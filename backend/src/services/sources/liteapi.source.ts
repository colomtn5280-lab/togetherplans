/**
 * LiteAPI v3 hotel data source — real hotel stays for the 'Hotels' category.
 * Docs: https://docs.liteapi.travel — self-serve key, LITEAPI_KEY env var.
 * Only active for the internal 'Hotels' category (hotel-stays / Hotel Stays).
 *
 * Verified live contract (Sept 2026, prod key, Denver 39.7392,-104.9903):
 *   GET https://api.liteapi.travel/v3.0/data/hotels
 *     ?latitude=<lat>&longitude=<lng>   — center point
 *     &radius=<meters>                  — TRUE server-side radius filter
 *                                         (radius=2000 → 130 hotels all ≤2.4km;
 *                                          radius=100000 → total 7291)
 *     &limit=N&offset=N                 — pagination (limit up to 200 tested)
 *     header: X-API-Key
 *   NOTE: the `distance` param the docs also mention is NOT a radius — it is
 *   ignored/capped (~12.7km max regardless of value). Always use `radius`.
 *   Response: { data: [{ id, name, hotelDescription (HTML! <p>/<strong>),
 *     chain, city, country, latitude, longitude, address, zip,
 *     main_photo, thumbnail (static.cupid.travel CDN), stars (1-5),
 *     rating (0-10 guest score), reviewCount, facilityIds }], hotelIds, total }
 *   No hotel website / booking URL field exists in list OR detail responses
 *   (verified /data/hotel?hotelId=... too) — rates/booking is a separate POST
 *   /hotels/rates flow (out of scope). We therefore emit NO ticketUrl rather
 *   than fabricate a broken link.
 */

import { Suggestion, haversineMiles } from './types';

const LITEAPI_BASE = 'https://api.liteapi.travel/v3.0/data/hotels';
const TIMEOUT_MS = 6000;
const MAX_RESULTS = 25;

interface LiteApiHotel {
  id: string;
  name?: string;
  hotelDescription?: string;
  chain?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  zip?: string;
  main_photo?: string;
  thumbnail?: string;
  stars?: number;
  rating?: number; // 0-10 guest review score
  reviewCount?: number;
}

interface LiteApiResponse {
  data?: LiteApiHotel[];
  total?: number;
  error?: unknown;
}

/** Strip HTML tags/entities — hotelDescription arrives as <p>/<strong> markup. */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#?\w+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, max = 140): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max)}…`;
}

/** Star rating → cost tier heuristic: 1-2★ budget, 3★ mid, 4-5★ upscale. */
function costTierFromStars(stars?: number): Suggestion['costTier'] {
  if (!stars || stars <= 2) return '$';
  if (stars === 3) return '$$';
  return '$$$';
}

async function fetchWithTimeout(url: string, key: string, ms: number): Promise<globalThis.Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { 'X-API-Key': key, Accept: 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch hotels near a lat/lng within radius miles.
 * Hotel stays are inherently a getaway category — like NPS parks, people
 * happily drive an hour for a mountain lodge or hot-springs resort — so we
 * apply a modest destination floor of 40 miles regardless of the browse
 * radius. The default 25mi search still surfaces the getaway an hour out;
 * distance is shown on the card so users can judge.
 */
export async function fetchLiteApiHotels(
  lat: number,
  lng: number,
  radiusMiles: number,
): Promise<Suggestion[]> {
  const key = process.env.LITEAPI_KEY;
  if (!key) return [];

  const effectiveRadiusMiles = Math.max(radiusMiles, 40);
  const radiusMeters = Math.round(effectiveRadiusMiles * 1609.34);

  try {
    const url = new URL(LITEAPI_BASE);
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('radius', String(radiusMeters));
    // Over-fetch a bit so post-filtering (missing coords/name) still fills the cap
    url.searchParams.set('limit', '60');

    const resp = await fetchWithTimeout(url.toString(), key, TIMEOUT_MS);
    if (!resp.ok) return [];

    const body = (await resp.json()) as LiteApiResponse;
    const hotels = body.data ?? [];

    return hotels
      .map((h): Suggestion | null => {
        if (!h.name || typeof h.latitude !== 'number' || typeof h.longitude !== 'number') {
          return null;
        }

        const dist = haversineMiles(lat, lng, h.latitude, h.longitude);
        if (dist > effectiveRadiusMiles) return null;

        const desc = h.hotelDescription ? truncate(stripHtml(h.hotelDescription)) : '';
        const address = [h.address, h.city].filter(Boolean).join(', ');
        // LiteAPI rating is a 0-10 guest score → our 0-5 scale
        const rating5 =
          typeof h.rating === 'number' && h.rating > 0
            ? Math.round((h.rating / 2) * 10) / 10
            : undefined;

        return {
          id: `liteapi:${h.id}`,
          name: h.name,
          category: 'Hotels',
          shortDescription:
            desc ||
            `${h.stars ? `${h.stars}-star ` : ''}hotel${h.city ? ` in ${h.city}` : ''}${
              rating5 ? ` — rated ${rating5}/5 by guests` : ''
            }`,
          venue: h.chain || h.name,
          address: address || undefined,
          latitude: h.latitude,
          longitude: h.longitude,
          distanceMiles: Math.round(dist * 10) / 10,
          price: rating5 ? `${rating5}/5 guest rating` : undefined,
          costTier: costTierFromStars(h.stars),
          imageUrl: h.main_photo || h.thumbnail,
          // No ticketUrl: LiteAPI's /data/hotels returns no hotel website or
          // booking link (verified live) — omit rather than link a broken URL.
          dateFriendly: true,
          groupFriendly: true,
          durationMinutes: 720, // overnight stay
          source: 'liteapi',
          externalId: h.id,
        };
      })
      .filter((s): s is Suggestion => s !== null)
      .sort((a, b) => {
        // Prefer well-rated hotels, then closer ones — a raw distance sort
        // surfaces whatever budget property happens to be nearest downtown.
        const ar = a.price ? 1 : 0;
        const br = b.price ? 1 : 0;
        if (ar !== br) return br - ar;
        return (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999);
      })
      .slice(0, MAX_RESULTS);
  } catch {
    return [];
  }
}
