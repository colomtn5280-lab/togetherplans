/**
 * Foursquare Places API v2 source.
 * Uses Client ID + Client Secret (free, no rate limit concerns at our scale).
 * Covers: restaurants, bars, wineries, breweries, parks, museums, entertainment venues.
 *
 * Photo enrichment: v2 /venues/search omits photos; we batch-fetch them via
 * to keep latency sane.
 */

import { Suggestion, SuggestionCategory, haversineMiles } from './types';

const FSQ_BASE = 'https://api.foursquare.com/v2';
const FSQ_VERSION = '20231001';

// Fetch real venue photos for at most this many results per search.
// Each takes ~1 network call; they run in parallel.

interface FsqCategory {
  id: string;
  name: string;
  categoryCode?: number;
  icon?: { prefix: string; suffix: string };
}

interface FsqVenue {
  id: string;
  name: string;
  categories?: FsqCategory[];
  location?: {
    lat?: number;
    lng?: number;
    formattedAddress?: string[];
    address?: string;
    city?: string;
    state?: string;
  };
  rating?: number;
  price?: { tier: number };   // 1=$, 2=$$, 3=$$$, 4=$$$$
  hours?: { isOpen?: boolean; status?: string };
  photos?: { groups?: Array<{ items?: Array<{ prefix: string; suffix: string }> }> };
  url?: string;
  description?: string;
  contact?: { formattedPhone?: string };
}

interface FsqSearchResponse {
  meta?: { code: number };
  response?: { venues?: FsqVenue[] };
}

