/**
 * Guest-to-member vote carryover.
 *
 * In-memory prisma fake (same pattern as share.test.ts). Exercised:
 *  - POST /api/auth/claim-guest-votes conversion happy path
 *  - member vote already exists → guest vote dropped, member vote kept
 *  - guest votes on non-member groups left pending
 *  - invitation accept with guestId converts that group's guest votes
 *  - consensus fires when a converted vote completes unanimity
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// ── In-memory state ───────────────────────────────────────────────────────────

interface FakeGuestVote { id: string; proposalId: string; optionId: string; guestId: string; guestName: string | null; createdAt: Date }
interface FakeOption { id: string; proposalId: string; name: string; category: string; createdAt: Date }
interface FakeProposal { id: string; groupId: string; creatorId: string; title: string; dateTime: Date; status: string; shareToken: string | null }
interface FakeGroup { id: string; name: string }
interface FakeMember { id: string; groupId: string; userId: string; role: string }
interface FakeVote { id: string; optionId: string; userId: string }
interface FakeInvitation { id: string; token: string; groupId: string; inviterId: string; status: string; expiresAt: Date }

const state = {
  groups: [] as FakeGroup[],
  members: [] as FakeMember[],
  proposals: [] as FakeProposal[],
  options: [] as FakeOption[],
  votes: [] as FakeVote[],
  guestVotes: [] as FakeGuestVote[],
  invitations: [] as FakeInvitation[],
  seq: 0,
};
const nid = (p: string) => `${p}-${++state.seq}`;

const sendItsAMatchEmail = jest.fn(async () => undefined);

jest.mock('@/services/email', () => ({
  sendItsAMatchEmail: (...args: unknown[]) => sendItsAMatchEmail(...(args as [])),
  sendVoteReminderEmail: jest.fn(async () => undefined),
  sendTake2Email: jest.fn(async () => undefined),
  sendWelcomeEmail: jest.fn(async () => undefined),
  sendVerifyEmail: jest.fn(async () => undefined),
  sendPasswordResetEmail: jest.fn(async () => undefined),
  sendAccountDeletedEmail: jest.fn(async () => undefined),
  sendGroupInviteEmail: jest.fn(async () => undefined),
}));

jest.mock('@/services/db', () => ({
  prisma: {
    proposal: {
      findUnique: jest.fn(async ({ where }: any) =>
        state.proposals.find((p) => (where.id ? p.id === where.id : p.shareToken === where.shareToken)) ?? null),
      update: jest.fn(async ({ where, data }: any) => {
        const p = state.proposals.find((x) => x.id === where.id)!;
        Object.assign(p, data);
        return p;
      }),
    },
    option: {
      findMany: jest.fn(async ({ where }: any) =>
        state.options
          .filter((o) => o.proposalId === where.proposalId)
          .map((o) => ({ ...o, votes: state.votes.filter((v) => v.optionId === o.id) }))),
    },
    vote: {
      create: jest.fn(async ({ data }: any) => {
        const v: FakeVote = { id: nid('v'), optionId: data.optionId, userId: data.userId };
        state.votes.push(v);
        return v;
      }),
      findFirst: jest.fn(async ({ where }: any) =>
        state.votes.find((v) => {
          if (where.userId && v.userId !== where.userId) return false;
          if (where.option?.proposalId) {
            const opt = state.options.find((o) => o.id === v.optionId);
            if (!opt || opt.proposalId !== where.option.proposalId) return false;
          }
          return true;
        }) ?? null),
      groupBy: jest.fn(async ({ where }: any) => {
        const proposalId = where.option.proposalId;
        const optIds = new Set(state.options.filter((o) => o.proposalId === proposalId).map((o) => o.id));
        const users = new Set(state.votes.filter((v) => optIds.has(v.optionId)).map((v) => v.userId));
        return [...users].map((userId) => ({ userId }));
      }),
    },
    guestVote: {
      findMany: jest.fn(async ({ where }: any) =>
        state.guestVotes
          .filter((gv) => gv.guestId === where.guestId)
          .map((gv) => {
            const p = state.proposals.find((x) => x.id === gv.proposalId)!;
            return { ...gv, proposal: { id: p.id, groupId: p.groupId, status: p.status } };
          })),
      delete: jest.fn(async ({ where }: any) => {
        const i = state.guestVotes.findIndex((gv) => gv.id === where.id);
        const [gone] = state.guestVotes.splice(i, 1);
        return gone;
      }),
    },
    groupMember: {
      findFirst: jest.fn(async ({ where }: any) =>
        state.members.find((m) => m.groupId === where.groupId && m.userId === where.userId) ?? null),
      findMany: jest.fn(async ({ where }: any) =>
        state.members
          .filter((m) => (where?.userId ? m.userId === where.userId : where?.groupId ? m.groupId === where.groupId : true))
          .map((m) => ({ ...m, user: { email: `${m.userId}@example.com` } }))),
      count: jest.fn(async ({ where }: any) =>
        state.members.filter((m) => m.groupId === where.groupId).length),
      create: jest.fn(async ({ data }: any) => {
        const m: FakeMember = { id: nid('mem'), groupId: data.groupId, userId: data.userId, role: 'MEMBER' };
        state.members.push(m);
        return m;
      }),
    },
    invitation: {
      findUnique: jest.fn(async ({ where }: any) =>
        state.invitations.find((i) => i.token === where.token) ?? null),
      update: jest.fn(async ({ where, data }: any) => {
        const i = state.invitations.find((x) => x.id === where.id)!;
        Object.assign(i, data);
        return i;
      }),
    },
    $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

import request from 'supertest';
import { createApp } from '@/app';
import { signToken } from '@/middleware/auth';

const app = createApp();

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GUEST_ID = '9f1c2b3a-4d5e-6f70-8192-a3b4c5d6e7f8';

function seedGroup(memberIds: string[]) {
  const g: FakeGroup = { id: nid('grp'), name: 'Sarah & Jake' };
  state.groups.push(g);
  for (const [i, uid] of memberIds.entries()) {
    state.members.push({ id: nid('mem'), groupId: g.id, userId: uid, role: i === 0 ? 'OWNER' : 'MEMBER' });
  }
  return g;
}

function seedProposal(groupId: string, optionCount = 2, status = 'OPEN') {
  const p: FakeProposal = {
    id: nid('prop'), groupId, creatorId: 'user-1', title: 'Friday night out',
    dateTime: new Date('2026-10-02T19:00:00Z'), status, shareToken: null,
  };
  state.proposals.push(p);
  const options: FakeOption[] = [];
  for (let i = 0; i < optionCount; i++) {
    const o: FakeOption = { id: nid('opt'), proposalId: p.id, name: `Option ${i + 1}`, category: 'Comedy', createdAt: new Date() };
    state.options.push(o);
    options.push(o);
  }
  return { proposal: p, options };
}

function seedGuestVote(proposalId: string, optionId: string, guestId = GUEST_ID) {
  const gv: FakeGuestVote = { id: nid('gv'), proposalId, optionId, guestId, guestName: 'Priya', createdAt: new Date() };
  state.guestVotes.push(gv);
  return gv;
}

beforeEach(() => {
  state.groups = []; state.members = []; state.proposals = [];
  state.options = []; state.votes = []; state.guestVotes = []; state.invitations = [];
  sendItsAMatchEmail.mockClear();
});

// ── claim-guest-votes ─────────────────────────────────────────────────────────

describe('POST /api/auth/claim-guest-votes', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/api/auth/claim-guest-votes').send({ guestId: GUEST_ID });
    expect(res.status).toBe(401);
  });

  it('400s without a valid guestId', async () => {
    const token = signToken('user-1', 'a@b.com');
    const res = await request(app)
      .post('/api/auth/claim-guest-votes')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('converts guest votes on member-group proposals to real votes (happy path)', async () => {
    const g = seedGroup(['user-1', 'user-2', 'user-3']);
    const { proposal, options } = seedProposal(g.id);
    seedGuestVote(proposal.id, options[0].id);

    const token = signToken('user-3', 'c@b.com');
    const res = await request(app)
      .post('/api/auth/claim-guest-votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ guestId: GUEST_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ converted: 1, pending: 0 });
    expect(state.guestVotes).toHaveLength(0);
    expect(state.votes).toHaveLength(1);
    expect(state.votes[0]).toMatchObject({ optionId: options[0].id, userId: 'user-3' });
  });

  it('keeps the member vote and drops the guest vote when a member vote already exists', async () => {
    const g = seedGroup(['user-1', 'user-2', 'user-3']);
    const { proposal, options } = seedProposal(g.id);
    // user-3 already voted as a member for option 2
    state.votes.push({ id: nid('v'), optionId: options[1].id, userId: 'user-3' });
    // ...and also voted as a guest for option 1 earlier
    seedGuestVote(proposal.id, options[0].id);

    const token = signToken('user-3', 'c@b.com');
    const res = await request(app)
      .post('/api/auth/claim-guest-votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ guestId: GUEST_ID });

    expect(res.status).toBe(200);
    expect(res.body.converted).toBe(1);
    expect(state.guestVotes).toHaveLength(0);
    // Only the original member vote remains — no duplicate
    expect(state.votes).toHaveLength(1);
    expect(state.votes[0].optionId).toBe(options[1].id);
  });

  it('leaves guest votes on non-member groups pending', async () => {
    const memberGroup = seedGroup(['user-1', 'user-3']);
    const otherGroup = seedGroup(['user-1', 'user-2']); // user-3 NOT a member
    const a = seedProposal(memberGroup.id);
    const b = seedProposal(otherGroup.id);
    seedGuestVote(a.proposal.id, a.options[0].id);
    seedGuestVote(b.proposal.id, b.options[0].id);

    const token = signToken('user-3', 'c@b.com');
    const res = await request(app)
      .post('/api/auth/claim-guest-votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ guestId: GUEST_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ converted: 1, pending: 1 });
    // The non-member guest vote is untouched
    expect(state.guestVotes).toHaveLength(1);
    expect(state.guestVotes[0].proposalId).toBe(b.proposal.id);
  });

  it('fires consensus when a converted vote completes unanimity', async () => {
    const g = seedGroup(['user-1', 'user-2']);
    const { proposal, options } = seedProposal(g.id);
    // user-1 already voted for option 1; user-2's guest vote on option 1 completes it
    state.votes.push({ id: nid('v'), optionId: options[0].id, userId: 'user-1' });
    seedGuestVote(proposal.id, options[0].id);

    const token = signToken('user-2', 'b@b.com');
    const res = await request(app)
      .post('/api/auth/claim-guest-votes')
      .set('Authorization', `Bearer ${token}`)
      .send({ guestId: GUEST_ID });

    expect(res.status).toBe(200);
    expect(res.body.converted).toBe(1);
    expect(state.proposals[0].status).toBe('DECIDED');
    expect(sendItsAMatchEmail).toHaveBeenCalled();
  });
});

// ── invitation accept converts guest votes ────────────────────────────────────

describe('POST /api/invitations/accept/:token with guestId', () => {
  it('joining a group converts that guest\'s votes on the group\'s proposals', async () => {
    const g = seedGroup(['user-1']);
    const { proposal, options } = seedProposal(g.id);
    seedGuestVote(proposal.id, options[0].id);
    const inv: FakeInvitation = {
      id: nid('inv'), token: 'invite-token-abc', groupId: g.id, inviterId: 'user-1',
      status: 'PENDING', expiresAt: new Date(Date.now() + 3600_000),
    };
    state.invitations.push(inv);

    const token = signToken('user-9', 'new@b.com');
    const res = await request(app)
      .post(`/api/invitations/accept/${inv.token}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ guestId: GUEST_ID });

    expect(res.status).toBe(201);
    expect(res.body.guestVotesClaimed).toEqual({ converted: 1, pending: 0 });
    expect(state.guestVotes).toHaveLength(0);
    expect(state.votes).toHaveLength(1);
    expect(state.votes[0]).toMatchObject({ optionId: options[0].id, userId: 'user-9' });
    expect(state.members.some((m) => m.groupId === g.id && m.userId === 'user-9')).toBe(true);
  });

  it('accepts without a guestId (no conversion, normal join)', async () => {
    const g = seedGroup(['user-1']);
    const inv: FakeInvitation = {
      id: nid('inv'), token: 'invite-token-def', groupId: g.id, inviterId: 'user-1',
      status: 'PENDING', expiresAt: new Date(Date.now() + 3600_000),
    };
    state.invitations.push(inv);

    const token = signToken('user-9', 'new@b.com');
    const res = await request(app)
      .post(`/api/invitations/accept/${inv.token}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.guestVotesClaimed).toBeUndefined();
  });
});
