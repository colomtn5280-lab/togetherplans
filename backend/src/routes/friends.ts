/**
 * Friends (connections) router
 *
 * POST   /api/friends/request/:userId   — send a friend request
 * PATCH  /api/friends/:id/accept        — accept a pending request
 * PATCH  /api/friends/:id/decline       — decline a pending request
 * DELETE /api/friends/:id               — unfriend (remove accepted connection)
 * GET    /api/friends                   — list your friends (ACCEPTED)
 * GET    /api/friends/requests          — list incoming PENDING requests
 * GET    /api/friends/sent              — list outgoing PENDING requests
 */
import { Router, Response } from 'express';
import { prisma } from '@/services/db';
import { requireAuth, AuthRequest } from '@/middleware/auth';
import { logger } from '@/services/logger';

export const friendsRouter = Router();
friendsRouter.use(requireAuth);

// ── helpers ──────────────────────────────────────────────────────────────────

/** Return the friendship record between two users regardless of direction */
async function findFriendship(a: string, b: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: a, receiverId: b },
        { senderId: b, receiverId: a },
      ],
    },
  });
}

// ── POST /api/friends/request/:userId ────────────────────────────────────────
friendsRouter.post('/request/:userId', async (req: AuthRequest, res: Response, next) => {
  try {
    const me = req.userId!;
    const { userId } = req.params;

    if (me === userId) {
      return res.status(400).json({ error: 'Cannot friend yourself' });
    }

    // Check target exists
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, displayName: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    // Check existing friendship or block
    const existing = await findFriendship(me, userId);
    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.status(409).json({ error: 'Already friends' });
      }
      if (existing.status === 'PENDING') {
        // If they already sent a request to us, auto-accept it
        if (existing.receiverId === me) {
          const updated = await prisma.friendship.update({
            where: { id: existing.id },
            data: { status: 'ACCEPTED' },
          });
          return res.json({ friendship: updated, autoAccepted: true });
        }
        return res.status(409).json({ error: 'Friend request already sent' });
      }
      if (existing.status === 'DECLINED') {
        // Allow re-requesting after decline: update record
        const updated = await prisma.friendship.update({
          where: { id: existing.id },
          data: { senderId: me, receiverId: userId, status: 'PENDING' },
        });
        return res.status(201).json({ friendship: updated });
      }
    }

    // Check block
    const blocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: me, blockedId: userId },
          { blockerId: userId, blockedId: me },
        ],
      },
    });
    if (blocked) return res.status(403).json({ error: 'Cannot send request to this user' });

    const friendship = await prisma.friendship.create({
      data: { senderId: me, receiverId: userId, status: 'PENDING' },
    });

    logger.info('Friend request sent', { from: me, to: userId });
    return res.status(201).json({ friendship });
  } catch (err) {
    return next(err);
  }
});

// ── PATCH /api/friends/:id/accept ────────────────────────────────────────────
friendsRouter.patch('/:id/accept', async (req: AuthRequest, res: Response, next) => {
  try {
    const me = req.userId!;
    const record = await prisma.friendship.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ error: 'Request not found' });
    if (record.receiverId !== me) return res.status(403).json({ error: 'Not your request to accept' });
    if (record.status !== 'PENDING') return res.status(409).json({ error: 'Request already resolved' });

    const updated = await prisma.friendship.update({
      where: { id: record.id },
      data: { status: 'ACCEPTED' },
    });
    return res.json({ friendship: updated });
  } catch (err) {
    return next(err);
  }
});

// ── PATCH /api/friends/:id/decline ───────────────────────────────────────────
friendsRouter.patch('/:id/decline', async (req: AuthRequest, res: Response, next) => {
  try {
    const me = req.userId!;
    const record = await prisma.friendship.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ error: 'Request not found' });
    if (record.receiverId !== me) return res.status(403).json({ error: 'Not your request to decline' });
    if (record.status !== 'PENDING') return res.status(409).json({ error: 'Request already resolved' });

    const updated = await prisma.friendship.update({
      where: { id: record.id },
      data: { status: 'DECLINED' },
    });
    return res.json({ friendship: updated });
  } catch (err) {
    return next(err);
  }
});

// ── DELETE /api/friends/:id ───────────────────────────────────────────────────
friendsRouter.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const me = req.userId!;
    const record = await prisma.friendship.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ error: 'Friendship not found' });
    if (record.senderId !== me && record.receiverId !== me) {
      return res.status(403).json({ error: 'Not your friendship' });
    }
    await prisma.friendship.delete({ where: { id: record.id } });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/friends ──────────────────────────────────────────────────────────
friendsRouter.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const me = req.userId!;
    const rows = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: me }, { receiverId: me }],
      },
      include: {
        sender:   { select: { id: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const friends = rows.map((r) => ({
      friendshipId: r.id,
      since: r.updatedAt,
      user: r.senderId === me ? r.receiver : r.sender,
    }));

    return res.json({ friends });
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/friends/requests ─────────────────────────────────────────────────
friendsRouter.get('/requests', async (req: AuthRequest, res: Response, next) => {
  try {
    const me = req.userId!;
    const rows = await prisma.friendship.findMany({
      where: { receiverId: me, status: 'PENDING' },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ requests: rows });
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/friends/sent ─────────────────────────────────────────────────────
friendsRouter.get('/sent', async (req: AuthRequest, res: Response, next) => {
  try {
    const me = req.userId!;
    const rows = await prisma.friendship.findMany({
      where: { senderId: me, status: 'PENDING' },
      include: {
        receiver: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ sent: rows });
  } catch (err) {
    return next(err);
  }
});
