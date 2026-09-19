/**
 * Eventbrite API source.
 * Free tier: Generous rate limits. Covers classes, workshops, festivals,
 * arts events, food & drink, fitness, community events, and more.
 * Auth: EVENTBRITE_PRIVATE_TOKEN env var (Bearer token in header).
 * Docs: https://www.eventbrite.com/platform/api
 */

import { Suggestion, SuggestionCategory, haversineMiles } from './types';

const EB_BASE = 'https://www.eventbriteapi.com/v3';

// ---------------------------------------------------------------------------
// Eventbrite response types
// ---------------------------------------------------------------------------
interface EbMultilingualText {
  text?: string;
  html?: string;
}

interface EbEvent {
  id: string;
  name: EbMultilingualText;
  description?: EbMultilingualText;
  url?: string;
  logo?: { url?: string; original?: { url?: string } };
  start?: { local?: string; utc?: string };
  end?: { local?: string };
  is_free?: boolean;
  capacity?: number;
  category_id?: string;
  subcategory_id?: string;
  format_id?: string;
  venue?: EbVenue;
  ticket_availability?: {
    minimum_ticket_price?: { display?: string; value?: number };
    maximum_ticket_price?: { display?: string; value?: number };
  };
}

interface EbVenue {
  id?: string;
  name?: string;
  address?: {
    address_1?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    latitude?: string;
    longitude?: string;
  };
}

interface EbResponse {
  events?: EbEvent[];
  pagination?: { has_more_items?: boolean; page_count?: number };
}

// ---------------------------------------------------------------------------
// Category mapping — Eventbrite category_id → our SuggestionCategory
// ---------------------------------------------------------------------------
const EB_CATEGORY_MAP: Record<string, SuggestionCategory> = {
  '103': 'Live Music',       // Music
  '110': 'Dining',           // Food & Drink
  '113': 'Local Experience', // Community & Culture
  '105': 'Arts & Culture',   // Performing & Visual Arts
  '104': 'Movies',           // Film, Media & Entertainment
  '108': 'Active',           // Sports & Fitness
  '107': 'Active',           // Health & Wellness
  '111': 'Outdoors',         // Travel & Outdoor
  '112': 'Local Experience', // Charity & Causes
  '116': 'Local Experience', // Science & Tech
  '102': 'Local Experience', // Business & Professional (talks, networking)
  '101': 'Unique & Quirky',  // Hobbies & Special Interest
  '109': 'Unique & Quirky',  // Home & Lifestyle
  '117': 'Arts & Culture',   // Fashion & Beauty
  '115': 'Unique & Quirky',  // Family & Education
  '100': 'Unique & Quirky',  // Auto, Boat & Air
  '106': 'Local Experience', // Government & Politics
  '114': 'Unique & Quirky',  // Spirituality
  '119': 'Unique & Quirky',  // School Activities
};

// Fallback: keyword scan of name/description
function classifyByKeywords(name: string, desc: string): SuggestionCategory {
  const text = `${name} ${desc}`.toLowerCase();
  if (/comedy|stand.?up|improv|laugh/i.test(text)) return 'Comedy';
  if (/wine|cocktail|beer|brew|tasting|distillery/i.test(text)) return 'Wine & Drinks';
  if (/theater|theatre|play|musical|opera|ballet|dance performance/i.test(text)) return 'Theater & Plays';
  if (/hike|hiking|trail|outdoor|camping|kayak|canoe|paddle|climb/i.test(text)) return 'Outdoors';
  if (/cooking|baking|dinner|culinary|food|brunch/i.test(text)) return 'Dining';
  if (/yoga|fitness|run|5k|marathon|race|cycling|spin/i.test(text)) return 'Active';
  if (/art|gallery|exhibit|museum|craft|paint|pottery|sculpt/i.test(text)) return 'Arts & Culture';
  if (/concert|live music|band|festival|dj|open mic/i.test(text)) return 'Live Music';
  if (/film|movie|screening|cinema/i.test(text)) return 'Movies';
  if (/trivia|escape room|game|karaoke|bingo/i.test(text)) return 'Unique & Quirky';
  return 'Local Experience';
}

function classify(ev: EbEvent): SuggestionCategory {
  const mapped = ev.category_id ? EB_CATEGORY_MAP[ev.category_id] : undefined;
  // Trust the mapped category unless it's too generic, then keyword-refine
  if (mapped && mapped !== 'Local Experience') return mapped;
  const name = ev.name?.text ?? '';
  const desc = ev.description?.text ?? '';
  return classifyByKeywords(name, desc);
}

