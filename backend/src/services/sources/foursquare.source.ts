/**
 * Foursquare Places API source.
 * Free tier: 10,000 calls/month (more than sufficient).
 * Key: FOURSQUARE_API_KEY env var.
 * Signup: foursquare.com/developers (instant)
 * Covers: restaurants, bars, wineries, breweries, parks, museums, entertainment venues.
 */

import { Suggestion, SuggestionCategory, haversineMiles } from './types';

const FSQ_BASE = 'https://api.foursquare.com/v3';

interface FsqPlace {
  fsq_id: string;
  name: string;
  categories?: Array<{ id: number; name: string; icon?: { prefix: string; suffix: string } }>;
  geocodes?: { main?: { latitude: number; longitude: number } };
  location?: { formatted_address?: string; address?: string; locality?: string; region?: string };
  rating?: number;
  price?: number;            // 1=$, 2=$$, 3=$$$, 4=$$$$
  hours?: { display?: string; is_open_now?: boolean };
  photos?: Array<{ prefix: string; suffix: string; width: number; height: number }>;
  website?: string;
  description?: string;
}

interface FsqResponse {
  results: FsqPlace[];
}

// FSQ category IDs → our categories
// Full list: https://location.foursquare.com/places/docs/categories
const FSQ_CATEGORY_MAP: Array<{
  ids: number[];
  category: SuggestionCategory;
  costTier: Suggestion['costTier'];
  durationMinutes: number;
}> = [
  { ids: [13000, 13065, 13199, 13072, 13338, 13046, 13377], category: 'Dining', costTier: '$$', durationMinutes: 75 },        // Restaurants
  { ids: [13003, 13029, 13049], category: 'Dining', costTier: '$', durationMinutes: 45 },                                      // Cafe, Coffee, Bakery
  { ids: [13059, 13057, 13272], category: 'Wine & Drinks', costTier: '$$', durationMinutes: 90 },                              // Bar, Cocktail bar, Beer bar
  { ids: [13056, 13055], category: 'Wine & Drinks', costTier: '$$', durationMinutes: 120 },                                    // Winery, Brewery
  { ids: [16000, 16019, 16032, 16039], category: 'Outdoors', costTier: 'free', durationMinutes: 90 },                         // Park, Garden, Trail
  { ids: [10000, 10002, 10052], category: 'Arts & Culture', costTier: '$', durationMinutes: 120 },                             // Museum, Art gallery
  { ids: [10024, 10025, 10026], category: 'Theater & Plays', costTier: '$$', durationMinutes: 150 },                          // Theater, Performing arts
  { ids: [10032, 10033], category: 'Movies', costTier: '$', durationMinutes: 150 },                                            // Cinema
  { ids: [10035, 10005], category: 'Live Music', costTier: '$$', durationMinutes: 150 },                                       // Music venue, Concert hall
  { ids: [10001], category: 'Comedy', costTier: '$$', durationMinutes: 90 },                                                   // Comedy club
  { ids: [18021, 18004, 18013], category: 'Active', costTier: '$', durationMinutes: 90 },                                     // Bowling, Mini golf, Gym
  { ids: [13006, 13009, 14005], category: 'Local Experience', costTier: '$$', durationMinutes: 120 },                         // Escape room, Karaoke, Spa
];

function fsqCostTier(price?: number): Suggestion['costTier'] {
  if (!price) return '$$';
  return price === 1 ? '$' : price === 2 ? '$$' : '$$$';
}

function fsqImage(photos?: FsqPlace['photos']): string | undefined {
  if (!photos?.length) return undefined;
  const p = photos[0];
  return `${p.prefix}400x300${p.suffix}`;
}

function fsqDescription(place: FsqPlace, category: SuggestionCategory): string {
  if (place.description) return place.description.slice(0, 180);
  const catName = place.categories?.[0]?.name ?? category;
  const ratingStr = place.rating ? ` Rated ${place.rating.toFixed(1)}/10.` : '';
  const hoursStr = place.hours?.is_open_now === false ? ' (Currently closed)' : '';
  return `${catName} in ${place.location?.locality ?? 'your area'}.${ratingStr}${hoursStr}`;
}

function getCategoryForPlace(place: FsqPlace): { category: SuggestionCategory; costTier: Suggestion['costTier']; durationMinutes: number } | null {
  const placeIds = (place.categories ?? []).map((c) => c.id);
  for (const rule of FSQ_CATEGORY_MAP) {
    if (rule.ids.some((id) => placeIds.includes(id))) {
      return { category: rule.category, costTier: rule.costTier, durationMinutes: rule.durationMinutes };
    }
    // Also check parent category (FSQ IDs are hierarchical — 13xxx = Food & Drink)
    for (const id of placeIds) {
      const parentId = Math.floor(id / 100) * 100;
      if (rule.ids.includes(parentId)) {
        return { category: rule.category, costTier: rule.costTier, durationMinutes: rule.durationMinutes };
      }
    }
  }
  return null;
}

export async function fetchFoursquare(
  lat: number,
  lng: number,
  radiusMiles: number,
  categoryFilter?: string,
): Promise<Suggestion[]> {
  const key = process.env.FOURSQUARE_API_KEY;
  if (!key) return [];

  try {
    const radiusM = Math.min(Math.round(radiusMiles * 1609.34), 100000);

    // Pick category IDs based on filter
    let categoryIds: number[] = [];
    if (categoryFilter && categoryFilter !== 'All') {
      for (const rule of FSQ_CATEGORY_MAP) {
        if (rule.category === categoryFilter) categoryIds.push(...rule.ids);
      }
    }

    const url = new URL(`${FSQ_BASE}/places/search`);
    url.searchParams.set('ll', `${lat},${lng}`);
    url.searchParams.set('radius', String(radiusM));
    url.searchParams.set('limit', '30');
    url.searchParams.set('sort', 'RELEVANCE');
    url.searchParams.set('fields', 'fsq_id,name,categories,geocodes,location,rating,price,hours,photos,website,description');
    if (categoryIds.length) {
      url.searchParams.set('categories', categoryIds.join(','));
    }

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: key,
        Accept: 'application/json',
      },
    });
    if (!resp.ok) return [];

    const data = (await resp.json()) as FsqResponse;
    const places = data.results ?? [];

    return places
      .map((place): Suggestion | null => {
        const geo = place.geocodes?.main;
        const categoryInfo = getCategoryForPlace(place);
        if (!categoryInfo) return null;

        const dist = geo ? haversineMiles(lat, lng, geo.latitude, geo.longitude) : undefined;

        return {
          id: `fsq:${place.fsq_id}`,
          name: place.name,
          category: categoryInfo.category,
          shortDescription: fsqDescription(place, categoryInfo.category),
          venue: place.name,
          address: place.location?.formatted_address ?? place.location?.address,
          latitude: geo?.latitude,
          longitude: geo?.longitude,
          distanceMiles: dist ? Math.round(dist * 10) / 10 : undefined,
          costTier: fsqCostTier(place.price),
          imageUrl: fsqImage(place.photos),
          ticketUrl: place.website,
          dateFriendly: true,
          groupFriendly: true,
          durationMinutes: categoryInfo.durationMinutes,
          source: 'foursquare',
          externalId: place.fsq_id,
        };
      })
      .filter((s): s is Suggestion => s !== null);
  } catch {
    return [];
  }
}
