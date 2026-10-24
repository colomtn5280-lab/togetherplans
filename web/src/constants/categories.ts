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
  /** Soft pastel background color used for card image fallbacks & chips. */
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
  { id: 'couples-events',     name: 'Couples Events',      emoji: '💑', tagline: 'Date-worthy events built for two',        color: '#FCE4EC', matches: ['Couples'] },
  { id: 'family-events',      name: 'Family Activities',   emoji: '👨‍👩‍👧', tagline: 'Fun for the whole family',                color: '#D5EFD5', matches: ['Family'] },
  { id: 'sports-active',      name: 'Sports & Active',     emoji: '🏟️', tagline: 'Games to watch, games to play',           color: '#FFE0B2', matches: ['Sports', 'Active'] },
  { id: 'hiking-trails',      name: 'Hiking Trails',       emoji: '🥾', tagline: 'Trails, parks & scenic walks',            color: '#D4EDDA', matches: ['Outdoors'] },
  { id: 'hotel-stays',        name: 'Hotel Stays',         emoji: '🏨', tagline: 'Staycations & weekend getaways',          color: '#CFE3FB', matches: ['Hotels'] },
  { id: 'local-experiences',  name: 'Local Experiences',   emoji: '📍', tagline: 'Escape rooms, trivia & hidden gems',      color: '#FFE8D1', matches: ['Local Experience'] },
  { id: 'movies',             name: 'Movies',              emoji: '🎬', tagline: 'Now playing on the big screen',           color: '#D5E8FD', matches: ['Movies'] },
  { id: 'netflix-shows',      name: 'Movie Night',         emoji: '📺', tagline: 'Vote on a movie or show to stream together', color: '#E2E8F0', matches: ['Streaming Night'] },
  { id: 'performing-arts',    name: 'Performing Arts',     emoji: '🎭', tagline: 'Theater, dance & live stage',             color: '#F3D9FA', matches: ['Theater & Plays'] },
  { id: 'restaurants-dining', name: 'Restaurants & Dining', emoji: '🍽️', tagline: 'New spots & favorite tables',            color: '#FDEBD0', matches: ['Dining'] },
  { id: 'volunteering',       name: 'Volunteering',        emoji: '🤝', tagline: 'Give back, together',                     color: '#D0F4E4', matches: ['Volunteering'] },
  { id: 'wellness-spa',       name: 'Wellness & Spa',      emoji: '💆', tagline: 'Massages, saunas & self-care',            color: '#D0F4F1', matches: ['Wellness'] },
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
 * Find a category by slug id OR display name (option.category stores the
 * display name; suggestion results may carry either, or a legacy internal
 * category name listed in `matches`).
 */
export function findCategory(idOrName: string | undefined | null): Category | undefined {
  if (!idOrName) return undefined;
  const key = LEGACY_ALIASES[idOrName] ?? idOrName;
  return ALL_CATEGORIES.find(
    (c) => c.id === key || c.name === key || c.matches.includes(key),
  );
}
