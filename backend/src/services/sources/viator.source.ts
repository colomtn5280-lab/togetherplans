/**
 * Viator Partner API source (Basic-tier affiliate) — bookable tours & experiences.
 * Key: VIATOR_API_KEY env var. Docs: https://docs.viator.com/partner-api/technical/
 *
 * Verified live contract (Sept 2026):
 *   GET https://api.viator.com/partner/destinations
 *     Headers: exp-api-key, Accept: application/json;version=2.0, Accept-Language: en-US
 *     → { destinations: [{ destinationId, name, type, center: { latitude, longitude },
 *         destinationUrl, ... }], totalCount } — 3,397 destinations, center coords present.
 *     Denver = 4837 (type CITY, center 39.7376,-104.9847).
 *   POST https://api.viator.com/partner/products/search
 *     Same headers + Content-Type (Accept-Language is REQUIRED — 400 without it).
 *     Body: { filtering: { destination: "<id>" }, sorting: { sort: 'TRAVELER_RATING',
 *       order: 'DESCENDING' }, pagination: { start, count }, currency: 'USD' }
 *     → { products: [{ productCode, title, description, images[].variants[] (100x100
 *       … 720x480), reviews: { combinedAverageRating, totalReviews }, duration:
 *       { fixedDurationInMinutes | variableDurationFromMinutes/ToMinutes },
 *       pricing: { summary: { fromPrice } }, productUrl, flags[] }], totalCount }
 *
 * AFFILIATE ATTRIBUTION: productUrl carries the partner ref (pid=P00321754&mcid=…)
 * — use it AS-IS as the booking link; never rewrite or strip query params.
 *
 * TAGS: filtering.tags uses AND semantics — combining several wine/brewery tag IDs
 * returned totalCount 0 live even though each tag matches individually. A SINGLE
 * tag works fine: 21575 "Wine, Beer & Spirits" returned 21 Denver products live,
 * vs only 1 via title-keyword post-filtering of the top-rated pool. So Wine &
 * Drinks uses the single umbrella tag 21575 server-side; a keyword post-filter
 * is unnecessary — tagged results are trusted as-is.
 *
 * Only active for internal categories 'Local Experience' (primary), 'Couples'
 * and 'Wine & Drinks' (supplements).
 */

import { Suggestion, SuggestionCategory, haversineMiles } from './types';

const VIATOR_BASE = 'https://api.viator.com/partner';
const TIMEOUT_MS = 8000; // products/search is slower than most sources
const MAX_RESULTS = 15;
const MAX_DEST_MILES = 60; // no forced results for rural users
const DEST_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const ACTIVE_CATEGORIES = new Set<SuggestionCategory>([
  'Local Experience',
  'Couples',
  'Wine & Drinks',
]);

interface ViatorDestination {
  destinationId: number;
  name?: string;
  type?: string;
  center?: { latitude?: number; longitude?: number };
}

interface ViatorImageVariant {
  width?: number;
  height?: number;
  url?: string;
}

interface ViatorProduct {
  productCode: string;
  title?: string;
  description?: string;
  images?: Array<{ variants?: ViatorImageVariant[] }>;
  reviews?: { combinedAverageRating?: number; totalReviews?: number };
  duration?: {
    fixedDurationInMinutes?: number;
    variableDurationFromMinutes?: number;
    variableDurationToMinutes?: number;
  };
  pricing?: { summary?: { fromPrice?: number }; currency?: string };
  productUrl?: string;
  flags?: string[];
}

// ---------------------------------------------------------------------------
// Destination resolution — fetch the full list once, cache 24h in-memory,
// keep only destinations with center coords, nearest-within-60mi haversine.
// ---------------------------------------------------------------------------
interface CachedDest {
  id: number;
  lat: number;
  lng: number;
}

let destCache: { fetchedAt: number; dests: CachedDest[] } | null = null;
let destInflight: Promise<CachedDest[]> | null = null;

