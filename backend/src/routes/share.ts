/**
 * Public share routes — guest voting via share link (the viral loop).
 *
 * GET  /api/share/:shareToken        — public proposal snapshot (open OR decided)
 * POST /api/share/:shareToken/vote   — guest vote (upsert by proposalId+guestId)
 *
 * Guest votes are ADVISORY ONLY: they are shown to members as a separate tally
 * but never trigger the consensus / match / lock-in logic. Members decide,
 * guests advise.
 *
 * No emails or private member data are ever returned from these routes.
 */

import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { prisma } from '@/services/db';

export const shareRouter = Router();

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
const GUEST_ID_RE = /^[A-Za-z0-9-]{8,64}$/;

/** Generate a URL-safe share token */
export function generateShareToken(): string {
  return crypto.randomBytes(18).toString('base64url'); // 24 chars, URL-safe
}

// Modest rate limit for guest votes. Note: per-IP limiting is weak behind
// Cloud Run + Cloudflare (shared LB IP), so we key by guestId when present.
const guestVoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    typeof req.body?.guestId === 'string' ? `guest:${req.body.guestId}` : (req.ip ?? 'unknown'),
  message: { error: 'Too many votes — slow down a little.' },
});

/** Load a proposal by share token with everything the public page needs */
async function loadByToken(shareToken: string) {
  return prisma.proposal.findUnique({
    where: { shareToken },
    include: {
      options: {
        orderBy: { createdAt: 'asc' },
        include: {
          votes: { select: { id: true } },
          guestVotes: { select: { guestId: true, guestName: true } },
        },
      },
      group: { select: { name: true } },
      creator: { select: { displayName: true } },
    },
  });
}

type LoadedProposal = NonNullable<Awaited<ReturnType<typeof loadByToken>>>;

/** Public, sanitized snapshot — combined member+guest tallies, no emails/user ids */
function toPublicSnapshot(proposal: LoadedProposal, guestId?: string) {
  const options = proposal.options.map((o) => ({
    id: o.id,
    name: o.name,
    category: o.category,
    description: o.description,
    address: o.address,
    imageUrl: o.imageUrl,
    eventDate: o.eventDate ? o.eventDate.toISOString() : null,
    memberVotes: o.votes.length,
    guestVotes: o.guestVotes.length,
    totalVotes: o.votes.length + o.guestVotes.length,
  }));

  const yourVote = guestId
    ? proposal.options.find((o) => o.guestVotes.some((gv) => gv.guestId === guestId))?.id ?? null
    : null;

  // Winner (for DECIDED proposals): most member votes
  let winnerOptionId: string | null = null;
  if (proposal.status === 'DECIDED' && proposal.options.length > 0) {
    const winner = proposal.options.reduce((best, o) =>
      o.votes.length > best.votes.length ? o : best, proposal.options[0]);
    winnerOptionId = winner.id;
  }

  return {
    shareToken: proposal.shareToken,
    status: proposal.status,
    title: proposal.title,
    dateTime: proposal.dateTime.toISOString(),
    groupName: proposal.group.name,
    creatorName: proposal.creator.displayName,
    options,
    totalVotes: options.reduce((s, o) => s + o.totalVotes, 0),
    winnerOptionId,
    yourVote,
  };
}

/**
 * GET /api/share/:shareToken?guestId=...
 * Public. Works for OPEN and DECIDED proposals (decided → winner shown).
 * CANCELLED / COUNTERED proposals 404 to avoid leaking group activity.
 */
shareRouter.get('/:shareToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareToken } = req.params;
    if (!TOKEN_RE.test(shareToken)) return res.status(404).json({ error: 'Not found' });

    const proposal = await loadByToken(shareToken);
    if (!proposal || (proposal.status !== 'OPEN' && proposal.status !== 'DECIDED')) {
      return res.status(404).json({ error: 'Not found' });
    }

    const guestId = typeof req.query.guestId === 'string' ? req.query.guestId : undefined;
    return res.json(toPublicSnapshot(proposal, guestId));
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/share/:shareToken/vote  { optionId, guestId, guestName? }
 * Public. Upserts by (proposalId, guestId) so a guest can change their vote.
 * Only OPEN proposals accept guest votes. Never triggers match logic.
 */
shareRouter.post('/:shareToken/vote', guestVoteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareToken } = req.params;
    if (!TOKEN_RE.test(shareToken)) return res.status(404).json({ error: 'Not found' });

    const { optionId, guestId, guestName } = req.body || {};
    if (!optionId || typeof optionId !== 'string') {
      return res.status(400).json({ error: 'optionId is required' });
    }
    if (!guestId || typeof guestId !== 'string' || !GUEST_ID_RE.test(guestId)) {
      return res.status(400).json({ error: 'A valid guestId is required' });
    }
    if (guestName !== undefined && (typeof guestName !== 'string' || guestName.length > 60)) {
      return res.status(400).json({ error: 'guestName must be a string of 60 characters or fewer' });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { shareToken },
      include: { options: { select: { id: true } } },
    });
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    if (proposal.status !== 'OPEN') {
      return res.status(409).json({ error: 'Voting is closed — this plan has already been decided.' });
    }
    if (!proposal.options.some((o) => o.id === optionId)) {
      return res.status(404).json({ error: 'Option not found on this proposal' });
    }

    const trimmedName = typeof guestName === 'string' && guestName.trim() ? guestName.trim() : undefined;

    const vote = await prisma.guestVote.upsert({
      where: { proposalId_guestId: { proposalId: proposal.id, guestId } },
      create: {
        proposalId: proposal.id,
        optionId,
        guestId,
        ...(trimmedName ? { guestName: trimmedName } : {}),
      },
      update: {
        optionId,
        ...(trimmedName ? { guestName: trimmedName } : {}),
      },
    });

    // Return the fresh public snapshot so the client can show live tallies
    const fresh = await loadByToken(shareToken);
    const snapshot = fresh ? toPublicSnapshot(fresh, guestId) : null;
    return res.status(201).json({
      vote: { optionId: vote.optionId, guestName: vote.guestName ?? null },
      proposal: snapshot,
    });
  } catch (err) {
    return next(err);
  }
});
