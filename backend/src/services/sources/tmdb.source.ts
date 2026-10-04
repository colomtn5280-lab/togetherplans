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
      attribution: 'Movie data © TMDB',
    };
  });
}

/** Netflix catalog via TMDB Discover → Streaming Night category
 *  Uses /discover/tv?watch_region=US&with_watch_providers=8 (Netflix provider ID)
 *  Also pulls Prime Video (9) and trending. Returns up to 40 shows with posters.
 */
async function fetchStreamingShows(key: string): Promise<Suggestion[]> {
  const [trendingData, netflixData, amazonData] = await Promise.all([
    tmdbFetch<{ results: TmdbShow[] }>('/trending/tv/week?language=en-US', key),
    tmdbFetch<{ results: TmdbShow[] }>(
      '/discover/tv?watch_region=US&with_watch_providers=8&sort_by=popularity.desc&page=1&language=en-US', key,
    ),
    tmdbFetch<{ results: TmdbShow[] }>(
      '/discover/tv?watch_region=US&with_watch_providers=9&sort_by=popularity.desc&page=1&language=en-US', key,
    ),
  ]);

  const tagged: Array<{ show: TmdbShow; service: string }> = [
    ...(netflixData?.results ?? []).slice(0, 20).map((s) => ({ show: s, service: 'Netflix' })),
    ...(amazonData?.results ?? []).slice(0, 10).map((s) => ({ show: s, service: 'Prime Video' })),
    ...(trendingData?.results ?? []).slice(0, 10).map((s) => ({ show: s, service: '' })),
  ];

  const seen = new Set<number>();
  const deduped = tagged.filter(({ show }) => {
    if (seen.has(show.id)) return false;
    seen.add(show.id);
    return true;
  });

  return deduped.slice(0, 40).map(({ show, service }): Suggestion => {
    const serviceStr = service ? ` — streaming on ${service}` : '';
    return {
      id: `tmdb:tv:${show.id}`,
      name: show.name,
      category: 'Streaming Night',
      shortDescription: (show.overview?.slice(0, 150) || `Popular series${serviceStr}. Queue it up and settle in.`) + (service ? ` (${service})` : ''),
      imageUrl: show.poster_path ? `${IMG_BASE}${show.poster_path}` : undefined,
      costTier: '$',
      dateFriendly: true,
      groupFriendly: false,
      durationMinutes: 150,
      ticketUrl: service === 'Netflix'
        ? `https://www.netflix.com/search?q=${encodeURIComponent(show.name)}`
        : `https://www.themoviedb.org/tv/${show.id}`,
      source: 'tmdb',
      externalId: `tv:${show.id}`,
      attribution: 'TV data © TMDB',
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

/**
 * Search TMDB for movies and TV shows by query string.
 * Used by the /api/suggestions/search endpoint for Netflix/Movies search.
 */
export async function searchTmdb(query: string): Promise<Suggestion[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key || !query.trim()) return [];

  try {
    const encodedQ = encodeURIComponent(query.trim());
    const data = await tmdbFetch<{
      results: Array<{
        id: number;
        media_type: 'movie' | 'tv' | 'person';
        title?: string;
        name?: string;
        overview?: string;
        poster_path?: string;
        release_date?: string;
        first_air_date?: string;
        vote_average?: number;
      }>;
    }>(`/search/multi?query=${encodedQ}&language=en-US&page=1`, key);

    if (!data?.results) return [];

    return data.results
      .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 20)
      .map((r): Suggestion => {
        const isMovie = r.media_type === 'movie';
        const name = r.title ?? r.name ?? 'Unknown';
        const score = r.vote_average ? ` — rated ${r.vote_average.toFixed(1)}/10` : '';
        return {
          id: `tmdb:${r.media_type}:${r.id}`,
          name,
          category: isMovie ? 'Movies' : 'Streaming Night',
          shortDescription: r.overview?.slice(0, 150) || `${isMovie ? 'Film' : 'TV Series'}${score}.`,
          imageUrl: r.poster_path ? `${IMG_BASE}${r.poster_path}` : undefined,
          costTier: '$',
          dateFriendly: true,
          groupFriendly: isMovie,
          durationMinutes: isMovie ? 130 : 150,
          ticketUrl: isMovie
            ? `https://www.themoviedb.org/movie/${r.id}`
            : `https://www.netflix.com/search?q=${encodeURIComponent(name)}`,
          source: 'tmdb',
          externalId: `${r.media_type}:${r.id}`,
          attribution: `${isMovie ? 'Movie' : 'TV'} data © TMDB`,
        };
      });
  } catch {
    return [];
  }
}
