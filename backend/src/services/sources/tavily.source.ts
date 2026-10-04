/**
 * Tavily Web Search source — universal fallback for all categories.
 *
 * Fires when primary API sources return fewer than FALLBACK_THRESHOLD results.
 * Also fires unconditionally for Volunteering (Mobilize is election-skewed).
 *
 * Returns results tagged isIdea:true so the frontend renders them in the
 * "Ideas to spark your plan" section with click-through links to the source.
 *
 * API key: TAVILY_API_KEY env var (plain env var, not Secret Manager).
 * Free tier: 1,000 credits/month. Basic search = 1 credit per call.
 * Pricing: https://docs.tavily.com/documentation/api-credits
 */

import { Suggestion, SuggestionCategory } from './types';
import { logger } from '@/services/logger';

const TAVILY_BASE = 'https://api.tavily.com';
const MAX_RESULTS = 8;
const TIMEOUT_MS = 6000;

// ---------------------------------------------------------------------------
// Per-category query templates + preferred domains to restrict/prefer
// ---------------------------------------------------------------------------
interface CategoryConfig {
  query: (city: string, state: string) => string;
  /** Domains to prefer (include_domains_mode: prefer) — not hard-restricted */
  domains?: string[];
  /** Always fire Tavily for this category regardless of primary result count */
  alwaysFire?: boolean;
}

const CATEGORY_CONFIG: Partial<Record<SuggestionCategory | string, CategoryConfig>> = {
  'Volunteering': {
    alwaysFire: true,
    query: (city, state) => `volunteer opportunities ${city} ${state} 2026 sign up`,
    domains: ['idealist.org', 'volunteermatch.org', 'createthegood.org', 'catchafire.org', 'justserve.org'],
  },
  'Outdoors': {
    alwaysFire: true,
    query: (city, state) => `hiking trails outdoor activities near ${city} ${state}`,
    domains: ['alltrails.com', 'hikingproject.com', 'traillink.com', 'recreation.gov'],
  },
  'Hotels': {
    query: (city, state) => `best hotels weekend getaway near ${city} ${state}`,
    domains: ['booking.com', 'hotels.com', 'tripadvisor.com', 'expedia.com'],
  },
  'Family': {
    query: (city, state) => `family friendly activities kids events ${city} ${state} 2026`,
    domains: ['eventbrite.com', 'tripadvisor.com', 'yelp.com', 'timeout.com'],
  },
  'Wellness': {
    query: (city, state) => `spa massage yoga wellness day spa ${city} ${state}`,
    domains: ['yelp.com', 'spafinder.com', 'mindbodyonline.com', 'tripadvisor.com'],
  },
  'Local Experience': {
    query: (city, state) => `unique local experiences things to do ${city} ${state}`,
    domains: ['viator.com', 'getyourguide.com', 'tripadvisor.com', 'yelp.com', 'timeout.com'],
  },
  'Wine & Drinks': {
    query: (city, state) => `wineries breweries cocktail bars tasting rooms near ${city} ${state}`,
    domains: ['yelp.com', 'tripadvisor.com', 'untappd.com', 'vivino.com'],
  },
  'Dining': {
    query: (city, state) => `best restaurants dining experiences ${city} ${state}`,
    domains: ['yelp.com', 'opentable.com', 'tripadvisor.com', 'eater.com'],
  },
  'Sports': {
    alwaysFire: false,
    query: (city, state) => `things to do sports activities near ${city} ${state} games venues`,
    domains: ['yelp.com', 'tripadvisor.com', 'timeout.com'],
  },
  'Comedy': {
    query: (city, state) => `comedy shows stand up improv nights ${city} ${state}`,
    domains: ['eventbrite.com', 'ticketmaster.com', 'yelp.com', 'timeout.com'],
  },
  'Live Music': {
    query: (city, state) => `live music concerts local venues ${city} ${state}`,
    domains: ['eventbrite.com', 'songkick.com', 'bandsintown.com', 'timeout.com'],
  },
  'Theater & Plays': {
    query: (city, state) => `theater shows plays musicals performing arts ${city} ${state}`,
    domains: ['eventbrite.com', 'ticketmaster.com', 'broadwayworld.com', 'timeout.com'],
  },
  'Arts & Culture': {
    query: (city, state) => `art galleries museums cultural events ${city} ${state}`,
    domains: ['tripadvisor.com', 'yelp.com', 'eventbrite.com', 'timeout.com'],
  },
};

