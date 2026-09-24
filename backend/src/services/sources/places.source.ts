/**
 * Google Places Text Search source
 *
 * Used as a venue fallback for categories where OSM (Overpass) data is sparse
 * in suburban areas — specifically Wellness & Spa.
 *
 * Uses the Places API (Legacy) Text Search endpoint:
 *   GET /maps/api/place/textsearch/json?query=...&location=...&radius=...
 *
 * Cost: $32/1000 requests (billed per category per cache miss, not per user).
 * Results are cached at the suggestions layer (6h for places).
 */

import { logger } from '@/services/logger';
import type { Suggestion, SuggestionCategory, CostTier, SourceName } from './types';

const GMAPS_BASE = 'https://maps.googleapis.com/maps/api';

interface PlacesResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: { location: { lat: number; lng: number } };
  rating?: number;
  price_level?: number;
  photos?: Array<{ photo_reference: string }>;
  types?: string[];
}

function photoUrl(ref: string, key: string): string {
  return `${GMAPS_BASE}/place/photo?maxwidth=600&photo_reference=${ref}&key=${key}`;
}

function costTier(priceLevel?: number): CostTier {
  if (priceLevel == null) return '$$';
  return (['$', '$', '$$', '$$$', '$$$'][priceLevel] ?? '$$') as CostTier;
}

const WELLNESS_QUERIES = [
  { q: 'day spa', desc: 'Day spa — massages, facials, and relaxation.' },
  { q: 'massage therapy', desc: 'Massage therapy — targeted relief and relaxation.' },
  { q: 'yoga studio', desc: 'Yoga studio — flow, breathe, and find your center.' },
  { q: 'nail salon', desc: 'Nail salon — a little self-care goes a long way.' },
  { q: 'hair salon', desc: 'Hair salon — fresh look, fresh start.' },
];

export async function fetchPlacesWellness(
  lat: number,
  lng: number,
  radiusMiles: number,
): Promise<Suggestion[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [];

  const radiusM = Math.min(Math.round(radiusMiles * 1609.34), 50000);
  const results: Suggestion[] = [];

  await Promise.allSettled(
    WELLNESS_QUERIES.map(async ({ q, desc }) => {
      try {
        const url = new URL(`${GMAPS_BASE}/place/textsearch/json`);
        url.searchParams.set('query', q);
        url.searchParams.set('location', `${lat},${lng}`);
        url.searchParams.set('radius', String(radiusM));
        url.searchParams.set('key', key);

        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;

        const data = (await res.json()) as { status: string; results: PlacesResult[] };
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          logger.warn(`Places text search (${q}): status=${data.status}`);
          return;
        }

        const items = (data.results ?? []).slice(0, 6);
        for (const place of items) {
          const plat = place.geometry?.location.lat;
          const plng = place.geometry?.location.lng;
          const imageUrl = place.photos?.[0]?.photo_reference
            ? photoUrl(place.photos[0].photo_reference, key)
            : undefined;

          results.push({
            id: `places:${place.place_id}`,
            name: place.name,
            category: 'Wellness' as SuggestionCategory,
            shortDescription: desc,
            venue: place.name,
            address: place.formatted_address,
            latitude: plat,
            longitude: plng,
            rating: place.rating,
            costTier: costTier(place.price_level),
            imageUrl,
            dateFriendly: true,
            groupFriendly: false,
            durationMinutes: 90,
            source: 'places' as SourceName,
            externalId: place.place_id,
          });
        }
      } catch (err) {
        logger.warn(`Places text search (${q}) failed`, { err });
      }
    }),
  );

  // Deduplicate by name (same business may appear in multiple query results)
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = r.name.toLowerCase().replace(/\s+/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
