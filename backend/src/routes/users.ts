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
