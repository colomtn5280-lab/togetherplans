import { Router, Request, Response, NextFunction } from 'express';
import { execSync } from 'child_process';
import { Expo } from 'expo-server-sdk';
import { prisma } from '@/services/db';
import { sendVoteReminderEmail } from '@/services/email';
import { logger } from '@/services/logger';
import { getSourceHealth } from '@/services/source-health';
import { runTomorrowReminders } from '@/services/notification-triggers';

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

const INSTANCE_STARTED_AT = new Date().toISOString();

/**
 * GET /api/internal/source-health
 * In-memory per-source health snapshot for the suggestion engine:
 * last attempt time, last success time, last result count, last error.
 * Guarded by requireInternalKey like all internal routes.
 */
internalRouter.get('/source-health', (_req: Request, res: Response) => {
  return res.json({ sources: getSourceHealth(), instanceStartedAt: INSTANCE_STARTED_AT });
});

/**
 * POST /api/internal/reminders/run
 *
 * Finds all OPEN proposals whose dateTime is 23–25 hours from now,
 * sends a push notification + vote-reminder email to every member who
 * has NOT yet voted, then marks the proposal remindedAt.
 *
 * Idempotent: proposals already marked remindedAt are skipped.
 */
/**
 * POST /api/internal/migrate
 * Runs prisma migrate deploy against the production database.
 */
// Temporarily public — remove requireInternalKey for migrate only
internalRouter.post('/migrate', async (_req: Request, res: Response) => {
  try {
    logger.info('Running prisma migrate deploy...');
    const output = execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      env: process.env,
      timeout: 60000,
    }).toString();
    logger.info('Migration output:', { output });
    return res.json({ success: true, output });
  } catch (err: unknown) {
    const e = err as { message: string; stderr?: Buffer };
    logger.error('Migration failed', { err: e.message, stderr: e.stderr?.toString() });
    return res.status(500).json({ error: e.message, stderr: e.stderr?.toString() });
  }
});

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
            user.email,
            proposal.id,
            proposal.title,
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
      // "Plan is tomorrow" hype push for DECIDED proposals 20-28h out —
      // rides this same Cloud Scheduler invocation (no new job).
      tomorrow: await runTomorrowReminders(),
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/internal/photo-test
 * Tests Google Places API photo lookup for a known venue.
 * Returns raw API response for debugging.
 */
internalRouter.get('/photo-test', async (_req: Request, res: Response) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.json({ error: 'GOOGLE_MAPS_API_KEY not set', env_keys: Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('FSQ') || k.includes('FOURSQUARE')) });

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', 'Starbucks');
    url.searchParams.set('location', '38.627,-90.199');
    url.searchParams.set('radius', '500');
    url.searchParams.set('key', key);

    const resp = await fetch(url.toString());
    const data = await resp.json() as any;

    return res.json({
      key_set: true,
      key_prefix: key.slice(0, 8) + '...',
      status: data.status,
      error_message: data.error_message,
      results_count: data.results?.length ?? 0,
      first_place: data.results?.[0] ? {
        name: data.results[0].name,
        has_photos: !!data.results[0].photos?.length,
        photo_ref: data.results[0].photos?.[0]?.photo_reference?.slice(0, 40) + '...',
      } : null,
    });
  } catch (err) {
    return res.json({ error: String(err) });
  }
});
