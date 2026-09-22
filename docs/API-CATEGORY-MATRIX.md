# 📊 DateNight / TogetherPlans — API Category Matrix
**Date:** September 2026  
**Version:** 1.0  
**Prepared by:** Jarvis (AI Engineering Assistant)

---

## 📈 Summary Stats

| Metric | Count |
|--------|-------|
| Total categories | 15 |
| Total APIs surveyed | 117 |
| APIs auto-registered by Jarvis | 14 |
| No-key / free / open APIs | 6 |
| APIs Jake must apply for | 12 |
| APIs with NO public endpoint (deep link only) | ~12 |
| Categories with booking capability | 9 |
| Categories fully covered (3+ sources) | 15 / 15 ✅ |

---

## Section 1: Category Menu Design

> New 15-category menu for the TogetherPlans app. Every category has a primary + fallback data source and clear booking status.

| # | Emoji | Category | Tagline | Primary API | Secondary API | Booking? |
|---|-------|----------|---------|-------------|---------------|----------|
| 1 | 🎭 | Comedy | Laugh out loud together | Ticketmaster Discovery | SeatGeek | No |
| 2 | 🎵 | Concerts | Live music, shared memories | Ticketmaster Discovery | Bandsintown | No |
| 3 | 💑 | Couples Events | Experiences made for two | Ticketmaster Discovery | Viator Partner API | **Yes** |
| 4 | 👨‍👩‍👧 | Family Events | Adventures the whole family will love | Ticketmaster Discovery | NPS API | No |
| 5 | ⛳ | Golf | Tee it up at the best courses | GolfCourseAPI | GolfNow Affiliate | **Yes** |
| 6 | 🥾 | Hiking Trails | Find your perfect trail | NPS API | OSM Overpass | No |
| 7 | 🏨 | Hotel Stays | Your home away from home | LiteAPI/Nuitee | Hotelbeds APItude | **Yes** |
| 8 | 🗺️ | Local Experiences | Discover what's around you | Viator Partner API | Tripadvisor Content API | **Yes** |
| 9 | 🎬 | Movies | What's playing near you tonight | International Showtimes | TMDB API | No |
| 10 | 📺 | Netflix Shows | Stream something great together | Watchmode API | TMDB Watch Providers | No |
| 11 | 🎭 | Performing Arts | Theatre, dance, and the arts | Ticketmaster Discovery | SeatGeek | No |
| 12 | 🍽️ | Restaurants & Dining | Great food, great company | Google Places API | Foursquare Places | **Yes** |
| 13 | 🤝 | Volunteering | Give back together | Every.org | Mobilize API | No |
| 14 | 🧘 | Wellness & Spa | Relax, restore, reconnect | Mindbody Public API | Groupon Partner API | **Yes** |
| 15 | 🍷 | Wine & Drinks | Sip, savor, and celebrate | Google Places API | Open Brewery DB | **Yes** |

---

## Section 2: Full API Matrix Table

> Legend:
> - ✅ **Auto-registered** — Jarvis registering now (self-serve, instant)
> - 🔧 **Jake registers** — requires business approval / contract / card on file
> - 🆓 **No key needed** — fully open/free endpoints
> - ❌ **No public API** — deep link / affiliate redirect only

---

### 🎭 Comedy

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Ticketmaster Discovery | Comedy shows, stand-up events | Self-serve | ✅ Auto-registered | Free 5k/day | No | P1 |
| 2 | SeatGeek | Comedy events, geo radius | Self-serve | ✅ Auto-registered | Free | No | P1 |
| 3 | Eventbrite v3 | Comedy events via organiser IDs | Self-serve | ✅ Auto-registered | Free | No | P2 |
| 4 | Bandsintown | Comedy tour dates | Approval req'd | 🔧 Jake registers | Free if approved | No | P2 |
| 5 | PredictHQ | Comedy label events | Trial then paid | 🔧 Jake registers | Paid | No | P3 |
| 6 | SerpApi Google Events | Google Events scrape | Unofficial | 🔧 Jake registers | $75/mo | No | P3 |
| 7 | Meetup GraphQL | Comedy meetup groups | Approval + Pro | 🔧 Jake registers | Paid | No | P4 |

---

