/**
 * Photo Enrichment — Google Places only
 *
 * For suggestions without an imageUrl (PredictHQ, Overpass, seed cards, etc.),
 * fetches a real venue photo via Google Places Text Search + Place Photos.
 *
 * Uses GOOGLE_MAPS_API_KEY (already deployed to Cloud Run).
 * Results are cached 24h — same venue never triggers duplicate lookups.
 *
 * Foursquare removed: it was making 40+ API calls per request,
 * causing unexpected charges. Google Places handles all photo needs.
 */

import { logger } from '@/services/logger';
import { cacheGet, cacheSet } from '@/services/cache';
import type { Suggestion } from './sources/types';

const GMAPS_BASE = 'https://maps.googleapis.com/maps/api';

// How long to cache a resolved photo URL (24 h)
const PHOTO_CACHE_TTL = 86_400;

// Max concurrent enrichment calls per request
const MAX_CONCURRENT = 15;

// Timeout per individual photo lookup
const PER_VENUE_TIMEOUT_MS = 5_000;

// ─── Google Places photo lookup ─────────────────────────────────────────────

async function googlePhotoForVenue(
  name: string,
  lat: number,
  lng: number,
  apiKey: string,
): Promise<string | undefined> {
  const cacheKey = `photo:gplaces:${name.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}:${lat.toFixed(2)},${lng.toFixed(2)}`;

  // Cache check
  const cached = await cacheGet(cacheKey);
  if (cached !== null) return cached || undefined;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PER_VENUE_TIMEOUT_MS);

    const searchUrl = new URL(`${GMAPS_BASE}/place/textsearch/json`);
    searchUrl.searchParams.set('query', name.slice(0, 60));
    searchUrl.searchParams.set('location', `${lat},${lng}`);
    searchUrl.searchParams.set('radius', '500');
    searchUrl.searchParams.set('key', apiKey);

    const searchResp = await fetch(searchUrl.toString(), { signal: controller.signal });
    if (!searchResp.ok) { clearTimeout(timer); await cacheSet(cacheKey, '', PHOTO_CACHE_TTL); return undefined; }

    const searchData = await searchResp.json() as {
      results?: Array<{ photos?: Array<{ photo_reference: string }> }>;
    };

    const photoRef = searchData.results?.[0]?.photos?.[0]?.photo_reference;
    if (!photoRef) { clearTimeout(timer); await cacheSet(cacheKey, '', PHOTO_CACHE_TTL); return undefined; }

    const photoUrl = new URL(`${GMAPS_BASE}/place/photo`);
    photoUrl.searchParams.set('maxwidth', '600');
    photoUrl.searchParams.set('photo_reference', photoRef);
    photoUrl.searchParams.set('key', apiKey);

    clearTimeout(timer);
    const imgUrl = photoUrl.toString();
    await cacheSet(cacheKey, imgUrl, PHOTO_CACHE_TTL);
    return imgUrl;
  } catch {
    await cacheSet(cacheKey, '', PHOTO_CACHE_TTL).catch(() => undefined);
    return undefined;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Enrich suggestions with real photos via Google Places.
 * Only enriches items missing imageUrl. Cached 24h per venue.
 */
export async function enrichPhotos(
  suggestions: Suggestion[],
  userLat?: number,
  userLng?: number,
): Promise<void> {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleKey) return;

  const toEnrich = suggestions.filter(
    (s) => !s.imageUrl && (
      (s.latitude && s.longitude) ||
      (userLat !== undefined && userLng !== undefined)
    )
  );

  if (toEnrich.length === 0) return;

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
        const photo = await googlePhotoForVenue(s.name, lat, lng, googleKey);
        if (photo) {
          s.imageUrl = photo;
          enriched++;
        }
      })
    );
    results.forEach((r) => {
      if (r.status === 'rejected') logger.warn('photo enrichment error', { error: r.reason });
    });
  }

  if (enriched > 0) {
    logger.info(`Photo enrichment: ${enriched}/${toEnrich.length} photos resolved via Google Places`);
  }
}
