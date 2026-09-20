import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '@/middleware/auth';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// GET /api/notifications — stub until push infra expanded
notificationsRouter.get('/', async (_req: AuthRequest, res: Response) => {
  res.json({ count: 0, notifications: [] });
});
