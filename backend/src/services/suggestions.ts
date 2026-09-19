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
import { Suggestion, SuggestionCategory, SuggestionQuery, haversineMiles } from './sources/types';
import { getSeedSuggestions } from './sources/seed.source';
import { fetchOverpass } from './sources/overpass.source';
import { fetchTmdb } from './sources/tmdb.source';
import { fetchTicketmaster } from './sources/ticketmaster.source';
import { fetchFoursquare } from './sources/foursquare.source';
import { fetchNpsParks, fetchNpsEvents } from './sources/nps.source';
import { fetchPredictHQ } from './sources/predicthq.source';

export type { Suggestion, SuggestionCategory, SuggestionQuery };

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

function zipToLatLng(zip: string): [number, number] {
  const prefix = zip.slice(0, 3);
  return ZIP_PREFIX_COORDS[prefix] ?? [39.8283, -98.5795]; // geographic center of US
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
function sortSuggestions(suggestions: Suggestion[], userLat?: number, userLng?: number): Suggestion[] {
  return [...suggestions].sort((a, b) => {
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
    // Seed last
    if (a.source === 'seed' && b.source !== 'seed') return 1;
    if (b.source === 'seed' && a.source !== 'seed') return -1;
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
  return `suggestions:v2:${loc}:${cat}:${rad}`;
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
  // Resolve coordinates
  let lat = query.lat;
  let lng = query.lng;
  if ((!lat || !lng) && query.zip) {
    [lat, lng] = zipToLatLng(query.zip);
  }

  const radiusMiles = query.radiusMiles ?? 25;
  const category = (query.category === 'All' ? undefined : query.category) as SuggestionCategory | undefined;
  const key = cacheKey(query);

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

  // Run all sources in parallel — each fails gracefully
  const sourceResults = await Promise.allSettled([
    // Location-dependent sources
    ...(hasLocation ? [
      fetchTicketmaster(lat!, lng!, radiusMiles, category),
      fetchFoursquare(lat!, lng!, radiusMiles, category),
      fetchPredictHQ(lat!, lng!, radiusMiles, category),
      fetchNpsParks(lat!, lng!, radiusMiles),
      fetchNpsEvents(lat!, lng!, radiusMiles),
      fetchOverpass(lat!, lng!, Math.min(radiusMiles, 30), category),
    ] : []),
    // Location-independent sources
    fetchTmdb(category),
  ]);

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

  // Filter by date if requested
  let filtered = allResults;
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

    filtered = allResults.filter((s) => {
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

  // Cache it
  await cache.set(key, JSON.stringify(final), cacheTtl(final));

  return final;
}