function viatorHeaders(key: string, json = false): Record<string, string> {
  const h: Record<string, string> = {
    'exp-api-key': key,
    Accept: 'application/json;version=2.0',
    'Accept-Language': 'en-US', // REQUIRED — request 400s without it
  };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<globalThis.Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function loadDestinations(key: string): Promise<CachedDest[]> {
  if (destCache && Date.now() - destCache.fetchedAt < DEST_CACHE_TTL_MS) {
    return destCache.dests;
  }
  if (destInflight) return destInflight; // dedupe concurrent cold-cache calls

  destInflight = (async () => {
    const resp = await fetchWithTimeout(
      `${VIATOR_BASE}/destinations`,
      { headers: viatorHeaders(key) },
      TIMEOUT_MS,
    );
    if (!resp.ok) throw new Error(`Viator destinations HTTP ${resp.status}`);
    const data = (await resp.json()) as { destinations?: ViatorDestination[] };
    // The full list is ~3,400 entries — keep only id + coords (CITY/REGION etc.
    // all carry center coords; entries without them can't be distance-matched).
    const dests: CachedDest[] = (data.destinations ?? [])
      .filter(
        (d) =>
          typeof d.destinationId === 'number' &&
          typeof d.center?.latitude === 'number' &&
          typeof d.center?.longitude === 'number',
      )
      .map((d) => ({
        id: d.destinationId,
        lat: d.center!.latitude!,
        lng: d.center!.longitude!,
      }));
    destCache = { fetchedAt: Date.now(), dests };
    return dests;
  })();

  try {
    return await destInflight;
  } finally {
    destInflight = null;
  }
}

/** Nearest Viator destination to the user within MAX_DEST_MILES, or null. */
async function resolveDestination(
  key: string,
  lat: number,
  lng: number,
): Promise<number | null> {
  const dests = await loadDestinations(key);
  let bestId: number | null = null;
  let bestDist = MAX_DEST_MILES;
  for (const d of dests) {
    const dist = haversineMiles(lat, lng, d.lat, d.lng);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = d.id;
    }
  }
  return bestId;
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------
function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shortDescription(p: ViatorProduct): string {
  const clean = stripHtml(p.description ?? '');
  if (!clean) return 'Bookable local experience via Viator.';
  return clean.length > 140 ? `${clean.slice(0, 137)}...` : clean;
}

/** Pick a ~480–720px-wide image variant (mid-size card image). */
function bestImage(p: ViatorProduct): string | undefined {
  const variants = p.images?.[0]?.variants ?? [];
  const usable = variants.filter((v) => v.url && typeof v.width === 'number');
  if (!usable.length) return undefined;
  // Prefer widths in [480, 720]; otherwise closest to 640.
  const inRange = usable.filter((v) => v.width! >= 480 && v.width! <= 720);
  const pool = inRange.length ? inRange : usable;
  pool.sort((a, b) => Math.abs(a.width! - 640) - Math.abs(b.width! - 640));
  return pool[0].url;
}

function costTierFromPrice(fromPrice?: number): Suggestion['costTier'] {
  if (typeof fromPrice !== 'number') return '$$';
  if (fromPrice < 40) return '$';
  if (fromPrice <= 100) return '$$';
  return '$$$';
}

function durationMinutes(p: ViatorProduct): number | undefined {
  const d = p.duration;
  if (!d) return undefined;
  if (typeof d.fixedDurationInMinutes === 'number') return d.fixedDurationInMinutes;
  if (typeof d.variableDurationToMinutes === 'number') return d.variableDurationToMinutes;
  if (typeof d.variableDurationFromMinutes === 'number') return d.variableDurationFromMinutes;
  return undefined;
}

/** Bayesian-ish rank: rating weighted by review volume (full weight at 50+). */
function rankScore(p: ViatorProduct): number {
  const rating = p.reviews?.combinedAverageRating ?? 0;
  const total = p.reviews?.totalReviews ?? 0;
  return rating * Math.min(1, total / 50);
}

/** Viator umbrella tag "Wine, Beer & Spirits" — single-tag filter verified live
 * (21 Denver products). Multi-tag arrays are AND-semantics and return 0. */
const WINE_TAG_ID = 21575;

const ROMANTIC_KEYWORDS = /\bromantic|couples?|sunset|evening|night|dinner|candlelit|private\b/i;

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function fetchViator(
  lat: number,
  lng: number,
  _radiusMiles: number,
  internalCategory?: SuggestionCategory,
): Promise<Suggestion[]> {
  const key = process.env.VIATOR_API_KEY;
  if (!key) return [];
  if (!internalCategory || !ACTIVE_CATEGORIES.has(internalCategory)) return [];

  try {
    const destinationId = await resolveDestination(key, lat, lng);
    if (destinationId === null) return []; // rural user — no destination in range

    const resp = await fetchWithTimeout(
      `${VIATOR_BASE}/products/search`,
      {
        method: 'POST',
        headers: viatorHeaders(key, true),
        body: JSON.stringify({
          filtering: {
            destination: String(destinationId),
            // Single tag only — multi-tag arrays are AND-semantics (0 results live).
            ...(internalCategory === 'Wine & Drinks' ? { tags: [WINE_TAG_ID] } : {}),
          },
          sorting: { sort: 'TRAVELER_RATING', order: 'DESCENDING' },
          pagination: { start: 1, count: 50 },
          currency: 'USD',
        }),
      },
      TIMEOUT_MS,
    );
    if (!resp.ok) return [];
    const data = (await resp.json()) as { products?: ViatorProduct[] };
    let products = (data.products ?? []).filter(
      (p) => p.productCode && p.title && p.productUrl,
    );

    // Category shaping
    if (internalCategory === 'Couples') {
      // Prefer romantic/evening-leaning products, keep top-rated rest as backfill.
      const romantic = products.filter((p) => ROMANTIC_KEYWORDS.test(p.title ?? ''));
      const rest = products.filter((p) => !ROMANTIC_KEYWORDS.test(p.title ?? ''));
      products = [...romantic, ...rest];
    }
    // 'Wine & Drinks' is shaped server-side via the tag filter above;
    // 'Local Experience' → pass through top-rated as-is.

    // Rank: rating weighted by review volume (stable within the Couples pre-order
    // because sort is applied uniformly — romantic-first ordering above only
    // matters for tie-breaking among equal scores via original index).
    const scored = products
      .map((p, i) => ({ p, score: rankScore(p), i }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, MAX_RESULTS);

    return scored.map(({ p }): Suggestion => {
      const fromPrice = p.pricing?.summary?.fromPrice;
      return {
        id: `viator:${p.productCode}`,
        name: p.title!,
        category: internalCategory,
        shortDescription: shortDescription(p),
        costTier: costTierFromPrice(fromPrice),
        price: typeof fromPrice === 'number' ? `From $${Math.round(fromPrice)}` : undefined,
        imageUrl: bestImage(p),
        // productUrl carries affiliate attribution (pid/mcid) — use AS-IS.
        ticketUrl: p.productUrl,
        dateFriendly: true,
        groupFriendly: true,
        durationMinutes: durationMinutes(p),
        rating: p.reviews?.combinedAverageRating,
        source: 'viator',
        externalId: p.productCode,
        attribution: 'Experiences via Viator',
      };
    });
  } catch {
    return []; // graceful failure — never break the aggregate
  }
}