// Foursquare category IDs (v2 format — 8-character hex strings)
// Map to our SuggestionCategory
const FSQ_CATEGORY_RULES: Array<{
  ids: string[];       // FSQ category IDs
  category: SuggestionCategory;
  costTier: Suggestion['costTier'];
  durationMinutes: number;
}> = [
  { ids: ['4d4b7105d754a06374d81259'], category: 'Dining', costTier: '$$', durationMinutes: 75 },           // Food (top-level)
  { ids: ['4bf58dd8d48988d16c941735'], category: 'Dining', costTier: '$', durationMinutes: 45 },             // Cafe/Coffee
  { ids: ['4bf58dd8d48988d1e0931735'], category: 'Dining', costTier: '$', durationMinutes: 60 },             // Bakery
  { ids: ['4d4b7105d754a06376d81259'], category: 'Outdoors', costTier: 'free', durationMinutes: 90 },       // Outdoors & Recreation
  { ids: ['4bf58dd8d48988d163941735'], category: 'Outdoors', costTier: 'free', durationMinutes: 90 },       // Park
  { ids: ['4bf58dd8d48988d159941735'], category: 'Outdoors', costTier: 'free', durationMinutes: 120 },      // Hiking Trail (verified)
  { ids: ['4bf58dd8d48988d165941735'], category: 'Outdoors', costTier: 'free', durationMinutes: 60 },       // Scenic Lookout (verified)
  { ids: ['4d4b7105d754a06377d81259'], category: 'Arts & Culture', costTier: '$', durationMinutes: 120 },   // Arts & Entertainment
  { ids: ['4bf58dd8d48988d181941735'], category: 'Arts & Culture', costTier: '$', durationMinutes: 120 },   // Museum (verified — d182 is Amusement Park, was mislabeled)
  { ids: ['4bf58dd8d48988d1e2931735'], category: 'Arts & Culture', costTier: 'free', durationMinutes: 75 }, // Art Gallery
  { ids: ['4bf58dd8d48988d137941735'], category: 'Theater & Plays', costTier: '$$', durationMinutes: 150 }, // Theater
  { ids: ['4bf58dd8d48988d17f941735'], category: 'Movies', costTier: '$', durationMinutes: 150 },           // Movie Theater
  { ids: ['4bf58dd8d48988d1e9941735'], category: 'Live Music', costTier: '$$', durationMinutes: 150 },      // Music Venue
  { ids: ['52e81612bcbc57f1066b79f4'], category: 'Comedy', costTier: '$$', durationMinutes: 90 },           // Comedy Club
  { ids: ['4bf58dd8d48988d116941735'], category: 'Wine & Drinks', costTier: '$$', durationMinutes: 90 },    // Bar
  { ids: ['50327c8591d4c4b30a586d5d'], category: 'Wine & Drinks', costTier: '$$', durationMinutes: 90 },    // Cocktail Bar
  { ids: ['4bf58dd8d48988d1d8941735'], category: 'Wine & Drinks', costTier: '$$', durationMinutes: 120 },   // Winery / Vineyard
  { ids: ['50327c8591d4c4b30a586d5d', '4bf58dd8d48988d11e941735'], category: 'Wine & Drinks', costTier: '$$', durationMinutes: 90 }, // Brewery
  { ids: ['4bf58dd8d48988d1e4931735'], category: 'Sports', costTier: '$', durationMinutes: 120 },           // Bowling Alley (verified — d166 is Sculpture Garden)
  { ids: ['4bf58dd8d48988d1e6941735'], category: 'Sports', costTier: '$$', durationMinutes: 240 },          // Golf Course
  { ids: ['52e81612bcbc57f1066b79eb'], category: 'Sports', costTier: '$', durationMinutes: 90 },            // Mini Golf Course (verified — d1e7 is Playground)
  { ids: ['58daa1558bbb0b01f18ec1b0'], category: 'Sports', costTier: '$', durationMinutes: 90 },            // Golf Driving Range
  { ids: ['4bf58dd8d48988d1e4931735'], category: 'Sports', costTier: '$', durationMinutes: 90 },            // Bowling Alley
  { ids: ['503289d391d4c4b30a586d6a'], category: 'Sports', costTier: '$$', durationMinutes: 120 },          // Climbing Gym
  { ids: ['4bf58dd8d48988d168941735'], category: 'Sports', costTier: '$', durationMinutes: 90 },            // Skating Rink
  // Family — every ID verified against live /v2/venues/categories taxonomy
  { ids: ['4bf58dd8d48988d17b941735'], category: 'Family', costTier: '$$', durationMinutes: 180 },          // Zoo
  { ids: ['4fceea171983d5d06c3e9823'], category: 'Family', costTier: '$$', durationMinutes: 150 },          // Aquarium
  { ids: ['4bf58dd8d48988d182941735'], category: 'Family', costTier: '$$$', durationMinutes: 300 },         // Amusement Park
  { ids: ['4bf58dd8d48988d1e7941735'], category: 'Family', costTier: 'free', durationMinutes: 90 },         // Playground
  { ids: ['4bf58dd8d48988d193941735'], category: 'Family', costTier: '$$', durationMinutes: 240 },          // Water Park
  { ids: ['4bf58dd8d48988d1e1931735'], category: 'Family', costTier: '$', durationMinutes: 90 },            // Arcade
  { ids: ['4bf58dd8d48988d191941735'], category: 'Family', costTier: '$', durationMinutes: 150 },           // Science Museum
  { ids: ['4bf58dd8d48988d181941735'], category: 'Family', costTier: '$', durationMinutes: 120 },           // Art Museum (also Arts & Culture)
  { ids: ['4bf58dd8d48988d1e2931735'], category: 'Family', costTier: 'free', durationMinutes: 90 },         // Art Gallery (family-friendly)
  { ids: ['4bf58dd8d48988d17b941735'], category: 'Local Experience', costTier: '$$', durationMinutes: 180 },// Zoo (also Local Experience)
  { ids: ['4fceea171983d5d06c3e9823'], category: 'Local Experience', costTier: '$$', durationMinutes: 150 },// Aquarium (also Local Experience)
  { ids: ['4bf58dd8d48988d181941735'], category: 'Local Experience', costTier: '$', durationMinutes: 120 }, // Museum (Local Experience)
  { ids: ['4bf58dd8d48988d1e4931735'], category: 'Family', costTier: '$', durationMinutes: 90 },            // Bowling Alley
  { ids: ['4bf58dd8d48988d1ed941735'], category: 'Wellness', costTier: '$$', durationMinutes: 120 },        // Spa
  { ids: ['52f2ab2ebcbc57f1066b8b3c'], category: 'Wellness', costTier: '$$', durationMinutes: 90 },         // Massage Clinic
  { ids: ['4bf58dd8d48988d102941735'], category: 'Wellness', costTier: '$', durationMinutes: 75 },          // Yoga Studio
  { ids: ['58daa1558bbb0b01f18ec1ae'], category: 'Wellness', costTier: '$$', durationMinutes: 90 },         // Sauna (verified — 52f2...8b42 is Big Box Store, was mislabeled)
  { ids: ['4bf58dd8d48988d160941735'], category: 'Wellness', costTier: '$$', durationMinutes: 180 },        // Hot Spring (verified)
  { ids: ['5744ccdfe4b0c0459246b4b2'], category: 'Wellness', costTier: '$$', durationMinutes: 75 },         // Pilates Studio (verified)
  { ids: ['52e81612bcbc57f1066b7a27'], category: 'Wellness', costTier: '$$', durationMinutes: 120 },        // Bath House (verified)
  // Volunteering — IDs verified live in the v2 taxonomy Sept 2026
  { ids: ['50328a8e91d4c4b30a586d6c'], category: 'Volunteering', costTier: 'free', durationMinutes: 120 },  // Non-Profit Organization (verified)
  { ids: ['52e81612bcbc57f1066b7a34'], category: 'Volunteering', costTier: 'free', durationMinutes: 120 },  // Community Center (verified)
  { ids: ['69d41dd556ec6a4ded8e8266'], category: 'Volunteering', costTier: 'free', durationMinutes: 120 },  // Community Garden (verified)
  { ids: ['4bf58dd8d48988d1f1931735'], category: 'Local Experience', costTier: '$$', durationMinutes: 120 }, // General Entertainment
];

