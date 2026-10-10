/**
 * Static Venues Source
 * ====================
 * Queries the local PostgreSQL venues table (PostGIS-indexed) for nearby places.
 * Data comes from Overture Maps, FSQ OS, NPS, and IMLS — all free/open licenses.
 *
 * ODbL note: OSM data lives in venues_osm (separate table); this source
 * queries BOTH tables for the hiking-trails category via UNION.
 *
 * Falls back silently if the table doesn't exist yet (returns []).
 */

import { prisma } from '@/services/db';
import { logger } from '@/services/logger';
import { Suggestion, SuggestionCategory, SourceName } from './types';

/** DateMeUp category slugs that are served primarily from the static DB */
export const STATIC_CATEGORIES = new Set<string>([
  'restaurants-dining',
  'after-dark',
  'wellness-spa',
  'sports-active',
  'hotel-stays',
  // Phase 2
  'arts-culture',
  'live-music-concerts',
  'comedy',
  'movies',
  'experiences',
  'family-events',
  'hiking-trails',
]);

/** Map DateMeUp slug → internal SuggestionCategory */
const SLUG_TO_INTERNAL: Record<string, SuggestionCategory> = {
  'restaurants-dining': 'Dining',
  'after-dark': 'Wine & Drinks', // closest internal type
  'wellness-spa': 'Wellness',
  'sports-active': 'Sports',
  'hotel-stays': 'Hotels',
  'arts-culture': 'Arts & Culture',
  'live-music-concerts': 'Live Music',
  'comedy': 'Comedy',
  'movies': 'Movies',
  'experiences': 'Local Experience',
  'family-events': 'Family',
  'hiking-trails': 'Outdoors',
};

/**
 * Query static venues near a location.
 * Uses PostGIS ST_DWithin for fast indexed radius search.
 *
 * For hiking-trails: UNIONs venues (NPS/IMLS) with venues_osm (OSM) so
 * both public-domain and OSM trail data are available without license mixing.
 *
 * @param categorySlug  DateMeUp category slug (e.g. 'restaurants-dining')
 * @param lat           Latitude
 * @param lng           Longitude
 * @param radiusMiles   Search radius (default 25 mi)
 * @param limit         Max results (default 30)
 */
export async function getStaticVenues(
  categorySlug: string,
  lat: number,
  lng: number,
  radiusMiles = 25,
  limit = 30,
): Promise<Suggestion[]> {
  const radiusMeters = radiusMiles * 1609.34;
  const internalCategory = SLUG_TO_INTERNAL[categorySlug];

  try {
    let rows: Array<{
      id: string;
      name: string;
      category: string;
      address: string | null;
      city: string | null;
      state: string | null;
      lat: number;
      lng: number;
      phone: string | null;
      website: string | null;
      price_level: number | null;
      rating: number | null;
      source: string;
      dist_m: number;
    }>;

    if (categorySlug === 'hiking-trails') {
      // UNION venues (NPS) + venues_osm (OSM trails) for hiking
      rows = await (prisma as any).$queryRaw`
        SELECT
          id, name, category, address, city, state,
          lat, lng, phone, website, price_level, rating, source,
          ST_Distance(location, ST_MakePoint(${lng}, ${lat})::geography) AS dist_m
        FROM venues
        WHERE category = 'hiking-trails'
          AND country = 'US'
          AND date_closed IS NULL
          AND ST_DWithin(
            location,
            ST_MakePoint(${lng}, ${lat})::geography,
            ${radiusMeters}
          )
        UNION ALL
        SELECT
          id, name, category,
          address, city, state,
          lat, lng,
          NULL AS phone, NULL AS website, NULL AS price_level, NULL AS rating,
          'osm' AS source,
          ST_Distance(location, ST_MakePoint(${lng}, ${lat})::geography) AS dist_m
        FROM venues_osm
        WHERE category = 'hiking-trails'
          AND ST_DWithin(
            location,
            ST_MakePoint(${lng}, ${lat})::geography,
            ${radiusMeters}
          )
        ORDER BY dist_m ASC
        LIMIT ${limit}
      `;
    } else {
      rows = await (prisma as any).$queryRaw`
        SELECT
          id, name, category, address, city, state,
          lat, lng, phone, website, price_level, rating, source,
          ST_Distance(location, ST_MakePoint(${lng}, ${lat})::geography) AS dist_m
        FROM venues
        WHERE category = ${categorySlug}
          AND country = 'US'
          AND date_closed IS NULL
          AND ST_DWithin(
            location,
            ST_MakePoint(${lng}, ${lat})::geography,
            ${radiusMeters}
          )
        ORDER BY dist_m ASC
        LIMIT ${limit}
      `;
    }

    return rows.map((r) => {
      const distMiles = r.dist_m ? Math.round((r.dist_m / 1609.34) * 10) / 10 : undefined;
      const locationStr = [r.city, r.state].filter(Boolean).join(', ');
      const fullAddress = [r.address, r.city, r.state].filter(Boolean).join(', ');

      return {
        id: `static-${r.id}`,
        name: r.name,
        category: internalCategory ?? ('Local Experience' as SuggestionCategory),
        shortDescription: locationStr || categorySlug,
        address: fullAddress || undefined,
        latitude: r.lat,
        longitude: r.lng,
        distanceMiles: distMiles,
        costTier: (r.price_level === 1 ? '$' : r.price_level === 2 ? '$$' : r.price_level === 3 ? '$$$' : '$$') as import('./types').CostTier,
        rating: r.rating ?? undefined,
        source: 'static' as SourceName,
        externalId: r.id,
        dateFriendly: true,
        groupFriendly: true,
        ticketUrl: r.website ?? undefined,
        attribution: getAttribution(r.source),
      };
    });
  } catch (err: unknown) {
    // If venues table doesn't exist yet, fail silently
    const msg = String(err);
    if (
      msg.includes('relation "venues" does not exist') ||
      msg.includes('column') ||
      msg.includes('function st_dwithin')
    ) {
      logger.warn(`[static-venues] Table not ready yet, falling back to live sources`);
    } else {
      logger.warn(`[static-venues] getStaticVenues error: ${msg}`);
    }
    return [];
  }
}

function getAttribution(source: string): string {
  switch (source) {
    case 'overture':
      return 'Data from Overture Maps (CDLA-Permissive-2.0)';
    case 'nps':
      return 'National Park Service (public domain)';
    case 'imls':
      return 'IMLS Museum Data (public domain)';
    case 'osm':
    case 'overpass':
      return '© OpenStreetMap contributors';
    default:
      return '';
  }
}
