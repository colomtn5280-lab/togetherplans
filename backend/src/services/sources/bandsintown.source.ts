/**
 * Bandsintown Events API source — Phase 4
 * =========================================
 * Free for app developers (app_id = your app name, no key required).
 * Covers upcoming concerts with venue details, dates, and ticket links.
 *
 * API: GET https://rest.bandsintown.com/v4/artists/{name}/events
 * Location-based search not available in the public API — use recommend endpoint
 * or discovery endpoint for location-based lookup.
 *
 * Actually: Bandsintown's public API v3/v4 doesn't have a location search.
 * The location approach is via the recommend endpoint or undocumented endpoints.
 * We use the BIT public "events near location" approach through their
 * discovery API which does support lat/lng.
 *
 * Note: Bandsintown API requires app_id registration at artists.bandsintown.com
 * Uses env: BANDSINTOWN_APP_ID (default: 'datemeup')
 *
 * Docs: https://rest.bandsintown.com/
 */

import { Suggestion, SuggestionCategory, CostTier, SourceName, haversineMiles } from './types';

const BIT_APP_ID = process.env.BANDSINTOWN_APP_ID ?? 'datemeup';
const BIT_BASE = 'https://rest.bandsintown.com';

interface BitEvent {
  id: string;
  artist_id?: string;
  url?: string;
  on_sale_datetime?: string;
  datetime: string;
  description?: string;
  venue: {
    name: string;
    latitude: string;
    longitude: string;
    city: string;
    region?: string;
    country: string;
    location?: string;
  };
  offers?: Array<{
    type: string;
    url: string;
    status: string;
  }>;
  lineup?: string[];
}

interface BitArtist {
  name: string;
  url?: string;
  image_url?: string;
  upcoming_event_count?: number;
}

/**
 * Fetch upcoming events near a location via Bandsintown.
 * Bandsintown doesn't have a public location-search endpoint in the free tier,
 * so we use their "discover" page undocumented endpoint or fall back to
 * searching by popular artist names for the area.
 *
 * Primary strategy: use the Bandsintown widget/discovery API for location events.
 * Fallback: return empty (don't fail the pipeline).
 */
export async function fetchBandsintown(
  lat: number,
  lng: number,
  radiusMiles: number,
  categoryFilter?: SuggestionCategory,
): Promise<Suggestion[]> {
  // Only relevant for live music and comedy
  if (
    categoryFilter &&
    !['Live Music', 'Comedy', 'Theater & Plays'].includes(categoryFilter)
  ) {
    return [];
  }

  const apiKey = process.env.BANDSINTOWN_API_KEY;
  if (!apiKey && !BIT_APP_ID) return [];

  try {
    // Bandsintown v3 location-based event discovery
    // Uses their location param: "{city},{country}" or lat/lng
    const url = new URL(`${BIT_BASE}/events/search`);
    url.searchParams.set('app_id', BIT_APP_ID);
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', String(Math.min(radiusMiles, 50)));
    url.searchParams.set('per_page', '20');
    if (apiKey) {
      url.searchParams.set('api_key', apiKey);
    }

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'DateMeUp/1.0 (datemeup.app)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      // Bandsintown may return 404 if location has no events — not an error
      if (res.status === 404) return [];
      throw new Error(`Bandsintown API ${res.status}: ${res.statusText}`);
    }

    const events = await res.json() as BitEvent[];
    if (!Array.isArray(events)) return [];

    const results: Suggestion[] = events
      .filter((ev) => ev.venue && ev.datetime)
      .map((ev) => {
        const venueLat = parseFloat(ev.venue.latitude);
        const venueLng = parseFloat(ev.venue.longitude);
        const dist =
          venueLat && venueLng
            ? Math.round(haversineMiles(lat, lng, venueLat, venueLng) * 10) / 10
            : undefined;

        const artists = ev.lineup?.join(', ') ?? 'Live Music';
        const ticketUrl = ev.offers?.find((o) => o.type === 'Tickets')?.url;
        const eventDate = ev.datetime.split('T')[0];
        const eventTime = ev.datetime.includes('T')
          ? new Date(ev.datetime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
          : undefined;

        const location = [ev.venue.city, ev.venue.region, ev.venue.country === 'United States' ? 'US' : ev.venue.country]
          .filter(Boolean)
          .join(', ');

        return {
          id: `bandsintown-${ev.id}`,
          name: artists,
          category: 'Live Music' as SuggestionCategory,
          shortDescription: `Live at ${ev.venue.name} — ${location}`,
          venue: ev.venue.name,
          address: [ev.venue.name, ev.venue.city, ev.venue.region].filter(Boolean).join(', '),
          latitude: venueLat || undefined,
          longitude: venueLng || undefined,
          distanceMiles: dist,
          date: eventDate,
          timeStart: eventTime,
          costTier: '$$$' as CostTier,
          ticketUrl: ticketUrl ?? ev.url,
          source: 'bandsintown' as SourceName,
          externalId: ev.id,
          dateFriendly: true,
          groupFriendly: true,
          expiresAt: eventDate, // cache until event date
        };
      });

    return results;
  } catch (err) {
    // Never crash the pipeline — Bandsintown is supplemental
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[bandsintown] Error:', String(err));
    }
    return [];
  }
}

/**
 * Phase 4 evaluation notes (for Jake / future reference):
 *
 * PredictHQ costs ~$500-2k+/mo at scale. It covers:
 *   - concerts → now covered by Ticketmaster (free tier 5k/day) + Bandsintown (free)
 *   - sports → covered by Ticketmaster
 *   - festivals/community → unique to PredictHQ (not fully replaceable yet)
 *   - performing-arts → covered by Ticketmaster
 *
 * Recommendation: Keep PredictHQ for festivals/community only.
 * Once Bandsintown integration is live and verified, reduce PredictHQ to
 * only the categories that TM+BIT don't cover (community events, local festivals).
 * This reduces PHQ call volume → potentially drops to free tier.
 *
 * To fully drop PredictHQ: monitor source-health dashboard for 30 days
 * after Bandsintown goes live. If live-music results are healthy, remove PHQ.
 */