### 🎵 Concerts

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Ticketmaster Discovery | Music concerts, all genres | Self-serve | ✅ Auto-registered | Free 5k/day | No | P1 |
| 2 | Bandsintown | Artist tour dates, concerts | Approval req'd | 🔧 Jake registers | Free if approved | No | P1 |
| 3 | SeatGeek | Concerts, geo radius | Self-serve | ✅ Auto-registered | Free | No | P2 |
| 4 | setlist.fm | Concert setlists, history | Self-serve | ✅ Auto-registered | Free non-commercial | No | P2 |
| 5 | JamBase | Live music discovery | Trial then paid | 🔧 Jake registers | Paid | No | P3 |
| 6 | Songkick | Concert listings | Approval req'd | 🔧 Jake registers | Commercial licence | No | P3 |
| 7 | Spotify Web API | Artist metadata (no concert data) | Self-serve | ✅ Auto-registered | Free limited | No | P4 |
| 8 | DICE / AXS / Etix | Ticket purchase / deep links | Partner contract | 🔧 Jake registers | Commission | No | P4 |

---

### 💑 Couples Events

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Ticketmaster Discovery | Events for two, date nights | Self-serve | ✅ Auto-registered | Free 5k/day | No | P1 |
| 2 | Viator Partner API | Couples experiences, tours, tastings | Affiliate self-serve | 🔧 Jake registers | 8% commission | **Yes** | P1 |
| 3 | Groupon Partner API | Couples deals, spa, dining | Affiliate self-serve | 🔧 Jake registers | Commission | No | P2 |
| 4 | OpenTable Partner API | Restaurant reservations for two | Approval req'd | 🔧 Jake registers | Commission | **Yes** | P2 |
| 5 | Eventbrite v3 | Couples-tagged events | Self-serve | ✅ Auto-registered | Free | No | P2 |
| 6 | PredictHQ | Event demand signals | Trial then paid | 🔧 Jake registers | Paid | No | P3 |
| 7 | Fever / Cozymeal | Curated couple experiences | No public API | ❌ Deep link only | Affiliate | No | P4 |
| 8 | Airbnb Experiences | Local couple activities | No public API | ❌ Deep link only | Referral | No | P4 |

---

### 👨‍👩‍👧 Family Events

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Ticketmaster Discovery | Family shows (includeFamily=only) | Self-serve | ✅ Auto-registered | Free 5k/day | No | P1 |
| 2 | NPS API | National parks, family trails | Self-serve | ✅ Auto-registered | Free 1000 req/hr | No | P1 |
| 3 | RIDB / Recreation.gov | Campgrounds, family recreation | Self-serve | ✅ Auto-registered | Free 50 req/min | No | P1 |
| 4 | ACTIVE Network Activity Search | Family sports, activities | Self-serve | 🔧 Jake registers | Free tier | No | P2 |
| 5 | Eventbrite v3 | Family-tagged events | Self-serve | ✅ Auto-registered | Free | No | P2 |
| 6 | Yelp Places API | Family-friendly venues | Paid | 🔧 Jake registers | $229/mo after trial | No | P3 |
| 7 | Google Places API New | Family venues, attractions | Pay-per-SKU | 🔧 Jake registers | 10k free/mo basic | No | P3 |
| 8 | PredictHQ | Family event demand | Trial then paid | 🔧 Jake registers | Paid | No | P4 |

---

### ⛳ Golf

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | GolfCourseAPI | Course info, ratings, locations | Self-serve | ✅ Auto-registered | Free | No | P1 |
| 2 | GolfNow Affiliate API | Tee time booking | Approval req'd | 🔧 Jake registers | Commission | **Yes** | P1 |
| 3 | Supreme Golf | Tee time aggregator | Partner contract | 🔧 Jake registers | Commission | **Yes** | P2 |
| 4 | Lightspeed Golf | Booking at Lightspeed courses | Approval req'd | 🔧 Jake registers | Per-booking | **Yes** | P2 |
| 5 | foreUP API | Booking at foreUP courses | Approval per-course | 🔧 Jake registers | Per-course | **Yes** | P3 |
| 6 | Golfbert API | GPS/maps, course layout | Self-serve paid | 🔧 Jake registers | Paid | No | P3 |
| 7 | Google Places API | Golf course discovery | Pay-per-SKU | 🔧 Jake registers | 10k free/mo | No | P4 |

