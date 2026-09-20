/**
 * After Dark — late-night mode features for DateNight.
 *
 * After Dark activates between 21:00 and 03:00 in the group/user's timezone.
 * It surfaces curated late-night suggestions (bars, late shows, night markets,
 * rooftop spots, etc.) and allows users to set a "mood" that shapes the feed.
 *
 * Routes:
 *   GET  /api/after-dark/status            — is After Dark active right now?
 *   GET  /api/after-dark/suggestions       — late-night suggestions (filtered from engine)
 *   POST /api/after-dark/mood              — set user's current mood (persisted in push token metadata for now)
 *   GET  /api/after-dark/mood              — get user's current mood
 *   POST /api/after-dark/impulse           — "Let's go NOW" — create a spontaneous open proposal for a group
 */

import { Router, Response } from 'express';
import { prisma } from '@/services/db';
import { requireAuth, AuthRequest } from '@/middleware/auth';
import { getSuggestions } from '@/services/suggestions';
import { logger } from '@/services/logger';
import { cache } from '@/services/cache';

export const afterDarkRouter = Router();
afterDarkRouter.use(requireAuth);

// ─── Constants ────────────────────────────────────────────────────────────────

const AFTER_DARK_START_HOUR = 21; // 9 PM
const AFTER_DARK_END_HOUR = 3;    // 3 AM (next day)

const AFTER_DARK_CATEGORIES = [
  'Live Music',
  'Comedy',
  'Wine & Drinks',
  'Unique & Quirky',
  'Local Experience',
  'Dining',
] as const;

const VALID_MOODS = [
  'adventurous',
  'romantic',
  'social',
  'chill',
  'spontaneous',
  'cultural',
] as const;

type AfterDarkMood = typeof VALID_MOODS[number];

