/**
 * Activity Suggestion Engine — multi-source aggregator.
 *
 * Sources (in priority order):
 *   1. Ticketmaster  — live events: concerts, comedy, theater, sports (TICKETMASTER_API_KEY)
 *   2. Foursquare    — places: restaurants, bars, wineries, venues (FOURSQUARE_API_KEY)
 *   3. PredictHQ     — concerts, festivals, performing arts, community events (PREDICTHQ_API_TOKEN)
 *   4. NPS           — national parks + park events (NPS_API_KEY)
 *   5. TMDB          — now-playing movies + trending streaming shows (TMDB_API_KEY)
 *   6. Overpass/OSM  — restaurants, parks, trails, museums (no key required)
 *   7. Seed catalog  — 80+ hand-curated entries, always available as fallback
 *
 * All sources run in parallel. Results are normalized, deduplicated, sorted by distance,
 * and cached per (zip/lat+lng + category + radius).
 */

import { cache } from '@/services/cache';
import { logger } from '@/services/logger';
import { recordSourceAttempt, recordSourceSuccess, recordSourceError } from '@/services/source-health';
import { Suggestion, SuggestionCategory, SuggestionQuery, haversineMiles } from './sources/types';
import { getSeedSuggestions } from './sources/seed.source';
import { fetchOverpass } from './sources/overpass.source';
import { fetchTmdb } from './sources/tmdb.source';
import { fetchTicketmaster } from './sources/ticketmaster.source';
import { fetchFoursquare } from './sources/foursquare.source';
import { fetchNpsParks, fetchNpsEvents } from './sources/nps.source';
import { fetchPredictHQ } from './sources/predicthq.source';
import { fetchMobilize } from './sources/mobilize.source';
import { fetchViator } from './sources/viator.source';
import { fetchLiteApiHotels } from './sources/liteapi.source';
import { enrichPhotos } from './photo-enrichment';
import { fetchAiIdeas } from './sources/ai-ideas.source';

export type { Suggestion, SuggestionCategory, SuggestionQuery };

// ---------------------------------------------------------------------------
// New unified category ids/names → legacy internal SuggestionCategory.
// `null` = no external source covers it yet → seed-only fallback (never error).
// Old internal category strings stored in the DB pass through unchanged.
// ---------------------------------------------------------------------------
const NEW_TO_INTERNAL: Record<string, SuggestionCategory | null> = {
  // slug ids
  'comedy': 'Comedy',
  'concerts': 'Live Music',
  'couples-events': 'Couples',
  'family-events': 'Family',
  'sports-active': 'Sports',
  'golf': 'Sports', // backward-compat alias — shipped clients still send the old 'golf' slug
  'hiking-trails': 'Outdoors',
  'hotel-stays': 'Hotels',
  'local-experiences': 'Local Experience',
  'movies': 'Movies',
  'netflix-shows': 'Streaming Night',
  'performing-arts': 'Theater & Plays',
  'restaurants-dining': 'Dining',
  'volunteering': 'Volunteering',
  'wellness-spa': 'Wellness',
  'wine-drinks': 'Wine & Drinks',
  'custom': null,
  // display names (mobile/web send these on option.category)
  'Concerts': 'Live Music',
  'Couples Events': 'Couples',
  'Family Events': 'Family',
  'Sports & Active': 'Sports',
  'Golf': 'Sports', // backward-compat alias — old proposal options / shipped clients send 'Golf'
  'Hiking Trails': 'Outdoors',
  'Hotel Stays': 'Hotels',
  'Local Experiences': 'Local Experience',
  'Netflix Shows': 'Streaming Night',
  'Performing Arts': 'Theater & Plays',
  'Restaurants & Dining': 'Dining',
  'Volunteering': 'Volunteering',
  'Wellness & Spa': 'Wellness',
  'Custom': null,
  // 'Comedy', 'Movies', 'Wine & Drinks' are already valid internal categories
};

/**
 * Resolve a raw category string (new slug, new display name, legacy internal
 * name, or 'All') to an internal SuggestionCategory.
 * seedOnly=true means no external source covers it — serve seed suggestions.
 */
function resolveCategory(raw?: string): { internal?: SuggestionCategory; seedOnly: boolean } {
  if (!raw || raw === 'All') return { internal: undefined, seedOnly: false };
  if (raw in NEW_TO_INTERNAL) {
    const mapped = NEW_TO_INTERNAL[raw];
    return mapped ? { internal: mapped, seedOnly: false } : { internal: undefined, seedOnly: true };
  }
  // Legacy internal category string (e.g. 'Dining', 'Outdoors') — pass through as-is
  return { internal: raw as SuggestionCategory, seedOnly: false };
}

