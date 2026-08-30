import { Router, Response } from 'express';
import { prisma } from '@/services/db';
import { requireAuth, AuthRequest } from '@/middleware/auth';

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

// POST /api/groups — create a group (creator becomes OWNER)
groupsRouter.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { name } = req.body || {};
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        members: { create: { userId: req.userId as string, role: 'OWNER' } },
      },
      include: { members: true },
    });
    return res.status(201).json(group);
  } catch (err) {
    return next(err);
  }
});

// GET /api/groups — list my groups
groupsRouter.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: req.userId } } },
      include: { members: { include: { user: { select: { id: true, displayName: true } } } } },
    });
    return res.json(groups);
  } catch (err) {
    return next(err);
  }
});

// GET /api/groups/:id
groupsRouter.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, members: { some: { userId: req.userId } } },
      include: {
        members: { include: { user: { select: { id: true, displayName: true } } } },
        proposals: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    return res.json(group);
  } catch (err) {
    return next(err);
  }
});
