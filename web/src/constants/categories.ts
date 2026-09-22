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
  /**
   * Legacy/internal suggestion-engine categories this maps to,
   * used for client-side filtering of suggestion results.
   */
  matches: string[];
}

export const CATEGORIES: Category[] = [
  { id: 'comedy',             name: 'Comedy',              emoji: '🎤', tagline: 'Stand-up, improv & open mic nights',      matches: ['Comedy'] },
  { id: 'concerts',           name: 'Concerts',            emoji: '🎸', tagline: 'Live shows, touring acts & local bands',  matches: ['Live Music'] },
  { id: 'couples-events',     name: 'Couples Events',      emoji: '💑', tagline: 'Date-worthy events built for two',        matches: [] },
  { id: 'family-events',      name: 'Family Events',       emoji: '👨‍👩‍👧', tagline: 'Fun for every age',                       matches: [] },
  { id: 'golf',               name: 'Golf',                emoji: '⛳', tagline: 'Courses, driving ranges & mini golf',     matches: ['Active'] },
  { id: 'hiking-trails',      name: 'Hiking Trails',       emoji: '🥾', tagline: 'Trails, parks & scenic walks',            matches: ['Outdoors'] },
  { id: 'hotel-stays',        name: 'Hotel Stays',         emoji: '🏨', tagline: 'Staycations & weekend getaways',          matches: [] },
  { id: 'local-experiences',  name: 'Local Experiences',   emoji: '📍', tagline: 'Escape rooms, trivia & hidden gems',      matches: ['Local Experience'] },
  { id: 'movies',             name: 'Movies',              emoji: '🎬', tagline: 'Now playing on the big screen',           matches: ['Movies'] },
  { id: 'netflix-shows',      name: 'Netflix Shows',       emoji: '📺', tagline: 'Stream a night in together',              matches: ['Streaming Night'] },
  { id: 'performing-arts',    name: 'Performing Arts',     emoji: '🎭', tagline: 'Theater, dance & live stage',             matches: ['Theater & Plays'] },
  { id: 'restaurants-dining', name: 'Restaurants & Dining', emoji: '🍽️', tagline: 'New spots & favorite tables',            matches: ['Dining'] },
  { id: 'volunteering',       name: 'Volunteering',        emoji: '🤝', tagline: 'Give back, together',                     matches: [] },
  { id: 'wellness-spa',       name: 'Wellness & Spa',      emoji: '💆', tagline: 'Massages, saunas & self-care',            matches: [] },
  { id: 'wine-drinks',        name: 'Wine & Drinks',       emoji: '🍷', tagline: 'Wineries, breweries & cocktail bars',     matches: ['Wine & Drinks'] },
];

/** The user-defined entry — always rendered LAST in pickers. */
export const CUSTOM_CATEGORY: Category = {
  id: 'custom',
  name: 'Custom',
  emoji: '✏️',
  tagline: 'Write your own idea',
  matches: [],
};

export const ALL_CATEGORIES: Category[] = [...CATEGORIES, CUSTOM_CATEGORY];
