/**
 * Mobilize (mobilize.us) public events API source — free, NO key required.
 * Docs: https://github.com/mobilizeamerica/api
 * Covers: volunteer shifts, community events, canvasses, rallies, trainings.
 * Only active for the internal 'Volunteering' category.
 *
 * Verified live contract (Sept 2026):
 *   GET https://api.mobilize.us/v1/events
 *     ?timeslot_start=gte_now      — only events with upcoming timeslots
 *     &zipcode=<zip>&max_dist=<mi> — server-side radius filter, sorted by distance
 *     &is_virtual=false            — exclude virtual events (per docs changelog,
 *                                    zipcode alone no longer excludes virtual)
 *     &per_page=N
 *   Response: { count, next, previous, data: [{ title, description, summary,
 *     event_type, is_virtual, browser_url, featured_image_url,
 *     sponsor: { name }, timeslots: [{ start_date (unix seconds), end_date }],
 *     location: { venue, address_lines[], locality, region, postal_code,
 *                 location: { latitude, longitude } } }] }
 *
 * LOCATION STRATEGY: Mobilize filters by zipcode+max_dist only (no lat/lng
 * param). The engine calls sources with lat/lng, so we reverse-geocode the
 * coordinates to a US zip via bigdatacloud's free client endpoint (no key,
 * verified live: 39.7392,-104.9903 → 80202), cache the zip per rounded
 * coordinate for the life of the instance, then let Mobilize do the radius
 * filter server-side. This beats the unfiltered-nationwide alternative
 * (~19k upcoming events — far too many pages to haversine-filter client-side
 * within a request budget). Events that DO carry coordinates are additionally
 * verified against the requested radius with haversine; events with a private
 * address (no coords) are kept if they at least have a locality, since
 * Mobilize already vetted them as within max_dist of the zip.
 */

import { Suggestion, haversineMiles } from './types';

const MOBILIZE_BASE = 'https://api.mobilize.us/v1/events';
const TIMEOUT_MS = 6000;
const MAX_RESULTS = 20;

interface MobilizeTimeslot {
  start_date: number; // unix seconds
  end_date?: number;
  is_full?: boolean;
}

interface MobilizeEvent {
  id: number;
  title?: string;
  description?: string;
  summary?: string;
  event_type?: string;
  is_virtual?: boolean;
  browser_url?: string;
  featured_image_url?: string;
  sponsor?: { name?: string };
  timeslots?: MobilizeTimeslot[];
  location?: {
    venue?: string;
    address_lines?: string[];
    locality?: string;
    region?: string;
    postal_code?: string;
    location?: { latitude?: number | null; longitude?: number | null };
  };
}

interface MobilizeResponse {
  count?: number;
  data?: MobilizeEvent[];
}

// lat/lng (rounded to ~1km) → zip, cached for the life of the instance
const zipCache = new Map<string, string | null>();

