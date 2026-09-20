/**
 * Foursquare Places API v2 source.
 * Uses Client ID + Client Secret (free, no rate limit concerns at our scale).
 * Covers: restaurants, bars, wineries, breweries, parks, museums, entertainment venues.
 */

import { Suggestion, SuggestionCategory, haversineMiles } from './types';

const FSQ_BASE = 'https://api.foursquare.com/v2';
const FSQ_VERSION = '20231001';

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
  { ids: ['4d4b7105d754a06377d81259'], category: 'Arts & Culture', costTier: '$', durationMinutes: 120 },   // Arts & Entertainment
  { ids: ['4bf58dd8d48988d182941735'], category: 'Arts & Culture', costTier: '$', durationMinutes: 120 },   // Museum
  { ids: ['4bf58dd8d48988d1e2931735'], category: 'Arts & Culture', costTier: 'free', durationMinutes: 75 }, // Art Gallery
  { ids: ['4bf58dd8d48988d137941735'], category: 'Theater & Plays', costTier: '$$', durationMinutes: 150 }, // Theater
  { ids: ['4bf58dd8d48988d17f941735'], category: 'Movies', costTier: '$', durationMinutes: 150 },           // Movie Theater
  { ids: ['4bf58dd8d48988d1e9941735'], category: 'Live Music', costTier: '$$', durationMinutes: 150 },      // Music Venue
  { ids: ['52e81612bcbc57f1066b79f4'], category: 'Comedy', costTier: '$$', durationMinutes: 90 },           // Comedy Club
  { ids: ['4bf58dd8d48988d116941735'], category: 'Wine & Drinks', costTier: '$$', durationMinutes: 90 },    // Bar
  { ids: ['50327c8591d4c4b30a586d5d'], category: 'Wine & Drinks', costTier: '$$', durationMinutes: 90 },    // Cocktail Bar
  { ids: ['4bf58dd8d48988d1d8941735'], category: 'Wine & Drinks', costTier: '$$', durationMinutes: 120 },   // Winery / Vineyard
  { ids: ['50327c8591d4c4b30a586d5d', '4bf58dd8d48988d11e941735'], category: 'Wine & Drinks', costTier: '$$', durationMinutes: 90 }, // Brewery
  { ids: ['4bf58dd8d48988d166941735'], category: 'Active', costTier: '$', durationMinutes: 120 },           // Bowling Alley
  { ids: ['4bf58dd8d48988d15e941735'], category: 'Active', costTier: '$', durationMinutes: 90 },            // Golf
  { ids: ['4bf58dd8d48988d1e7941735'], category: 'Local Experience', costTier: '$$', durationMinutes: 120 }, // Entertainment
];

function matchCategory(venue: FsqVenue): { category: SuggestionCategory; costTier: Suggestion['costTier']; durationMinutes: number } | null {
  const ids = (venue.categories ?? []).map((c) => c.id);
  for (const rule of FSQ_CATEGORY_RULES) {
    if (rule.ids.some((id) => ids.includes(id))) return rule;
  }
  // Try top-level category prefix match (first 4 chars of ID)
  for (const catId of ids) {
    const prefix = catId.slice(0, 20);
    for (const rule of FSQ_CATEGORY_RULES) {
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
  return `${item.prefix}400x300${item.suffix}`;
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

  // Build category-specific queries or a general one
  const queries = wantCategories.length
    ? [wantCategories.slice(0, 6)] // max 6 IDs per request
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
        url.searchParams.set('limit', '20');
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

    const match = matchCategory(venue);
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
