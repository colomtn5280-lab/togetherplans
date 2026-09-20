/**
 * Share Cards — generate shareable OG-ready metadata for a decided proposal.
 *
 * POST /api/share-cards/:proposalId   — generate (idempotent)
 * GET  /api/share-cards/:proposalId   — fetch card data (public, no auth needed)
 *
 * Share cards are purely derived data (no DB table needed yet).
 * The route builds a card object from the proposal + winning option
 * and returns it. The web/mobile layer renders or shares it.
 * A `shareToken` (UUID stable per proposal) is derived from the proposal id
 * so the same URL is always shareable without mutation.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@/services/db';
import { requireAuth, AuthRequest } from '@/middleware/auth';
import { logger } from '@/services/logger';
import crypto from 'crypto';

export const shareCardsRouter = Router();

const APP_URL = process.env.APP_URL || 'https://togetherplans.app';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Deterministic share token from proposal id — same proposal always same URL */
function deriveShareToken(proposalId: string): string {
  return crypto.createHash('sha256').update(`share:${proposalId}`).digest('hex').slice(0, 32);
}

/** Format a dateTime for display */
function formatDate(dt: Date): string {
  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dt: Date): string {
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Pick emoji badge for category */
const CATEGORY_EMOJI: Record<string, string> = {
  Dining: '🍽️',
  'Live Music': '🎵',
  Comedy: '😂',
  'Theater & Plays': '🎭',
  Movies: '🎬',
  'Streaming Night': '📺',
  Outdoors: '🌿',
  'Day Trip': '🚗',
  'Wine & Drinks': '🍷',
  'Arts & Culture': '🎨',
  Active: '🏃',
  'Local Experience': '📍',
  'Unique & Quirky': '✨',
};

// ─── Build card data ──────────────────────────────────────────────────────────

async function buildCard(proposalId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      options: {
        include: {
          votes: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      group: {
        select: { name: true, groupType: true },
      },
      creator: {
        select: { displayName: true },
      },
    },
  });

  if (!proposal) return null;

  // Find winning option: most votes; tie → first option
  const winningOption = proposal.options.reduce((best, opt) =>
    opt.votes.length > best.votes.length ? opt : best,
    proposal.options[0]
  );

  const totalVotes = proposal.options.reduce((sum, o) => sum + o.votes.length, 0);
  const shareToken = deriveShareToken(proposalId);
  const shareUrl = `${APP_URL}/share/${shareToken}`;
  const emoji = winningOption ? (CATEGORY_EMOJI[winningOption.category] || '📅') : '📅';

  // OG meta title / description (used for native share sheet + web meta tags)
  const ogTitle = winningOption
    ? `${emoji} ${proposal.group.name} is going to ${winningOption.name}!`
    : `${emoji} ${proposal.title} — the group decided!`;

  const ogDescription = [
    winningOption?.address ? `📍 ${winningOption.address}` : null,
    `📅 ${formatDate(proposal.dateTime)} at ${formatTime(proposal.dateTime)}`,
    totalVotes > 0 ? `👥 ${totalVotes} vote${totalVotes !== 1 ? 's' : ''}` : null,
    proposal.group.groupType ? `Group type: ${proposal.group.groupType}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    proposalId,
    shareToken,
    shareUrl,
    status: proposal.status,
    title: proposal.title,
    dateTime: proposal.dateTime.toISOString(),
    dateFormatted: formatDate(proposal.dateTime),
    timeFormatted: formatTime(proposal.dateTime),
    groupName: proposal.group.name,
    groupType: proposal.group.groupType,
    creatorName: proposal.creator.displayName,
    winningOption: winningOption
      ? {
          name: winningOption.name,
          category: winningOption.category,
          description: winningOption.description,
          address: winningOption.address,
          latitude: winningOption.latitude,
          longitude: winningOption.longitude,
          imageUrl: (winningOption as any).imageUrl ?? null,
          ticketUrl: (winningOption as any).ticketUrl ?? null,
          voteCount: winningOption.votes.length,
          emoji,
        }
      : null,
    allOptions: proposal.options.map((o) => ({
      id: o.id,
      name: o.name,
      category: o.category,
      voteCount: o.votes.length,
      isWinner: winningOption ? o.id === winningOption.id : false,
    })),
    totalVotes,
    og: {
      title: ogTitle,
      description: ogDescription,
      image: winningOption
        ? `${APP_URL}/api/share-cards/${proposalId}/og-image`
        : null,
      url: shareUrl,
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/share-cards/:proposalId
 * Public — no auth required (share links are meant to be opened by anyone).
 * Returns card data or 404.
 */
shareCardsRouter.get('/:proposalId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await buildCard(req.params.proposalId);
    if (!card) return res.status(404).json({ error: 'Proposal not found' });
    return res.json(card);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/share-cards/by-token/:shareToken
 * Public — resolve a share token to a proposal card.
 * Brute-force lookup (token is derived from proposalId, so we can't reverse it
 * without the id). We scan DECIDED proposals only — this is acceptable since
 * share cards only exist for decided proposals in practice, and the table is small.
 * For scale: add a shareToken column to Proposal in a future migration.
 */
shareCardsRouter.get('/by-token/:shareToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareToken } = req.params;
    if (!/^[a-f0-9]{32}$/.test(shareToken)) {
      return res.status(400).json({ error: 'Invalid share token format' });
    }

    // Find among DECIDED proposals (only decided proposals get share cards)
    const decidedProposals = await prisma.proposal.findMany({
      where: { status: 'DECIDED' },
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000, // reasonable upper bound
    });

    const match = decidedProposals.find(
      (p) => deriveShareToken(p.id) === shareToken
    );

    if (!match) return res.status(404).json({ error: 'Share card not found' });

    const card = await buildCard(match.id);
    if (!card) return res.status(404).json({ error: 'Proposal not found' });
    return res.json(card);
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/share-cards/:proposalId/generate
 * Auth required — any group member can generate a share card for a proposal.
 * Idempotent: just returns the card data (no DB write needed yet).
 */
shareCardsRouter.post(
  '/:proposalId/generate',
  requireAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const proposal = await prisma.proposal.findUnique({
        where: { id: req.params.proposalId },
        select: { groupId: true, status: true },
      });
      if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

      // Must be a group member
      const membership = await prisma.groupMember.findFirst({
        where: { groupId: proposal.groupId, userId: req.userId },
      });
      if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

      // Warn (don't block) if not yet decided — card still works but no winner
      if (proposal.status !== 'DECIDED') {
        logger.warn(`share-card generated for non-DECIDED proposal ${req.params.proposalId}`);
      }

      const card = await buildCard(req.params.proposalId);
      if (!card) return res.status(404).json({ error: 'Proposal not found' });

      return res.status(200).json(card);
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/share-cards/:proposalId/og-image
 * Returns a lightweight SVG that can be used as the OG image.
 * No external dependencies — generated server-side, instantly.
 * The web layer can also render its own canvas-based version; this is the fallback.
 */
shareCardsRouter.get('/:proposalId/og-image', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await buildCard(req.params.proposalId);
    if (!card) return res.status(404).json({ error: 'Proposal not found' });

    const winnerName = card.winningOption?.name ?? card.title;
    const emoji = card.winningOption?.emoji ?? '📅';
    const group = card.groupName;
    const date = card.dateFormatted;
    const addr = card.winningOption?.address ?? '';

    // Escape XML special chars
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0E8C8C;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#065f5f;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Decorative circle -->
  <circle cx="1050" cy="100" r="200" fill="#7CB518" fill-opacity="0.15"/>
  <circle cx="100" cy="550" r="150" fill="#ffffff" fill-opacity="0.05"/>
  <!-- Brand -->
  <text x="60" y="80" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="28" font-weight="800" fill="#D9F1F0" letter-spacing="0.5">📅 DateNight</text>
  <!-- Emoji -->
  <text x="60" y="220" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="80">${emoji}</text>
  <!-- Winner name -->
  <text x="60" y="320" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="56" font-weight="800" fill="#ffffff" letter-spacing="-1">${esc(winnerName.length > 30 ? winnerName.slice(0, 28) + '…' : winnerName)}</text>
  <!-- Group name -->
  <text x="60" y="385" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="32" fill="#7CB518" font-weight="700">${esc(group)}</text>
  <!-- Date -->
  <text x="60" y="435" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="26" fill="#D9F1F0">${esc(date)}</text>
  <!-- Address if available -->
  ${addr ? `<text x="60" y="480" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="22" fill="#b2dede">📍 ${esc(addr.length > 50 ? addr.slice(0, 48) + '…' : addr)}</text>` : ''}
  <!-- Tagline -->
  <text x="60" y="580" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-size="20" fill="#7CB518" letter-spacing="0.3">Plan together. Go together. — togetherplans.app</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(svg);
  } catch (err) {
    return next(err);
  }
});
