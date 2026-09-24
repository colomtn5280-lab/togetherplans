/**
 * Guest voting via share link + solo-start backend support.
 *
 * Uses an in-memory fake of the prisma client (jest.mock of @/services/db)
 * so these run in CI without a database — matching existing test patterns.
 *
 * Exercised here:
 *  - GET /api/share/:token on OPEN proposal (no emails / private data leaked)
 *  - Guest vote create + change (upsert by proposalId+guestId)
 *  - Vote on DECIDED proposal rejected 409
 *  - Invalid token → 404
 *  - POST /api/proposals/:id/share-link (lazy token, member-only)
 *  - Solo flow: create a 1-member group, then a proposal in it
 *
 * NOT exercised (needs a real DB): actual SQL constraints/migration.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// ── In-memory state ───────────────────────────────────────────────────────────

interface FakeGuestVote { id: string; proposalId: string; optionId: string; guestId: string; guestName: string | null; createdAt: Date }
interface FakeOption { id: string; proposalId: string; name: string; category: string; description: string | null; address: string | null; imageUrl: string | null; eventDate: Date | null; createdAt: Date }
interface FakeProposal { id: string; groupId: string; creatorId: string; title: string; dateTime: Date; status: string; shareToken: string | null; createdAt: Date; updatedAt: Date }
interface FakeGroup { id: string; name: string; groupType: string | null; description: string | null }
interface FakeMember { id: string; groupId: string; userId: string; role: string }

const state = {
  groups: [] as FakeGroup[],
  members: [] as FakeMember[],
  proposals: [] as FakeProposal[],
  options: [] as FakeOption[],
  votes: [] as { id: string; optionId: string; userId: string }[],
  guestVotes: [] as FakeGuestVote[],
  seq: 0,
};
const nid = (p: string) => `${p}-${++state.seq}`;

function hydrateProposal(p: FakeProposal) {
  const group = state.groups.find((g) => g.id === p.groupId)!;
  return {
    ...p,
    group: { name: group.name, groupType: group.groupType },
    creator: { displayName: 'Sarah', email: 'sarah@example.com' },
    counters: [],
    options: state.options
      .filter((o) => o.proposalId === p.id)
      .map((o) => ({
        ...o,
        votes: state.votes.filter((v) => v.optionId === o.id),
        guestVotes: state.guestVotes.filter((gv) => gv.optionId === o.id),
      })),
  };
}

jest.mock('@/services/db', () => ({
  prisma: {
    proposal: {
      findUnique: jest.fn(async ({ where }: any) => {
        const p = where.shareToken
          ? state.proposals.find((x) => x.shareToken === where.shareToken)
          : state.proposals.find((x) => x.id === where.id);
        return p ? hydrateProposal(p) : null;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const p = state.proposals.find((x) => x.id === where.id)!;
        Object.assign(p, data);
        return hydrateProposal(p);
      }),
      create: jest.fn(async ({ data }: any) => {
        const p: FakeProposal = {
          id: nid('prop'), groupId: data.groupId, creatorId: data.creatorId,
          title: data.title, dateTime: data.dateTime, status: 'OPEN',
          shareToken: null, createdAt: new Date(), updatedAt: new Date(),
        };
        state.proposals.push(p);
        for (const o of data.options?.create ?? []) {
          state.options.push({
            id: nid('opt'), proposalId: p.id, name: o.name, category: o.category,
            description: o.description ?? null, address: o.address ?? null,
            imageUrl: o.imageUrl ?? null, eventDate: o.eventDate ?? null, createdAt: new Date(),
          });
        }
        return hydrateProposal(p);
      }),
    },
    option: {
      findUnique: jest.fn(async ({ where }: any) => {
        const o = state.options.find((x) => x.id === where.id);
        if (!o) return null;
        const p = state.proposals.find((x) => x.id === o.proposalId)!;
        return { ...o, proposal: p };
      }),
      findMany: jest.fn(async () => []),
    },
    guestVote: {
      upsert: jest.fn(async ({ where, create, update }: any) => {
        const { proposalId, guestId } = where.proposalId_guestId;
        let gv = state.guestVotes.find((x) => x.proposalId === proposalId && x.guestId === guestId);
        if (gv) {
          Object.assign(gv, update);
        } else {
          gv = {
            id: nid('gv'), proposalId, optionId: create.optionId, guestId,
            guestName: create.guestName ?? null, createdAt: new Date(),
          };
          state.guestVotes.push(gv);
        }
        return gv;
      }),
    },
    groupMember: {
      findFirst: jest.fn(async ({ where }: any) =>
        state.members.find((m) => m.groupId === where.groupId && m.userId === where.userId) ?? null),
      count: jest.fn(async ({ where }: any) =>
        state.members.filter((m) => m.groupId === where.groupId).length),
      findMany: jest.fn(async () => []),
    },
    group: {
      create: jest.fn(async ({ data }: any) => {
        const g: FakeGroup = { id: nid('grp'), name: data.name, groupType: data.groupType ?? null, description: data.description ?? null };
        state.groups.push(g);
        const m: FakeMember = { id: nid('mem'), groupId: g.id, userId: data.members.create.userId, role: data.members.create.role };
        state.members.push(m);
        return { ...g, members: [m] };
      }),
    },
    vote: {
      findUnique: jest.fn(async () => null),
      groupBy: jest.fn(async () => []),
    },
    user: {
      findUnique: jest.fn(async () => ({ displayName: 'Sarah' })),
    },
  },
}));

import request from 'supertest';
import { createApp } from '@/app';
import { signToken } from '@/middleware/auth';

const app = createApp();

// ── Fixtures ──────────────────────────────────────────────────────────────────

function seedProposal(status = 'OPEN', shareToken: string | null = 'tok_abcdefgh12345678') {
  const g: FakeGroup = { id: nid('grp'), name: 'Sarah & Jake', groupType: 'COUPLE', description: null };
  state.groups.push(g);
  state.members.push({ id: nid('mem'), groupId: g.id, userId: 'user-1', role: 'OWNER' });
  state.members.push({ id: nid('mem'), groupId: g.id, userId: 'user-2', role: 'MEMBER' });
  const p: FakeProposal = {
    id: nid('prop'), groupId: g.id, creatorId: 'user-1', title: 'Friday night out',
    dateTime: new Date('2026-10-02T19:00:00Z'), status, shareToken,
    createdAt: new Date(), updatedAt: new Date(),
  };
  state.proposals.push(p);
  const o1: FakeOption = { id: nid('opt'), proposalId: p.id, name: 'Sushi Zen', category: 'Restaurants & Dining', description: null, address: '1 Main St', imageUrl: null, eventDate: null, createdAt: new Date() };
  const o2: FakeOption = { id: nid('opt'), proposalId: p.id, name: 'Comedy Cellar', category: 'Comedy', description: null, address: null, imageUrl: null, eventDate: null, createdAt: new Date() };
  state.options.push(o1, o2);
  return { group: g, proposal: p, o1, o2 };
}

beforeEach(() => {
  state.groups = []; state.members = []; state.proposals = [];
  state.options = []; state.votes = []; state.guestVotes = [];
});

// ── Public share GET ──────────────────────────────────────────────────────────

describe('GET /api/share/:shareToken', () => {
  it('returns a sanitized snapshot for an OPEN proposal — no emails or user ids', async () => {
    const { proposal, o1 } = seedProposal();
    state.votes.push({ id: nid('v'), optionId: o1.id, userId: 'user-2' });

    const res = await request(app).get(`/api/share/${proposal.shareToken}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Friday night out');
    expect(res.body.groupName).toBe('Sarah & Jake');
    expect(res.body.status).toBe('OPEN');
    expect(res.body.options).toHaveLength(2);
    expect(res.body.options[0].memberVotes).toBe(1);
    expect(res.body.options[0].guestVotes).toBe(0);
    // No private data anywhere in the payload
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('@example.com');
    expect(raw).not.toContain('email');
    expect(raw).not.toContain('userId');
    expect(raw).not.toContain('user-1');
  });

  it('404s on an unknown token', async () => {
    const res = await request(app).get('/api/share/tok_doesnotexist9999');
    expect(res.status).toBe(404);
  });

  it('404s on a malformed token', async () => {
    const res = await request(app).get('/api/share/x!');
    expect(res.status).toBe(404);
  });

  it('shows winner for DECIDED proposals', async () => {
    const { proposal, o1 } = seedProposal('DECIDED');
    state.votes.push({ id: nid('v'), optionId: o1.id, userId: 'user-1' });
    state.votes.push({ id: nid('v'), optionId: o1.id, userId: 'user-2' });

    const res = await request(app).get(`/api/share/${proposal.shareToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DECIDED');
    expect(res.body.winnerOptionId).toBe(o1.id);
  });
});

// ── Guest voting ──────────────────────────────────────────────────────────────

describe('POST /api/share/:shareToken/vote', () => {
  const guestId = '9f1c2b3a-4d5e-6f70-8192-a3b4c5d6e7f8';

  it('creates a guest vote, then upserts when the guest changes their vote', async () => {
    const { proposal, o1, o2 } = seedProposal();

    const first = await request(app)
      .post(`/api/share/${proposal.shareToken}/vote`)
      .send({ optionId: o1.id, guestId, guestName: 'Priya' });
    expect(first.status).toBe(201);
    expect(first.body.vote.optionId).toBe(o1.id);
    expect(first.body.vote.guestName).toBe('Priya');
    expect(first.body.proposal.yourVote).toBe(o1.id);
    expect(state.guestVotes).toHaveLength(1);

    // Change vote — same guestId, different option → upsert, still one row
    const second = await request(app)
      .post(`/api/share/${proposal.shareToken}/vote`)
      .send({ optionId: o2.id, guestId });
    expect(second.status).toBe(201);
    expect(second.body.vote.optionId).toBe(o2.id);
    expect(second.body.proposal.yourVote).toBe(o2.id);
    expect(state.guestVotes).toHaveLength(1);
    expect(state.guestVotes[0].optionId).toBe(o2.id);

    // Tally reflects the change
    const snap = await request(app).get(`/api/share/${proposal.shareToken}?guestId=${guestId}`);
    const opt2 = snap.body.options.find((o: { id: string }) => o.id === o2.id);
    expect(opt2.guestVotes).toBe(1);
    expect(snap.body.yourVote).toBe(o2.id);
  });

  it('rejects votes on a DECIDED proposal with 409', async () => {
    const { proposal, o1 } = seedProposal('DECIDED');
    const res = await request(app)
      .post(`/api/share/${proposal.shareToken}/vote`)
      .send({ optionId: o1.id, guestId });
    expect(res.status).toBe(409);
  });

  it('404s for an option that is not on the proposal', async () => {
    const { proposal } = seedProposal();
    const res = await request(app)
      .post(`/api/share/${proposal.shareToken}/vote`)
      .send({ optionId: 'not-an-option', guestId });
    expect(res.status).toBe(404);
  });

  it('400s without a guestId', async () => {
    const { proposal, o1 } = seedProposal();
    const res = await request(app)
      .post(`/api/share/${proposal.shareToken}/vote`)
      .send({ optionId: o1.id });
    expect(res.status).toBe(400);
  });

  it('404s on an invalid token', async () => {
    const res = await request(app)
      .post('/api/share/tok_doesnotexist9999/vote')
      .send({ optionId: 'x', guestId });
    expect(res.status).toBe(404);
  });
});

// ── Member share-link endpoint ────────────────────────────────────────────────

describe('POST /api/proposals/:id/share-link', () => {
  it('lazily generates a stable token for a member', async () => {
    const { proposal } = seedProposal('OPEN', null);
    const token = signToken('user-1', 'a@b.com');

    const res = await request(app)
      .post(`/api/proposals/${proposal.id}/share-link`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.shareToken).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
    expect(res.body.shareUrl).toContain(`/vote/${res.body.shareToken}`);

    // Second call returns the SAME token
    const res2 = await request(app)
      .post(`/api/proposals/${proposal.id}/share-link`)
      .set('Authorization', `Bearer ${token}`);
    expect(res2.body.shareToken).toBe(res.body.shareToken);
  });

  it('403s for non-members', async () => {
    const { proposal } = seedProposal('OPEN', null);
    const token = signToken('stranger', 's@b.com');
    const res = await request(app)
      .post(`/api/proposals/${proposal.id}/share-link`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ── Member proposal GET includes guest tallies ────────────────────────────────

describe('GET /api/proposals/:id — guest tallies for members', () => {
  it('includes guestVotes per option in tally and guestVoteCount on options', async () => {
    const { proposal, o1 } = seedProposal();
    state.guestVotes.push({ id: nid('gv'), proposalId: proposal.id, optionId: o1.id, guestId: 'guest-abc-123', guestName: 'Priya', createdAt: new Date() });

    const token = signToken('user-1', 'a@b.com');
    const res = await request(app)
      .get(`/api/proposals/${proposal.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const t = res.body.tally.find((x: { optionId: string }) => x.optionId === o1.id);
    expect(t.guestVotes).toBe(1);
    const opt = res.body.options.find((x: { id: string }) => x.id === o1.id);
    expect(opt.guestVoteCount).toBe(1);
    // Raw guest ids must not leak to members
    expect(JSON.stringify(res.body)).not.toContain('guest-abc-123');
  });
});

// ── Solo-start: 1-member group + proposal ─────────────────────────────────────

describe('solo-start backend flow', () => {
  it('creates a 1-member group, then a proposal in it (zero-group user)', async () => {
    const token = signToken('solo-user', 'solo@b.com');

    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "Sarah's plans" });
    expect(groupRes.status).toBe(201);
    expect(groupRes.body.members).toHaveLength(1);
    const groupId = groupRes.body.id;

    const propRes = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupId,
        title: 'Friday night out',
        dateTime: '2026-10-02T19:00:00Z',
        options: [{ name: 'Sushi Zen', category: 'Restaurants & Dining' }],
      });
    expect(propRes.status).toBe(201);
    expect(propRes.body.options).toHaveLength(1);
  });
});