function matchCategory(venue: FsqVenue, categoryFilter?: string): { category: SuggestionCategory; costTier: Suggestion['costTier']; durationMinutes: number } | null {
  const ids = (venue.categories ?? []).map((c) => c.id);
  // When a category filter is active, prefer rules for that category first —
  // some IDs (e.g. Bowling Alley) legitimately appear under multiple categories.
  const ordered = categoryFilter
    ? [...FSQ_CATEGORY_RULES.filter((r) => r.category === categoryFilter),
       ...FSQ_CATEGORY_RULES.filter((r) => r.category !== categoryFilter)]
    : FSQ_CATEGORY_RULES;
  for (const rule of ordered) {
    if (rule.ids.some((id) => ids.includes(id))) return rule;
  }
  // Try top-level category prefix match (first 4 chars of ID)
  for (const catId of ids) {
    const prefix = catId.slice(0, 20);
    for (const rule of ordered) {
      if (rule.ids.some((id) => id.startsWith(prefix.slice(0, 16)))) return rule;
    }
  }
  return null;
}

function costTierFromPrice(price?: { tier: number }): Suggestion['costTier'] {
  if (!price) return '$$';
  return price.tier <= 1 ? '$' : price.tier === 2 ? '$$' : '$$$';
}

function venueImage(photos?: FsqVenue['photos']): string | undefined {
  const item = photos?.groups?.[0]?.items?.[0];
  if (!item) return undefined;
  return `${item.prefix}600x400${item.suffix}`;
}


function venueDescription(venue: FsqVenue, category: SuggestionCategory): string {
  if (venue.description) return venue.description.slice(0, 180);
  const catName = venue.categories?.[0]?.name ?? category;
  const city = venue.location?.city ?? 'your area';
  const rating = venue.rating ? ` Rated ${venue.rating.toFixed(1)}/10.` : '';
  const open = venue.hours?.isOpen === false ? ' (Currently closed)' : '';
  return `${catName} in ${city}.${rating}${open}`;
}

