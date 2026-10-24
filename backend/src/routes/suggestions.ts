import { Router, Request, Response, NextFunction } from 'express';
import { getSuggestions } from '@/services/suggestions';
import { ALL_CATEGORIES } from '@/constants/categories';
import { searchTmdb } from '@/services/sources/tmdb.source';
import { searchFoursquareVenues } from '@/services/sources/foursquare.source';
import { requireAuth, AuthRequest } from '@/middleware/auth';
import { scrapeVenueDetail } from '@/services/firecrawl';

export const suggestionsRouter = Router();

const VALID_CATEGORIES = new Set<string>([
  'All',
  // Legacy internal categories (kept for old clients + stored DB values)
  'Dining', 'Live Music', 'Comedy', 'Theater & Plays', 'Movies',
  'Streaming Night', 'Outdoors', 'Day Trip', 'Wine & Drinks',
  'Arts & Culture', 'Active', 'Local Experience', 'Unique & Quirky',
  // New unified categories — slugs and display names both accepted
  ...ALL_CATEGORIES.map((c) => c.id),
  ...ALL_CATEGORIES.map((c) => c.name),
  // Legacy 'Golf' category (replaced by 'Sports & Active') — shipped clients still send these
  'golf', 'Golf',
]);

const VALID_DATE_FILTERS = new Set(['tonight', 'this-weekend', 'this-week', 'anytime']);

function isValidDateFilter(f: string): boolean {
  return VALID_DATE_FILTERS.has(f) || /^specific:\d{4}-\d{2}-\d{2}$/.test(f);
}

/**
 * GET /api/suggestions
 *
 * Query params:
 *   lat        float   User latitude
 *   lng        float   User longitude
 *   zip        string  US zip code (alternative to lat/lng)
 *   category   string  One of the 14 categories above, or 'All'
 *   radius     number  Search radius in miles (default 25, max 150 — day trips & getaways)
 *   dateFilter string  'tonight' | 'this-weekend' | 'this-week' | 'anytime'
 *
 * Returns: Suggestion[]
 */
suggestionsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
    const zip = typeof req.query.zip === 'string' ? req.query.zip.trim() : undefined;
    const rawCategory = typeof req.query.category === 'string' ? req.query.category : undefined;
    const rawRadius = req.query.radius !== undefined ? Number(req.query.radius) : undefined;
    const rawDateFilter = typeof req.query.dateFilter === 'string' ? req.query.dateFilter : undefined;

    // Validate lat/lng
    if (lat !== undefined && (isNaN(lat) || lat < -90 || lat > 90)) {
      return res.status(400).json({ error: 'lat must be between -90 and 90' });
    }
    if (lng !== undefined && (isNaN(lng) || lng < -180 || lng > 180)) {
      return res.status(400).json({ error: 'lng must be between -180 and 180' });
    }

    // Validate zip
    if (zip && !/^\d{5}$/.test(zip)) {
      return res.status(400).json({ error: 'zip must be a 5-digit US zip code' });
    }

    // Validate category
    if (rawCategory && !VALID_CATEGORIES.has(rawCategory)) {
      return res.status(400).json({
        error: `Invalid category. Valid values: ${[...VALID_CATEGORIES].join(', ')}`,
      });
    }

    // Validate radius — up to 150 mi so users can plan day trips & getaways
    const radiusMiles = rawRadius
      ? Math.min(Math.max(rawRadius, 1), 150)
      : 25;

    // Validate dateFilter
    if (rawDateFilter && !isValidDateFilter(rawDateFilter)) {
      return res.status(400).json({
        error: `Invalid dateFilter. Valid values: ${[...VALID_DATE_FILTERS].join(', ')}`,
      });
    }

    const suggestions = await getSuggestions({
      lat: lat !== undefined && !isNaN(lat) ? lat : undefined,
      lng: lng !== undefined && !isNaN(lng) ? lng : undefined,
      zip,
      category: rawCategory,
      radiusMiles,
      dateFilter: rawDateFilter as string | undefined,
      // E9: pass userId for personalized ranking when the request is authenticated
      userId: (req as { user?: { userId?: string; id?: string } }).user?.userId ??
               (req as { user?: { userId?: string; id?: string } }).user?.id,
    });

    // E7: Cloudflare edge caching — suggestion results are identical per metro.
    // Anon requests: cache 15 min at CDN edge, serve stale up to 1h.
    // Auth'd requests: private (user-specific featured results may differ).
    const isAuthed = !!req.headers.authorization;
    if (!isAuthed) {
      res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    } else {
      res.setHeader('Cache-Control', 'private, no-store');
    }

    return res.json(suggestions);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/suggestions/live
 *
 * E4: Phase-2 progressive response. Returns ONLY live external-API results
 * (Ticketmaster, PredictHQ, Bandsintown) without the static-spine wait.
 * The frontend calls this after rendering Phase 1 (/api/suggestions) to
 * overlay dated events on top of already-rendered venue cards.
 *
 * Same params as GET /api/suggestions.
 */
