/**
 * Photo Enrichment — cross-source image lookup
 *
 * For suggestions that arrive without an imageUrl (PredictHQ, Overpass,
 * seed cards, etc.), this module tries to find a real photo by searching
 * Foursquare for the venue name near the event coordinates.
 *
 * Strategy (all use existing env vars — no new API keys):
 *   1. Foursquare v2 venue search by name + lat/lng → /venues/{id}/photos
 *
 * Results are cached in the same Redis/in-memory cache so a venue that
 * appears across multiple requests only triggers one photo lookup.
 */

import { logger } from '@/services/logger';
import { cache } from '@/services/cache';
import type { Suggestion } from './sources/types';

const FSQ_BASE = 'https://api.foursquare.com/v2';
const FSQ_VERSION = '20231001';

// How long to cache a resolved photo URL (24 h)
const PHOTO_CACHE_TTL = 86_400;

// Max concurrent enrichment calls per request — keeps latency bounded
const MAX_CONCURRENT = 20;

// Timeout per individual photo lookup (search + photo fetch)
const PER_VENUE_TIMEOUT_MS = 5_000;

// ─── Foursquare name-search + photo ────────────────────────────────────────

async function fsqPhotoForVenue(
  name: string,
  lat: number,
  lng: number,
  clientId: string,
  clientSecret: string,
): Promise<string | undefined> {
  const cacheKey = `photo:fsq:${name.toLowerCase().replace(/\s+/g, '-')}:${lat.toFixed(2)},${lng.toFixed(2)}`;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached !== null) return cached || undefined; // empty string = confirmed no photo

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PER_VENUE_TIMEOUT_MS);

    // 1. Find the venue by name near the event location
    const searchUrl = new URL(`${FSQ_BASE}/venues/search`);
    searchUrl.searchParams.set('query', name.slice(0, 60));
    searchUrl.searchParams.set('ll', `${lat},${lng}`);
    searchUrl.searchParams.set('radius', '500'); // tight radius — same block
    searchUrl.searchParams.set('limit', '1');
    searchUrl.searchParams.set('intent', 'match');
    searchUrl.searchParams.set('client_id', clientId);
    searchUrl.searchParams.set('client_secret', clientSecret);
    searchUrl.searchParams.set('v', FSQ_VERSION);

    const searchResp = await fetch(searchUrl.toString(), { signal: controller.signal });
    if (!searchResp.ok) { clearTimeout(timer); await cache.set(cacheKey, '', PHOTO_CACHE_TTL); return undefined; }

    const searchData = await searchResp.json() as {
      response?: { venues?: Array<{ id: string }> };
    };
    const venueId = searchData.response?.venues?.[0]?.id;
    if (!venueId) { clearTimeout(timer); await cache.set(cacheKey, '', PHOTO_CACHE_TTL); return undefined; }

    // 2. Fetch a photo for that venue
    const photoUrl = new URL(`${FSQ_BASE}/venues/${venueId}/photos`);
    photoUrl.searchParams.set('client_id', clientId);
    photoUrl.searchParams.set('client_secret', clientSecret);
    photoUrl.searchParams.set('v', FSQ_VERSION);
    photoUrl.searchParams.set('group', 'venue');
    photoUrl.searchParams.set('limit', '1');

    const photoResp = await fetch(photoUrl.toString(), { signal: controller.signal });
    clearTimeout(timer);
    if (!photoResp.ok) { await cache.set(cacheKey, '', PHOTO_CACHE_TTL); return undefined; }

    const photoData = await photoResp.json() as {
      response?: { photos?: { items?: Array<{ prefix: string; suffix: string }> } };
    };
    const item = photoData.response?.photos?.items?.[0];
    if (!item) { await cache.set(cacheKey, '', PHOTO_CACHE_TTL); return undefined; }

    const imgUrl = `${item.prefix}600x400${item.suffix}`;
    await cache.set(cacheKey, imgUrl, PHOTO_CACHE_TTL);
    return imgUrl;
  } catch {
    return undefined;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Enrich a list of suggestions with real photos wherever imageUrl is missing.
 * Runs photo lookups in parallel (capped at MAX_CONCURRENT).
 * Safe to call — any lookup failure leaves imageUrl unchanged (undefined).
 */
export async function enrichPhotos(
  suggestions: Suggestion[],
  userLat?: number,
  userLng?: number,
): Promise<void> {
  const clientId = process.env.FOURSQUARE_CLIENT_ID;
  const clientSecret = process.env.FOURSQUARE_CLIENT_SECRET;

  // Nothing we can do without Foursquare credentials
  if (!clientId || !clientSecret) return;

  // Only enrich items that need it and have enough location data
  const toEnrich = suggestions.filter(
    (s) => !s.imageUrl && (
      (s.latitude && s.longitude) ||
      (userLat !== undefined && userLng !== undefined)
    )
  );

  if (toEnrich.length === 0) return;

  // Chunk into batches so we don't flood the API
  const chunks: Suggestion[][] = [];
  for (let i = 0; i < toEnrich.length; i += MAX_CONCURRENT) {
    chunks.push(toEnrich.slice(i, i + MAX_CONCURRENT));
  }

  let enriched = 0;
  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(async (s) => {
        const lat = s.latitude ?? userLat!;
        const lng = s.longitude ?? userLng!;
        const photo = await fsqPhotoForVenue(s.name, lat, lng, clientId, clientSecret);
        if (photo) {
          s.imageUrl = photo;
          enriched++;
        }
      })
    );
    // Log any unexpected errors (not expected — inner fn swallows them)
    results.forEach((r) => {
      if (r.status === 'rejected') logger.warn('photo enrichment chunk error', { error: r.reason });
    });
  }

  if (enriched > 0) {
    logger.info(`Photo enrichment: ${enriched}/${toEnrich.length} photos resolved`);
  }
}
