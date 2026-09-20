# DateNight — Activity Discovery Engine Strategy
# Generated: September 19, 2026

---

## THE CORE PROBLEM

The current suggestions system makes 3 API calls (Yelp, TMDB, Google Places), returns
plain text with no images, and covers maybe 20% of what couples actually want to do.
The goal is a rich, geographically-aware activity engine that covers the full spectrum:
dining, movies, live music, comedy, theater, hiking, day trips, wine tours, Netflix nights,
local experiences, arts performances, and more — all from a zip code or lat/lng.

---

## RECOMMENDED ARCHITECTURE: MULTI-SOURCE AGGREGATOR + LLM NORMALIZER

The key insight: no single API covers everything. The solution is to:

1. Pull from 6-8 sources simultaneously (mix of free APIs + selective scraping)
2. Normalize all results into a single unified Suggestion schema
3. Use an LLM (Claude Haiku — cheap) to categorize ambiguous results and enrich descriptions
4. Cache heavily per zip code (6-12 hours) to avoid repeated API calls
5. Serve results through the existing GET /api/suggestions endpoint

This gives you breadth without scraping everything, and keeps costs near zero.

---

## TIER 1: FREE APIs — NO COST, USE IMMEDIATELY

These require no payment, have generous free tiers, and cover most of the category map.

### 1. Ticketmaster Discovery API
  What it covers: Concerts, sports, comedy shows, theater, arts performances, festivals
  Coverage: US + Canada + international, lat/lng + zip code search
  Free tier: 5,000 calls/day — more than enough
  Key params: latlong, radius, classificationName (Music/Sports/Arts/Comedy/Theatre)
  Signup: developer.ticketmaster.com — instant approval, no review
  Response includes: event name, venue, date/time, ticket URL, image, genre, price range
  Category mapping: concerts → Live Music, comedy → Comedy, theatre → Theater/Plays,
                    arts → Arts & Culture, sports → Active

### 2. Foursquare Places API (FSQ)
  What it covers: Restaurants, bars, cafes, wineries, breweries, parks, gyms, museums,
                  spas, movie theaters, bowling alleys, escape rooms — 100M+ POIs globally
  Free tier: 10,000 calls/month
  Key params: ll (lat,lng), radius, categories (FSQ category IDs), near (city/zip)
  Signup: foursquare.com/developers — instant
  Response includes: name, address, lat/lng, category, hours, photos, rating, price tier
  Category mapping: dining, wine/drinks, outdoor activities, entertainment venues
  Note: This replaces Yelp for place search — better free tier, no restrictions

### 3. National Park Service API (api.nps.gov)
  What it covers: National parks, trails, campgrounds, visitor centers, events at parks
  Free tier: Completely free, just need an email for a key
  Signup: https://www.nps.gov/subjects/developer/get-started.htm — instant
  Key params: stateCode, q (keyword), limit
  Response includes: park name, description, activities, directions, images, entrance fees
  Category mapping: Hiking, Day Trips, Outdoors, Nature

### 4. TMDB (already have key)
  What it covers: Now-playing movies + streaming content
  Extend to: Use /movie/now_playing for cinema suggestions
             Use /tv/popular + /watch/providers for Netflix/streaming night ideas
  New endpoint: GET /tv/popular?watch_region=US returns trending shows by country
  Category mapping: Movies (theaters), Streaming Night (Netflix/Hulu/etc.)

### 5. OpenStreetMap Overpass API
  What it covers: Restaurants, parks, hiking trails, museums, theaters, wineries, breweries,
                  gyms, swimming pools, golf courses — all public OSM data
  Free tier: Completely free, no key, no account
  Endpoint: https://overpass-api.de/api/interpreter
  Key queries:
    - node["amenity"="restaurant"](around:10000,lat,lng) — restaurants
    - way["leisure"="park"](around:20000,lat,lng) — parks
    - way["route"="hiking"](around:30000,lat,lng) — hiking trails
    - node["amenity"="theatre"](around:15000,lat,lng) — theaters
    - node["craft"="winery"](around:30000,lat,lng) — wineries
    - node["craft"="brewery"](around:20000,lat,lng) — breweries
  Limitation: Data quality varies; rural areas can be sparse
  Category mapping: Outdoors, Dining, Arts/Culture, Wine & Drinks

