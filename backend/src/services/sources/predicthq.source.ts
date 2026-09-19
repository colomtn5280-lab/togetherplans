/**
 * PredictHQ Events API source.
 * Free tier available — no credit card required.
 * Covers concerts, festivals, performing arts, community events, expos, sports.
 * Auth: PREDICTHQ_API_TOKEN env var (Bearer token).
 * Docs: https://docs.predicthq.com/api/events/search-events
 *
 * Location search: within="{radius}mi@{lat},{lng}"
 */

import { Suggestion, SuggestionCategory, haversineMiles } from './types';

const PHQ_BASE = 'https://api.predicthq.com/v1';

// ---------------------------------------------------------------------------
// PredictHQ response types
// ---------------------------------------------------------------------------
interface PhqEvent {
  id: string;
  title: string;
  description?: string;
  category: string;
  labels?: string[];
  start: string;       // ISO datetime e.g. "2026-09-22T19:30:00"
  end?: string;
  timezone?: string;
  location?: [number, number]; // [lng, lat]
  geo?: {
    geometry?: {
      coordinates?: [number, number]; // [lng, lat]
    };
    address?: {
      formatted_address?: string;
      city?: string;
      region?: string;
      country_code?: string;
    };
  };
  entities?: Array<{
    type: string;
    name?: string;
    formatted_address?: string;
  }>;
  rank?: number;
  local_rank?: number;
  phq_attendance?: number;
  predicted_event_spend?: number;
}

