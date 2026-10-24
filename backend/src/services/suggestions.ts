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

import { cacheGetWithStale, cacheSet } from '@/services/cache';
import { logger } from '@/services/logger';
import { recordSourceAttempt, recordSourceSuccess, recordSourceError } from '@/services/source-health';
import { Suggestion, SuggestionCategory, SuggestionQuery, haversineMiles } from './sources/types';
import { prisma } from '@/services/db';
import { getSeedSuggestions } from './sources/seed.source';
import { fetchOverpass } from './sources/overpass.source';
import { fetchPlacesWellness } from './sources/places.source';
import { fetchTmdb } from './sources/tmdb.source';
import { fetchTicketmaster } from './sources/ticketmaster.source';
import { fetchViator } from './sources/viator.source';
import { fetchLiteApiHotels } from './sources/liteapi.source';
import { fetchPredictHQ } from './sources/predicthq.source';
import { fetchMobilize } from './sources/mobilize.source';
import { enrichPhotos } from './photo-enrichment';
import { fetchAiIdeas } from './sources/ai-ideas.source';
import { fetchFoursquare } from './sources/foursquare.source';
import { fetchNpsParks, fetchNpsEvents } from './sources/nps.source';
import { fetchTavilyFallback, tavilyAlwaysFires } from './sources/tavily.source';
import { getStaticVenues, STATIC_CATEGORIES } from './sources/static.source';
import { fetchBandsintown } from './sources/bandsintown.source';

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
    const zipCached = await cacheGetWithStale(cacheK);
    if (zipCached) {
      const [la, ln] = JSON.parse(zipCached.value) as [number, number];
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
        await cacheSet(cacheK, JSON.stringify([la, ln]), 30 * 86400).catch(() => undefined);
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
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 60);
  const cutoffStr = cutoff.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  // Only treat a date as "upcoming soon" if it's within the 60-day window
  const isSoon = (date: string | undefined): boolean =>
    !!date && date <= cutoffStr;

  return [...suggestions].sort((a, b) => {
    // Seed "ideas" always sort last, after every real result
    const aSeed = a.source === 'seed';
    const bSeed = b.source === 'seed';
    if (aSeed !== bSeed) return aSeed ? 1 : -1;

    const aSoon = isSoon(a.date);
    const bSoon = isSoon(b.date);

    // Events within 60 days sort first, chronologically
    if (aSoon && bSoon) return a.date!.localeCompare(b.date!);
    if (aSoon) return -1;
    if (bSoon) return 1;

    // Events 60+ days away and undated venues both sort by distance
    if (a.distanceMiles !== undefined && b.distanceMiles !== undefined) {
      return a.distanceMiles - b.distanceMiles;
    }
    if (a.distanceMiles !== undefined) return -1;
    if (b.distanceMiles !== undefined) return 1;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// E9: Personalized ranking — SQL scoring heuristic
// Boosts suggestions whose category matches the user's past voted options.
// No ML needed: simple category-affinity score from vote history.
// Only fires when userId is present; cache-safe (boosts happen post-cache).
// ---------------------------------------------------------------------------
async function personalizeRanking(suggestions: Suggestion[], userId: string): Promise<Suggestion[]> {
  try {
    // Get categories inferred from the user's recent votes via option titles
    // (Option model doesn't store activityType; we use vote count per category
    // from the suggestions the user has added to proposals historically)
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const votes = await prisma.vote.findMany({
      where: { userId, createdAt: { gte: cutoff } },
      include: { option: { select: { category: true } } },
      take: 100,
    });

    // Tally category affinity scores
    const affinity = new Map<string, number>();
    for (const v of votes) {
      const cat = (v.option as { category?: string | null })?.category;
      if (cat) affinity.set(cat, (affinity.get(cat) ?? 0) + 1);
    }

    if (affinity.size === 0) return suggestions;

    // Sort: user-preferred categories bubble up, everything else unchanged
    return [...suggestions].sort((a, b) => {
      const aScore = a.category ? (affinity.get(a.category) ?? 0) : 0;
      const bScore = b.category ? (affinity.get(b.category) ?? 0) : 0;
      // Only reorder if there's a meaningful difference — don't disrupt distance sort
      if (Math.abs(aScore - bScore) < 2) return 0;
      return bScore - aScore;
    });
  } catch (err) {
    logger.warn(`[E9] Personalized ranking failed: ${err instanceof Error ? err.message : err}`);
    return suggestions; // gracefully degrade — return unranked
  }
}

// ---------------------------------------------------------------------------
// Featured Business Injection — paid B2B businesses injected at the top
// ---------------------------------------------------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
async function getFeaturedBusinesses(category: string, lat: number, lng: number): Promise<Suggestion[]> {
  try {
    const businesses = await prisma.business.findMany({
      where: {
        featuredCategory: category,
        subscriptionStatus: 'active',
        tier: { in: ['premium', 'featured'] },
        active: true,
      } as any,
      orderBy: [
        { featuredSlot: 'asc' } as any,
        { name: 'asc' },
      ],
    });

    // Filter by radius (haversine distance)
    const nearby = (businesses as any[]).filter((b: any) => {
      if (!b.lat || !b.lng) return true;
      const dist = haversineMiles(lat, lng, b.lat, b.lng);
      return dist <= (b.featuredRadius || 30);
    });

    return nearby.map((b: any, i: number) => ({
      id: `featured-${b.id}`,
      name: b.name,
      category: category as SuggestionCategory,
      shortDescription: b.description || '',
      address: b.address || b.city,
      imageUrl: b.heroImageUrl || b.logoUrl || undefined,
      costTier: (b.priceRange === '$' ? '$' : b.priceRange === '$$' ? '$$' : b.priceRange === '$$$' ? '$$$' : 'free') as any,
      source: 'featured' as const,
      externalId: `featured-${b.id}`,
      dateFriendly: true,
      groupFriendly: true,
      ticketUrl: b.website || undefined,
      isFeatured: true,
      featuredTier: b.tier as 'premium' | 'featured',
      featuredSlot: b.featuredSlot ?? (i + 1),
    }));
  } catch (err) {
    logger.error(`getFeaturedBusinesses error: ${String(err)}`);
    return [];
  }
}

async function getDirectListings(category: string): Promise<Suggestion[]> {
  try {
    const listings = await (prisma as any).businessDirectListing.findMany({
      where: { category, active: true, OR: [{ eventDate: null }, { eventDate: { gte: new Date() } }] },
      include: { business: { select: { name: true, logoUrl: true, website: true } } },
      orderBy: { eventDate: 'asc' },
      take: 10,
    });
    return listings.map((l: any) => ({
      id: `direct-${l.id}`,
      name: l.title,
      category: category as SuggestionCategory,
      shortDescription: `${l.business.name} — ${l.description}`,
      address: l.address || undefined,
      imageUrl: l.imageUrl || l.business.logoUrl || undefined,
      source: 'featured' as const,
      externalId: `direct-${l.id}`,
      dateFriendly: true,
      groupFriendly: true,
      costTier: 'free' as const,
      ticketUrl: l.ticketUrl || l.business.website || undefined,
      date: l.eventDate ? new Date(l.eventDate).toISOString().split('T')[0] : undefined,
      isDirectListing: true,
    }));
  } catch { return []; }
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
  return `suggestions:v19:${loc}:${cat}:${rad}:${date}`;
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

  const cacheHit = !query._skipCache ? await cacheGetWithStale(key) : null;
  if (cacheHit) {
    try {
      const parsed = JSON.parse(cacheHit.value) as Suggestion[];
      if (!cacheHit.stale) {
        logger.info(`Suggestions cache hit (fresh): ${key} (${parsed.length} results)`);
        return parsed;
      }
      // Stale — return immediately, refresh in background
      logger.info(`Suggestions cache hit (stale, refreshing bg): ${key} (${parsed.length} results)`);
      void fetchAndCache(query, lat, lng, radiusMiles, category, key);
      return parsed;
    } catch {
      // corrupted entry — fall through to full fetch
    }
  }

  const hasLocation = typeof lat === 'number' && typeof lng === 'number';
  logger.info(`Suggestions fetch: ${key} hasLocation=${hasLocation}`);

  // ── Static venue pre-check ────────────────────────────────────────────────
  // For categories served from the local venue DB, query it first (~5ms).
  // If we get ≥10 results, skip the equivalent live API sources (Foursquare,
  // Overpass) and use the static spine instead. Live sources for events
  // (Ticketmaster, PredictHQ) are never skipped — they provide dated inventory.
  const categorySlug = query.category ?? '';
  const isStaticCategory = STATIC_CATEGORIES.has(categorySlug);
  let staticResults: Suggestion[] = [];
  let useStaticSpine = false;

  if (hasLocation && isStaticCategory) {
    try {
      staticResults = await getStaticVenues(categorySlug, lat!, lng!, radiusMiles);
      useStaticSpine = staticResults.length >= 10;
      logger.info(
        `[static-venues] ${categorySlug}: ${staticResults.length} results → ` +
        (useStaticSpine ? 'using static spine, skipping Foursquare/Overpass' : 'thin, falling back to live'),
      );
    } catch (err) {
      logger.warn(`[static-venues] pre-check error: ${String(err)}`);
    }
  }


  const namedFetches: Array<{ name: string; fetch: () => Promise<Suggestion[]> }> = [
    ...(hasLocation ? [
      { name: 'ticketmaster', fetch: () => fetchTicketmaster(lat!, lng!, radiusMiles, category) },
      { name: 'predicthq', fetch: () => fetchPredictHQ(lat!, lng!, radiusMiles, category) },
      // Skip Overpass + Foursquare if static spine has adequate coverage (≥10 results).
      // They provide the same venue data from the same upstream sources,
      // but the static DB is faster and has no rate limits.
      // Also skip for movies: Overpass/FSQ return theaters, not films. TMDB is correct.
      // Revert hiking: run Overpass + Foursquare synchronously so users get real trails
      // (not generic seeds). The spinner is better UX than seed placeholders.
      ...(!useStaticSpine && categorySlug !== 'movies' ? [
        { name: 'overpass', fetch: () => fetchOverpass(lat!, lng!, Math.min(radiusMiles, 30), category) },
        { name: 'foursquare', fetch: () => fetchFoursquare(lat!, lng!, radiusMiles, category) },
      ] : []),
      // NPS: national parks + events — primary for Outdoors/hiking.
      // Run synchronously so users see real park data, not seeds.
      ...(!category || category === 'Outdoors'
        ? [
            { name: 'nps-parks', fetch: () => fetchNpsParks(lat!, lng!, radiusMiles) },
            { name: 'nps-events', fetch: () => fetchNpsEvents(lat!, lng!, radiusMiles) },
          ]
        : []),
      // Bandsintown: free live music events (Phase 4) — supplements Ticketmaster
      ...((!category || category === 'Live Music' || category === 'Comedy') && hasLocation
        ? [{ name: 'bandsintown', fetch: () => fetchBandsintown(lat!, lng!, radiusMiles, category) }]
        : []),
      // Google Places text search fallback for Wellness (OSM is sparse for spas in suburbs)
      ...((category === 'Wellness' || !category) && hasLocation
        ? [{ name: 'places', fetch: () => fetchPlacesWellness(lat!, lng!, radiusMiles) }]
        : []),
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

  // Add static results first if using the static spine
  if (staticResults.length > 0) {
    allResults.push(...staticResults);
    sourceSummary.push(`static:${staticResults.length}`);
  }

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
      // specific:YYYY-MM-DD — exact date match
      if (query.dateFilter?.startsWith('specific:')) {
        const dateStr = query.dateFilter.slice('specific:'.length);
        return s.date === dateStr;
      }
      return true;
    });
  }

  // Deduplicate, sort, pad with seed if thin
  const deduped = deduplicate(filtered);
  const sorted = sortSuggestions(deduped, lat, lng);

  // No seed fallback — return empty array and let the frontend spinner show.
  // Users should see a spinner while APIs load rather than generic placeholder tiles
  // that look like real results and cause them to click away.
  let final = sorted;

  logger.info(`Suggestions assembled: ${final.length} total [${sourceSummary.join(', ')}]`);

  // ---------------------------------------------------------------------------
  // Return core results immediately, then enrich in background (Fix 1)
  // ---------------------------------------------------------------------------
  // Gemini AI ideas, Tavily fallback, and photo enrichment are non-critical
  // for the core venue list. Moving them to background cuts cold-path latency
  // from ~10s to ~1-2s. The enriched result overwrites the cache entry seconds
  // later — every subsequent request gets the full version.
  //
  // First user in a new metro sees: real venues, no AI ideas, some missing photos.
  // Second user (seconds later): full enriched cached result.
  //
  // Rollback: revert this commit to restore blocking behaviour.

  // Resolve city/state needed by Gemini + Tavily — do this NOW (fast, shared)
  let ideaCity = '';
  let ideaState = '';
  if (query.zip) {
    try {
      const zipData = await fetch(`https://api.zippopotam.us/us/${query.zip}`, { signal: AbortSignal.timeout(3000) });
      if (zipData.ok) {
        const zd = await zipData.json() as { places?: Array<{ 'place name'?: string; 'state abbreviation'?: string }> };
        ideaCity = zd.places?.[0]?.['place name'] ?? query.zip;
        ideaState = zd.places?.[0]?.['state abbreviation'] ?? '';
      }
    } catch { ideaCity = query.zip; }
  } else if (lat && lng) {
    try {
      const geo = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        { signal: AbortSignal.timeout(3000) },
      );
      if (geo.ok) {
        const gd = await geo.json() as { city?: string; principalSubdivisionCode?: string };
        ideaCity = gd.city ?? `${lat.toFixed(2)},${lng.toFixed(2)}`;
        ideaState = (gd.principalSubdivisionCode ?? '').replace('US-', '');
      }
    } catch { ideaCity = `${lat.toFixed(2)},${lng.toFixed(2)}`; }
  }

  // Featured businesses: inject into the result we return NOW (paid placement must be immediate)
  if (hasLocation && query.category && query.category !== 'All') {
    const [featured, directListings] = await Promise.all([
      getFeaturedBusinesses(query.category, lat!, lng!),
      getDirectListings(query.category),
    ]);
    if (featured.length > 0 || directListings.length > 0) {
      const featuredNames = new Set([...featured, ...directListings].map(f => f.name.toLowerCase()));
      final = final.filter(r => !featuredNames.has(r.name.toLowerCase()));
      final = [...featured.slice(0, 3), ...directListings, ...final];
      if (featured.length > 0) logger.info(`Featured injection: ${featured.length} businesses, ${directListings.length} direct listings for ${query.category}`);
    }
  }

  // Cache the core result immediately — fast for the returning user
  await cacheSet(key, JSON.stringify(final), cacheTtl(final));

  // E9: Personalized ranking (applied post-cache so cached entry stays generic)
  if (query.userId) {
    final = await personalizeRanking(final, query.userId);
  }

  // Background enrichment: Gemini + Tavily + photos
  // Runs after response is sent. Overwrites cache with enriched version.
  void (async () => {
    try {
      let enriched = [...final];

      // Gemini AI ideas
      if (process.env.GEMINI_API_KEY) {
        const aiIdeas = await fetchAiIdeas(category ?? 'Local Experience', ideaCity, ideaState, 5);
        if (aiIdeas.length) {
          enriched = deduplicate([...enriched, ...aiIdeas]);
          logger.info(`[bg] AI ideas appended: ${aiIdeas.length} for ${category} near ${ideaCity}`);
        }
      }

      // Tavily fallback
      const TAVILY_THRESHOLD = 5;
      const realCount = enriched.filter((s) => !s.isIdea && s.source !== 'seed').length;
      // Skip Outdoors/hiking: Tavily returns "10 best trails in..." listicles, not venues.
      const skipCategories = new Set(['Movies', 'Streaming Night', 'After Dark', 'Outdoors']);
      const shouldFireTavily =
        process.env.TAVILY_API_KEY &&
        !skipCategories.has(category ?? '') &&
        ideaCity &&
        (tavilyAlwaysFires(category ?? '') || realCount < TAVILY_THRESHOLD);

      if (shouldFireTavily) {
        const tavilyResults = await fetchTavilyFallback(category ?? 'Local Experience', ideaCity, ideaState);
        if (tavilyResults.length) {
          enriched = deduplicate([...enriched, ...tavilyResults]);
          logger.info(`[bg] Tavily fallback: ${tavilyResults.length} results for ${category} near ${ideaCity}`);
        }
      }

      // Photo enrichment
      await enrichPhotos(enriched, lat, lng);

      // Overwrite cache with fully enriched result
      await cacheSet(key, JSON.stringify(enriched), cacheTtl(enriched));
      logger.info(`[bg] Enrichment complete for ${key}: ${enriched.length} results`);
    } catch (err) {
      logger.warn(`[bg] Enrichment failed for ${key}: ${err instanceof Error ? err.message : err}`);
    }
  })();

  return final;
}

// ---------------------------------------------------------------------------
// E3 helper: full fetch + cache write, called from background refresh
// ---------------------------------------------------------------------------
async function fetchAndCache(
  query: SuggestionQuery,
  lat: number | undefined,
  lng: number | undefined,
  radiusMiles: number,
  category: SuggestionCategory | undefined,
  key: string,
): Promise<void> {
  try {
    // Re-run the main function but skip the cache check (this IS the refresh)
    // We pass a sentinel to skip the stale branch — simpler than extracting a sub-fn.
    const fresh = await getSuggestions({ ...query, _skipCache: true });
    await cacheSet(key, JSON.stringify(fresh), cacheTtl(fresh));
    logger.info(`Background cache refresh complete: ${key} (${fresh.length} results)`);
  } catch (err) {
    logger.warn(`Background cache refresh failed: ${key}: ${err instanceof Error ? err.message : err}`);
  }
}