---

### 🥾 Hiking Trails

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | NPS API | National park trails | Self-serve | ✅ Auto-registered | Free 1000 req/hr | No | P1 |
| 2 | RIDB / Recreation.gov | Recreation sites, campgrounds | Self-serve | ✅ Auto-registered | Free 50 req/min | No | P1 |
| 3 | OSM Overpass API | Global trail data | No key needed | 🆓 Open | Free | No | P1 |
| 4 | USFS / USGS Trail Services | US Forest Service trails | No key needed | 🆓 Open | Free, public domain | No | P2 |
| 5 | National Weather Service | Trail weather conditions | No key needed | 🆓 Open | Free | No | P2 |
| 6 | TrailAPI (RapidAPI) | Trail listings, difficulty | Self-serve freemium | 🔧 Jake registers | Freemium | No | P3 |
| 7 | Outdooractive | International trails | Approval, paid | 🔧 Jake registers | Paid | No | P4 |
| 8 | AllTrails | Trail discovery | No public API | ❌ Deep link only | Affiliate | No | P4 |

---

### 🏨 Hotel Stays

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | LiteAPI / Nuitee | Hotel booking, global inventory | Self-serve instant | 🔧 Jake registers | Per-booking fees | **Yes** | P1 |
| 2 | Hotelbeds APItude | Hotel booking, B2B rates | Sandbox instant / live contract | 🔧 Jake registers | Commission | **Yes** | P1 |
| 3 | Expedia Rapid API | Hotel search + booking | Approval req'd | 🔧 Jake registers | Commission | **Yes** | P2 |
| 4 | Booking.com Demand API | Hotel search + booking | Approval req'd | 🔧 Jake registers | Commission | **Yes** | P2 |
| 5 | Tripadvisor Content API | Hotel ratings, reviews | Self-serve | ✅ Auto-registered | 5k free/mo | No | P2 |
| 6 | Duffel Stays | Hotel booking, modern API | Self-serve | 🔧 Jake registers | Per-booking | **Yes** | P3 |
| 7 | RateHawk | B2B hotel rates | Approval req'd | 🔧 Jake registers | B2B pricing | **Yes** | P3 |
| 8 | Priceline Partner Network | Hotel search + booking | Approval req'd | 🔧 Jake registers | Commission | **Yes** | P4 |
| 9 | Amadeus | Hotel + travel | ⚠️ ENTERPRISE ONLY (shut down self-serve Jul 2026) | ❌ Not available | Enterprise | **Yes** | ❌ Skip |

---

### 🗺️ Local Experiences

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Viator Partner API | Tours, activities, experiences | Affiliate self-serve | 🔧 Jake registers | 8% commission | **Yes** | P1 |
| 2 | Tripadvisor Content API | Attractions, experiences | Self-serve | ✅ Auto-registered | 5k free/mo | No | P1 |
| 3 | GetYourGuide Partner API | Activities, tours | Approval req'd | 🔧 Jake registers | Commission | **Yes** | P2 |
| 4 | Tiqets Affiliate API | Museum tickets, attractions | Self-serve affiliate | 🔧 Jake registers | Commission | **Yes** | P2 |
| 5 | Musement / TUI API | Tours and experiences | Approval req'd | 🔧 Jake registers | Commission | **Yes** | P3 |
| 6 | FareHarbor External API | Local operator booking | Approval per operator | 🔧 Jake registers | Per-booking | **Yes** | P3 |
| 7 | Klook / Headout | Asia/intl experiences | Approval req'd | 🔧 Jake registers | Commission | **Yes** | P4 |
| 8 | Amadeus Tours | Tours + experiences | ⚠️ ENTERPRISE ONLY (Jul 2026) | ❌ Not available | Enterprise | **Yes** | ❌ Skip |

---