export async function fetchFoursquare(
  lat: number,
  lng: number,
  radiusMiles: number,
  categoryFilter?: string,
): Promise<Suggestion[]> {
  const clientId = process.env.FOURSQUARE_CLIENT_ID;
  const clientSecret = process.env.FOURSQUARE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const radiusM = Math.min(Math.round(radiusMiles * 1609.34), 100000);

  // Pick category IDs to search
  const wantCategories = categoryFilter && categoryFilter !== 'All'
    ? FSQ_CATEGORY_RULES.filter((r) => r.category === categoryFilter).flatMap((r) => r.ids)
    : [];

  // Build category-specific queries or a general one.
  // Chunk filtered IDs into batches of 5 so deep categories (Family, Wellness)
  // aren't silently truncated to the first 6 IDs.
  const chunk = <T,>(arr: T[], n: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  };
  const queries = wantCategories.length
    ? chunk([...new Set(wantCategories)], 5)
    : [
        ['4d4b7105d754a06374d81259'], // Food
        ['4d4b7105d754a06377d81259'], // Arts & Entertainment
        ['4d4b7105d754a06376d81259'], // Outdoors
        ['4bf58dd8d48988d116941735', '4bf58dd8d48988d1d8941735'], // Bar + Winery
      ];

  const allVenues: FsqVenue[] = [];

  await Promise.allSettled(
    queries.map(async (catIds) => {
      try {
        const url = new URL(`${FSQ_BASE}/venues/search`);
        url.searchParams.set('ll', `${lat},${lng}`);
        url.searchParams.set('radius', String(radiusM));
        url.searchParams.set('limit', '50');
        url.searchParams.set('categoryId', catIds.join(','));
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('client_secret', clientSecret);
        url.searchParams.set('v', FSQ_VERSION);
        url.searchParams.set('intent', 'browse');

        const resp = await fetch(url.toString());
        if (!resp.ok) return;

        const data = (await resp.json()) as FsqSearchResponse;
        if (data.meta?.code === 200 && data.response?.venues) {
          allVenues.push(...data.response.venues);
        }
      } catch {
        // fail silently per-query
      }
    }),
  );

  // Normalize and dedupe by id
  const seen = new Set<string>();
  const results: Suggestion[] = [];

  for (const venue of allVenues) {
    if (seen.has(venue.id)) continue;
    seen.add(venue.id);

    const match = matchCategory(venue, categoryFilter && categoryFilter !== 'All' ? categoryFilter : undefined);
    if (!match) continue;

    const vLat = venue.location?.lat;
    const vLng = venue.location?.lng;
    const dist = vLat && vLng ? haversineMiles(lat, lng, vLat, vLng) : undefined;
    const addr = venue.location?.formattedAddress?.join(', ') ?? venue.location?.address;

    results.push({
      id: `fsq:${venue.id}`,
      name: venue.name,
      category: match.category,
      shortDescription: venueDescription(venue, match.category),
      venue: venue.name,
      address: addr,
      latitude: vLat,
      longitude: vLng,
      distanceMiles: dist !== undefined ? Math.round(dist * 10) / 10 : undefined,
      costTier: costTierFromPrice(venue.price),
      imageUrl: venueImage(venue.photos),
      ticketUrl: venue.url,
      dateFriendly: true,
      groupFriendly: true,
      durationMinutes: match.durationMinutes,
      source: 'foursquare',
      externalId: venue.id,
      attribution: 'Venue data © Foursquare',
    });
  }

  return results;
}

/**
 * Text-search Foursquare venues by keyword (for cuisine chips / restaurant search).
 * Uses the same v2 /venues/search but with `query` param instead of categoryId.
 */
export async function searchFoursquareVenues(
  query: string,
  lat: number,
  lng: number,
  radiusMiles: number,
): Promise<Suggestion[]> {
  const clientId = process.env.FOURSQUARE_CLIENT_ID;
  const clientSecret = process.env.FOURSQUARE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const radiusM = Math.min(Math.round(radiusMiles * 1609.34), 40000);
  // Restrict to food category so "Italian restaurant" doesn't return Italian clothing stores
  const FOOD_CAT = '4d4b7105d754a06374d81259';

  try {
    const url = new URL(`${FSQ_BASE}/venues/search`);
    url.searchParams.set('ll', `${lat},${lng}`);
    url.searchParams.set('radius', String(radiusM));
    url.searchParams.set('limit', '30');
    url.searchParams.set('query', query);
    url.searchParams.set('categoryId', FOOD_CAT);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('client_secret', clientSecret);
    url.searchParams.set('v', FSQ_VERSION);
    url.searchParams.set('intent', 'browse');

    const resp = await fetch(url.toString());
    if (!resp.ok) return [];

    const data = (await resp.json()) as FsqSearchResponse;
    const venues = data.response?.venues ?? [];
    const results: Suggestion[] = [];
    const seen = new Set<string>();

    for (const venue of venues) {
      if (seen.has(venue.id)) continue;
      seen.add(venue.id);

      const vLat = venue.location?.lat;
      const vLng = venue.location?.lng;
      const dist = vLat && vLng ? haversineMiles(lat, lng, vLat, vLng) : undefined;
      const addr = venue.location?.formattedAddress?.join(', ') ?? venue.location?.address;

      results.push({
        id: `fsq:${venue.id}`,
        name: venue.name,
        category: 'Dining',
        shortDescription: venueDescription(venue, 'Dining'),
        venue: venue.name,
        address: addr,
        latitude: vLat,
        longitude: vLng,
        distanceMiles: dist !== undefined ? Math.round(dist * 10) / 10 : undefined,
        costTier: costTierFromPrice(venue.price),
        imageUrl: venueImage(venue.photos),
        ticketUrl: venue.url,
        dateFriendly: true,
        groupFriendly: true,
        durationMinutes: 75,
        source: 'foursquare',
        externalId: venue.id,
        attribution: 'Venue data © Foursquare',
      });
    }

    return results;
  } catch {
    return [];
  }
}
