/**
 * Photo Enrichment — cross-source image lookup
 *
 * For suggestions that arrive without an imageUrl (PredictHQ, Overpass,
 * seed cards, etc.), this module tries to find a real venue photo.
 *
 * Strategy (uses existing env vars — no new API keys):
 *   1. Google Places API (Text Search → Place Photos) — uses GOOGLE_MAPS_API_KEY
 *   2. Foursquare v2 venue search → /venues/{id}/photos — uses FOURSQUARE_CLIENT_ID/SECRET
 *
 * Results are cached 24h so the same venue never triggers duplicate lookups.
 */

import { logger } from '@/services/logger';
import { cache } from '@/services/cache';
import type { Suggestion } from './sources/types';

const FSQ_BASE = 'https://api.foursquare.com/v2';
const FSQ_VERSION = '20231001';
const GMAPS_BASE = 'https://maps.googleapis.com/maps/api';

// How long to cache a resolved photo URL (24 h)
const PHOTO_CACHE_TTL = 86_400;

// Max concurrent enrichment calls per request — keeps latency bounded
const MAX_CONCURRENT = 20;

// Timeout per individual photo lookup
const PER_VENUE_TIMEOUT_MS = 5_000;

// ─── Google Places photo lookup ─────────────────────────────────────────────
// Uses Text Search to find the place, then fetches the first photo reference.
// Returns a direct photo URL (600px wide) or undefined on any failure.

async function googlePhotoForVenue(
  name: string,
  lat: number,
  lng: number,
  apiKey: string,
): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PER_VENUE_TIMEOUT_MS);

    // Text Search scoped to location
    const searchUrl = new URL(`${GMAPS_BASE}/place/textsearch/json`);
    searchUrl.searchParams.set('query', name.slice(0, 60));
    searchUrl.searchParams.set('location', `${lat},${lng}`);
    searchUrl.searchParams.set('radius', '500');
    searchUrl.searchParams.set('fields', 'place_id,photos');
    searchUrl.searchParams.set('key', apiKey);

    const searchResp = await fetch(searchUrl.toString(), { signal: controller.signal });
    if (!searchResp.ok) { clearTimeout(timer); return undefined; }

    const searchData = await searchResp.json() as {
      results?: Array<{ photos?: Array<{ photo_reference: string }> }>;
    };

    const photoRef = searchData.results?.[0]?.photos?.[0]?.photo_reference;
    if (!photoRef) { clearTimeout(timer); return undefined; }

    // Build the photo URL directly — this is a redirect URL, not a fetch
    const photoUrl = new URL(`${GMAPS_BASE}/place/photo`);
    photoUrl.searchParams.set('maxwidth', '600');
    photoUrl.searchParams.set('photo_reference', photoRef);
    photoUrl.searchParams.set('key', apiKey);

    clearTimeout(timer);
    return photoUrl.toString();
  } catch {
    return undefined;
  }
}

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
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const fsqClientId = process.env.FOURSQUARE_CLIENT_ID;
  const fsqClientSecret = process.env.FOURSQUARE_CLIENT_SECRET;

  // Need at least one working source
  if (!fsqClientId || !fsqClientSecret) return;

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

        // Try Google Places first (better quality, direct URL)
        let photo: string | undefined;
        if (googleKey) {
          photo = await googlePhotoForVenue(s.name, lat, lng, googleKey);
        }

        // Foursquare as fallback
        if (!photo && fsqClientId && fsqClientSecret) {
          photo = await fsqPhotoForVenue(s.name, lat, lng, fsqClientId, fsqClientSecret);
        }

        if (photo) {
          s.imageUrl = photo;
          enriched++;
        }
      })
    );
    results.forEach((r) => {
      if (r.status === 'rejected') logger.warn('photo enrichment chunk error', { error: r.reason });
    });
  }

  if (enriched > 0) {
    logger.info(`Photo enrichment: ${enriched}/${toEnrich.length} photos resolved`);
  }
}
