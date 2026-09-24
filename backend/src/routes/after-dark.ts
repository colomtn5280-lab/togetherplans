import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { getUserPreferences, setUserPreferences } from '../models/UserPreferences';
import {
  filterAfterDark,
  enrichAfterDarkMetadata,
  scoreAfterDarkRelevance,
  AfterDarkConfig,
} from '../services/after-dark.service';
import { getSuggestions } from '../services/suggestions';

const router = Router();

/**
 * GET /api/user/preferences
 * Fetch user's After Dark and personalization preferences
 */
router.get('/preferences', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const prefs = getUserPreferences(userId);
    res.json(prefs);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/user/preferences
 * Update user's preferences
 */
router.put('/preferences', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updated = setUserPreferences(userId, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * POST /api/after-dark
 * Get After Dark filtered suggestions
 * Body: { lat, lng, radius?, nightStartsAt?, includeFamilyEvents? }
 */
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { lat, lng, radius = 60, nightStartsAt, includeFamilyEvents } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    // Get user preferences (allow overrides from request)
    const userPrefs = getUserPreferences(userId);
    const config: AfterDarkConfig = {
      nightStartsAt: (nightStartsAt || userPrefs.nightStartsAt) as any,
      includeFamilyEvents: includeFamilyEvents !== undefined ? includeFamilyEvents : userPrefs.includeFamilyInAfterDark,
      sortByTimeToEvent: true,
    };

    // Fetch base suggestions
    const suggestions = await getSuggestions({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radiusMiles: parseFloat(radius),
    });

    // Apply After Dark filter
    const filtered = filterAfterDark(suggestions, config);

    // Enrich with time metadata (TIER 2)
    const enriched = enrichAfterDarkMetadata(filtered);

    // Score by relevance (TIER 3)
    const scores = scoreAfterDarkRelevance(enriched, {
      favoriteCategories: userPrefs.favoriteCategories,
      groupSize: userPrefs.groupSize,
    });

    // Add scores to results
    const results = enriched.map((s, i) => ({
      ...s,
      relevanceScore: scores[i],
    }));

    res.json(results);
  } catch (error) {
    console.error('Error in After Dark endpoint:', error);
    res.status(500).json({ error: 'Failed to get After Dark suggestions' });
  }
});

/**
 * GET /api/after-dark/stats
 * Get analytics on After Dark usage (TIER 3 enhancement)
 * Returns: trending categories, peak hours, popular times
 */
router.get('/stats', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Placeholder for v1.4 ML/analytics integration
    res.json({
      trendingNow: ['Live Music', 'Wine & Drinks', 'Comedy'],
      peakHours: ['7-9pm', '8-10pm'],
      topCategories: ['Live Music', 'Dining', 'Wine & Drinks'],
      message: 'Placeholder; full analytics in v1.4',
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/after-dark/notify-me
 * Set up last-minute-deals notification (TIER 3)
 * Body: { category, maxPrice, maxDistance }
 */
router.post('/notify-me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Placeholder for v1.4 notification service
    const { category, maxPrice, maxDistance } = req.body;

    res.json({
      notificationId: `notify_${userId}_${Date.now()}`,
      category,
      maxPrice,
      maxDistance,
      status: 'active',
      message: 'Placeholder; real notifications in v1.4',
    });
  } catch (error) {
    console.error('Error setting up notification:', error);
    res.status(500).json({ error: 'Failed to set up notification' });
  }
});

export default router;
