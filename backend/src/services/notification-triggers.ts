/**
 * Notification triggers — the three highest-leverage engagement pushes.
 *
 *  1. Holdout   — exactly one member's vote missing on an OPEN proposal →
 *                 nudge the non-voter. Once per proposal per user
 *                 (cache key holdout:<proposalId>:<userId>, no schema change).
 *  2. Tomorrow  — DECIDED proposal happening in 20-28h → remind all members.
 *                 Rides the existing Cloud Scheduler reminders job.
 *                 (cache key tomorrow:<proposalId>).
 *  3. GuestVote — a NEW guest vote lands → tell the proposal creator.
 *                 Rate-limited to 1 push / proposal / 30 min
 *                 (cache key guestpush:<proposalId>).
 *
 * Rails: Expo push (chunked, same pattern as nudge/vote reminders) + the
 * cache-backed in-app feed the web bell polls. No emails — these are
 * lightweight, playful moments, not inbox material.
 */

import { ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from '@/services/db';
import { cache } from '@/services/cache';
import { logger } from '@/services/logger';
import { buildPushMessage, sendPushMessages } from '@/services/push';
import { addFeedNotification } from '@/services/notification-feed';

const HOLDOUT_TTL_SECONDS = 30 * 24 * 3600;      // effectively "once ever"
const TOMORROW_TTL_SECONDS = 3 * 24 * 3600;       // outlives the 20-28h window
const GUEST_PUSH_TTL_SECONDS = 30 * 60;           // 30 min rate limit

// ── Trigger 1: You're the holdout ─────────────────────────────────────────────

/**
 * After any vote lands (member vote, or converted guest vote via the
 * consensus path), check whether exactly one member's vote is missing on an
 * OPEN proposal and nudge them. For 2-member groups the single non-voter is
 * trivially the holdout — included, but only once at least one vote exists.
 * Fires at most once per proposal per user.
 */
export async function checkHoldoutAndNotify(proposalId: string): Promise<number> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      options: { include: { votes: { select: { userId: true } } } },
      group: { include: { members: { include: { user: true } } } },
    },
  });
  if (!proposal || proposal.status !== 'OPEN') return 0;

  const votedUserIds = new Set<string>();
  for (const option of proposal.options) {
    for (const vote of option.votes) votedUserIds.add(vote.userId);
  }
  const members = proposal.group.members;
  const memberCount = members.length;
  const nonVoters = members.filter((m) => !votedUserIds.has(m.userId));

  // Exactly one missing vote, at least one vote cast, at least 2 members.
  if (memberCount < 2 || votedUserIds.size === 0 || nonVoters.length !== 1) return 0;

  const votedCount = memberCount - nonVoters.length;
  const title = "Everyone's waiting on you 👀";
  const body = `${proposal.title} — ${votedCount} of ${memberCount} have voted. Cast yours!`;

  const pushMessages: ExpoPushMessage[] = [];
  let notified = 0;

  for (const member of nonVoters) {
    const dedupeKey = `holdout:${proposal.id}:${member.userId}`;
    const already = await cache.get(dedupeKey);
    if (already) continue;
    await cache.set(dedupeKey, String(Date.now()), HOLDOUT_TTL_SECONDS);

    const user = member.user as { pushToken?: string | null };
    const msg = buildPushMessage(user, title, body, { proposalId: proposal.id });
    if (msg) pushMessages.push(msg);
    await addFeedNotification(member.userId, title, body, proposal.id);
    notified++;
  }

  await sendPushMessages(pushMessages, 'holdout');
  if (notified > 0) {
    logger.info('Holdout notification fired', { proposalId: proposal.id, notified });
  }
  return notified;
}

// ── Trigger 2: Plan is tomorrow ───────────────────────────────────────────────