### 6. Meetup GraphQL API
  What it covers: Local group events — hiking clubs, wine tastings, running groups,
                  book clubs, photography walks, couples activities, social events
  Free tier: OAuth-based but free for read queries
  Signup: meetup.com → developer access
  Key query: groupByUrlname or upcomingEvents(lat, lon, radius)
  Category mapping: Local Experiences, Active, Social, Day Trips

---

## TIER 2: EASY SIGNUPS (1-2 day turnaround)

### 7. Eventbrite Public API
  What it covers: Community events, food & drink tastings, art shows, comedy nights,
                  fitness events, concerts, festivals, yoga, cooking classes
  Free tier: Free for read access (searching public events)
  Signup: eventbrite.com/platform → create app
  Key params: location.latitude, location.longitude, location.within (radius in km),
              categories (food_drink, arts, music, film_media, sports_fitness, etc.)
  Response includes: event name, description, start/end time, venue, image, ticket URL, price
  Category mapping: Nearly all categories — excellent breadth

### 8. Songkick API
  What it covers: Concerts and music events globally
  Free tier: Available with application (respond within 1-2 days usually)
  Signup: https://www.songkick.com/developer/api-key-request
  Note: Ticketmaster already covers most of this — Songkick adds smaller venues and
        underground shows that TM doesn't list. Lower priority.

---

## TIER 3: WEB SCRAPING (for gaps no API fills)

### Legal Considerations
Scraping public web pages where no login is required is generally legal under:
  - hiQ Labs v. LinkedIn (9th Circuit, 2022): public data scraping is protected
  - Terms of service violations are civil contract issues, not criminal
  - Best practice: scrape sparingly, respect robots.txt, cache heavily, add delays

Scrape ONLY when:
  a) No API exists for the data
  b) The page is fully public (no login wall)
  c) You cache results so you're not hammering the site

### Scraping Targets

a) Local brewery/winery event pages
   - Many local breweries post events on their own websites (no API for this)
   - Strategy: Use Foursquare to find local breweries → scrape their /events page
   - Tool: Playwright (headless Chrome) or cheerio + axios for static pages
   - Frequency: Once per week per venue, cached

b) Comedy club schedules
   - Major chains (Laugh Factory, Improv, Comedy Cellar) have public schedules
   - Ticketmaster covers some but misses house shows and open mics
   - Strategy: Find venues via Foursquare (category: comedy club) → scrape schedule

c) Local theater company schedules
   - Community theater, small playhouses often not on TM/Eventbrite
   - Same strategy: venue discovery via FSQ → scrape schedule page

d) Running/walking events (5Ks, charity walks)
   - RunSignUp.com has a public search: runsignup.com/Race/Search?SearchString=&State=CO
   - Active.com has a public events search
   - These are fully public pages, easily scrapable

e) Netflix/Hulu/Disney+ trending shows
   - JustWatch's unofficial API (observe network calls from justwatch.com)
   - TMDB's /watch/providers already has this data — use that first
   - Reelgood.com has public streaming data

f) Day trip destinations (within 1-3 hour drive)
   - Google "day trips from [city]" → scrape travel blog top results
   - OR: use NPS API for national parks + state park directories
   - Atlas Obscura has a public search page for unique/quirky local spots

---

## THE LLM NORMALIZATION LAYER

This is the secret weapon that makes heterogeneous data actually useful.

Problem: Ticketmaster returns "Improv Jam Session at The Laugh Factory" — what category?
Solution: Pass it through Claude Haiku (cheap: ~$0.001 per result) to:
  1. Assign a category from the taxonomy
  2. Generate a short couple-friendly description if one is missing
  3. Estimate cost tier ($, $$, $$$) if not provided
  4. Flag as "date-friendly" or "group-friendly" or "both"
  5. Extract duration estimate if inferrable

