/**
 * National Park Service API source — free with an API key.
 * Key signup: https://www.nps.gov/subjects/developer/get-started.htm (instant)
 * Covers: national parks, monuments, recreation areas, trails, events.
 * Uses NPS_API_KEY env var. Falls back gracefully when key is absent.
 */

import { Suggestion, haversineMiles } from './types';

// Zip code → lat/lng lookup table (top 1000 US zip prefixes for offline use)
// Full lookup done via NPS API's stateCode param when zip is provided
const NPS_BASE = 'https://developer.nps.gov/api/v1';

interface NpsPark {
  id: string;
  parkCode?: string;
  fullName: string;
  description: string;
  latitude: string;
  longitude: string;
  directionsInfo?: string;
  entranceFees?: Array<{ cost: string; description: string; title: string }>;
  images?: Array<{ url: string; title: string }>;
  url?: string;
  addresses?: Array<{ city: string; stateCode: string; postalCode: string }>;
  activities?: Array<{ id: string; name: string }>;
}

interface NpsEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  datetimes?: Array<{ startdatetime: string }>;
  images?: Array<{ url: string }>;
  feeInfo?: string;
  organizationName?: string;
  parkFullName?: string;
  latitude?: string;
  longitude?: string;
}

function isFree(fees?: Array<{ cost: string }>): boolean {
  if (!fees || fees.length === 0) return true;
  return fees.every((f) => parseFloat(f.cost) === 0);
}

function activityList(activities?: Array<{ name: string }>): string {
  if (!activities?.length) return '';
  const names = activities.slice(0, 4).map((a) => a.name);
  return names.join(', ');
}

// Module-level cache of the full NPS park list (changes rarely; one fetch per instance per day)
let parkListCache: { parks: NpsPark[]; fetchedAt: number } | null = null;
const PARK_LIST_TTL_MS = 24 * 3600 * 1000;

async function getAllParks(key: string): Promise<NpsPark[]> {
  if (parkListCache && Date.now() - parkListCache.fetchedAt < PARK_LIST_TTL_MS) {
    return parkListCache.parks;
  }
  const url = new URL(`${NPS_BASE}/parks`);
  // BUG FIX: previously limit=20 with no location filter returned the first 20
  // parks alphabetically (nationwide), which were then radius-filtered to ~0.
  // The NPS API has no lat/lng search — fetch the full list (~470 parks) and
  // filter locally.
  url.searchParams.set('limit', '600');
  url.searchParams.set('api_key', key);
  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error(`NPS /parks HTTP ${resp.status}`);
  const data = (await resp.json()) as { data: NpsPark[] };
  const parks = data.data ?? [];
  parkListCache = { parks, fetchedAt: Date.now() };
  return parks;
}

/** Fetch parks near a lat/lng within radius miles.
 *  National parks are destination trips — people happily drive 1-2 hours for
 *  Rocky Mountain NP — so we apply a floor of 100 miles regardless of the
 *  user's browse radius. Distance is shown on the card so users can judge. */
export async function fetchNpsParks(
  lat: number,
  lng: number,
  radiusMiles: number,
): Promise<Suggestion[]> {
  const key = process.env.NPS_API_KEY;
  if (!key) return [];

  const effectiveRadius = Math.max(radiusMiles, 100);

  try {
    const parks = await getAllParks(key);

    return parks
      .map((park): Suggestion | null => {
        const pLat = parseFloat(park.latitude);
        const pLng = parseFloat(park.longitude);
        if (isNaN(pLat) || isNaN(pLng)) return null;

        const dist = haversineMiles(lat, lng, pLat, pLng);
        if (dist > effectiveRadius) return null;

        const acts = activityList(park.activities);
        const free = isFree(park.entranceFees);
        const addr = park.addresses?.[0];
        // Always 'Outdoors' — a distance-based 'Day Trip' relabel made distant
        // parks vanish from hiking-trails queries (category filter mismatch).
        const category = 'Outdoors' as const;

        return {
          id: `nps:${park.id}`,
          name: park.fullName,
          category,
          shortDescription: park.description?.slice(0, 180) ||
            `National park${acts ? ` -- ${acts}` : ''}. ${free ? 'Free entry.' : 'Entrance fee applies.'}`,
          venue: park.fullName,
          address: addr ? `${addr.city}, ${addr.stateCode} ${addr.postalCode}` : undefined,
          latitude: pLat,
          longitude: pLng,
          distanceMiles: Math.round(dist * 10) / 10,
          costTier: free ? 'free' : '$',
          imageUrl: park.images?.[0]?.url,
          ticketUrl: park.url,
          dateFriendly: true,
          groupFriendly: true,
          durationMinutes: dist > 45 ? 360 : 180,
          source: 'nps',
          externalId: park.id,
        };
      })
      .filter((s): s is Suggestion => s !== null)
      .sort((a, b) => (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999))
      .slice(0, 8);
  } catch {
    return [];
  }
}