### 🎬 Movies

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | International Showtimes API | Cinema showtimes, 50+ countries | 30-day trial | 🔧 Jake registers | Paid after trial | No | P1 |
| 2 | TMDB API | Movie metadata, posters, info | Self-serve | ✅ Auto-registered | Free | No | P1 |
| 3 | OMDb API | Movie ratings, metadata | Self-serve | ✅ Auto-registered | Free 1k/day | No | P2 |
| 4 | MovieGlu API | Showtimes by territory | Trial then paid | 🔧 Jake registers | Paid per territory | No | P2 |
| 5 | Gracenote TMS OnConnect | TV/movie metadata | Self-serve limited | 🔧 Jake registers | Confirm plan exists | No | P3 |
| 6 | AMC Theatres API | AMC showtimes | Approval req'd | 🔧 Jake registers | Partner only | No | P3 |
| 7 | Fandango | Ticket purchase | Approval req'd | 🔧 Jake registers | Commission | **Yes** | P3 |
| 8 | SerpApi Showtimes | Google showtimes scrape | Unofficial | 🔧 Jake registers | $75/mo | No | P4 |

---

### 📺 Netflix Shows

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Watchmode API | Streaming availability, 50+ countries | Self-serve | ✅ Auto-registered | Free tier | No | P1 |
| 2 | TMDB Watch Providers | Netflix provider (ID=8) availability | Self-serve | ✅ Auto-registered | Free | No | P1 |
| 3 | TVmaze API | TV show info, schedules | No key needed | 🆓 Open | Free | No | P2 |
| 4 | Trakt API | Watch history, trending shows | Self-serve | ✅ Auto-registered | Free | No | P2 |
| 5 | Netflix Top10 TSV | Official Netflix top charts | No key needed | 🆓 Open | Free (public data) | No | P2 |
| 6 | Streaming Availability (MovieOfTheNight) | Multi-service availability | Self-serve RapidAPI | 🔧 Jake registers | Freemium | No | P3 |
| 7 | uNoGS | Netflix global search (unofficial) | RapidAPI freemium | 🔧 Jake registers | Freemium | No | P3 |
| 8 | Netflix | Native streaming data | No public API | ❌ Deep link only | N/A | No | ❌ Skip |
| 9 | JustWatch / Reelgood | Streaming aggregator | Partner contract | 🔧 Jake registers | Contract | No | P4 |

---

### 🎭 Performing Arts

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Ticketmaster Discovery | Theatre, dance, opera, arts | Self-serve | ✅ Auto-registered | Free 5k/day | No | P1 |
| 2 | SeatGeek | Theater events | Self-serve | ✅ Auto-registered | Free | No | P1 |
| 3 | Eventbrite v3 | Arts & culture events | Self-serve | ✅ Auto-registered | Free | No | P2 |
| 4 | PredictHQ | Arts event demand | Trial then paid | 🔧 Jake registers | Paid | No | P3 |
| 5 | London Theatre Direct API | West End booking (UK) | Affiliate | 🔧 Jake registers | Commission | **Yes** | P3 |
| 6 | TodayTix | Theatre tickets | Partner contract | 🔧 Jake registers | Commission | **Yes** | P3 |
| 7 | Spektrix | Venue-specific booking | Approval per venue | 🔧 Jake registers | Per-venue | **Yes** | P4 |

---

### 🍽️ Restaurants & Dining

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Google Places API New | Restaurant discovery, ratings | Pay-per-SKU | 🔧 Jake registers | 10k free/mo basic | No | P1 |
| 2 | Foursquare Places API | Restaurant search, categories | Self-serve | ✅ Auto-registered | Free monthly allowance | No | P1 |
| 3 | Tripadvisor Content API | Restaurant reviews, rankings | Self-serve | ✅ Auto-registered | 5k free/mo | No | P1 |
| 4 | OpenTable Partner API | Table reservations | Approval req'd | 🔧 Jake registers | Commission | **Yes** | P2 |
| 5 | Yelp Places API | Restaurant search, reviews | Paid | 🔧 Jake registers | $229/mo after trial | No | P2 |
| 6 | Spoonacular Food API | Food content, restaurant info | Self-serve | 🔧 Jake registers | Free tier | No | P3 |
| 7 | OSM Overpass | Restaurant locations | No key needed | 🆓 Open | Free (no ratings) | No | P3 |
| 8 | Resy / Tock / SevenRooms | Premium reservations | No public API | ❌ Deep link only | N/A | No | P4 |

---

