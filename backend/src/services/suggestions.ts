import { cache } from '@/services/cache';

/**
 * Activity suggestion engine.
 *
 * MVP: curated seed catalog + randomization, cached via Redis/in-memory.
 * Third-party integrations (Google Places, Yelp, TMDB) plug in behind
 * fetchExternal() when API keys are configured.
 */

export interface Suggestion {
  name: string;
  category: string;
  description: string;
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
    // TODO: merge external API results (Google Places / Yelp / TMDB) when keys are set
    pool = SEED_CATALOG;
    await cache.set(cacheKey, JSON.stringify(pool), CACHE_TTL_SECONDS);
  }

  const filtered = query.category ? pool.filter((s) => s.category === query.category) : pool;

  // Randomization requirement: shuffle, return 3-5 suggestions
  return shuffle(filtered).slice(0, 5);
}