/** Fetch NPS events near a location */
export async function fetchNpsEvents(
  lat: number,
  lng: number,
  radiusMiles: number,
): Promise<Suggestion[]> {
  const key = process.env.NPS_API_KEY;
  if (!key) return [];

  try {
    // BUG FIX: previously limit=20 with no location filter fetched 20 arbitrary
    // events nationwide, which the radius filter reduced to ~0. Query events by
    // the parkCodes of parks actually near the user instead.
    const parks = await getAllParks(key);
    const nearbyParkCodes = parks
      .filter((p) => {
        const pLat = parseFloat(p.latitude);
        const pLng = parseFloat(p.longitude);
        if (isNaN(pLat) || isNaN(pLng) || !p.parkCode) return false;
        return haversineMiles(lat, lng, pLat, pLng) <= Math.max(radiusMiles, 100);
      })
      .map((p) => p.parkCode as string)
      .slice(0, 10);
    if (nearbyParkCodes.length === 0) return [];

    const url = new URL(`${NPS_BASE}/events`);
    url.searchParams.set('limit', '20');
    url.searchParams.set('api_key', key);
    url.searchParams.set('parkCode', nearbyParkCodes.join(','));
    // Filter to upcoming events
    const today = new Date().toISOString().split('T')[0];
    url.searchParams.set('dateStart', today);

    const resp = await fetch(url.toString());
    if (!resp.ok) return [];

    const data = (await resp.json()) as { data: NpsEvent[] };
    const events = data.data ?? [];

    return events
      .map((ev): Suggestion | null => {
        const evLat = ev.latitude ? parseFloat(ev.latitude) : undefined;
        const evLng = ev.longitude ? parseFloat(ev.longitude) : undefined;

        if (evLat && evLng) {
          const dist = haversineMiles(lat, lng, evLat, evLng);
          if (dist > radiusMiles) return null;
        }

        const dateStr = ev.datetimes?.[0]?.startdatetime;
        const isFreeEvent = !ev.feeInfo || ev.feeInfo.toLowerCase().includes('free');

        return {
          id: `nps:event:${ev.id}`,
          name: ev.title,
          category: 'Arts & Culture',
          shortDescription: ev.description?.replace(/<[^>]+>/g, '').slice(0, 180) ||
            `Event at ${ev.parkFullName || ev.location}. ${isFreeEvent ? 'Free to attend.' : ''}`,
          venue: ev.parkFullName || ev.organizationName,
          address: ev.location,
          latitude: evLat,
          longitude: evLng,
          date: dateStr ? dateStr.split('T')[0] : undefined,
          timeStart: dateStr ? new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : undefined,
          costTier: isFreeEvent ? 'free' : '$',
          imageUrl: ev.images?.[0]?.url,
          dateFriendly: true,
          groupFriendly: true,
          durationMinutes: 120,
          source: 'nps',
          externalId: `event:${ev.id}`,
          expiresAt: dateStr,
        };
      })
      .filter((s): s is Suggestion => s !== null)
      .slice(0, 6);
  } catch {
    return [];
  }
}