### 🤝 Volunteering

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Every.org Charity API | Nonprofit search, giving | Self-serve | ✅ Auto-registered | Free | No | P1 |
| 2 | GlobalGiving API | Crowdfunded projects | Self-serve | ✅ Auto-registered | Free | No | P1 |
| 3 | Mobilize API | Volunteer events, sign-up | No key for public endpoints | 🆓 Open | Free | No | P1 |
| 4 | ProPublica Nonprofit API | Nonprofit data, 990s | No key needed | 🆓 Open | Free | No | P2 |
| 5 | Idealist / VolunteerMatch API | Volunteer opportunities | Approval + licence fee | 🔧 Jake registers | Licence fee | No | P2 |
| 6 | Galaxy Digital | Volunteer management | Approval per site | 🔧 Jake registers | Per-site | No | P3 |
| 7 | Candid / GuideStar | Nonprofit profiles | Trial then paid | 🔧 Jake registers | Paid | No | P3 |
| 8 | Points of Light | Volunteer programs | No public API | ❌ Deep link only | N/A | No | P4 |

---

### 🧘 Wellness & Spa

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Mindbody Public API v6 | Classes, spas, wellness booking | Sandbox self-serve / live approval | 🔧 Jake registers | Per-booking | **Yes** | P1 |
| 2 | Groupon Partner API | Spa deals, wellness packages | Affiliate self-serve | 🔧 Jake registers | Commission | No | P1 |
| 3 | Google Places API | Spa, gym, yoga studio discovery | Pay-per-SKU | 🔧 Jake registers | 10k free/mo | No | P2 |
| 4 | Foursquare Places | Wellness venue discovery | Self-serve | ✅ Auto-registered | Free monthly | No | P2 |
| 5 | Booker by Mindbody | Salon + spa booking | Approval req'd | 🔧 Jake registers | Per-booking | **Yes** | P3 |
| 6 | Square Bookings API | Spa booking (Square merchants) | Self-serve | 🔧 Jake registers | Per-merchant | **Yes** | P3 |
| 7 | Zenoti API | Enterprise spa/salon | Approval, enterprise | 🔧 Jake registers | Enterprise | **Yes** | P4 |
| 8 | Boulevard API | Salon/spa, GraphQL | Approval req'd | 🔧 Jake registers | Per-booking | **Yes** | P4 |
| 9 | Vagaro / Fresha / ClassPass | Wellness marketplaces | Partner contract / no API | ❌ Deep link only | Referral | No | P4 |

---

### 🍷 Wine & Drinks

| # | API / Provider | What It Covers | Access Type | Jarvis/Jake/Open | Cost | Booking? | Priority |
|---|----------------|----------------|-------------|------------------|------|----------|----------|
| 1 | Google Places API | Bars, wine bars, breweries | Pay-per-SKU | 🔧 Jake registers | 10k free/mo | No | P1 |
| 2 | Open Brewery DB | Craft brewery search, global | No key needed | 🆓 Open | Free | No | P1 |
| 3 | Foursquare Places | Bar + venue discovery | Self-serve | ✅ Auto-registered | Free monthly | No | P1 |
| 4 | TheCocktailDB | Cocktail recipes, bar content | Test key free | 🔧 Jake registers | Small Patreon for prod | No | P2 |
| 5 | Untappd API | Craft beer, brewery check-ins | Approval req'd (slow) | 🔧 Jake registers | Approval required | No | P2 |
| 6 | Spoonacular Wine Endpoints | Wine pairings, content | Self-serve | 🔧 Jake registers | Free tier | No | P3 |
| 7 | Viator / GetYourGuide | Wine tastings, tours | Affiliate | 🔧 Jake registers | Commission | **Yes** | P3 |
| 8 | Wine-Searcher API | Wine database, pricing | Approval, paid | 🔧 Jake registers | Paid | No | P4 |
| 9 | Vivino / Tock / CellarPass / Drizly | Wine + spirits marketplaces | No public API | ❌ Deep link only | Referral | No | P4 |

---

## Section 3: APIs by Access Complexity

### Tier 1: LIVE NOW (No key needed / Jarvis auto-registering)

**Auto-registered by Jarvis (self-serve, instant):**

