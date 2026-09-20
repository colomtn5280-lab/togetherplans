import { Router, Response } from 'express';
import { prisma } from '@/services/db';
import { requireAuth, AuthRequest } from '@/middleware/auth';
import { getSuggestions, SuggestionCategory } from '@/services/suggestions';

export const proposalsRouter = Router();

proposalsRouter.use(requireAuth);

const MIN_OPTIONS = 3;
const MAX_OPTIONS = 5;

interface OptionInput {
  name: string;
  category: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  externalRef?: string;
}

function validateOptions(options: unknown): string | null {
  if (!Array.isArray(options) || options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    return `A proposal requires ${MIN_OPTIONS}-${MAX_OPTIONS} activity options`;
  }
  for (const o of options as OptionInput[]) {
    if (!o.name || !o.category) return 'Each option needs a name and a category';
  }
  return null;
}

// POST /api/proposals — create a date proposal with 3-5 activity options
proposalsRouter.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId, title, dateTime, options } = req.body || {};
    if (!groupId || !title || !dateTime) {
      return res.status(400).json({ error: 'groupId, title and dateTime are required' });
    }
    const parsedDate = new Date(dateTime);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'dateTime must be a valid ISO date' });
    }
    const optionError = validateOptions(options);
    if (optionError) return res.status(400).json({ error: optionError });

    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.userId },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const proposal = await prisma.proposal.create({
      data: {
        groupId,
        creatorId: req.userId as string,
        title,
        dateTime: parsedDate,
        options: { create: (options as OptionInput[]).map((o) => ({ ...o })) },
      },
      include: { options: true },
    });
    return res.status(201).json(proposal);
  } catch (err) {
    return next(err);
  }
});

// POST /api/proposals/:id/counter — counter-proposal (marks original COUNTERED)
proposalsRouter.post('/:id/counter', async (req: AuthRequest, res: Response, next) => {
  try {
    const original = await prisma.proposal.findUnique({ where: { id: req.params.id } });
    if (!original) return res.status(404).json({ error: 'Proposal not found' });

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: original.groupId, userId: req.userId },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const { title, dateTime, options } = req.body || {};
    if (!title || !dateTime) {
      return res.status(400).json({ error: 'title and dateTime are required' });
    }
    const parsedDate = new Date(dateTime);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'dateTime must be a valid ISO date' });
    }
    const optionError = validateOptions(options);
    if (optionError) return res.status(400).json({ error: optionError });

    const [, counter] = await prisma.$transaction([
      prisma.proposal.update({ where: { id: original.id }, data: { status: 'COUNTERED' } }),
      prisma.proposal.create({
        data: {
          groupId: original.groupId,
          creatorId: req.userId as string,
          title,
          dateTime: parsedDate,
          parentId: original.id,
          options: { create: (options as OptionInput[]).map((o: OptionInput) => ({ ...o })) },
        },
        include: { options: true },
      }),
    ]);
    return res.status(201).json(counter);
  } catch (err) {
    return next(err);
  }
});

// GET /api/proposals/:id — proposal with options, votes and consensus tally
proposalsRouter.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: {
        options: { include: { votes: true } },
        counters: true,
      },
    });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: proposal.groupId, userId: req.userId },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const memberCount = await prisma.groupMember.count({ where: { groupId: proposal.groupId } });
    const tally = proposal.options.map((o) => ({
      optionId: o.id,
      name: o.name,
      votes: o.votes.length,
      consensus: memberCount > 0 && o.votes.length > memberCount / 2,
    }));
    return res.json({ ...proposal, memberCount, tally });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/proposals/:id/cancel — cancel a proposal (creator or group OWNER)
proposalsRouter.patch('/:id/cancel', async (req: AuthRequest, res: Response, next) => {
  try {
    const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id } });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    if (proposal.status === 'DECIDED' || proposal.status === 'CANCELLED') {
      return res.status(409).json({ error: `Proposal is already ${proposal.status.toLowerCase()}` });
    }

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: proposal.groupId, userId: req.userId },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const isCreator = proposal.creatorId === req.userId;
    const isOwner = membership.role === 'OWNER';
    if (!isCreator && !isOwner) {
      return res.status(403).json({ error: 'Only the proposal creator or a group owner can cancel this proposal' });
    }

    const updated = await prisma.proposal.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: { options: true },
    });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
});

// POST /api/proposals/:id/vote — approval-vote for an option
proposalsRouter.post('/:id/vote', async (req: AuthRequest, res: Response, next) => {
  try {
    const { optionId } = req.body || {};
    if (!optionId) return res.status(400).json({ error: 'optionId is required' });

    const option = await prisma.option.findUnique({
      where: { id: optionId },
      include: { proposal: true },
    });
    if (!option || option.proposalId !== req.params.id) {
      return res.status(404).json({ error: 'Option not found on this proposal' });
    }
    if (option.proposal.status !== 'OPEN') {
      return res.status(409).json({ error: `Proposal is ${option.proposal.status.toLowerCase()}` });
    }
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: option.proposal.groupId, userId: req.userId },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const existing = await prisma.vote.findUnique({
      where: { optionId_userId: { optionId, userId: req.userId as string } },
    });
    if (existing) return res.status(409).json({ error: 'Already voted for this option' });

    const vote = await prisma.vote.create({
      data: { optionId, userId: req.userId as string },
    });

    // Consensus: ALL members voted AND one option has strict majority
    const memberCount = await prisma.groupMember.count({ where: { groupId: option.proposal.groupId } });
    const allOptions = await prisma.option.findMany({
      where: { proposalId: option.proposalId },
      include: { votes: true },
    });
    // Count distinct voters across all options on this proposal
    const distinctVoters = await prisma.vote.groupBy({
      by: ['userId'],
      where: { option: { proposalId: option.proposalId } },
    });
    const allVoted = distinctVoters.length >= memberCount;
    const winner = allOptions.find((o) => o.votes.length > memberCount / 2);
    let decided = false;
    if (allVoted && winner) {
      await prisma.proposal.update({ where: { id: option.proposalId }, data: { status: 'DECIDED' } });
      decided = true;
    }
    return res.status(201).json({ vote, decided, voteCount: winner ? winner.votes.length : 0, memberCount, winnerId: winner?.id });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/proposals/:id/votes — retract current user's vote on this proposal
proposalsRouter.delete('/:id/votes', async (req: AuthRequest, res: Response, next) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { options: true },
    });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status !== 'OPEN') return res.status(409).json({ error: `Proposal is ${proposal.status.toLowerCase()}` });

    const optionIds = proposal.options.map((o) => o.id);
    const deleted = await prisma.vote.deleteMany({
      where: { userId: req.userId as string, optionId: { in: optionIds } },
    });
    return res.json({ deleted: deleted.count });
  } catch (err) {
    return next(err);
  }
});

// GET /api/proposals/suggestions/list?lat=..&lng=..&category=..
// Location-based suggestions with randomization (cached, <1s)
proposalsRouter.get('/suggestions/list', async (req: AuthRequest, res: Response, next) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const category = (req.query.category as SuggestionCategory | undefined) || undefined;
    const suggestions = await getSuggestions({ lat, lng, category });
    return res.json({ suggestions });
  } catch (err) {
    return next(err);
  }
});