/** Mood → preferred categories (used to re-rank/filter suggestions) */
const MOOD_CATEGORIES: Record<AfterDarkMood, string[]> = {
  adventurous:  ['Unique & Quirky', 'Live Music', 'Local Experience'],
  romantic:     ['Wine & Drinks', 'Dining', 'Unique & Quirky'],
  social:       ['Live Music', 'Comedy', 'Wine & Drinks'],
  chill:        ['Dining', 'Wine & Drinks', 'Local Experience'],
  spontaneous:  ['Unique & Quirky', 'Local Experience', 'Live Music'],
  cultural:     ['Local Experience', 'Arts & Culture', 'Dining'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Check if After Dark is currently active (server UTC, adjusted to offset if provided) */
function isAfterDarkActive(utcOffsetMinutes?: number): boolean {
  const now = new Date();
  const localHour = utcOffsetMinutes !== undefined
    ? new Date(now.getTime() + utcOffsetMinutes * 60000).getUTCHours()
    : now.getUTCHours();
  return localHour >= AFTER_DARK_START_HOUR || localHour < AFTER_DARK_END_HOUR;
}

/** Minutes until After Dark starts (or 0 if already active) */
function minutesUntilAfterDark(utcOffsetMinutes?: number): number {
  if (isAfterDarkActive(utcOffsetMinutes)) return 0;
  const now = new Date();
  const localHour = utcOffsetMinutes !== undefined
    ? new Date(now.getTime() + utcOffsetMinutes * 60000).getUTCHours()
    : now.getUTCHours();
  const localMinute = now.getUTCMinutes();
  // Minutes until 21:00
  if (localHour < AFTER_DARK_START_HOUR) {
    return (AFTER_DARK_START_HOUR - localHour) * 60 - localMinute;
  }
  return 0;
}

/** Cache key for user mood — TTL 24 hours */
function moodCacheKey(userId: string): string {
  return `afterdark:mood:${userId}`;
}

/** Get user's mood from cache */
async function getMoodFromCache(userId: string): Promise<AfterDarkMood | null> {
  const val = await cache.get(moodCacheKey(userId));
  if (val && VALID_MOODS.includes(val as AfterDarkMood)) {
    return val as AfterDarkMood;
  }
  return null;
}

/** Set user's mood in cache (TTL 24 hours) */
async function setMoodInCache(userId: string, mood: AfterDarkMood): Promise<void> {
  await cache.set(moodCacheKey(userId), mood, 24 * 60 * 60);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/after-dark/status
 * Returns whether After Dark is active for the requesting user.
 * Query: utcOffset (optional, minutes — e.g. -420 for MT)
 */
afterDarkRouter.get('/status', async (req: AuthRequest, res: Response) => {
  const utcOffset = req.query.utcOffset !== undefined
    ? Number(req.query.utcOffset)
    : undefined;

  if (utcOffset !== undefined && !isNaN(utcOffset) && (utcOffset < -840 || utcOffset > 840)) {
    return res.status(400).json({ error: 'utcOffset must be between -840 and 840 minutes' });
  }

  const active = isAfterDarkActive(utcOffset);
  const minutesUntil = minutesUntilAfterDark(utcOffset);

  const currentMood = await getMoodFromCache(req.userId as string);

  return res.json({
    active,
    minutesUntilActive: active ? 0 : minutesUntil,
    activeHours: { start: AFTER_DARK_START_HOUR, end: AFTER_DARK_END_HOUR },
    currentMood,
    availableMoods: VALID_MOODS,
  });
});

/**
 * GET /api/after-dark/suggestions
 * Returns late-night filtered suggestions.
 * Query: lat, lng, zip, radius, mood (overrides stored mood)
 */
afterDarkRouter.get('/suggestions', async (req: AuthRequest, res: Response, next) => {
  try {
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
    const zip = typeof req.query.zip === 'string' ? req.query.zip.trim() : undefined;
    const radius = req.query.radius !== undefined ? Math.min(Number(req.query.radius), 60) : 25;
    const moodParam = typeof req.query.mood === 'string' ? req.query.mood as AfterDarkMood : undefined;
    const utcOffset = req.query.utcOffset !== undefined ? Number(req.query.utcOffset) : undefined;

    if (utcOffset !== undefined && !isNaN(utcOffset) && (utcOffset < -840 || utcOffset > 840)) {
      return res.status(400).json({ error: 'utcOffset must be between -840 and 840 minutes' });
    }

    if (moodParam && !VALID_MOODS.includes(moodParam)) {
      return res.status(400).json({
        error: `Invalid mood. Valid values: ${VALID_MOODS.join(', ')}`,
      });
    }

    // Resolve stored mood if not passed as query param
    let mood: AfterDarkMood | null = moodParam ?? null;
    if (!mood) {
      mood = await getMoodFromCache(req.userId as string);
    }

    // Fetch from all after-dark-friendly categories in parallel
    const categoryResults = await Promise.all(
      AFTER_DARK_CATEGORIES.map((cat) =>
        getSuggestions({ lat, lng, zip, category: cat, radiusMiles: radius }).catch((err) => {
          logger.warn(`after-dark: getSuggestions failed for ${cat}: ${err.message}`);
          return [];
        })
      )
    );

    let suggestions = categoryResults.flat();

    // Filter for late-night vibes: deprioritise family-only / outdoor daytime
    suggestions = suggestions.filter((s) => s.dateFriendly);

    // Mood-based re-ranking: bump preferred categories to the top
    if (mood && MOOD_CATEGORIES[mood]) {
      const preferred = new Set(MOOD_CATEGORIES[mood]);
      suggestions.sort((a, b) => {
        const aP = preferred.has(a.category) ? 0 : 1;
        const bP = preferred.has(b.category) ? 0 : 1;
        if (aP !== bP) return aP - bP;
        // Within same tier, closer first
        if (a.distanceMiles !== undefined && b.distanceMiles !== undefined) {
          return a.distanceMiles - b.distanceMiles;
        }
        return 0;
      });
    }

    // Deduplicate by id
    const seen = new Set<string>();
    suggestions = suggestions.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    return res.json({
      mood: mood ?? null,
      count: suggestions.length,
      suggestions: suggestions.slice(0, 60), // cap at 60
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/after-dark/mood
 * Body: { mood: AfterDarkMood }
 * Stores the user's current mood (lightweight, no schema change needed).
 */
afterDarkRouter.post('/mood', async (req: AuthRequest, res: Response, next) => {
  try {
    const { mood } = req.body || {};
    if (!mood || !VALID_MOODS.includes(mood as AfterDarkMood)) {
      return res.status(400).json({
        error: `mood is required. Valid values: ${VALID_MOODS.join(', ')}`,
      });
    }

    await setMoodInCache(req.userId as string, mood as AfterDarkMood);

    return res.json({
      mood,
      message: `After Dark mood set to "${mood}"`,
      preferredCategories: MOOD_CATEGORIES[mood as AfterDarkMood],
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/after-dark/mood
 * Returns the user's current stored mood.
 */
afterDarkRouter.get('/mood', async (req: AuthRequest, res: Response, next) => {
  try {
    const mood = await getMoodFromCache(req.userId as string);
    return res.json({
      mood,
      availableMoods: VALID_MOODS,
      preferredCategories: mood ? MOOD_CATEGORIES[mood] : null,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/after-dark/impulse
 * "Let's go NOW" — creates a spontaneous OPEN proposal for tonight
 * with the user's mood-driven option pre-populated.
 *
 * Body: { groupId, optionName, optionCategory, optionAddress? }
 * The dateTime is set to 2 hours from now.
 */
afterDarkRouter.post('/impulse', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId, optionName, optionCategory, optionAddress } = req.body || {};

    if (!groupId) return res.status(400).json({ error: 'groupId is required' });
    if (!optionName) return res.status(400).json({ error: 'optionName is required' });
    if (!optionCategory) return res.status(400).json({ error: 'optionCategory is required' });

    // Must be a group member
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.userId },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    // Impulse proposals are set to 2 hours from now
    const impulseDateTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // Get user's mood for the title
    const mood = await getMoodFromCache(req.userId as string);
    const moodTag = mood ? ` [${mood}]` : '';

    const proposal = await prisma.proposal.create({
      data: {
        groupId,
        creatorId: req.userId as string,
        title: `⚡ After Dark Impulse${moodTag}: ${optionName}`,
        dateTime: impulseDateTime,
        options: {
          create: [
            {
              name: optionName,
              category: optionCategory,
              description: 'Spontaneous After Dark pick 🌙',
              ...(optionAddress ? { address: optionAddress } : {}),
            },
            // Pad to minimum 3 options with generic late-night fillers
            {
              name: 'Grab drinks nearby',
              category: 'Wine & Drinks',
              description: 'Whatever is open and close',
            },
            {
              name: 'Late-night eats',
              category: 'Dining',
              description: 'Find the nearest late-night spot',
            },
          ],
        },
      },
      include: { options: true },
    });

    logger.info(`after-dark impulse proposal created: ${proposal.id} by ${req.userId}`);

    return res.status(201).json({
      proposal,
      message: 'Impulse proposal created — go vote!',
      impulseDateTime: impulseDateTime.toISOString(),
    });
  } catch (err) {
    return next(err);
  }
});
