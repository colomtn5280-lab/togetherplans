/**
 * Ticketmaster Discovery API source.
 * Free tier: 5,000 calls/day. Covers concerts, comedy, theater, sports, arts.
 * Key: TICKETMASTER_API_KEY env var.
 * Signup: developer.ticketmaster.com/member/register (instant)
 */

import { Suggestion, SuggestionCategory, haversineMiles } from './types';

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2';

interface TmEvent {
  id: string;
  name: string;
  url?: string;
  images?: Array<{ url: string; width: number; height: number }>;
  dates?: {
    start?: { localDate?: string; localTime?: string };
    status?: { code: string };
  };
  priceRanges?: Array<{ min: number; max: number; currency: string }>;
  classifications?: Array<{
    segment?: { name: string };
    genre?: { name: string };
    subGenre?: { name: string };
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      address?: { line1?: string };
      city?: { name?: string };
      state?: { stateCode?: string };
      location?: { latitude?: string; longitude?: string };
    }>;
  };
  info?: string;
  pleaseNote?: string;
}

interface TmResponse {
  _embedded?: { events?: TmEvent[] };
  page?: { totalElements: number };
}

// TM classification segment → our category
const SEGMENT_MAP: Record<string, SuggestionCategory> = {
  'Music': 'Live Music',
  'Arts & Theatre': 'Theater & Plays',
  'Comedy': 'Comedy',
  'Sports': 'Active',
  'Film': 'Movies',
  'Miscellaneous': 'Local Experience',
};

const GENRE_OVERRIDE: Record<string, SuggestionCategory> = {
  'Comedy': 'Comedy',
  'Jazz': 'Live Music',
  'Blues': 'Live Music',
  'Country': 'Live Music',
  'Classical': 'Arts & Culture',
  'Opera': 'Arts & Culture',
  'Ballet': 'Arts & Culture',
  'Dance': 'Arts & Culture',
  'Theatre': 'Theater & Plays',
  'Broadway': 'Theater & Plays',
  'Cabaret': 'Theater & Plays',
  'Circus & Acts': 'Unique & Quirky',
};

function classifyTm(classifications?: TmEvent['classifications']): SuggestionCategory {
  const c = classifications?.[0];
  if (!c) return 'Local Experience';
  const genre = c.genre?.name ?? '';
  if (GENRE_OVERRIDE[genre]) return GENRE_OVERRIDE[genre];
  const segment = c.segment?.name ?? '';
  return SEGMENT_MAP[segment] ?? 'Local Experience';
}

function formatPrice(ranges?: TmEvent['priceRanges']): { price?: string; costTier: Suggestion['costTier'] } {
  if (!ranges?.length) return { costTier: '$$' };
  const min = Math.min(...ranges.map((r) => r.min));
  const max = Math.max(...ranges.map((r) => r.max));
  const price = min === max ? `$${min}` : `$${min}--$${max}`;
  const costTier: Suggestion['costTier'] = min === 0 ? 'free' : min < 25 ? '$' : min < 75 ? '$$' : '$$$';
  return { price, costTier };
}

function bestImage(images?: TmEvent['images']): string | undefined {
  if (!images?.length) return undefined;
  // Prefer 16:9 ratio, largest available
  const sorted = [...images].sort((a, b) => b.width - a.width);
  return sorted[0]?.url;
}

export async function fetchTicketmaster(
  lat: number,
  lng: number,
  radiusMiles: number,
  categoryFilter?: string,
): Promise<Suggestion[]> {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return [];

  try {
    const url = new URL(`${TM_BASE}/events.json`);
    url.searchParams.set('apikey', key);
    url.searchParams.set('latlong', `${lat},${lng}`);
    url.searchParams.set('radius', String(Math.round(radiusMiles)));
    url.searchParams.set('unit', 'miles');
    url.searchParams.set('size', '30');
    url.searchParams.set('sort', 'date,asc');
    url.searchParams.set('countryCode', 'US');
    // Only future events
    url.searchParams.set('startDateTime', new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));

    // Map our category to TM classification
    if (categoryFilter && categoryFilter !== 'All') {
      const segmentFilter: Record<string, string> = {
        'Live Music': 'Music',
        'Comedy': 'Arts & Theatre',
        'Theater & Plays': 'Arts & Theatre',
        'Arts & Culture': 'Arts & Theatre',
        'Active': 'Sports',
      };
      const seg = segmentFilter[categoryFilter];
      if (seg) url.searchParams.set('segmentName', seg);
      if (categoryFilter === 'Comedy') url.searchParams.set('genreName', 'Comedy');
    }

    const resp = await fetch(url.toString());
    if (!resp.ok) return [];

    const data = (await resp.json()) as TmResponse;
    const events = data._embedded?.events ?? [];

    return events.map((ev): Suggestion => {
      const venue = ev._embedded?.venues?.[0];
      const venueName = venue?.name;
      const city = venue?.city?.name;
      const state = venue?.state?.stateCode;
      const address = [venue?.address?.line1, city, state].filter(Boolean).join(', ');
      const vLat = venue?.location?.latitude ? parseFloat(venue.location.latitude) : undefined;
      const vLng = venue?.location?.longitude ? parseFloat(venue.location.longitude) : undefined;
      const dist = vLat && vLng ? haversineMiles(lat, lng, vLat, vLng) : undefined;

      const dateStr = ev.dates?.start?.localDate;
      const timeStr = ev.dates?.start?.localTime;
      const category = classifyTm(ev.classifications);
      const { price, costTier } = formatPrice(ev.priceRanges);

      const timeFormatted = timeStr
        ? new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : undefined;

      const desc = [
        ev.classifications?.[0]?.genre?.name,
        venueName ? `at ${venueName}` : '',
        city ? `in ${city}` : '',
        dateStr ? `on ${new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}` : '',
      ].filter(Boolean).join(' ');

      return {
        id: `tm:${ev.id}`,
        name: ev.name,
        category,
        shortDescription: desc || `${category} event${venueName ? ` at ${venueName}` : ''}.`,
        venue: venueName,
        address,
        latitude: vLat,
        longitude: vLng,
        distanceMiles: dist ? Math.round(dist * 10) / 10 : undefined,
        date: dateStr,
        timeStart: timeFormatted,
        price,
        costTier,
        imageUrl: bestImage(ev.images),
        ticketUrl: ev.url,
        dateFriendly: true,
        groupFriendly: true,
        durationMinutes: 150,
        source: 'ticketmaster',
        externalId: ev.id,
        expiresAt: dateStr ? `${dateStr}T23:59:59` : undefined,
        attribution: 'Event data © Ticketmaster',
      };
    });
  } catch {
    return [];
  }
}
