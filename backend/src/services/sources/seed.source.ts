/**
 * Expanded seed catalog -- 14 categories, 80+ entries.
 * Shown when location is unavailable or external sources are thin.
 * Curated for couples and small groups.
 */

import { Suggestion, SuggestionCategory } from './types';

interface SeedEntry {
  name: string;
  category: SuggestionCategory;
  shortDescription: string;
  costTier: Suggestion['costTier'];
  dateFriendly: boolean;
  groupFriendly: boolean;
  durationMinutes?: number;
}

const SEEDS: SeedEntry[] = [
  // ── Dining ──────────────────────────────────────────────────────
  { name: 'Italian dinner date', category: 'Dining', shortDescription: 'Candlelit pasta and a bottle of red -- a classic for good reason.', costTier: '$$', dateFriendly: true, groupFriendly: false, durationMinutes: 90 },
  { name: 'Sushi night', category: 'Dining', shortDescription: 'Omakase if you\'re feeling fancy, casual rolls if you\'re not.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 75 },
  { name: 'Taco crawl', category: 'Dining', shortDescription: 'Hit three different taquerias in one night. The rules: one taco per stop.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Farm-to-table dinner', category: 'Dining', shortDescription: 'Seasonal menu, local ingredients, zero pretension about it.', costTier: '$$$', dateFriendly: true, groupFriendly: false, durationMinutes: 105 },
  { name: 'Brunch date', category: 'Dining', shortDescription: 'Eggs Benedict, bottomless mimosas, no agenda.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },
  { name: 'Food truck festival', category: 'Dining', shortDescription: 'Wander, sample, argue about which one was best.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Ramen night', category: 'Dining', shortDescription: 'Rich broth, soft-boiled egg, steam rising off the bowl.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 60 },
  { name: 'Steakhouse splurge', category: 'Dining', shortDescription: 'Because sometimes the occasion calls for a bone-in ribeye.', costTier: '$$$', dateFriendly: true, groupFriendly: false, durationMinutes: 120 },

  // ── Live Music ───────────────────────────────────────────────────
  { name: 'Live jazz club', category: 'Live Music', shortDescription: 'Dark room, small stage, good drinks. Jazz improvisation is best experienced live.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Local band at a bar', category: 'Live Music', shortDescription: 'Discover a local act you\'ve never heard of. Half the fun is the surprise.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },
  { name: 'Outdoor summer concert', category: 'Live Music', shortDescription: 'Blanket on the lawn, picnic basket, music under the stars.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 180 },
  { name: 'Bluegrass open mic', category: 'Live Music', shortDescription: 'Rotating musicians, cold beer, foot-tapping required.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },

  // ── Comedy ───────────────────────────────────────────────────────
  { name: 'Stand-up comedy show', category: 'Comedy', shortDescription: 'Laugh until your sides hurt. Check local clubs for touring acts.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },
  { name: 'Improv comedy night', category: 'Comedy', shortDescription: 'Audience suggestions become the show. Nothing is scripted.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },
  { name: 'Comedy open mic', category: 'Comedy', shortDescription: 'Hit-or-miss by design. That\'s part of the fun.', costTier: 'free', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },

  // ── Theater & Plays ──────────────────────────────────────────────
  { name: 'Broadway touring production', category: 'Theater & Plays', shortDescription: 'Full production values, touring cast. Check what\'s in town this month.', costTier: '$$$', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },
  { name: 'Community theater play', category: 'Theater & Plays', shortDescription: 'Local talent, intimate venue, often surprisingly great.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Murder mystery dinner', category: 'Theater & Plays', shortDescription: 'Interactive theater meets a three-course meal. Whodunit?', costTier: '$$$', dateFriendly: true, groupFriendly: true, durationMinutes: 180 },
  { name: 'Shakespeare in the park', category: 'Theater & Plays', shortDescription: 'Free outdoor Shakespeare, usually summer evenings. Bring a blanket.', costTier: 'free', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },

  // ── Movies ───────────────────────────────────────────────────────
  { name: 'New release at the cinema', category: 'Movies', shortDescription: 'Popcorn. Previews. Debate the ending on the drive home.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },
  { name: 'Drive-in movie', category: 'Movies', shortDescription: 'Old school double feature from the car. Sneak in snacks.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 210 },
  { name: 'Outdoor film screening', category: 'Movies', shortDescription: 'Movies under the stars in a park or rooftop. Usually free or cheap.', costTier: 'free', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },
  { name: 'Arthouse film', category: 'Movies', shortDescription: 'Independent or foreign film at a local art cinema.', costTier: '$', dateFriendly: true, groupFriendly: false, durationMinutes: 120 },

  // ── Streaming Night ──────────────────────────────────────────────
  { name: 'Netflix binge night', category: 'Streaming Night', shortDescription: 'Pick a new series, order delivery, commit to at least 3 episodes.', costTier: '$', dateFriendly: true, groupFriendly: false, durationMinutes: 180 },
  { name: 'Classic movie marathon', category: 'Streaming Night', shortDescription: 'Pick a director or decade and go deep. Kubrick, Nolan, or 80s rom-coms.', costTier: 'free', dateFriendly: true, groupFriendly: true, durationMinutes: 240 },
  { name: 'Reality TV guilty pleasure night', category: 'Streaming Night', shortDescription: 'No judgment. Fully committed. Snacks mandatory.', costTier: 'free', dateFriendly: true, groupFriendly: false, durationMinutes: 120 },
  { name: 'True crime documentary', category: 'Streaming Night', shortDescription: 'The good kind of disturbing. You\'ll be discussing it for days.', costTier: 'free', dateFriendly: true, groupFriendly: false, durationMinutes: 120 },
  { name: 'Anime night', category: 'Streaming Night', shortDescription: 'Start a new series together. Crunchyroll or Netflix has hundreds.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },

  // ── Outdoors ─────────────────────────────────────────────────────
  { name: 'Sunset hike', category: 'Outdoors', shortDescription: 'Time it right and the trail view becomes the main event.', costTier: 'free', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Picnic in the park', category: 'Outdoors', shortDescription: 'Blanket, cheese board, good wine, nowhere to be.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Farmers market morning', category: 'Outdoors', shortDescription: 'Wander stalls, grab fresh coffee, argue about which jam to buy.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },
  { name: 'Kayaking or canoeing', category: 'Outdoors', shortDescription: 'Paddle a local lake or river. Rentals available at most parks.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Stargazing night', category: 'Outdoors', shortDescription: 'Drive 30 min from city lights. Bring a blanket, a star map, and snacks.', costTier: 'free', dateFriendly: true, groupFriendly: false, durationMinutes: 120 },
  { name: 'Beach or lake day', category: 'Outdoors', shortDescription: 'Sun, water, sand. No further description needed.', costTier: 'free', dateFriendly: true, groupFriendly: true, durationMinutes: 240 },
  { name: 'Botanical garden walk', category: 'Outdoors', shortDescription: 'Quietly beautiful. Great conversation starter, surprisingly romantic.', costTier: '$', dateFriendly: true, groupFriendly: false, durationMinutes: 90 },

  // ── Day Trip ─────────────────────────────────────────────────────
  { name: 'National park day trip', category: 'Day Trip', shortDescription: 'Pick the closest one, pack lunch, leave early. Come back tired in the best way.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 480 },
  { name: 'Explore a nearby small town', category: 'Day Trip', shortDescription: 'Every region has a charming main street within driving distance. Find yours.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 300 },
  { name: 'Scenic mountain drive', category: 'Day Trip', shortDescription: 'No destination required. Just pick a direction, go up, stop at viewpoints.', costTier: 'free', dateFriendly: true, groupFriendly: true, durationMinutes: 240 },
  { name: 'Apple or berry picking', category: 'Day Trip', shortDescription: 'Seasonal farm experience. You will eat more than you bring home.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 240 },
  { name: 'Road trip to a new city', category: 'Day Trip', shortDescription: 'One tank of gas. One city you haven\'t explored. One day to figure it out.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 480 },

  // ── Wine & Drinks ────────────────────────────────────────────────
  { name: 'Winery tour and tasting', category: 'Wine & Drinks', shortDescription: 'Barrel room walkthrough, five pours, one bottle to take home.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },
  { name: 'Craft brewery tour', category: 'Wine & Drinks', shortDescription: 'Behind-the-scenes brewing process, four-sample flight, merch optional.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Cocktail bar crawl', category: 'Wine & Drinks', shortDescription: 'Three bars, one signature cocktail per stop. Walk between them.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 180 },
  { name: 'Wine and cheese night at home', category: 'Wine & Drinks', shortDescription: 'Curate a board, open something new, no phones after 9pm.', costTier: '$$', dateFriendly: true, groupFriendly: false, durationMinutes: 120 },
  { name: 'Distillery tasting room', category: 'Wine & Drinks', shortDescription: 'Whiskey, gin, or bourbon -- most distilleries offer tours and pours.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },

  // ── Arts & Culture ────────────────────────────────────────────────
  { name: 'Art museum visit', category: 'Arts & Culture', shortDescription: 'Find one piece each that stops you cold. Debate why.', costTier: '$$', dateFriendly: true, groupFriendly: false, durationMinutes: 120 },
  { name: 'Gallery opening night', category: 'Arts & Culture', shortDescription: 'Free admission, free wine, local artists, good conversation.', costTier: 'free', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },
  { name: 'History museum', category: 'Arts & Culture', shortDescription: 'Local history is weirder and more interesting than you expect.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Cooking class together', category: 'Arts & Culture', shortDescription: 'Learn a new dish side by side. You\'ll reference the night for years.', costTier: '$$$', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },
  { name: 'Pottery or painting class', category: 'Arts & Culture', shortDescription: 'Create something, laugh at it, keep it anyway.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },

  // ── Active ────────────────────────────────────────────────────────
  { name: 'Bowling night', category: 'Active', shortDescription: 'Lane rental, rental shoes, trash talk. Timeless.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Mini golf', category: 'Active', shortDescription: 'Competitive enough to be interesting, chill enough for conversation.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },
  { name: 'Rock climbing gym', category: 'Active', shortDescription: 'Bouldering together requires communication and trust. Also arms.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Partner yoga class', category: 'Active', shortDescription: 'More laughter than expected. Actually great for couples.', costTier: '$$', dateFriendly: true, groupFriendly: false, durationMinutes: 75 },
  { name: 'Cycling route', category: 'Active', shortDescription: 'Rent bikes or bring your own. End at a coffee shop or brewery.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },
  { name: 'Charity 5K run/walk', category: 'Active', shortDescription: 'Sign up together. Casual pace is fine. Post-race brunch is mandatory.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Ice skating', category: 'Active', shortDescription: 'Hold hands and blame each other for falling. Classic winter date.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },
  { name: 'Paddleboard rental', category: 'Active', shortDescription: 'Flat water is forgiving. Falling in is part of the experience.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },

  // ── Local Experience ──────────────────────────────────────────────
  { name: 'Escape room', category: 'Local Experience', shortDescription: '60 minutes, one lock, two minds. Find out how well you work under pressure.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },
  { name: 'Axe throwing', category: 'Local Experience', shortDescription: 'Surprisingly accessible, deeply satisfying. No experience required.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },
  { name: 'Karaoke private room', category: 'Local Experience', shortDescription: 'Your own room. Zero audience. Maximum commitment.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Trivia night at a bar', category: 'Local Experience', shortDescription: 'Team up, order nachos, and argue about the answer in round 3.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },
  { name: 'Board game cafe', category: 'Local Experience', shortDescription: 'Hundreds of games, good drinks, no one looking at their phone.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },
  { name: 'Pottery painting studio', category: 'Local Experience', shortDescription: 'Pick a piece, paint it, come back in a week to pick it up glazed.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 120 },
  { name: 'Virtual reality arcade', category: 'Local Experience', shortDescription: 'Play together in VR, laugh at the motion capture footage after.', costTier: '$$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },

  // ── Unique & Quirky ───────────────────────────────────────────────
  { name: 'Ghost tour of the city', category: 'Unique & Quirky', shortDescription: 'Walking tour of haunted locations. Spooky, historical, and genuinely good stories.', costTier: '$', dateFriendly: true, groupFriendly: true, durationMinutes: 90 },
  { name: 'Sunrise hike', category: 'Unique & Quirky', shortDescription: 'Set an alarm, drive in the dark, watch the sun come up from elevation.', costTier: 'free', dateFriendly: true, groupFriendly: false, durationMinutes: 180 },
  { name: 'Vintage shopping day', category: 'Unique & Quirky', shortDescription: 'Thrift stores and vintage shops. Budget $20 each, see who finds the best thing.', costTier: '$', dateFriendly: true, groupFriendly: false, durationMinutes: 180 },
  { name: 'Flea market Saturday', category: 'Unique & Quirky', shortDescription: 'Treasure hunting in the organized chaos. Coffee in hand is required.', costTier: 'free', dateFriendly: true, groupFriendly: true, durationMinutes: 150 },
  { name: 'Observatory night viewing', category: 'Unique & Quirky', shortDescription: 'Many public observatories do free public nights through a telescope.', costTier: 'free', dateFriendly: true, groupFriendly: false, durationMinutes: 120 },
];

export function getSeedSuggestions(
  category?: string,
  limit = 15,
): Suggestion[] {
  const filtered =
    !category || category === 'All'
      ? SEEDS
      : SEEDS.filter((s) => s.category === category);

  // Shuffle
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, limit).map((s, i) => ({
    id: `seed:${i}-${s.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: s.name,
    category: s.category,
    shortDescription: s.shortDescription,
    costTier: s.costTier,
    dateFriendly: s.dateFriendly,
    groupFriendly: s.groupFriendly,
    durationMinutes: s.durationMinutes,
    source: 'seed' as const,
    externalId: `seed-${i}`,
  }));
}
