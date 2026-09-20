import { Router, Response } from 'express';
import { prisma } from '@/services/db';
import { requireAuth, AuthRequest } from '@/middleware/auth';

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

// POST /api/groups — create a group (creator becomes OWNER)
groupsRouter.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, description, groupType } = req.body || {};
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        ...(description ? { description: description.trim() } : {}),
        ...(groupType ? { groupType } : {}),
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

// PATCH /api/groups/:id — rename group (OWNER only)
groupsRouter.patch('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { name } = req.body || {};
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId: req.userId },
    });
    if (!membership) return res.status(404).json({ error: 'Group not found' });
    if (membership.role !== 'OWNER') return res.status(403).json({ error: 'Only the group owner can rename the group' });

    const group = await prisma.group.update({
      where: { id: req.params.id },
      data: { name: name.trim() },
      include: { members: { include: { user: { select: { id: true, displayName: true } } } } },
    });
    return res.json(group);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/groups/:id — delete group (OWNER only, cascade handled by Prisma)
groupsRouter.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId: req.userId },
    });
    if (!membership) return res.status(404).json({ error: 'Group not found' });
    if (membership.role !== 'OWNER') return res.status(403).json({ error: 'Only the group owner can delete the group' });

    await prisma.group.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/groups/:id/members/me — leave a group (any member)
groupsRouter.delete('/:id/members/me', async (req: AuthRequest, res: Response, next) => {
  try {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId: req.userId },
    });
    if (!membership) return res.status(404).json({ error: 'Group not found or you are not a member' });

    if (membership.role === 'OWNER') {
      // Check if this user is the only OWNER
      const ownerCount = await prisma.groupMember.count({
        where: { groupId: req.params.id, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        return res.status(400).json({ error: 'Transfer ownership before leaving' });
      }
    }

    await prisma.groupMember.delete({ where: { id: membership.id } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/groups/:id/members/:userId — remove a member (OWNER only, cannot remove self)
groupsRouter.delete('/:id/members/:userId', async (req: AuthRequest, res: Response, next) => {
  try {
    const myMembership = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId: req.userId },
    });
    if (!myMembership) return res.status(404).json({ error: 'Group not found' });
    if (myMembership.role !== 'OWNER') return res.status(403).json({ error: 'Only the group owner can remove members' });
    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: 'Use DELETE /members/me to leave the group' });
    }

    const target = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId: req.params.userId },
    });
    if (!target) return res.status(404).json({ error: 'Member not found' });

    await prisma.groupMember.delete({ where: { id: target.id } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/groups/:id/members/:userId/role — change role (OWNER only)
groupsRouter.patch('/:id/members/:userId/role', async (req: AuthRequest, res: Response, next) => {
  try {
    const { role } = req.body || {};
    if (!role || !['OWNER', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: "role must be 'OWNER' or 'MEMBER'" });
    }

    const myMembership = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId: req.userId },
    });
    if (!myMembership) return res.status(404).json({ error: 'Group not found' });
    if (myMembership.role !== 'OWNER') return res.status(403).json({ error: 'Only the group owner can change roles' });

    const target = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId: req.params.userId },
    });
    if (!target) return res.status(404).json({ error: 'Member not found' });

    const updated = await prisma.groupMember.update({
      where: { id: target.id },
      data: { role },
      include: { user: { select: { id: true, displayName: true } } },
    });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
});