// ---------------------------------------------------------------------------
// Zip code → lat/lng (lightweight static table for top 50 US metro zip prefixes)
// Falls back to center-of-US if zip not found.
// ---------------------------------------------------------------------------
const ZIP_PREFIX_COORDS: Record<string, [number, number]> = {
  '100': [40.7128, -74.0060],   // New York
  '900': [34.0522, -118.2437],  // Los Angeles
  '606': [41.8781, -87.6298],   // Chicago
  '770': [29.7604, -95.3698],   // Houston
  '852': [33.4484, -112.0740],  // Phoenix
  '191': [39.9526, -75.1652],   // Philadelphia
  '782': [29.4241, -98.4936],   // San Antonio
  '921': [32.7157, -117.1611],  // San Diego
  '752': [32.7767, -96.7970],   // Dallas
  '787': [30.2672, -97.7431],   // Austin
  '802': [39.7392, -104.9903],  // Denver
  '980': [47.6062, -122.3321],  // Seattle
  '021': [42.3601, -71.0589],   // Boston
  '303': [33.7490, -84.3880],   // Atlanta
  '331': [25.7617, -80.1918],   // Miami
  '970': [45.5051, -122.6750],  // Portland
  '891': [36.1699, -115.1398],  // Las Vegas
  '372': [36.1627, -86.7816],   // Nashville
  '282': [35.2271, -80.8431],   // Charlotte
  '971': [37.3382, -121.8863],  // San Jose
};

function zipToLatLngStatic(zip: string): [number, number] | null {
  const prefix = zip.slice(0, 3);
  return ZIP_PREFIX_COORDS[prefix] ?? null;
}

// In-memory zip → coords cache (persists for the life of the instance)
const zipMemory = new Map<string, [number, number]>();

/**
 * Resolve a US zip to lat/lng.
 * Order: static metro-prefix table (instant) → in-memory cache → cache service →
 * zippopotam.us lookup → geographic center of US as last resort.
 */
export async function zipToLatLng(zip: string): Promise<[number, number]> {
  const staticHit = zipToLatLngStatic(zip);
  if (staticHit) return staticHit;

  const mem = zipMemory.get(zip);
  if (mem) return mem;

  const cacheK = `zipgeo:us:${zip}`;
  try {
    const cached = await cache.get(cacheK);
    if (cached) {
      const [la, ln] = JSON.parse(cached) as [number, number];
      if (typeof la === 'number' && typeof ln === 'number') {
        zipMemory.set(zip, [la, ln]);
        return [la, ln];
      }
    }
  } catch {
    // corrupted cache entry — fall through to live lookup
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const resp = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (resp.ok) {
      const data = (await resp.json()) as { places?: Array<{ latitude: string; longitude: string }> };
      const place = data.places?.[0];
      const la = place ? parseFloat(place.latitude) : NaN;
      const ln = place ? parseFloat(place.longitude) : NaN;
      if (!isNaN(la) && !isNaN(ln)) {
        zipMemory.set(zip, [la, ln]);
        await cache.set(cacheK, JSON.stringify([la, ln]), 30 * 86400).catch(() => undefined);
        return [la, ln];
      }
    }
  } catch (err) {
    logger.warn(`zipToLatLng: zippopotam lookup failed for ${zip}: ${err instanceof Error ? err.message : err}`);
  }

  return [39.8283, -98.5795]; // geographic center of US — last resort only
}

