/**
 * OpenStreetMap Overpass API source — completely free, no key required.
 * Covers: restaurants, parks, hiking trails, museums, theaters, wineries,
 *         breweries, galleries, comedy clubs, and more.
 */

import { Suggestion, SuggestionCategory, haversineMiles } from './types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const TIMEOUT_MS = 8000;

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Map OSM tags → our category + description
const TAG_RULES: Array<{
  query: string;       // OverpassQL filter string
  category: SuggestionCategory;
  costTier: Suggestion['costTier'];
  descriptionFn: (tags: Record<string, string>) => string;
  dateFriendly: boolean;
  groupFriendly: boolean;
  durationMinutes: number;
}> = [
  {
    query: '["amenity"="restaurant"]',
    category: 'Dining',
    costTier: '$$',
    descriptionFn: (t) => [t.cuisine ? `${t.cuisine} cuisine` : '', t.opening_hours ? `Open: ${t.opening_hours}` : ''].filter(Boolean).join(' · ') || 'Local restaurant',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 75,
  },
  {
    query: '["amenity"="cafe"]',
    category: 'Dining',
    costTier: '$',
    descriptionFn: (t) => t.name ? `Cafe -- ${t.description || 'Local coffee shop and cafe'}` : 'Local coffee shop',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 60,
  },
  {
    query: '["craft"="winery"]',
    category: 'Wine & Drinks',
    costTier: '$$',
    descriptionFn: () => 'Local winery -- tastings and tours may be available.',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 120,
  },
  {
    query: '["craft"="brewery"]',
    category: 'Wine & Drinks',
    costTier: '$$',
    descriptionFn: (t) => t.name ? 'Craft brewery taproom -- sample freshly brewed beers on site.' : 'Local brewery',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 90,
  },
  {
    query: '["amenity"="bar"]["bar"!="dive"]',
    category: 'Wine & Drinks',
    costTier: '$',
    descriptionFn: (t) => t.cocktails === 'yes' ? 'Cocktail bar -- craft drinks in a social atmosphere.' : 'Local bar and lounge.',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 120,
  },
  {
    query: '["leisure"="park"]["name"]',
    category: 'Outdoors',
    costTier: 'free',
    descriptionFn: (t) => [t.description, t.leisure === 'nature_reserve' ? 'Nature reserve' : ''].filter(Boolean).join(' ') || 'Local park -- great for a stroll, picnic, or outdoor time.',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 90,
  },
  {
    query: '["route"="hiking"]',
    category: 'Outdoors',
    costTier: 'free',
    descriptionFn: (t) => {
      const dist = t.distance ? ` (${t.distance})` : '';
      const diff = t.difficulty ? `, ${t.difficulty} difficulty` : '';
      return `Hiking trail${dist}${diff}. Check AllTrails for conditions.`;
    },
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 120,
  },
  {
    query: '["amenity"="theatre"]',
    category: 'Theater & Plays',
    costTier: '$$',
    descriptionFn: () => 'Local theater -- check their website for current productions.',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 150,
  },
  {
    query: '["amenity"="cinema"]',
    category: 'Movies',
    costTier: '$',
    descriptionFn: (t) => t.name ? 'Movie theater -- check showtimes for current releases.' : 'Local cinema',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 150,
  },
  {
    query: '["tourism"="museum"]',
    category: 'Arts & Culture',
    costTier: '$',
    descriptionFn: (t) => t.description || t.subject ? `Museum${t.subject ? ` focused on ${t.subject}` : ''}.` : 'Local museum worth exploring.',
    dateFriendly: true,
    groupFriendly: false,
    durationMinutes: 120,
  },
  {
    query: '["tourism"="gallery"]',
    category: 'Arts & Culture',
    costTier: 'free',
    descriptionFn: () => 'Art gallery -- often free, check for opening hours and current exhibitions.',
    dateFriendly: true,
    groupFriendly: false,
    durationMinutes: 75,
  },
  {
    query: '["leisure"="bowling_alley"]',
    category: 'Active',
    costTier: '$',
    descriptionFn: () => 'Bowling alley -- lanes, rental shoes, and good old-fashioned competition.',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 120,
  },
  {
    query: '["leisure"="miniature_golf"]',
    category: 'Active',
    costTier: '$',
    descriptionFn: () => 'Mini golf -- easy going, competitive enough to be fun.',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 90,
  },
  {
    query: '["leisure"="escape_game"]',
    category: 'Local Experience',
    costTier: '$$',
    descriptionFn: () => 'Escape room -- 60 minutes, one lock, two minds. Find out how you work under pressure.',
    dateFriendly: true,
    groupFriendly: true,
    durationMinutes: 90,
  },
];

/** Build an Overpass QL query for a given tag rule, centered at lat/lng with radius in meters */
function buildQuery(tagFilter: string, lat: number, lng: number, radiusM: number): string {
  return `[out:json][timeout:10];
(
  node${tagFilter}(around:${radiusM},${lat},${lng});
  way${tagFilter}(around:${radiusM},${lat},${lng});
  relation${tagFilter}(around:${radiusM},${lat},${lng});
);
out center tags 20;`;
}

async function queryOverpass(ql: string): Promise<OverpassElement[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(ql)}`,
      signal: ctrl.signal,
    });
    if (!resp.ok) return [];
    const data = (await resp.json()) as OverpassResponse;
    return data.elements ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchOverpass(
  lat: number,
  lng: number,
  radiusMiles: number,
  categoryFilter?: string,
): Promise<Suggestion[]> {
  const radiusM = Math.round(radiusMiles * 1609.34);
  const rules = categoryFilter && categoryFilter !== 'All'
    ? TAG_RULES.filter((r) => r.category === categoryFilter)
    : TAG_RULES;

  // Run all queries in parallel, cap at 6 concurrent to be polite
  const batchSize = 6;
  const results: Suggestion[] = [];

  for (let i = 0; i < rules.length; i += batchSize) {
    const batch = rules.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (rule) => {
        const ql = buildQuery(rule.query, lat, lng, radiusM);
        const elements = await queryOverpass(ql);
        return elements
          .filter((el) => el.tags?.name)
          .slice(0, 5) // max 5 per tag type
          .map((el): Suggestion => {
            const elLat = el.lat ?? el.center?.lat;
            const elLng = el.lon ?? el.center?.lon;
            const tags = el.tags ?? {};
            const dist = elLat && elLng ? haversineMiles(lat, lng, elLat, elLng) : undefined;
            return {
              id: `overpass:${el.id}`,
              name: tags.name ?? 'Unnamed',
              category: rule.category,
              shortDescription: rule.descriptionFn(tags),
              venue: tags.name,
              address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
                .filter(Boolean).join(' '),
              latitude: elLat,
              longitude: elLng,
              distanceMiles: dist ? Math.round(dist * 10) / 10 : undefined,
              costTier: rule.costTier,
              dateFriendly: rule.dateFriendly,
              groupFriendly: rule.groupFriendly,
              durationMinutes: rule.durationMinutes,
              source: 'overpass',
              externalId: String(el.id),
            };
          });
      }),
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled') results.push(...r.value);
    }
  }

  return results;
}