// ---------------------------------------------------------------------------
// Price helpers
// ---------------------------------------------------------------------------
function formatPrice(ev: EbEvent): { price?: string; costTier: Suggestion['costTier'] } {
  if (ev.is_free) return { price: 'Free', costTier: 'free' };
  const min = ev.ticket_availability?.minimum_ticket_price?.value;
  const max = ev.ticket_availability?.maximum_ticket_price?.value;
  const minDisplay = ev.ticket_availability?.minimum_ticket_price?.display;
  const maxDisplay = ev.ticket_availability?.maximum_ticket_price?.display;
  if (!min && min !== 0) return { costTier: '$$' };
  const price = max && max !== min ? `${minDisplay}–${maxDisplay}` : minDisplay ?? `$${min}`;
  const costTier: Suggestion['costTier'] =
    min === 0 ? 'free' : min < 20 ? '$' : min < 60 ? '$$' : '$$$';
  return { price, costTier };
}

// ---------------------------------------------------------------------------
// Category filter — skip Eventbrite for purely venue-based categories
// ---------------------------------------------------------------------------
const SKIP_CATEGORIES = new Set<string>(['Dining', 'Wine & Drinks', 'Movies', 'Streaming Night']);

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function fetchEventbrite(
  lat: number,
  lng: number,
  radiusMiles: number,
  categoryFilter?: string,
): Promise<Suggestion[]> {
  const token = process.env.EVENTBRITE_PRIVATE_TOKEN;
  if (!token) return [];

  // Eventbrite excels at events, not places — skip venue-type-only filters
  if (categoryFilter && SKIP_CATEGORIES.has(categoryFilter)) return [];

  try {
    const url = new URL(`${EB_BASE}/events/search/`);
    url.searchParams.set('location.latitude', String(lat));
    url.searchParams.set('location.longitude', String(lng));
    url.searchParams.set('location.within', `${Math.round(radiusMiles)}mi`);
    url.searchParams.set('expand', 'venue,ticket_availability');
    url.searchParams.set('page_size', '50');
    url.searchParams.set('sort_by', 'date');
    url.searchParams.set('start_date.keyword', 'current_future');
    // Only published, available events
    url.searchParams.set('status', 'live');

    // Map our category to Eventbrite category_id
    if (categoryFilter && categoryFilter !== 'All') {
      const catIdMap: Record<string, string> = {
        'Live Music': '103',
        'Comedy': '103',        // comedy is often under Music; keyword filter catches the rest
        'Arts & Culture': '105',
        'Theater & Plays': '105',
        'Active': '108',
        'Outdoors': '111',
        'Local Experience': '113',
        'Unique & Quirky': '101',
      };
      const catId = catIdMap[categoryFilter];
      if (catId) url.searchParams.set('categories', catId);
    }

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      // Log the error for diagnostics without crashing
      const body = await resp.text().catch(() => '');
      console.error(`[Eventbrite] HTTP ${resp.status}: ${body.slice(0, 200)}`);
      return [];
    }

    const data = (await resp.json()) as EbResponse;
    const events = data.events ?? [];

    const results: Suggestion[] = [];

    for (const ev of events) {
      const name = ev.name?.text?.trim();
      if (!name) continue;

      const venue = ev.venue;
      const addr = venue?.address;
      const vLat = addr?.latitude ? parseFloat(addr.latitude) : undefined;
      const vLng = addr?.longitude ? parseFloat(addr.longitude) : undefined;
      const dist = vLat && vLng ? haversineMiles(lat, lng, vLat, vLng) : undefined;

      const address = [addr?.address_1, addr?.city, addr?.region]
        .filter(Boolean)
        .join(', ');

      const localStart = ev.start?.local; // "2026-09-22T19:30:00"
      const dateStr = localStart ? localStart.split('T')[0] : undefined;
      const timeRaw = localStart ? localStart.split('T')[1] : undefined;
      const timeFormatted = timeRaw
        ? new Date(`2000-01-01T${timeRaw}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })
        : undefined;

      const category = classify(ev);
      const { price, costTier } = formatPrice(ev);

      const descParts = [
        ev.description?.text?.replace(/\s+/g, ' ').slice(0, 120),
      ].filter(Boolean);

      const shortDescription =
        descParts[0] ??
        `${category} event${venue?.name ? ` at ${venue.name}` : ''}${addr?.city ? ` in ${addr.city}` : ''}.`;

      results.push({
        id: `eb:${ev.id}`,
        name,
        category,
        shortDescription: shortDescription.slice(0, 200),
        venue: venue?.name,
        address: address || undefined,
        latitude: vLat,
        longitude: vLng,
        distanceMiles: dist !== undefined ? Math.round(dist * 10) / 10 : undefined,
        date: dateStr,
        timeStart: timeFormatted,
        price,
        costTier,
        imageUrl: ev.logo?.original?.url ?? ev.logo?.url,
        ticketUrl: ev.url,
        dateFriendly: true,
        groupFriendly: true,
        durationMinutes: 120,
        source: 'eventbrite',
        externalId: ev.id,
        expiresAt: dateStr ? `${dateStr}T23:59:59` : undefined,
      });
    }

    return results;
  } catch (err) {
    console.error('[Eventbrite] fetch error:', err);
    return [];
  }
}