async function fetchWithTimeout(url: string, ms: number): Promise<globalThis.Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'TogetherPlans/1.0 (hello@togetherplans.app)' },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Reverse-geocode lat/lng → US zip. Free bigdatacloud client endpoint, no key. */
async function latLngToZip(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(2)}:${lng.toFixed(2)}`;
  if (zipCache.has(key)) return zipCache.get(key) ?? null;
  try {
    const resp = await fetchWithTimeout(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      4000,
    );
    if (resp.ok) {
      const data = (await resp.json()) as { postcode?: string };
      const zip = /^\d{5}$/.test(data.postcode ?? '') ? (data.postcode as string) : null;
      zipCache.set(key, zip);
      return zip;
    }
  } catch {
    // fall through
  }
  zipCache.set(key, null);
  return null;
}

function firstUpcomingTimeslot(slots?: MobilizeTimeslot[]): MobilizeTimeslot | null {
  if (!slots?.length) return null;
  const nowSec = Date.now() / 1000;
  const upcoming = slots
    .filter((t) => typeof t.start_date === 'number' && t.start_date > nowSec)
    .sort((a, b) => a.start_date - b.start_date);
  return upcoming[0] ?? null;
}

function buildAddress(loc?: MobilizeEvent['location']): string | undefined {
  if (!loc) return undefined;
  const lines = (loc.address_lines ?? []).filter((l) => l && l.trim());
  const parts = [...lines, [loc.locality, loc.region].filter(Boolean).join(', ')].filter(Boolean);
  return parts.length ? parts.join(', ') : undefined;
}

function cleanDescription(ev: MobilizeEvent): string {
  const raw = (ev.description || ev.summary || '').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim();
  if (raw) return raw.length > 140 ? `${raw.slice(0, 137)}...` : raw;
  return ev.sponsor?.name ? `Volunteer event by ${ev.sponsor.name}` : 'Local volunteer opportunity';
}

/**
 * Fetch upcoming in-person volunteer/community events near a location.
 * Only called for the internal 'Volunteering' category.
 */
export async function fetchMobilize(
  lat: number,
  lng: number,
  radiusMiles: number,
): Promise<Suggestion[]> {
  try {
    const zip = await latLngToZip(lat, lng);
    if (!zip) return []; // no reliable zip → no reliable Mobilize radius filter

    const url = new URL(MOBILIZE_BASE);
    url.searchParams.set('timeslot_start', 'gte_now');
    url.searchParams.set('zipcode', zip);
    url.searchParams.set('max_dist', String(Math.min(Math.max(Math.round(radiusMiles), 1), 60)));
    url.searchParams.set('is_virtual', 'false'); // prefer in-person for a plans app
    url.searchParams.set('per_page', '40');

    const resp = await fetchWithTimeout(url.toString(), TIMEOUT_MS);
    if (!resp.ok) return [];
    const payload = (await resp.json()) as MobilizeResponse;
    const events = payload.data ?? [];

    return events
      .map((ev): Suggestion | null => {
        if (!ev.title?.trim()) return null; // named only
        if (ev.is_virtual) return null;

        const slot = firstUpcomingTimeslot(ev.timeslots);
        if (!slot) return null; // upcoming only

        const loc = ev.location;
        const evLat = loc?.location?.latitude ?? undefined;
        const evLng = loc?.location?.longitude ?? undefined;
        let dist: number | undefined;
        if (typeof evLat === 'number' && typeof evLng === 'number') {
          dist = haversineMiles(lat, lng, evLat, evLng);
          if (dist > radiusMiles) return null; // verify server-side filter
        } else if (!loc?.locality) {
          return null; // no coords AND no locality → not usable for a plans app
        }

        const start = new Date(slot.start_date * 1000);

        return {
          id: `mobilize:${ev.id}`,
          name: ev.title.trim(),
          category: 'Volunteering',
          shortDescription: cleanDescription(ev),
          venue: loc?.venue || ev.sponsor?.name,
          address: buildAddress(loc),
          latitude: typeof evLat === 'number' ? evLat : undefined,
          longitude: typeof evLng === 'number' ? evLng : undefined,
          distanceMiles: dist !== undefined ? Math.round(dist * 10) / 10 : undefined,
          date: start.toISOString().split('T')[0],
          timeStart: start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          costTier: 'free',
          imageUrl: ev.featured_image_url || undefined,
          ticketUrl: ev.browser_url,
          dateFriendly: true,
          groupFriendly: true,
          durationMinutes: slot.end_date
            ? Math.max(30, Math.round((slot.end_date - slot.start_date) / 60))
            : 120,
          source: 'mobilize',
          externalId: String(ev.id),
          expiresAt: start.toISOString(),
        };
      })
      .filter((s): s is Suggestion => s !== null)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .slice(0, MAX_RESULTS);
  } catch {
    return []; // graceful failure — never break the aggregate
  }
}