suggestionsRouter.get('/live', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
    const zip = typeof req.query.zip === 'string' ? req.query.zip.trim() : undefined;
    const rawCategory = typeof req.query.category === 'string' ? req.query.category : undefined;
    const rawRadius = req.query.radius !== undefined ? Number(req.query.radius) : undefined;
    const rawDateFilter = typeof req.query.dateFilter === 'string' ? req.query.dateFilter : undefined;
    const radiusMiles = rawRadius ? Math.min(Math.max(rawRadius, 1), 150) : 25;

    // Fetch with a forced live-only flag (skip static spine + cache)
    const suggestions = await getSuggestions({
      lat: lat !== undefined && !isNaN(lat) ? lat : undefined,
      lng: lng !== undefined && !isNaN(lng) ? lng : undefined,
      zip,
      category: rawCategory,
      radiusMiles,
      dateFilter: rawDateFilter as string | undefined,
      _skipCache: true,
    });

    // Only return dated event results (the live-only value-add)
    const liveEvents = suggestions.filter((s) => !!s.date);

    res.setHeader('Cache-Control', 'no-store');
    return res.json(liveEvents);
  } catch (err) {
    return next(err);
  }
});



/**
 * GET /api/suggestions/search?q=...&category=...
 *
 * Category-aware search:
 *   - restaurants-dining / Dining: Foursquare text search (cuisine chips + name search)
 *   - Movies / Streaming Night / netflix-shows: TMDB title search
 *   - Default: TMDB
 *
 * Requires lat+lng or zip for location-based searches (restaurants).
 */
suggestionsRouter.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) return res.json([]);

    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
    const zip = typeof req.query.zip === 'string' ? req.query.zip.trim() : undefined;
    const radius = req.query.radius !== undefined ? Number(req.query.radius) : 25;

    const isDining = category === 'restaurants-dining' || category === 'Dining';

    if (isDining) {
      // Resolve coordinates for FSQ search
      let searchLat = lat;
      let searchLng = lng;
      if ((!searchLat || !searchLng) && zip) {
        try {
          const { zipToLatLng } = await import('@/services/suggestions');
          [searchLat, searchLng] = await zipToLatLng(zip);
        } catch { /* fall through */ }
      }
      if (!searchLat || !searchLng) {
        return res.json([]); // no location for restaurant search
      }
      const results = await searchFoursquareVenues(q, searchLat, searchLng, radius);
      res.setHeader('Cache-Control', 'no-store');
      return res.json(results);
    }

    // Movies / Streaming Night / default: TMDB
    const results = await searchTmdb(q);
    return res.json(results);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/suggestions/enrich?url=<encodedUrl>
 *
 * Fetch Firecrawl venue detail for a given source URL.
 * Requires user auth. Used by EventDetail modals.
 */
suggestionsRouter.get('/enrich', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const url = typeof req.query.url === 'string' ? req.query.url.trim() : '';

    if (!url) {
      return res.status(400).json({ error: 'url query param is required' });
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return res.status(400).json({ error: 'url must use http or https' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const detail = await scrapeVenueDetail(url);
    return res.json({ detail });
  } catch (err) {
    return next(err);
  }
});