// ---------------------------------------------------------------------------
// Deduplication by name similarity + lat/lng proximity
// ---------------------------------------------------------------------------
function deduplicate(suggestions: Suggestion[]): Suggestion[] {
  const seen = new Map<string, Suggestion>();
  for (const s of suggestions) {
    const nameKey = s.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    const existing = seen.get(nameKey);
    if (!existing) {
      seen.set(nameKey, s);
    } else {
      // Prefer the one with more data (image, address, distance)
      const score = (s: Suggestion) =>
        (s.imageUrl ? 2 : 0) + (s.address ? 1 : 0) + (s.distanceMiles !== undefined ? 1 : 0) + (s.date ? 1 : 0);
      if (score(s) > score(existing)) seen.set(nameKey, s);
    }
  }
  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// Sorting: events first (by date), then places by distance, then seed
// ---------------------------------------------------------------------------
function sortSuggestions(suggestions: Suggestion[], _userLat?: number, _userLng?: number): Suggestion[] {
  return [...suggestions].sort((a, b) => {
    // Seed "ideas" always sort last, after every real result
    const aSeed = a.source === 'seed';
    const bSeed = b.source === 'seed';
    if (aSeed !== bSeed) return aSeed ? 1 : -1;
    // Events with a date sort first, chronologically
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    // Then by distance if available
    if (a.distanceMiles !== undefined && b.distanceMiles !== undefined) {
      return a.distanceMiles - b.distanceMiles;
    }
    if (a.distanceMiles !== undefined) return -1;
    if (b.distanceMiles !== undefined) return 1;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Cache key
// ---------------------------------------------------------------------------
function cacheKey(query: SuggestionQuery): string {
  const loc = query.zip
    ? `zip:${query.zip}`
    : query.lat !== undefined && query.lng !== undefined
    ? `ll:${Math.round(query.lat * 10) / 10}:${Math.round(query.lng * 10) / 10}`
    : 'noloc';
  const cat = query.category ?? 'All';
  const rad = query.radiusMiles ?? 25;
  const date = query.dateFilter ?? 'anytime';
  return `suggestions:v8:${loc}:${cat}:${rad}:${date}`;
}

// Events expire sooner; places cached longer
function cacheTtl(suggestions: Suggestion[]): number {
  const hasEvents = suggestions.some((s) => s.date);
  return hasEvents ? 3600 : 21600; // 1 hour for events, 6 hours for places
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function getSuggestions(query: SuggestionQuery): Promise<Suggestion[]> {
  // Resolve coordinates (zip resolution may hit zippopotam.us — async)
  let lat = query.lat;
  let lng = query.lng;
  if ((!lat || !lng) && query.zip) {
    [lat, lng] = await zipToLatLng(query.zip);
  }

  const radiusMiles = query.radiusMiles ?? 25;
  const { internal: category, seedOnly } = resolveCategory(query.category);
  const key = cacheKey(query);

  // Category with no external-source coverage yet → serve seed suggestions
  if (seedOnly) {
    const seeds = getSeedSuggestions(undefined, 12);
    logger.info(`Suggestions seed-only fallback for category "${query.category}": ${seeds.length} results`);
    return seeds;
  }

  // Cache check
  const cached = await cache.get(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as Suggestion[];
      logger.info(`Suggestions cache hit: ${key} (${parsed.length} results)`);
      return parsed;
    } catch {
      // corrupted cache entry — fall through
    }
  }

  const hasLocation = typeof lat === 'number' && typeof lng === 'number';
  logger.info(`Suggestions fetch: ${key} hasLocation=${hasLocation}`);

  // Run all sources in parallel — each fails gracefully; per-source health is tracked
  const namedFetches: Array<{ name: string; fetch: () => Promise<Suggestion[]> }> = [
    ...(hasLocation ? [
      { name: 'ticketmaster', fetch: () => fetchTicketmaster(lat!, lng!, radiusMiles, category) },
      { name: 'foursquare', fetch: () => fetchFoursquare(lat!, lng!, radiusMiles, category) },
      { name: 'predicthq', fetch: () => fetchPredictHQ(lat!, lng!, radiusMiles, category) },
      { name: 'nps-parks', fetch: () => fetchNpsParks(lat!, lng!, radiusMiles) },
      { name: 'nps-events', fetch: () => fetchNpsEvents(lat!, lng!, radiusMiles) },
      { name: 'overpass', fetch: () => fetchOverpass(lat!, lng!, Math.min(radiusMiles, 30), category) },
      // Mobilize only covers volunteering — skip the network call for anything else
      ...(category === 'Volunteering'
        ? [{ name: 'mobilize', fetch: () => fetchMobilize(lat!, lng!, radiusMiles) }]
        : []),
      // Viator (affiliate) covers bookable tours/experiences — only for these categories
      ...(category === 'Local Experience' || category === 'Couples' || category === 'Wine & Drinks'
        ? [{ name: 'viator', fetch: () => fetchViator(lat!, lng!, radiusMiles, category) }]
        : []),
      // LiteAPI only covers hotel stays — skip the network call for anything else
      ...(category === 'Hotels'
        ? [{ name: 'liteapi', fetch: () => fetchLiteApiHotels(lat!, lng!, radiusMiles) }]
        : []),
    ] : []),
    { name: 'tmdb', fetch: () => fetchTmdb(category) },
  ];

  const sourceResults = await Promise.allSettled(
    namedFetches.map(async ({ name, fetch }) => {
      recordSourceAttempt(name);
      try {
        const results = await fetch();
        recordSourceSuccess(name, results.length);
        return results;
      } catch (err) {
        recordSourceError(name, err);
        throw err;
      }
    }),
  );

  // Collect all results
  const allResults: Suggestion[] = [];
  const sourceSummary: string[] = [];

  for (const result of sourceResults) {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
      if (result.value.length > 0) {
        sourceSummary.push(`${result.value[0].source}:${result.value.length}`);
      }
    }
  }

  // Add distance to any results missing it (if we have user location)
  if (hasLocation) {
    for (const s of allResults) {
      if (s.distanceMiles === undefined && s.latitude && s.longitude) {
        s.distanceMiles = Math.round(haversineMiles(lat!, lng!, s.latitude, s.longitude) * 10) / 10;
      }
    }
  }

  // Filter by category (applied before date filter so every code path is covered)
  let filtered = category
    ? allResults.filter((s) => !s.category || s.category === category)
    : allResults;

  // Filter by date if requested
  if (query.dateFilter && query.dateFilter !== 'anytime') {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59);
    const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + 7);

    // Weekend: next Saturday/Sunday
    const dayOfWeek = now.getDay();
    const daysToSat = (6 - dayOfWeek + 7) % 7 || 7;
    const satStr = new Date(now.getTime() + daysToSat * 86400000).toISOString().split('T')[0];
    const sunStr = new Date(now.getTime() + (daysToSat + 1) * 86400000).toISOString().split('T')[0];

    filtered = filtered.filter((s) => {
      if (!s.date) return query.dateFilter !== 'tonight'; // non-events visible except tonight filter
      if (query.dateFilter === 'tonight') return s.date === todayStr;
      if (query.dateFilter === 'this-weekend') return s.date === satStr || s.date === sunStr;
      if (query.dateFilter === 'this-week') return s.date >= todayStr && s.date <= endOfWeek.toISOString().split('T')[0];
      return true;
    });
  }

  // Deduplicate, sort, pad with seed if thin
  const deduped = deduplicate(filtered);
  const sorted = sortSuggestions(deduped, lat, lng);

  // Always include some seed suggestions if external sources are thin
  const minExternal = 5;
  let final = sorted;
  if (deduped.filter((s) => s.source !== 'seed').length < minExternal) {
    const seeds = getSeedSuggestions(category, 12);
    const withSeeds = deduplicate([...sorted, ...seeds]);
    final = sortSuggestions(withSeeds, lat, lng);
  }

  logger.info(`Suggestions assembled: ${final.length} total [${sourceSummary.join(', ')}]`);

  // Append AI-generated ideas (Gemini) if key is configured.
  // Always adds 8 fresh ideas tagged as isIdea:true so the frontend
  // shows them in the "Ideas to spark your plan" section.
  if (process.env.GEMINI_API_KEY) {
    let aiCity = '';
    let aiState = '';
    if (query.zip) {
      // Resolve city name from zip via zippopotam (cached)
      try {
        const zipData = await fetch(`https://api.zippopotam.us/us/${query.zip}`, { signal: AbortSignal.timeout(3000) });
        if (zipData.ok) {
          const zd = await zipData.json() as { places?: Array<{ 'place name'?: string; 'state abbreviation'?: string }> };
          aiCity = zd.places?.[0]?.['place name'] ?? query.zip;
          aiState = zd.places?.[0]?.['state abbreviation'] ?? '';
        }
      } catch { aiCity = query.zip; }
    } else if (lat && lng) {
      aiCity = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    }
    const aiIdeas = await fetchAiIdeas(category ?? 'Local Experience', aiCity, aiState, 5);
    if (aiIdeas.length) {
      final = deduplicate([...final, ...aiIdeas]);
      logger.info(`AI ideas appended: ${aiIdeas.length} for ${category} near ${aiCity}`);
    }
  }

  // Enrich photos for any results still missing imageUrl (PredictHQ, Overpass,
  // seed cards, etc.) — uses Foursquare venue name search, cached 24h.
  await enrichPhotos(final, lat, lng);

  // Cache it
  await cache.set(key, JSON.stringify(final), cacheTtl(final));

  return final;
}