Cost estimate: 1000 suggestions/day through Haiku = ~$1-2/day total
This is cheap enough to run on every cache miss.

Prompt template (backend, suggestions.service.ts):

  "You are categorizing local activities for a date night app.
   Given this activity: [name, description, venue, source]
   Return JSON:
   {
     category: one of [Dining, Live Music, Comedy, Theater/Plays, Movies,
               Streaming Night, Outdoors/Hiking, Day Trip, Wine & Drinks,
               Arts & Culture, Active/Sports, Local Experience, Unique/Quirky],
     dateFriendly: true/false,
     groupFriendly: true/false,
     costTier: 'free'|'$'|'$$'|'$$$',
     shortDescription: '1-2 sentence couple-focused description',
     durationMinutes: estimated number or null
   }"

---

## UNIFIED SUGGESTION SCHEMA

All sources normalized to this structure in the backend:

  interface Suggestion {
    id: string                    // source:externalId (e.g. "tm:G5diZ")
    name: string                  // activity/event name
    category: SuggestionCategory  // from taxonomy above
    shortDescription: string      // 1-2 sentences, LLM-generated if missing
    venue?: string                // venue/place name
    address?: string
    latitude?: number
    longitude?: number
    distanceMiles?: number        // calculated from user lat/lng
    date?: string                 // ISO date for events; null for permanent places
    timeStart?: string            // "7:30 PM"
    price?: string                // "Free" | "$15-$45" | "$$"
    costTier: 'free'|'$'|'$$'|'$$$'
    imageUrl?: string
    ticketUrl?: string            // booking/tickets link
    dateFriendly: boolean
    groupFriendly: boolean
    durationMinutes?: number
    source: SourceName            // 'ticketmaster'|'foursquare'|'nps'|'tmdb'|
                                  // 'eventbrite'|'overpass'|'scraped'
    externalId: string            // original ID from source
    expiresAt?: string            // for events; drives cache TTL
  }

---

## CATEGORY TAXONOMY (14 categories)

These map to filter tabs in the app UI:

  1. Dining              — restaurants, cafes, food tours, cooking classes
  2. Live Music          — concerts, open mics, jazz nights, festivals
  3. Comedy             — stand-up shows, improv, open mic comedy
  4. Theater & Plays    — musicals, plays, opera, community theater
  5. Movies             — now-playing films, drive-in, film festivals
  6. Streaming Night    — trending Netflix/Hulu/Disney+ shows to watch together
  7. Outdoors           — parks, hiking trails, walks, nature areas
  8. Day Trip           — national parks, scenic drives, nearby towns (1-3hr)
  9. Wine & Drinks      — wineries, breweries, cocktail bars, tastings
  10. Arts & Culture    — museums, galleries, art walks, exhibitions
  11. Active             — 5Ks, cycling, paddleboarding, yoga, gym classes
  12. Local Experience  — unique local things (escape rooms, pottery, cooking)
  13. Unique & Quirky   — Atlas Obscura style discoveries
  14. All               — unfiltered

---

## IMPLEMENTATION PLAN (phased)

### Phase 1 — This Week (Jarvis can build immediately, no new signups needed)

Step 1: Refactor suggestions.service.ts into a multi-source aggregator
  - Create sources/ directory: ticketmaster.source.ts, foursquare.source.ts,
    tmdb.source.ts, overpass.source.ts, nps.source.ts, seed.source.ts
  - Each source exports: fetchSuggestions(lat, lng, radiusMiles, categories[])
  - All return: RawSuggestion[] (source-specific shape)
  - Main service: calls all sources in parallel (Promise.allSettled), normalizes,
    deduplicates by name+lat/lng, sorts by distance