// Fallback for unmapped categories
function getConfig(category: string): CategoryConfig {
  return CATEGORY_CONFIG[category] ?? {
    query: (city, state) => `${category} activities things to do ${city} ${state}`,
  };
}

// ---------------------------------------------------------------------------
// Tavily API response shape
// ---------------------------------------------------------------------------
interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
}

// ---------------------------------------------------------------------------
// Map a Tavily result URL to a source name label for the UI
// ---------------------------------------------------------------------------
function labelFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const labels: Record<string, string> = {
      'idealist.org': 'Idealist',
      'volunteermatch.org': 'VolunteerMatch',
      'createthegood.org': 'Create the Good',
      'catchafire.org': 'Catchafire',
      'justserve.org': 'JustServe',
      'alltrails.com': 'AllTrails',
      'hikingproject.com': 'Hiking Project',
      'booking.com': 'Booking.com',
      'hotels.com': 'Hotels.com',
      'tripadvisor.com': 'Tripadvisor',
      'expedia.com': 'Expedia',
      'eventbrite.com': 'Eventbrite',
      'yelp.com': 'Yelp',
      'timeout.com': 'Time Out',
      'spafinder.com': 'Spafinder',
      'viator.com': 'Viator',
      'getyourguide.com': 'GetYourGuide',
      'opentable.com': 'OpenTable',
      'eater.com': 'Eater',
      'songkick.com': 'Songkick',
      'bandsintown.com': 'Bandsintown',
      'broadwayworld.com': 'BroadwayWorld',
    };
    return labels[host] ?? host;
  } catch {
    return 'Web';
  }
}

// ---------------------------------------------------------------------------
// Main fetch function
// ---------------------------------------------------------------------------
export async function fetchTavilyFallback(
  category: string,
  city: string,
  state: string,
): Promise<Suggestion[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    logger.warn('Tavily: TAVILY_API_KEY not set, skipping');
    return [];
  }

  if (!city) {
    logger.warn('Tavily: no city provided, skipping');
    return [];
  }

  const config = getConfig(category);
  const query = config.query(city, state);

  logger.info(`Tavily fallback: "${query}"`);

  try {
    const body: Record<string, unknown> = {
      query,
      search_depth: 'basic',
      max_results: MAX_RESULTS,
      topic: 'general',
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      country: 'united states',
    };

    // Use prefer mode so results outside target domains can still surface
    if (config.domains?.length) {
      body.include_domains = config.domains;
      body.include_domains_mode = 'prefer';
    }

    const resp = await fetch(`${TAVILY_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      logger.warn('Tavily request failed', { status: resp.status, body: text.slice(0, 200), category });
      return [];
    }

    const data = await resp.json() as TavilyResponse;
    const results = data.results ?? [];

    if (!results.length) {
      logger.info(`Tavily: no results for "${query}"`);
      return [];
    }

    logger.info(`Tavily: ${results.length} results for ${category} near ${city}`);

    // Categories where Tavily results are real results (not just ideas)
    const NON_IDEA_CATEGORIES = new Set(['Outdoors', 'Hiking Trails', 'Sports', 'Family', 'Hotels']);
    const isIdea = !NON_IDEA_CATEGORIES.has(category);

    // Map to Suggestion shape — tagged as ideas with sourceUrl for click-through
    return results.map((r, i): Suggestion => {
      const sourceName = labelFromUrl(r.url);
      // Extract a short description from the content snippet
      const shortDesc = r.content
        ? r.content.replace(/\s+/g, ' ').trim().slice(0, 120)
        : `Found on ${sourceName}`;

      return {
        id: `tavily:${category.toLowerCase().replace(/\s+/g, '-')}:${i}`,
        name: r.title.replace(/\s*[-|].*$/, '').trim().slice(0, 80), // strip " - Site Name" suffix
        category: category as SuggestionCategory,
        shortDescription: shortDesc,
        costTier: '$$',
        dateFriendly: true,
        groupFriendly: true,
        durationMinutes: 120,
        source: 'tavily' as const,
        externalId: `tavily-${i}`,
        isIdea,
        ticketUrl: r.url,
        attribution: `Via ${sourceName}`,
      };
    });
  } catch (err) {
    logger.warn('Tavily error', {
      category,
      city,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

/**
 * Whether Tavily should always fire for this category regardless
 * of how many primary results were returned.
 */
export function tavilyAlwaysFires(category: string): boolean {
  return CATEGORY_CONFIG[category]?.alwaysFire === true;
}
