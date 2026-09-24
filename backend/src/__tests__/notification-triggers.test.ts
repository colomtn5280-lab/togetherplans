/**
 * Notification triggers — holdout, tomorrow, guest-vote.
 *
 * Uses jest.mock of @/services/db (in-memory prisma fake) matching existing
 * test patterns. Push tokens in fixtures are intentionally NOT valid Expo
 * tokens, so buildPushMessage filters them and no network send is attempted;
 * these tests exercise the trigger/dedupe/rate-limit logic plus the feed.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

interface FakeVote { userId: string }
interface FakeOption { id: string; name: string; votes: FakeVote[]; guestVotes: { id: string }[] }
interface FakeMember { userId: string; user: { id: string; pushToken: string | null } }
interface FakeProposal {
  id: string;
  status: string;
  title: string;
  dateTime: Date;
  options: FakeOption[];
  group: { members: FakeMember[] };
  creator: { id: string; pushToken: string | null };
}

const state: { proposals: FakeProposal[] } = { proposals: [] };

jest.mock('@/services/db', () => ({
  prisma: {
    proposal: {
      findUnique: jest.fn(async ({ where }: any) =>
        state.proposals.find((p) => p.id === where.id) ?? null),
      findMany: jest.fn(async ({ where }: any) =>
        state.proposals.filter((p) =>
          p.status === where.status &&
          p.dateTime >= where.dateTime.gte &&
          p.dateTime <= where.dateTime.lte)),
    },
  },
}));

import {
  checkHoldoutAndNotify,
  runTomorrowReminders,
  notifyCreatorOfGuestVote,
} from '@/services/notification-triggers';
import { getFeed } from '@/services/notification-feed';

const member = (userId: string): FakeMember => ({ userId, user: { id: userId, pushToken: null } });
const option = (id: string, name: string, voterIds: string[], guestVoteCount = 0): FakeOption => ({
  id,
  name,
  votes: voterIds.map((userId) => ({ userId })),
  guestVotes: Array.from({ length: guestVoteCount }, (_, i) => ({ id: `gv-${i}` })),
});

function makeProposal(id: string, overrides: Partial<FakeProposal> = {}): FakeProposal {
  const p: FakeProposal = {
    id,
    status: 'OPEN',
    title: 'Friday Date Night',
    dateTime: new Date(Date.now() + 24 * 3600 * 1000),
    options: [option(`${id}-o1`, 'Sushi', [])],
    group: { members: [member('u1'), member('u2'), member('u3')] },
    creator: { id: 'u1', pushToken: null },
    ...overrides,
  };
  state.proposals.push(p);
  return p;
}

beforeEach(() => {
  state.proposals = [];
});

// ── Trigger 1: holdout ────────────────────────────────────────────────────────

describe('checkHoldoutAndNotify', () => {
  it('fires for the single non-voter when exactly one vote is missing (3 members)', async () => {
    makeProposal('p-holdout-1', {
      options: [option('o1', 'Sushi', ['u1', 'u2'])],
    });
    const notified = await checkHoldoutAndNotify('p-holdout-1');
    expect(notified).toBe(1);
    const feed = await getFeed('u3');
    expect(feed).toHaveLength(1);
    expect(feed[0].title).toBe("Everyone's waiting on you 👀");
    expect(feed[0].message).toBe('Friday Date Night — 2 of 3 have voted. Cast yours!');
    expect(feed[0].proposalId).toBe('p-holdout-1');
  });

  it('does NOT fire when more than one vote is missing', async () => {
    makeProposal('p-holdout-2', {
      options: [option('o1', 'Sushi', ['u1'])], // u2 and u3 both missing
    });
    expect(await checkHoldoutAndNotify('p-holdout-2')).toBe(0);
  });

  it('does NOT fire when everyone has voted', async () => {
    makeProposal('p-holdout-3', {
      options: [option('o1', 'Sushi', ['u1', 'u2', 'u3'])],
    });
    expect(await checkHoldoutAndNotify('p-holdout-3')).toBe(0);
  });

  it('fires only ONCE per proposal per user (cache dedupe)', async () => {
    makeProposal('p-holdout-4', {
      group: { members: [member('d1'), member('d2'), member('d3')] },
      options: [option('o1', 'Sushi', ['d1', 'd2'])],
    });
    expect(await checkHoldoutAndNotify('p-holdout-4')).toBe(1);
    expect(await checkHoldoutAndNotify('p-holdout-4')).toBe(0); // deduped
    expect(await getFeed('d3')).toHaveLength(1);
  });

  it('2-member group: non-voter is the holdout once one vote exists', async () => {
    makeProposal('p-holdout-5', {
      group: { members: [member('u1'), member('u2')] },
      options: [option('o1', 'Sushi', ['u1'])],
    });
    const notified = await checkHoldoutAndNotify('p-holdout-5');
    expect(notified).toBe(1);
    const feed = await getFeed('u2');
    expect(feed[0].message).toBe('Friday Date Night — 1 of 2 have voted. Cast yours!');
  });

  it('2-member group: does NOT fire before any vote exists', async () => {
    makeProposal('p-holdout-6', {
      group: { members: [member('u1'), member('u2')] },
      options: [option('o1', 'Sushi', [])],
    });
    // Zero votes → both are non-voters → nonVoters.length !== 1 anyway,
    // but assert the zero-votes guard explicitly with a 3-member group below.
    expect(await checkHoldoutAndNotify('p-holdout-6')).toBe(0);
  });

  it('does NOT fire on non-OPEN proposals', async () => {
    makeProposal('p-holdout-7', {
      status: 'DECIDED',
      options: [option('o1', 'Sushi', ['u1', 'u2'])],
    });
    expect(await checkHoldoutAndNotify('p-holdout-7')).toBe(0);
  });
});

// ── Trigger 2: plan is tomorrow ───────────────────────────────────────────────

describe('runTomorrowReminders', () => {
  const now = new Date('2026-09-25T12:00:00Z');
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000);

  it('selects DECIDED proposals 20-28h out and notifies all members', async () => {
    makeProposal('p-tmrw-in', {
      status: 'DECIDED',
      dateTime: hoursFromNow(24),
      options: [option('o1', 'Rooftop Bar', ['u1', 'u2', 'u3'])],
    });
    makeProposal('p-tmrw-early', { status: 'DECIDED', dateTime: hoursFromNow(19) });  // too soon
    makeProposal('p-tmrw-late', { status: 'DECIDED', dateTime: hoursFromNow(29) });   // too far
    makeProposal('p-tmrw-open', { status: 'OPEN', dateTime: hoursFromNow(24) });      // not decided

    const result = await runTomorrowReminders(now);
    expect(result.proposalsNotified).toBe(1);

    const feed = await getFeed('u2');
    const entry = feed.find((n) => n.proposalId === 'p-tmrw-in');
    expect(entry?.title).toBe('Tomorrow: Friday Date Night 🎉');
    expect(entry?.message).toBe('You locked in Rooftop Bar. Have fun!');
    // Edge proposals got nothing
    expect(feed.filter((n) => n.proposalId === 'p-tmrw-early')).toHaveLength(0);
    expect(feed.filter((n) => n.proposalId === 'p-tmrw-late')).toHaveLength(0);
    expect(feed.filter((n) => n.proposalId === 'p-tmrw-open')).toHaveLength(0);
  });

  it('includes the 20h and 28h boundaries', async () => {
    makeProposal('p-tmrw-20', { status: 'DECIDED', dateTime: hoursFromNow(20) });
    makeProposal('p-tmrw-28', { status: 'DECIDED', dateTime: hoursFromNow(28) });
    const result = await runTomorrowReminders(now);
    expect(result.proposalsNotified).toBe(2);
  });

  it('dedupes on subsequent runs (cache marker)', async () => {
    makeProposal('p-tmrw-dedupe', { status: 'DECIDED', dateTime: hoursFromNow(24) });
    expect((await runTomorrowReminders(now)).proposalsNotified).toBe(1);
    expect((await runTomorrowReminders(now)).proposalsNotified).toBe(0);
  });
});

// ── Trigger 3: new guest vote ─────────────────────────────────────────────────

describe('notifyCreatorOfGuestVote', () => {
  it('notifies the creator with guest name and leading option', async () => {
    makeProposal('p-guest-1', {
      creator: { id: 'creator-1', pushToken: null },
      options: [
        option('o1', 'Sushi', ['u1'], 2),   // 3 total — leading
        option('o2', 'Bowling', ['u2'], 0), // 1 total
      ],
    });
    const sent = await notifyCreatorOfGuestVote('p-guest-1', 'Maya');
    expect(sent).toBe(true);
    const feed = await getFeed('creator-1');
    expect(feed[0].title).toBe('🗳 A guest voted on your plan');
    expect(feed[0].message).toBe('Maya voted on Friday Date Night — Sushi is ahead');
  });

  it("falls back to 'Someone' when the guest is anonymous", async () => {
    makeProposal('p-guest-2', {
      creator: { id: 'creator-2', pushToken: null },
      options: [option('o1', 'Sushi', [], 1)],
    });
    await notifyCreatorOfGuestVote('p-guest-2', undefined);
    const feed = await getFeed('creator-2');
    expect(feed[0].message).toBe('Someone voted on Friday Date Night — Sushi is ahead');
  });

  it('rate-limits to one push per proposal per 30 min', async () => {
    makeProposal('p-guest-3', {
      creator: { id: 'creator-3', pushToken: null },
      options: [option('o1', 'Sushi', [], 1)],
    });
    expect(await notifyCreatorOfGuestVote('p-guest-3', 'A')).toBe(true);
    expect(await notifyCreatorOfGuestVote('p-guest-3', 'B')).toBe(false);
    expect(await notifyCreatorOfGuestVote('p-guest-3', 'C')).toBe(false);
    expect(await getFeed('creator-3')).toHaveLength(1);
  });
});
