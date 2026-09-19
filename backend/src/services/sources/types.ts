/**
 * Unified Suggestion schema — all sources normalize to this shape.
 */

export type SuggestionCategory =
  | 'Dining'
  | 'Live Music'
  | 'Comedy'
  | 'Theater & Plays'
  | 'Movies'
  | 'Streaming Night'
  | 'Outdoors'
  | 'Day Trip'
  | 'Wine & Drinks'
  | 'Arts & Culture'
  | 'Active'
  | 'Local Experience'
  | 'Unique & Quirky';

export type CostTier = 'free' | '$' | '$$' | '$$$';
export type SourceName =
  | 'ticketmaster'
  | 'foursquare'
  | 'nps'
  | 'tmdb'
  | 'eventbrite'
  | 'predicthq'
  | 'overpass'
  | 'seed'
  | 'scraped';

export interface Suggestion {
  id: string;                      // source:externalId
  name: string;
  category: SuggestionCategory;
  shortDescription: string;
  venue?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  date?: string;                   // ISO date for events
  timeStart?: string;              // e.g. "7:30 PM"
  price?: string;                  // human string e.g. "$15–$45"
  costTier: CostTier;
  imageUrl?: string;
  ticketUrl?: string;
  dateFriendly: boolean;
  groupFriendly: boolean;
  durationMinutes?: number;
  source: SourceName;
  externalId: string;
  expiresAt?: string;              // ISO — drives cache TTL for events
}

export interface SuggestionQuery {
  lat?: number;
  lng?: number;
  zip?: string;
  category?: SuggestionCategory | 'All';
  radiusMiles?: number;
  dateFilter?: 'tonight' | 'this-weekend' | 'this-week' | 'anytime';
}

/** Distance in miles between two lat/lng points (Haversine) */
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