| API | Categories Powered | Status |
|-----|-------------------|--------|
| Ticketmaster Discovery | Comedy, Concerts, Couples Events, Family Events, Performing Arts | ✅ Registering |
| SeatGeek | Comedy, Concerts, Performing Arts | ✅ Registering |
| Eventbrite v3 | Comedy, Couples Events, Family Events, Performing Arts | ✅ Registering |
| setlist.fm | Concerts | ✅ Registering |
| TMDB API | Movies, Netflix Shows | ✅ Registering |
| OMDb API | Movies | ✅ Registering |
| Watchmode API | Netflix Shows | ✅ Registering |
| Trakt API | Netflix Shows | ✅ Registering |
| GolfCourseAPI | Golf | ✅ Registering |
| NPS API | Hiking Trails, Family Events | ✅ Registering |
| RIDB / Recreation.gov | Hiking Trails, Family Events | ✅ Registering |
| Every.org | Volunteering | ✅ Registering |
| GlobalGiving | Volunteering | ✅ Registering |
| Foursquare Places | Restaurants, Wellness, Wine & Drinks | ✅ Registering |
| Tripadvisor Content API | Restaurants, Local Experiences, Hotel Stays | ✅ Registering |

**Open / No key required:**

| API | Categories Powered | Endpoint |
|-----|-------------------|----------|
| OSM Overpass | Hiking Trails, Restaurants | https://overpass-api.de/api/interpreter |
| USFS / USGS Trails | Hiking Trails | Public domain endpoints |
| National Weather Service | Hiking Trails (conditions) | https://api.weather.gov |
| TVmaze | Netflix Shows | https://api.tvmaze.com |
| Mobilize API | Volunteering | Public endpoints, no key |
| ProPublica Nonprofit API | Volunteering | https://projects.propublica.org/nonprofits/api/v2 |
| Open Brewery DB | Wine & Drinks | https://api.openbrewerydb.org/v1 |
| Netflix Top10 TSV | Netflix Shows | https://www.netflix.com/tudum/top10 |

---

### Tier 2: JAKE APPLIES (Approval / Contract Required)

**Fast approval — apply this week (<1–7 days):**

| API | Categories | Signup URL | Est. Wait |
|-----|-----------|------------|-----------|
| Viator Partner API | Couples Events, Local Experiences, Wine & Drinks | https://partnerapi.viator.com | 1–3 days |
| Hotelbeds APItude | Hotel Stays | https://developer.hotelbeds.com | Sandbox instant / Live: 1–2 weeks |
| LiteAPI / Nuitee | Hotel Stays | https://www.liteapi.travel | Instant |
| Tripadvisor Content API | Restaurants, Local Experiences, Hotels | https://www.tripadvisor.com/developers | Self-serve with card |
| Bandsintown | Comedy, Concerts | https://www.bandsintown.com/api | 3–7 days |
| International Showtimes | Movies | https://www.internationalshowtimes.com/apirequest | 30-day trial, instant |
| Groupon Partner API | Couples Events, Wellness | https://affiliate.groupon.com | 2–5 days |

**Business approval — apply this month (1–4 weeks):**

| API | Categories | Signup URL | Requirements | Est. Wait |
|-----|-----------|------------|-------------|-----------|
| GolfNow Affiliate API | Golf | https://www.golfnow.com/affiliates | Business registration | 1–3 weeks |
| Expedia Rapid API | Hotel Stays | https://developers.expediagroup.com/docs/rapid | Travel industry verification | 2–4 weeks |
| Booking.com Demand API | Hotel Stays | https://developers.booking.com | Business verification | 2–4 weeks |
| OpenTable Partner API | Restaurants, Couples Events | https://platform.opentable.com | Business registration | 1–2 weeks |
| Idealist / VolunteerMatch | Volunteering | https://www.idealist.org/en/api | Licence fee, non-profit focus | 2–3 weeks |
| GetYourGuide Partner API | Local Experiences | https://partner.getyourguide.com | Business + travel sector | 2–4 weeks |
| Mindbody Public API v6 | Wellness | https://developers.mindbodyonline.com | Sandbox instant / Live: 1–3 weeks |
| Untappd API | Wine & Drinks | https://untappd.com/api/docs | Approval required (slow) | 2–6 weeks |

---

### Tier 3: NO API EXISTS (Deep Link Strategy)

