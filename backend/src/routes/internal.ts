import { Router, Request, Response, NextFunction } from 'express';
import { Expo } from 'expo-server-sdk';
import { prisma } from '@/services/db';
import { sendVoteReminderEmail } from '@/services/email';
import { logger } from '@/services/logger';

export const internalRouter = Router();

/**
 * Guard middleware — requires x-internal-key header matching INTERNAL_CRON_KEY env var.
 */
function requireInternalKey(req: Request, res: Response, next: NextFunction): void {
  const key = process.env.INTERNAL_CRON_KEY;
  if (!key) {
    res.status(503).json({ error: 'Internal key not configured' });
    return;
  }
  if (req.headers['x-internal-key'] !== key) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

internalRouter.use(requireInternalKey);

/**
 * POST /api/internal/reminders/run
 *
 * Finds all OPEN proposals whose dateTime is 23–25 hours from now,
 * sends a push notification + vote-reminder email to every member who
 * has NOT yet voted, then marks the proposal remindedAt.
 *
 * Idempotent: proposals already marked remindedAt are skipped.
 */
internalRouter.post('/reminders/run', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // T+23h
    const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000); // T+25h

    const proposals = await prisma.proposal.findMany({
      where: {
        status: 'OPEN',
        remindedAt: null,
        dateTime: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        options: { include: { votes: true } },
        group: {
          include: {
            members: { include: { user: true } },
          },
        },
      },
    });

    logger.info('Vote reminder job running', {
      proposalsInWindow: proposals.length,
      windowStart,
      windowEnd,
    });

    const expo = new Expo();
    let remindersSent = 0;

    for (const proposal of proposals) {
      // Collect user IDs that have voted on ANY option of this proposal
      const votedUserIds = new Set<string>();
      for (const option of proposal.options) {
        for (const vote of option.votes) {
          votedUserIds.add(vote.userId);
        }
      }

      const unvotedMembers = proposal.group.members.filter(
        (m) => !votedUserIds.has(m.userId),
      );

      if (unvotedMembers.length === 0) {
        // Mark as reminded even if everyone voted (no need to re-check)
        await prisma.proposal.update({
          where: { id: proposal.id },
          data: { remindedAt: new Date() },
        });
        continue;
      }

      const pushMessages: Parameters<typeof expo.sendPushNotificationsAsync>[0] = [];

      for (const member of unvotedMembers) {
        const user = member.user as {
          id: string;
          name?: string | null;
          email?: string | null;
          pushToken?: string | null;
        };

        // Expo push notification
        if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
          pushMessages.push({
            to: user.pushToken,
            sound: 'default',
            title: proposal.group.name,
            body: `"${proposal.title}" needs your vote`,
            data: { proposalId: proposal.id },
          });
        }

        // Vote reminder email
        if (user.email) {
          void sendVoteReminderEmail(
            user.email,
            user.name ?? 'there',
            proposal.title,
            proposal.group.name,
            proposal.id,
          );
        }

        remindersSent++;
      }

      // Send push notifications in chunks
      if (pushMessages.length > 0) {
        try {
          const chunks = expo.chunkPushNotifications(pushMessages);
          for (const chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
          }
          logger.info('Push reminders sent', {
            proposalId: proposal.id,
            count: pushMessages.length,
          });
        } catch (pushErr) {
          logger.error('Failed to send push reminders', { proposalId: proposal.id, pushErr });
          // Non-fatal — still mark remindedAt so we don't retry infinitely
        }
      }

      // Mark proposal as reminded to prevent duplicate sends
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { remindedAt: new Date() },
      });

      logger.info('Proposal marked reminded', {
        proposalId: proposal.id,
        remindersSent: unvotedMembers.length,
      });
    }

    return res.json({
      remindersSent,
      proposalsProcessed: proposals.length,
    });
  } catch (err) {
    return next(err);
  }
});
