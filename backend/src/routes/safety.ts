/**
 * /api/safety/* — Block and Report endpoints.
 * POST   /api/safety/block/:userId   — block a user
 * DELETE /api/safety/block/:userId   — unblock a user
 * GET    /api/safety/blocks          — list blocked users
 * POST   /api/safety/report          — report a user or content
 */
import { Router, Response } from 'express';
import { prisma } from '@/services/db';
import { requireAuth, AuthRequest } from '@/middleware/auth';

export const safetyRouter = Router();

// POST /api/safety/block/:userId
safetyRouter.post('/block/:userId', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const blockerId = req.userId as string;
    const { userId: blockedId } = req.params;

    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Upsert so duplicate calls are idempotent
    await prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });

    return res.status(200).json({ message: 'User blocked' });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/safety/block/:userId
safetyRouter.delete('/block/:userId', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const blockerId = req.userId as string;
    const { userId: blockedId } = req.params;

    await prisma.blockedUser.deleteMany({
      where: { blockerId, blockedId },
    });

    return res.status(200).json({ message: 'User unblocked' });
  } catch (err) {
    return next(err);
  }
});

// GET /api/safety/blocks
safetyRouter.get('/blocks', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const blockerId = req.userId as string;

    const blocks = await prisma.blockedUser.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(blocks.map((b) => ({ ...b.blocked, blockedAt: b.createdAt })));
  } catch (err) {
    return next(err);
  }
});

// POST /api/safety/report
safetyRouter.post('/report', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const reporterId = req.userId as string;
    const { reportedUserId, reportedContentType, reportedContentId, reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    const validReasons = ['spam', 'harassment', 'inappropriate', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: `reason must be one of: ${validReasons.join(', ')}` });
    }

    await prisma.report.create({
      data: {
        reporterId,
        reportedUserId: reportedUserId ?? null,
        reportedContentType: reportedContentType ?? null,
        reportedContentId: reportedContentId ?? null,
        reason,
        details: details ?? null,
      },
    });

    return res.status(200).json({ message: 'Report submitted' });
  } catch (err) {
    return next(err);
  }
});
