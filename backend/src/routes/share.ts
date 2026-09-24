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
import { logger } from '@/services/logger';
import { notifyCreatorOfGuestVote } from '@/services/notification-triggers';
import { rasterizeOgSvgCached } from '@/services/og-image';

export const shareRouter = Router();

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
const GUEST_ID_RE = /^[A-Za-z0-9-]{8,64}$/;

/** Generate a URL-safe share token */
export function generateShareToken(): string {
  return crypto.randomBytes(18).toString('base64url'); // 24 chars, URL-safe
}

// Modest rate limit for guest votes. Note: per-IP limiting is weak behind
// Cloud Run + Cloudflare (shared LB IP), so we key by guestId when present.
// IPv6-safe: use skip() to handle guestId, ipKeyGenerator() uses proper IP detection
const guestVoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => typeof req.body?.guestId === 'string', // Skip rate limit for guestId-based requests
  message: { error: 'Too many votes — slow down a little.' },
  // Don't specify keyGenerator; ipKeyGenerator is used by default (IPv6-safe)
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

    // Was there already a vote by this guest? (distinguish CREATE from change-vote)
    const existingGuestVote = await prisma.guestVote.findUnique({
      where: { proposalId_guestId: { proposalId: proposal.id, guestId } },
      select: { id: true },
    });

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

    // New guest vote (not a change) → tell the creator. Fire-and-forget,
    // rate-limited inside (1 push / proposal / 30 min).
    if (!existingGuestVote) {
      void notifyCreatorOfGuestVote(proposal.id, trimmedName).catch((err) =>
        logger.error('Guest-vote notification failed', { proposalId: proposal.id, err }),
      );
    }

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

// ─── Rich link previews (OG) for /vote/<token> links ─────────────────────────
//
// Social crawlers (iMessage, WhatsApp, Facebook, Twitter, Slack, …) don't run
// the SPA's JS, so OG tags must come from a server. A Cloudflare Pages Function
// (web/functions/vote/[token].ts) proxies known crawler user-agents to
// GET /api/share/:token/preview; humans who land here directly are instantly
// redirected to the SPA voting page.

const APP_URL = process.env.APP_URL || 'https://togetherplans.app';
const API_URL = process.env.API_URL || 'https://api.togetherplans.app';

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escXml(s: string): string {
  return escHtml(s);
}

function formatShareDate(dt: Date): string {
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/**
 * GET /api/share/:shareToken/preview
 * Crawler-readable HTML with OG tags + instant redirect to the SPA for humans.
 */
shareRouter.get('/:shareToken/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareToken } = req.params;
    if (!TOKEN_RE.test(shareToken)) return res.status(404).send('Not found');

    const proposal = await loadByToken(shareToken);
    if (!proposal || (proposal.status !== 'OPEN' && proposal.status !== 'DECIDED')) {
      return res.status(404).send('Not found');
    }

    const spaUrl = `${APP_URL}/vote/${shareToken}`;
    const proposer = proposal.creator.displayName || proposal.group.name;
    const optionCount = proposal.options.length;
    const ogTitle = `${proposer} proposed: ${proposal.title}`;
    const ogDescription = `${optionCount} option${optionCount !== 1 ? 's' : ''} · Tap to vote — no account needed · ${formatShareDate(proposal.dateTime)}`;
    const ogImage = `${API_URL}/api/share/${shareToken}/og`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escHtml(ogTitle)}</title>
<meta name="description" content="${escHtml(ogDescription)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="TogetherPlans">
<meta property="og:title" content="${escHtml(ogTitle)}">
<meta property="og:description" content="${escHtml(ogDescription)}">
<meta property="og:image" content="${escHtml(ogImage)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escHtml(spaUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(ogTitle)}">
<meta name="twitter:description" content="${escHtml(ogDescription)}">
<meta name="twitter:image" content="${escHtml(ogImage)}">
<meta http-equiv="refresh" content="0;url=${escHtml(spaUrl)}">
<script>window.location.replace(${JSON.stringify(spaUrl)});</script>
</head>
<body>
<p>Redirecting to <a href="${escHtml(spaUrl)}">${escHtml(spaUrl)}</a>…</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(html);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/share/:shareToken/og
 * Branded OG image for OPEN (and DECIDED) proposals — teal card, title, date,
 * option count, CTA, wordmark. Served as raster PNG (1200x630) because
 * WhatsApp/iMessage/Facebook crawlers don't render SVG og:images.
 * ?format=svg keeps the raw SVG available for debugging.
 */
shareRouter.get('/:shareToken/og', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareToken } = req.params;
    if (!TOKEN_RE.test(shareToken)) return res.status(404).json({ error: 'Not found' });

    const proposal = await loadByToken(shareToken);
    if (!proposal || (proposal.status !== 'OPEN' && proposal.status !== 'DECIDED')) {
      return res.status(404).json({ error: 'Not found' });
    }

    const title = proposal.title.length > 34 ? proposal.title.slice(0, 32) + '…' : proposal.title;
    const date = formatShareDate(proposal.dateTime);
    const optionCount = proposal.options.length;
    const subtitle = `${optionCount} option${optionCount !== 1 ? 's' : ''} · ${date}`;
    const cta = proposal.status === 'OPEN'
      ? 'Vote now — no account needed'
      : 'The group decided — see the plan';

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0E8C8C;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#065f5f;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="100" r="200" fill="#7CB518" fill-opacity="0.15"/>
  <circle cx="100" cy="550" r="150" fill="#ffffff" fill-opacity="0.05"/>
  <text x="60" y="90" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="34" font-weight="800" fill="#D9F1F0" letter-spacing="0.5">TogetherPlans</text>
  <text x="60" y="290" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="56" font-weight="800" fill="#ffffff" letter-spacing="-1">${escXml(title)}</text>
  <text x="60" y="365" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="32" fill="#D9F1F0">${escXml(subtitle)}</text>
  <rect x="60" y="425" rx="16" width="600" height="76" fill="#7CB518"/>
  <text x="92" y="475" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="30" font-weight="800" fill="#0F1519">${escXml(cta)}</text>
  <text x="60" y="580" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="20" fill="#7CB518" letter-spacing="0.3">Plan together. Go together. — togetherplans.app</text>
</svg>`;

    if (req.query.format === 'svg') {
      // Debugging escape hatch — raw SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(svg);
    }

    // Rasterize to PNG — WhatsApp/iMessage/Facebook require raster og:images.
    // Cache key includes status so an OPEN→DECIDED flip refreshes the CTA.
    const png = rasterizeOgSvgCached(`share:${shareToken}:${proposal.status}`, svg);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(png);
  } catch (err) {
    return next(err);
  }
});
