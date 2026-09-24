import { Router, Request, Response, NextFunction } from 'express';
import { getSuggestions } from '@/services/suggestions';
import { ALL_CATEGORIES } from '@/constants/categories';

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
    if (rawDateFilter && !VALID_DATE_FILTERS.has(rawDateFilter)) {
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
      dateFilter: rawDateFilter as 'tonight' | 'this-weekend' | 'this-week' | 'anytime' | undefined,
    });

    return res.json(suggestions);
  } catch (err) {
    return next(err);
  }
});


// ── Temporary: test Gemini API from production ─────────────────────────────
suggestionsRouter.get('/gemini-test', async (_req: import('express').Request, res: import('express').Response) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ error: 'GEMINI_API_KEY not set' });
  try {
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello in 3 words. Return plain text only.' }] }] }),
        signal: AbortSignal.timeout(8000),
      }
    );
    const d = await r.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
    return res.json({
      key_prefix: key.slice(0, 12) + '...',
      status: r.status,
      error: d.error?.message ?? null,
      response: d.candidates?.[0]?.content?.parts?.[0]?.text ?? null,
    });
  } catch (err) {
    return res.json({ error: String(err) });
  }
});