interface PhqResponse {
  count: number;
  results: PhqEvent[];
  next?: string;
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------
const PHQ_CATEGORY_MAP: Record<string, SuggestionCategory> = {
  'concerts':        'Live Music',
  'festivals':       'Local Experience',
  'performing-arts': 'Theater & Plays',
  'community':       'Local Experience',
  'expos':           'Local Experience',
  'sports':          'Active',
  'conferences':     'Local Experience',
  'academic':        'Local Experience',
};

// PHQ label → more specific category override
const LABEL_OVERRIDES: Record<string, SuggestionCategory> = {
  'comedy':           'Comedy',
  'jazz':             'Live Music',
  'blues':            'Live Music',
  'classical':        'Arts & Culture',
  'opera':            'Arts & Culture',
  'ballet':           'Arts & Culture',
  'dance':            'Arts & Culture',
  'art':              'Arts & Culture',
  'art-gallery':      'Arts & Culture',
  'museum':           'Arts & Culture',
  'theatre':          'Theater & Plays',
  'musical':          'Theater & Plays',
  'food':             'Dining',
  'food-and-drink':   'Wine & Drinks',
  'beer':             'Wine & Drinks',
  'wine':             'Wine & Drinks',
  'cocktail':         'Wine & Drinks',
  'fitness':          'Active',
  'yoga':             'Active',
  'running':          'Active',
  'cycling':          'Active',
  'hiking':           'Outdoors',
  'outdoor':          'Outdoors',
  'trivia':           'Unique & Quirky',
  'escape-room':      'Unique & Quirky',
  'karaoke':          'Unique & Quirky',
  'film':             'Movies',
  'movie':            'Movies',
  'cinema':           'Movies',
};

function classify(ev: PhqEvent): SuggestionCategory {
  // Labels take priority — they're more specific
  for (const label of ev.labels ?? []) {
    const normalized = label.toLowerCase().replace(/\s+/g, '-');
    if (LABEL_OVERRIDES[normalized]) return LABEL_OVERRIDES[normalized];
  }
  // Festival sub-classification by label set
  if (ev.category === 'festivals') {
    const labelSet = new Set(ev.labels?.map((l) => l.toLowerCase()) ?? []);
    if (labelSet.has('music') || labelSet.has('concert')) return 'Live Music';
    if (labelSet.has('food') || labelSet.has('culinary')) return 'Dining';
    if (labelSet.has('art') || labelSet.has('culture')) return 'Arts & Culture';
  }
  return PHQ_CATEGORY_MAP[ev.category] ?? 'Local Experience';
}

// ---------------------------------------------------------------------------
// Skip categories PHQ doesn't help with (places, not events)
// ---------------------------------------------------------------------------
const SKIP_CATEGORIES = new Set<string>(['Dining', 'Streaming Night', 'Movies']);

// PHQ categories to request per our category filter
function phqCategories(categoryFilter?: string): string {
  if (!categoryFilter || categoryFilter === 'All') {
    return 'concerts,festivals,performing-arts,community,expos,sports';
  }
  const map: Record<string, string> = {
    'Live Music':      'concerts,festivals',
    'Comedy':          'concerts,performing-arts,community',
    'Theater & Plays': 'performing-arts',
    'Arts & Culture':  'performing-arts,expos,community',
    'Active':          'sports,community',
    'Outdoors':        'community,sports',
    'Local Experience':'community,expos,festivals,conferences',
    'Unique & Quirky': 'community,expos',
    'Wine & Drinks':   'festivals,community',
  };
  return map[categoryFilter] ?? 'concerts,festivals,performing-arts,community,expos,sports';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCostTier(ev: PhqEvent): Suggestion['costTier'] {
  const spend = ev.predicted_event_spend;
  if (!spend || spend < 10) return 'free';
  if (spend < 30) return '$';
  if (spend < 80) return '$$';
  return '$$$';
}

function extractVenueAndAddress(ev: PhqEvent): {
  venue?: string;
  address?: string;
  city?: string;
} {
  const venueEntity = ev.entities?.find((e) => e.type === 'venue');
  const venue = venueEntity?.name;
  const address = venueEntity?.formatted_address ?? ev.geo?.address?.formatted_address;
  const city = ev.geo?.address?.city;
  return { venue, address, city };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function fetchPredictHQ(
  lat: number,
  lng: number,
  radiusMiles: number,
  categoryFilter?: string,
): Promise<Suggestion[]> {
  const token = process.env.PREDICTHQ_API_TOKEN;
  if (!token) return [];

  if (categoryFilter && SKIP_CATEGORIES.has(categoryFilter)) return [];

  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const url = new URL(`${PHQ_BASE}/events/`);
    url.searchParams.set('within', `${Math.round(radiusMiles)}mi@${lat},${lng}`);
    url.searchParams.set('active.gte', today);
    url.searchParams.set('active.lte', thirtyDaysOut);
    url.searchParams.set('category', phqCategories(categoryFilter));
    url.searchParams.set('limit', '50');
    url.searchParams.set('sort', 'rank');
    url.searchParams.set('state', 'active');
    url.searchParams.set('brand_unsafe.exclude', 'true');

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error(`[PredictHQ] HTTP ${resp.status}: ${body.slice(0, 200)}`);
      return [];
    }

    const data = (await resp.json()) as PhqResponse;
    const events = data.results ?? [];
    const results: Suggestion[] = [];

    for (const ev of events) {
      if (!ev.title) continue;

      // PHQ coordinates are [lng, lat]
      const coords = ev.geo?.geometry?.coordinates ?? ev.location;
      const evLat = coords ? coords[1] : undefined;
      const evLng = coords ? coords[0] : undefined;
      const dist =
        evLat !== undefined && evLng !== undefined
          ? haversineMiles(lat, lng, evLat, evLng)
          : undefined;

      const { venue, address, city } = extractVenueAndAddress(ev);

      const dateStr = ev.start ? ev.start.split('T')[0] : undefined;
      const timeRaw = ev.start?.includes('T') ? ev.start.split('T')[1] : undefined;
      const timeFormatted = timeRaw
        ? new Date(`2000-01-01T${timeRaw}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })
        : undefined;

      const category = classify(ev);
      const costTier = formatCostTier(ev);

      const descText = ev.description?.replace(/\s+/g, ' ').slice(0, 150);
      const labelTags = ev.labels?.slice(0, 3).join(', ');
      const locationStr = [venue ? `at ${venue}` : undefined, city ? `in ${city}` : undefined]
        .filter(Boolean)
        .join(' ');
      const fallbackDesc =
        [labelTags, locationStr].filter(Boolean).join(' ') ||
        `${category} event${locationStr ? ` ${locationStr}` : ''}.`;
      const shortDescription = (descText ?? fallbackDesc).slice(0, 200);

      results.push({
        id: `phq:${ev.id}`,
        name: ev.title,
        category,
        shortDescription,
        venue,
        address,
        latitude: evLat,
        longitude: evLng,
        distanceMiles: dist !== undefined ? Math.round(dist * 10) / 10 : undefined,
        date: dateStr,
        timeStart: timeFormatted,
        costTier,
        dateFriendly: true,
        groupFriendly: true,
        durationMinutes: 120,
        source: 'predicthq',
        externalId: ev.id,
        expiresAt: dateStr ? `${dateStr}T23:59:59` : undefined,
      });
    }

    return results;
  } catch (err) {
    console.error('[PredictHQ] fetch error:', err);
    return [];
  }
}