| Provider | Category | Deep Link Strategy |
|----------|----------|--------------------|
| Netflix | Netflix Shows | Link to Netflix search: `https://www.netflix.com/search?q={title}` |
| AllTrails | Hiking Trails | Link to AllTrails explore: `https://www.alltrails.com/explore?lat={lat}&lng={lng}` |
| Resy | Restaurants | Link to Resy search: `https://resy.com/cities/{city}?seats=2&date={date}` |
| Tock | Restaurants, Wine | Link to Tock: `https://www.exploretock.com/search?query={venue}` |
| Airbnb Experiences | Couples Events | Link to Experiences: `https://www.airbnb.com/s/experiences?location={city}` |
| Vivino | Wine & Drinks | Link to Vivino: `https://www.vivino.com/search/wines?q={wine}` |
| Drizly | Wine & Drinks | Link to Drizly: `https://drizly.com/liquor-store-locator` |
| CellarPass | Wine & Drinks | Link to: `https://www.cellarpass.com/wineries/{region}` |
| Cozymeal | Couples Events | Link to: `https://www.cozymeal.com/{city}/cooking-classes` |
| Fever | Couples Events | Link to: `https://feverup.com/en/{city}/events` |
| Vagaro / Fresha | Wellness | Link to Vagaro: `https://www.vagaro.com/{city}/{service}` |
| ClassPass | Wellness | Link to: `https://classpass.com/classes/{city}` |
| Points of Light | Volunteering | Link to: `https://www.pointsoflight.org/handsonnetwork` |
| SevenRooms | Restaurants | Link to venue-specific URLs |
| Fandango | Movies | Link to: `https://www.fandango.com/{movie-title}/movie-times` |

---

## Section 4: Redundancy Map

> Goal: Every category has **Primary → Fallback → Last Resort** to ensure zero dead screens.

| Category | Primary API | Fallback API | Last Resort |
|----------|------------|--------------|-------------|
| 🎭 Comedy | Ticketmaster Discovery | SeatGeek | Eventbrite v3 |
| 🎵 Concerts | Ticketmaster Discovery | Bandsintown | setlist.fm (history) |
| 💑 Couples Events | Ticketmaster + Viator | OpenTable (dining) | Deep link: Airbnb Experiences |
| 👨‍👩‍👧 Family Events | Ticketmaster (family filter) | NPS API | RIDB / Recreation.gov |
| ⛳ Golf | GolfCourseAPI (info) | GolfNow (booking) | Google Places (golf_course) |
| 🥾 Hiking Trails | NPS API | OSM Overpass | RIDB + NWS (conditions) |
| 🏨 Hotel Stays | LiteAPI / Nuitee | Hotelbeds APItude | Tripadvisor (reviews → link out) |
| 🗺️ Local Experiences | Viator Partner API | Tripadvisor Attractions | GetYourGuide |
| 🎬 Movies | International Showtimes | TMDB (metadata) | OMDb + deep link Fandango |
| 📺 Netflix Shows | Watchmode API | TMDB Watch Providers | TVmaze + Netflix Top10 TSV |
| 🎭 Performing Arts | Ticketmaster (Arts filter) | SeatGeek (theater) | Eventbrite v3 |
| 🍽️ Restaurants & Dining | Google Places API | Foursquare Places | Tripadvisor + OSM Overpass |
| 🤝 Volunteering | Every.org | Mobilize API | ProPublica Nonprofit API |
| 🧘 Wellness & Spa | Mindbody Public API | Groupon Partner | Foursquare (discovery) |
| 🍷 Wine & Drinks | Google Places (bars) | Open Brewery DB | Foursquare + Viator (tastings) |

---

## ⚠️ Key Warnings & Deprecations

| Provider | Warning |
|----------|---------|
| **Amadeus** | ⛔ Shut down free self-serve portal July 17, 2026. Enterprise contracts only. Do not implement. |
| **Yelp** | ⚠️ No free production tier — $229+/mo. Use Google Places + Foursquare instead. |
| **Eventbrite** | ⚠️ Removed public event search API. Only organiser ID-based endpoints remain. |
| **Netflix** | ❌ No public API. Use Watchmode + TMDB providers + Top10 TSV. |
| **AllTrails** | ❌ No public API. Deep link only. |
| **Resy / Tock / Airbnb Experiences / Vivino / Drizly** | ❌ No public APIs. Affiliate deep links only. |
| **Booking-capable APIs** | ⚠️ Almost always require registered business approval — plan 2–4 weeks lead time. |

---

*Last updated: September 2026 — TogetherPlans Engineering*