/**
 * For DECIDED proposals whose dateTime is 20-28h from now, push a hype
 * reminder to all group members. Runs inside the existing Cloud Scheduler
 * reminders job (POST /api/internal/reminders/run — no new job). Dedupe via
 * cache marker (the remindedAt column is owned by the OPEN vote reminder).
 */
export async function runTomorrowReminders(now: Date = new Date()): Promise<{ proposalsNotified: number; pushesSent: number }> {
  const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000);

  const proposals = await prisma.proposal.findMany({
    where: {
      status: 'DECIDED',
      dateTime: { gte: windowStart, lte: windowEnd },
    },
    include: {
      options: { include: { votes: { select: { userId: true } } } },
      group: { include: { members: { include: { user: true } } } },
    },
  });

  let proposalsNotified = 0;
  let pushesSent = 0;

  for (const proposal of proposals) {
    const dedupeKey = `tomorrow:${proposal.id}`;
    const already = await cache.get(dedupeKey);
    if (already) continue;
    await cache.set(dedupeKey, String(Date.now()), TOMORROW_TTL_SECONDS);

    // Winning option = most member votes (same rule as the public snapshot)
    const winner = proposal.options.length > 0
      ? proposal.options.reduce((best, o) => (o.votes.length > best.votes.length ? o : best), proposal.options[0])
      : null;

    const title = `Tomorrow: ${proposal.title} 🎉`;
    const body = winner
      ? `You locked in ${winner.name}. Have fun!`
      : 'Your plan is locked in. Have fun!';

    const pushMessages: ExpoPushMessage[] = [];
    for (const member of proposal.group.members) {
      const user = member.user as { pushToken?: string | null };
      const msg = buildPushMessage(user, title, body, { proposalId: proposal.id });
      if (msg) pushMessages.push(msg);
      await addFeedNotification(member.userId, title, body, proposal.id);
    }
    pushesSent += await sendPushMessages(pushMessages, 'tomorrow');
    proposalsNotified++;
    logger.info('Tomorrow reminder sent', { proposalId: proposal.id, members: proposal.group.members.length });
  }

  return { proposalsNotified, pushesSent };
}

// ── Trigger 3: New guest vote ─────────────────────────────────────────────────

/**
 * When a guest vote is CREATED (not a change-vote upsert), tell the proposal
 * creator. Rate-limited: max one push per proposal per 30 min so a burst of
 * guests doesn't spam.
 */
export async function notifyCreatorOfGuestVote(
  proposalId: string,
  guestName?: string | null,
): Promise<boolean> {
  const rateKey = `guestpush:${proposalId}`;
  const recentlyPushed = await cache.get(rateKey);
  if (recentlyPushed) return false;
  await cache.set(rateKey, String(Date.now()), GUEST_PUSH_TTL_SECONDS);

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      options: {
        include: {
          votes: { select: { id: true } },
          guestVotes: { select: { id: true } },
        },
      },
      creator: { select: { id: true, pushToken: true } },
    },
  });
  if (!proposal || !proposal.creator) return false;

  // Leading option by combined member+guest votes (what guests/members see)
  const leader = proposal.options.length > 0
    ? proposal.options.reduce((best, o) => {
        const total = o.votes.length + o.guestVotes.length;
        const bestTotal = best.votes.length + best.guestVotes.length;
        return total > bestTotal ? o : best;
      }, proposal.options[0])
    : null;

  const title = '🗳 A guest voted on your plan';
  const voter = guestName && guestName.trim() ? guestName.trim() : 'Someone';
  const body = leader
    ? `${voter} voted on ${proposal.title} — ${leader.name} is ahead`
    : `${voter} voted on ${proposal.title}`;

  const msg = buildPushMessage(proposal.creator as { pushToken?: string | null }, title, body, { proposalId: proposal.id });
  await sendPushMessages(msg ? [msg] : [], 'guest-vote');
  await addFeedNotification(proposal.creator.id, title, body, proposal.id);
  logger.info('Guest vote notification sent', { proposalId: proposal.id });
  return true;
}
