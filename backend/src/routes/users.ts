/**
 * /api/users/* — proxy to auth handlers for web client compatibility.
 * The web client calls /users/me but the backend auth lives at /auth/me.
 */
import { Router, Response } from 'express';
import { prisma } from '@/services/db';
import { requireAuth, AuthRequest } from '@/middleware/auth';

export const usersRouter = Router();

// GET /api/users/me — alias for GET /api/auth/me
usersRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.deletedAt) return res.status(404).json({ error: 'User not found' });
    return res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      latitude: user.latitude,
      longitude: user.longitude,
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/users/me — alias for DELETE /api/auth/me (GDPR soft delete)
usersRouter.delete('/me', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { deletedAt: new Date() },
    });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/users/search?q=<displayName>
 * Auth required. Search users by displayName (case-insensitive, prefix match).
 * Returns up to 10 results. Excludes deleted users and the requesting user.
 * Used by InviteMembersScreen USERNAME invite method.
 */
usersRouter.get('/search', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'q must be at least 2 characters' });
    }
    if (q.length > 50) {
      return res.status(400).json({ error: 'q must be 50 characters or fewer' });
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        id: { not: req.userId as string },
        displayName: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, displayName: true, avatarUrl: true },
      take: 10,
      orderBy: { displayName: 'asc' },
    });

    return res.json(users);
  } catch (err) {
    return next(err);
  }
});
