/**
 * Unified 15-category system (+ Custom) — duplicated from
 * backend/src/constants/categories.ts (no shared package). Keep in sync.
 */

export interface Category {
  /** Stable slug id */
  id: string;
  /** Display name — stored on proposal option.category */
  name: string;
  emoji: string;
  tagline: string;
  /** Pastel tint used for card fallbacks & thumbnails. */
  color: string;
  /**
   * Legacy/internal suggestion-engine categories this maps to,
   * used for client-side filtering of suggestion results.
   */
  matches: string[];
}

export const CATEGORIES: Category[] = [
  { id: 'comedy',             name: 'Comedy',              emoji: '🎤', tagline: 'Stand-up, improv & open mic nights',      color: '#FEF9C3', matches: ['Comedy'] },
  { id: 'concerts',           name: 'Concerts',            emoji: '🎸', tagline: 'Live shows, touring acts & local bands',  color: '#EBD5FB', matches: ['Live Music'] },
  { id: 'family-events',      name: 'Family Activities',   emoji: '👨‍👩‍👧', tagline: 'Fun for the whole family',                color: '#D5EFD5', matches: ['Family'] },
  { id: 'sports-active',      name: 'Sports & Active',     emoji: '🏟️', tagline: 'Games to watch, games to play',           color: '#FFE0B2', matches: ['Sports'] },
  { id: 'hiking-trails',      name: 'Hiking Trails',       emoji: '🥾', tagline: 'Trails, parks & scenic walks',            color: '#D4EDDA', matches: ['Outdoors'] },
  { id: 'hotel-stays',        name: 'Hotel Stays',         emoji: '🏨', tagline: 'Staycations & weekend getaways',          color: '#CFE3FB', matches: [] },
  { id: 'local-experiences',  name: 'Local Experiences',   emoji: '📍', tagline: 'Escape rooms, trivia & hidden gems',      color: '#FFE8D1', matches: ['Local Experience'] },
  { id: 'movies',             name: 'Movies',              emoji: '🎬', tagline: 'Now playing on the big screen',           color: '#D5E8FD', matches: ['Movies'] },
  { id: 'netflix-shows',      name: 'Movie Night',         emoji: '📺', tagline: 'Vote on a movie or show to stream together', color: '#E2E8F0', matches: ['Streaming Night'] },
  { id: 'performing-arts',    name: 'Performing Arts',     emoji: '🎭', tagline: 'Theater, dance & live stage',             color: '#F3D9FA', matches: ['Theater & Plays'] },
  { id: 'restaurants-dining', name: 'Restaurants & Dining', emoji: '🍽️', tagline: 'New spots & favorite tables',            color: '#FDEBD0', matches: ['Dining'] },
  { id: 'volunteering',       name: 'Volunteering',        emoji: '🤝', tagline: 'Give back, together',                     color: '#D0F4E4', matches: [] },
  { id: 'wellness-spa',       name: 'Wellness & Spa',      emoji: '💆', tagline: 'Massages, saunas & self-care',            color: '#D0F4F1', matches: [] },
  { id: 'wine-drinks',        name: 'Bars & Nightlife',    emoji: '🍷', tagline: 'Bars, breweries, wineries & cocktail lounges', color: '#F5D9DE', matches: ['Wine & Drinks'] },
];

/** The user-defined entry — always rendered LAST in pickers. */
export const CUSTOM_CATEGORY: Category = {
  id: 'custom',
  name: 'Custom',
  emoji: '✏️',
  tagline: 'Write your own idea',
  color: '#F0F0F0',
  matches: [],
};

export const ALL_CATEGORIES: Category[] = [...CATEGORIES, CUSTOM_CATEGORY];

/**
 * Legacy aliases → current category id. Old stored proposal options and
 * shipped clients may still carry the retired 'golf'/'Golf' category.
 */
const LEGACY_ALIASES: Record<string, string> = {
  'golf': 'sports-active',
  'Golf': 'sports-active',
};

/**
 * Resolve a category's tint color by slug id OR display name
 * (stored proposal options carry display names). Grey fallback.
 */
export function getCategoryColorById(category?: string): string {
  if (!category) return '#F0F0F0';
  const key = LEGACY_ALIASES[category] ?? category;
  const cat = ALL_CATEGORIES.find((c) => c.id === key || c.name === key);
  return cat?.color ?? '#F0F0F0';
}
