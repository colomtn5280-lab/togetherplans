/**
 * TMDB source — movies now playing + trending streaming shows.
 * Uses existing TMDB_API_KEY. Free, no rate limit concerns at our scale.
 */

import { Suggestion } from './types';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
  genre_ids?: number[];
}

interface TmdbShow {
  id: number;
  name: string;
  overview: string;
  poster_path?: string;
  vote_average?: number;
  first_air_date?: string;
}

interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
}

interface TmdbProviderResult {
  results?: {
    US?: {
      flatrate?: TmdbProvider[];
      free?: TmdbProvider[];
      ads?: TmdbProvider[];
    };
  };
}

// Genre IDs for enriched descriptions
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 14: 'Fantasy',
  27: 'Horror', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
};

async function tmdbFetch<T>(path: string, key: string): Promise<T | null> {
  try {
    const sep = path.includes('?') ? '&' : '?';
    const resp = await fetch(`${TMDB_BASE}${path}${sep}api_key=${key}`);
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

/** Now-playing movies → Movies category */
async function fetchNowPlaying(key: string): Promise<Suggestion[]> {
  const data = await tmdbFetch<{ results: TmdbMovie[] }>(
    '/movie/now_playing?language=en-US&page=1&region=US', key,
  );
  if (!data?.results) return [];

  return data.results.slice(0, 10).map((m): Suggestion => {
    const genres = (m.genre_ids ?? []).map((id) => GENRE_MAP[id]).filter(Boolean);
    const genreStr = genres.length ? genres.slice(0, 2).join(', ') : 'Film';
    const score = m.vote_average ? ` -- rated ${m.vote_average.toFixed(1)}/10` : '';
    return {
      id: `tmdb:movie:${m.id}`,
      name: m.title,
      category: 'Movies',
      shortDescription: m.overview?.slice(0, 150) || `${genreStr} film${score} -- now playing in theaters.`,
      imageUrl: m.poster_path ? `${IMG_BASE}${m.poster_path}` : undefined,
      costTier: '$',
      dateFriendly: true,
      groupFriendly: true,
      durationMinutes: 130,
      ticketUrl: `https://www.themoviedb.org/movie/${m.id}`,
      source: 'tmdb',
      externalId: `movie:${m.id}`,
    };
  });
}

/** Trending TV shows + streaming provider info → Streaming Night category */
async function fetchStreamingShows(key: string): Promise<Suggestion[]> {
  const data = await tmdbFetch<{ results: TmdbShow[] }>(
    '/tv/popular?language=en-US&page=1', key,
  );
  if (!data?.results) return [];

  const shows = data.results.slice(0, 8);

  // Fetch provider info for the first few shows (to add "on Netflix" context)
  const withProviders = await Promise.allSettled(
    shows.map(async (show) => {
      const providers = await tmdbFetch<TmdbProviderResult>(
        `/tv/${show.id}/watch/providers`, key,
      );
      const usProviders = providers?.results?.US;
      const services = [
        ...(usProviders?.flatrate ?? []),
        ...(usProviders?.free ?? []),
        ...(usProviders?.ads ?? []),
      ].slice(0, 2).map((p) => p.provider_name);
      return { show, services };
    }),
  );

  return withProviders
    .filter((r) => r.status === 'fulfilled')
    .map((r): Suggestion => {
      const { show, services } = (r as PromiseFulfilledResult<{ show: TmdbShow; services: string[] }>).value;
      const where = services.length ? ` -- streaming on ${services.join(', ')}` : '';
      return {
        id: `tmdb:tv:${show.id}`,
        name: show.name,
        category: 'Streaming Night',
        shortDescription: show.overview?.slice(0, 150) || `Popular series${where}. Queue it up and settle in.`,
        imageUrl: show.poster_path ? `${IMG_BASE}${show.poster_path}` : undefined,
        costTier: '$',
        dateFriendly: true,
        groupFriendly: false,
        durationMinutes: 150,
        ticketUrl: `https://www.themoviedb.org/tv/${show.id}`,
        source: 'tmdb',
        externalId: `tv:${show.id}`,
      };
    });
}

export async function fetchTmdb(categoryFilter?: string): Promise<Suggestion[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return [];

  const wantMovies = !categoryFilter || categoryFilter === 'All' || categoryFilter === 'Movies';
  const wantStreaming = !categoryFilter || categoryFilter === 'All' || categoryFilter === 'Streaming Night';

  const tasks: Promise<Suggestion[]>[] = [];
  if (wantMovies) tasks.push(fetchNowPlaying(key));
  if (wantStreaming) tasks.push(fetchStreamingShows(key));

  const results = await Promise.allSettled(tasks);
  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => (r as PromiseFulfilledResult<Suggestion[]>).value);
}