Step 2: Add LLM categorization for results missing a category
  - Call Claude Haiku API for results from scraped/OSM sources without categories
  - Cache categorization results (so same venue doesn't get re-categorized daily)

Step 3: Upgrade caching
  - Cache key: suggestions:{zipCode}:{category}:{radiusMiles}
  - TTL: 6 hours for events (they change), 24 hours for permanent places
  - Add a background refresh job so users never hit a cold cache

Step 4: Add zip-to-lat/lng conversion
  - Use free zipcodebase.com API (10,000 free calls/month) OR
  - Ship a static zip code database (100KB JSON) — faster and free forever
  - Users who don't share GPS can enter zip code instead

Step 5: Update the API endpoint
  - GET /api/suggestions?lat=&lng=&zip=&category=&radius=&date=
  - Support zip code as an alternative to lat/lng
  - Support category filter (comma-separated)
  - Support date filter for events (today, this-weekend, this-week, anytime)

### Phase 2 — Next Week (needs API key signups)

  - Sign up for Ticketmaster Discovery API (developer.ticketmaster.com — 10 min)
  - Sign up for Foursquare Places API (foursquare.com/developers — 10 min)
  - Sign up for NPS API (nps.gov — 5 min, email verification)
  - Sign up for Eventbrite API (eventbrite.com/platform — same day)
  - Wire each source into the aggregator
  - Add images (Foursquare + Ticketmaster both return image URLs)

### Phase 3 — Two Weeks Out (scraping layer)

  - Add Playwright-based scraper service for comedy clubs + local theater
  - Add RunSignUp scraper for walking/running events
  - Add Atlas Obscura scraper for unique/quirky category
  - Wire scraped results through LLM normalizer
  - Store scraped results in a venues cache table in Postgres (so we're not
    re-scraping the same venue every request)

### Phase 4 — Polish

  - Learn from user votes: if a category gets consistently voted for in a group,
    weight it higher in suggestions for that group
  - Time-of-day awareness: morning → outdoor/brunch, evening → dining/events
  - Weather API integration (Open-Meteo — completely free): surface outdoor
    suggestions only when weather is good, pivot to indoor when rainy

---

## WHAT THIS COSTS (ongoing)

  Ticketmaster Discovery API:  Free (5000 calls/day)
  Foursquare Places:           Free (10,000 calls/month)
  NPS API:                     Free (unlimited with key)
  OpenStreetMap Overpass:      Free (no limits, be respectful)
  TMDB:                        Free (already have key)
  Eventbrite:                  Free for read access
  Claude Haiku (LLM):          ~$1-3/month at current traffic levels
  Open-Meteo (weather):        Free

  Total additional monthly cost: ~$2-5/month

---

## HOW IT LOOKS IN THE APP

Mobile Discover tab (upgraded):
  - Category filter bar: All | Dining | Live Music | Outdoors | Movies | Wine | More...
  - Date filter: Tonight | This Weekend | This Week | Anytime
  - Distance filter: 5mi | 15mi | 30mi | Day Trip (60mi)
  - Cards now have: image, name, category badge, distance, date (for events),
    price tier dots ($$$), "Add to Proposal" button
  - Pull to refresh triggers a new fetch for tonight's events

Web Suggestions page (upgraded):
  - Same filter bar, grid layout on desktop
  - Clicking a suggestion opens a detail modal with full description, map pin,
    ticket link, and "Add to Group Proposal" button

---

## IMMEDIATE NEXT STEPS FOR JAKE

1. Sign up for these 4 APIs (takes 30 min total, all instant or same-day):
   a. Ticketmaster: developer.ticketmaster.com/member/register
   b. Foursquare: foursquare.com/developers/signup
   c. NPS: nps.gov/subjects/developer/get-started.htm
   d. Eventbrite: eventbrite.com/platform/api#contact-us

2. Send Jarvis the 4 API keys → Jarvis wires them in and deploys Phase 1+2
   (Phase 1 uses only free/keyless sources and can start NOW without any new keys)

3. Decide on search radius default: 15 miles? 25 miles? Day trips at 60 miles?

4. Confirm the category list above matches your vision, or add/remove categories

---

## JARVIS START NOW (no new keys needed)

Phase 1 can begin immediately using:
  - OpenStreetMap Overpass (no key)
  - NPS API (email signup, instant key)
  - TMDB streaming shows (already have key)
  - Upgraded seed catalog (hand-curated, enriched)
  - LLM categorization via Claude Haiku (already have Anthropic access)

Say the word and Jarvis starts building.
