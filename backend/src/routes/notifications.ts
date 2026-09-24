import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '@/middleware/auth';
import { getFeed, markFeedNotificationRead } from '@/services/notification-feed';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// GET /api/notifications — cache-backed feed populated by notification
// triggers (holdout / tomorrow / guest-vote). The web bell polls this every
// 60s (AppNav) and NotificationsPage every 30s; `count` is the unread count
// used for the badge.
notificationsRouter.get('/', async (req: AuthRequest, res: Response) => {
  const notifications = await getFeed(req.userId as string);
  const count = notifications.filter((n) => !n.read).length;
  res.json({ count, notifications });
});

// PATCH /api/notifications/:id/read — mark a feed entry read (web "Mark read")
notificationsRouter.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  const ok = await markFeedNotificationRead(req.userId as string, req.params.id);
  if (!ok) return res.status(404).json({ error: 'Notification not found' });
  return res.json({ ok: true });
});
