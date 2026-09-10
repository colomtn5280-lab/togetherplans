import { cache } from '@/services/cache';

/**
 * Activity suggestion engine.
 *
 * Merges curated seed catalog with live data from Yelp, TMDB, and Google Places.
 * Falls back gracefully when API keys are missing or calls fail.
 * Results are cached (Redis/in-memory) for 5 minutes.
 */

export interface Suggestion {
  name: string;
  category: string;
  description: string;
  address?: string;
  // rough distance ranking input when lat/lng provided
  latitude?: number;
  longitude?: number;
}

export interface SuggestionQuery {
  lat?: number;
  lng?: number;
  category?: string;
}

const SEED_CATALOG: Suggestion[] = [
  { name: 'Italian dinner date', category: 'restaurant', description: 'Cozy pasta and wine spot' },
  { name: 'Sushi night', category: 'restaurant', description: 'Omakase or casual rolls' },
  { name: 'Taco crawl', category: 'restaurant', description: 'Hit 3 taquerias in one night' },
  { name: 'New release movie', category: 'movie', description: 'Catch the latest blockbuster' },
  { name: 'Indie film screening', category: 'movie', description: 'Local arthouse theater pick' },
  { name: 'Mini golf', category: 'activity', description: 'Classic competitive fun' },
  { name: 'Bowling night', category: 'activity', description: 'Lanes, snacks, and trash talk' },
  { name: 'Escape room', category: 'activity', description: 'Team puzzle under pressure' },
  { name: 'Karaoke room', category: 'activity', description: 'Private room, zero judgment' },
  { name: 'Sunset hike', category: 'outdoors', description: 'Golden-hour trail walk' },
  { name: 'Picnic in the park', category: 'outdoors', description: 'Blanket, snacks, people-watching' },
  { name: 'Farmers market stroll', category: 'outdoors', description: 'Weekend morning browse' },
  { name: 'Museum visit', category: 'culture', description: 'Art or science, your pick' },
  { name: 'Live music venue', category: 'culture', description: 'Local band or open mic' },
  { name: 'Cooking class', category: 'culture', description: 'Learn a dish together' },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const CACHE_TTL_SECONDS = 300;

// ─── Yelp Fusion API ──────────────────────────────────────────────────────────

const YELP_CATEGORY_MAP: Record<string, string> = {
  restaurant: 'restaurants',
  activity: 'fun things to do',
  outdoors: 'parks',
  culture: 'arts',
};

async function fetchYelp(lat: number, lng: number, category?: string): Promise<Suggestion[]> {
  const key = process.env.YELP_API_KEY;
  if (!key) return [];

  try {
    const term = category ? (YELP_CATEGORY_MAP[category] ?? category) : 'restaurants,activities';
    const url = new URL('https://api.yelp.com/v3/businesses/search');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('term', term);
    url.searchParams.set('limit', '20');
    url.searchParams.set('sort_by', 'rating');

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!resp.ok) return [];

    const data = (await resp.json()) as {
      businesses?: Array<{
        name: string;
        categories?: Array<{ title: string }>;
        location?: { display_address?: string[] };
        rating?: number;
        coordinates?: { latitude?: number; longitude?: number };
      }>;
    };

    return (data.businesses ?? []).map((b) => ({
      name: b.name,
      category: b.categories?.[0]?.title ?? category ?? 'activity',
      address: b.location?.display_address?.join(' ') ?? '',
      description: b.rating ? `Rated ${b.rating}/5 on Yelp` : 'Highly rated local spot',
      latitude: b.coordinates?.latitude,
      longitude: b.coordinates?.longitude,
    }));
  } catch {
    return [];
  }
}

// ─── TMDB (Now Playing Movies) ────────────────────────────────────────────────

async function fetchTMDB(): Promise<Suggestion[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return [];

  try {
    const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${key}&language=en-US&page=1`;
    const resp = await fetch(url);
    if (!resp.ok) return [];

    const data = (await resp.json()) as {
      results?: Array<{ title: string; overview: string }>;
    };

    return (data.results ?? []).map((m) => ({
      name: m.title,
      category: 'movie',
      description: (m.overview ?? '').slice(0, 120),
    }));
  } catch {
    return [];
  }
}

// ─── Google Places API ────────────────────────────────────────────────────────

async function fetchGooglePlaces(lat: number, lng: number): Promise<Suggestion[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&key=${key}`;
    const resp = await fetch(url);
    if (!resp.ok) return [];

    const data = (await resp.json()) as {
      results?: Array<{
        name: string;
        types?: string[];
        vicinity?: string;
        rating?: number;
      }>;
    };

    return (data.results ?? []).map((p) => ({
      name: p.name,
      category: p.types?.[0] ?? 'restaurant',
      address: p.vicinity ?? '',
      description: p.rating ? `Rated ${p.rating}/5 on Google` : 'Nearby place',
    }));
  } catch {
    return [];
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getSuggestions(query: SuggestionQuery): Promise<Suggestion[]> {
  // Round coordinates to ~1km resolution to maximize cache hit rate
  const lat = query.lat !== undefined ? Math.round(query.lat * 100) / 100 : 'x';
  const lng = query.lng !== undefined ? Math.round(query.lng * 100) / 100 : 'x';
  const cacheKey = `suggestions:${query.category || 'all'}:${lat}:${lng}`;

  const cached = await cache.get(cacheKey);
  let pool: Suggestion[];
  if (cached) {
    pool = JSON.parse(cached) as Suggestion[];
  } else {
    const external: Suggestion[] = [];

    const hasLocation = typeof lat === 'number' && typeof lng === 'number';

    // Fetch TMDB movies (location-independent) when relevant
    const wantMovies = !query.category || query.category === 'movie';
    if (wantMovies) {
      const movies = await fetchTMDB();
      external.push(...movies);
    }

    if (hasLocation) {
      // Yelp Fusion — primary location source
      const yelpResults = await fetchYelp(lat as number, lng as number, query.category);
      external.push(...yelpResults);

      // Google Places — supplement if Yelp is absent/thin
      if (yelpResults.length < 5) {
        const googleResults = await fetchGooglePlaces(lat as number, lng as number);
        external.push(...googleResults);
      }
    }

    // Merge: external first, then seed catalog. Deduplicate by name (case-insensitive).
    const seen = new Set<string>();
    const merged: Suggestion[] = [];
    for (const s of [...external, ...SEED_CATALOG]) {
      const key = s.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(s);
      }
    }

    pool = merged;
    await cache.set(cacheKey, JSON.stringify(pool), CACHE_TTL_SECONDS);
  }

  const filtered = query.category ? pool.filter((s) => s.category === query.category) : pool;

  // Shuffle and return up to 10 results for variety
  return shuffle(filtered).slice(0, 10);
}
