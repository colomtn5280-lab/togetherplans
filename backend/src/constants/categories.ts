/**
 * Unified 15-category system (+ Custom) shared across backend, mobile, web.
 * Duplicated in mobile/src/constants/categories.ts and web/src/constants/categories.ts
 * — keep all three in sync.
 */

export interface Category {
  /** Stable slug id — safe for URLs, query params, storage. */
  id: string;
  /** Display name shown in UI and stored on proposal options. */
  name: string;
  emoji: string;
  tagline: string;
}

export const CATEGORIES: Category[] = [
  { id: 'comedy',             name: 'Comedy',              emoji: '🎤', tagline: 'Stand-up, improv & open mic nights' },
  { id: 'concerts',           name: 'Concerts',            emoji: '🎸', tagline: 'Live shows, touring acts & local bands' },
  { id: 'couples-events',     name: 'Couples Events',      emoji: '💑', tagline: 'Date-worthy events built for two' },
  { id: 'family-events',      name: 'Family Events',       emoji: '👨‍👩‍👧', tagline: 'Fun for every age' },
  { id: 'sports-active',      name: 'Sports & Active',     emoji: '🏟️', tagline: 'Games to watch, games to play' },
  { id: 'hiking-trails',      name: 'Hiking Trails',       emoji: '🥾', tagline: 'Trails, parks & scenic walks' },
  { id: 'hotel-stays',        name: 'Hotel Stays',         emoji: '🏨', tagline: 'Staycations & weekend getaways' },
  { id: 'local-experiences',  name: 'Local Experiences',   emoji: '📍', tagline: 'Escape rooms, trivia & hidden gems' },
  { id: 'movies',             name: 'Movies',              emoji: '🎬', tagline: 'Now playing on the big screen' },
  { id: 'netflix-shows',      name: 'Netflix Shows',       emoji: '📺', tagline: 'Stream a night in together' },
  { id: 'performing-arts',    name: 'Performing Arts',     emoji: '🎭', tagline: 'Theater, dance & live stage' },
  { id: 'restaurants-dining', name: 'Restaurants & Dining', emoji: '🍽️', tagline: 'New spots & favorite tables' },
  { id: 'volunteering',       name: 'Volunteering',        emoji: '🤝', tagline: 'Give back, together' },
  { id: 'wellness-spa',       name: 'Wellness & Spa',      emoji: '💆', tagline: 'Massages, saunas & self-care' },
  { id: 'wine-drinks',        name: 'Wine & Drinks',       emoji: '🍷', tagline: 'Wineries, breweries & cocktail bars' },
];

/** The user-defined entry — always rendered LAST in pickers. */
export const CUSTOM_CATEGORY: Category = {
  id: 'custom',
  name: 'Custom',
  emoji: '✏️',
  tagline: 'Write your own idea',
};

export const ALL_CATEGORIES: Category[] = [...CATEGORIES, CUSTOM_CATEGORY];
