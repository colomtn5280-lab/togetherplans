# 📋 DateNight / TogetherPlans — API Registration Log
**Date Started:** September 2026  
**Version:** 1.0  
**Owner:** Jarvis (auto-registrations) + Jake (approval/contract registrations)

---

## How to Use This Log

- Update `Status` when a key is obtained or rejected
- Store actual API keys in the **secrets manager** — never in this file
- Link to the key location (e.g. `1Password > DateNight > TICKETMASTER_API_KEY`)
- Add notes for any rate limits, billing thresholds, or renewal dates

**Status codes:**
| Status | Meaning |
|--------|---------|
| ✅ DONE | API key obtained and in secrets manager |
| 🔄 PENDING | Jarvis is auto-registering now |
| ⏳ APPLIED | Application submitted, awaiting approval |
| ❌ FAILED | Registration failed or rejected — see notes |
| 🚫 NOT STARTED | Not yet applied for |
| ❌ SKIP | Deprecated / not available / not cost-effective |

---

## Section 1: Open / No-Key APIs

> These require no registration. Mark as ✅ DONE — just configure the base URL.

| Status | API / Provider | Category | Registered Email | Date | Key / URL Location | Notes |
|--------|----------------|----------|-----------------|------|--------------------|-------|
| ✅ DONE | OSM Overpass API | Hiking Trails, Restaurants | N/A — no key | Sep 2026 | `https://overpass-api.de/api/interpreter` | Free, open, no auth. Rate limit: 10k nodes/query. |
| ✅ DONE | USFS / USGS Trail Services | Hiking Trails | N/A — no key | Sep 2026 | Public domain endpoints | US federal data. No key. |
| ✅ DONE | National Weather Service (NWS) | Hiking Trails | N/A — no key | Sep 2026 | `https://api.weather.gov` | Free US weather. No key. |
| ✅ DONE | TVmaze API | Netflix Shows | N/A — no key | Sep 2026 | `https://api.tvmaze.com` | Free TV metadata. No key. Rate limit: 20 calls/10 sec. |
| ✅ DONE | Mobilize API (public endpoints) | Volunteering | N/A — no key | Sep 2026 | `https://api.mobilize.us/v1` | Public endpoints free. No key for basic search. |
| ✅ DONE | ProPublica Nonprofit API | Volunteering | N/A — no key | Sep 2026 | `https://projects.propublica.org/nonprofits/api/v2` | IRS 990 data. No key. |
| ✅ DONE | Open Brewery DB | Wine & Drinks | N/A — no key | Sep 2026 | `https://api.openbrewerydb.org/v1` | Free craft brewery data. No key. |
| ✅ DONE | Netflix Top10 TSV | Netflix Shows | N/A — no key | Sep 2026 | `https://www.netflix.com/tudum/top10` | Official Netflix top charts. Public TSV download. |

---

## Section 2: Auto-Registered by Jarvis (Self-Serve, Instant)

> Jarvis is registering these now. Status will update to ✅ DONE as keys are confirmed.

| Status | API / Provider | Category | Registered Email | Date | Key Location | Env Var | Notes |
|--------|----------------|----------|-----------------|------|--------------|---------|-------|
| 🔄 PENDING | Ticketmaster Discovery API | Comedy, Concerts, Couples, Family, Performing Arts | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → TICKETMASTER_API_KEY | `TICKETMASTER_API_KEY` | Free 5k/day. Jarvis registering. |
| 🔄 PENDING | SeatGeek API | Comedy, Concerts, Performing Arts | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → SEATGEEK_CLIENT_ID | `SEATGEEK_CLIENT_ID` | Free tier. Good geo radius search. |
| 🔄 PENDING | Eventbrite v3 | Comedy, Couples Events, Family Events, Performing Arts | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → EVENTBRITE_API_KEY | `EVENTBRITE_API_KEY` | Note: public event search removed. Organiser ID-based only. |
| 🔄 PENDING | setlist.fm API | Concerts | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → SETLISTFM_API_KEY | `SETLISTFM_API_KEY` | Free non-commercial. Historical setlist data. |
| 🔄 PENDING | TMDB API | Movies, Netflix Shows | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → TMDB_API_KEY | `TMDB_API_KEY` | Free. Use watch/providers for Netflix. |
| 🔄 PENDING | OMDb API | Movies | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → OMDB_API_KEY | `OMDB_API_KEY` | Free 1k/day. $1/mo for 100k/day. |
| 🔄 PENDING | Watchmode API | Netflix Shows | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → WATCHMODE_API_KEY | `WATCHMODE_API_KEY` | Free tier. Best streaming availability API. |
| 🔄 PENDING | Trakt API | Netflix Shows | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → TRAKT_API_KEY | `TRAKT_API_KEY` | Free non-commercial. Trending + community data. |
| 🔄 PENDING | GolfCourseAPI | Golf | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → GOLF_COURSE_API_KEY | `GOLF_COURSE_API_KEY` | Free tier. Course discovery only (no booking). |
| 🔄 PENDING | NPS API | Hiking Trails, Family Events | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → NPS_API_KEY | `NPS_API_KEY` | Free 1k/hr. US national parks + trails. |
| 🔄 PENDING | RIDB / Recreation.gov API | Hiking Trails, Family Events | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → RIDB_API_KEY | `RIDB_API_KEY` | Free 50/min. Campgrounds + rec sites. |
| 🔄 PENDING | Every.org Charity API | Volunteering | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → EVERY_ORG_API_KEY | `EVERY_ORG_API_KEY` | Free. Nonprofit search. |
| 🔄 PENDING | GlobalGiving API | Volunteering | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → GLOBAL_GIVING_API_KEY | `GLOBAL_GIVING_API_KEY` | Free. Crowdfunded projects + causes. |
| 🔄 PENDING | Foursquare Places API | Restaurants, Wellness, Wine & Drinks | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → FOURSQUARE_API_KEY | `FOURSQUARE_API_KEY` | Free monthly allowance. Venue categories. |
| 🔄 PENDING | Tripadvisor Content API | Restaurants, Local Experiences, Hotels | dev@togetherplans.com | Sep 2026 | 1Password → DateNight → TRIPADVISOR_API_KEY | `TRIPADVISOR_API_KEY` | 5k free/mo. Needs billing card. |

---

## Section 3: Jake Applies — This Week (Fast Approval)

| Status | API / Provider | Category | Applied Email | Date Applied | Date Approved | Key Location | Env Var | Apply URL | Notes |
|--------|----------------|----------|--------------|--------------|---------------|--------------|---------|-----------|-------|
| 🚫 NOT STARTED | Viator Partner API | Couples Events, Local Experiences, Wine | jake@togetherplans.com | — | — | TBD | `VIATOR_API_KEY` | https://www.viator.com/partner | 8% commission. 1–3 day approval. |
| 🚫 NOT STARTED | Hotelbeds APItude (Sandbox) | Hotel Stays | jake@togetherplans.com | — | — | TBD | `HOTELBEDS_API_KEY` + `HOTELBEDS_SECRET` | https://developer.hotelbeds.com | Sandbox instant. Live = 1–2 weeks. |
| 🚫 NOT STARTED | LiteAPI / Nuitee | Hotel Stays | jake@togetherplans.com | — | — | TBD | `LITE_API_KEY` | https://app.liteapi.travel/register | Instant self-serve. Fastest hotel booking. |
| 🚫 NOT STARTED | Bandsintown | Comedy, Concerts | jake@togetherplans.com | — | — | TBD | `BANDSINTOWN_APP_ID` | https://www.bandsintown.com/api | 3–7 day approval. Free if approved. |
| 🚫 NOT STARTED | International Showtimes API | Movies | jake@togetherplans.com | — | — | TBD | `INTERNATIONAL_SHOWTIMES_KEY` | https://www.internationalshowtimes.com/apirequest | 30-day free trial, effectively instant. |
| 🚫 NOT STARTED | Groupon Partner API | Couples Events, Wellness | jake@togetherplans.com | — | — | TBD | `GROUPON_TS_TOKEN` | https://affiliate.groupon.com | 2–5 day approval. Commission-based. |
| 🚫 NOT STARTED | Spotify Web API | Concerts (artist metadata) | dev@togetherplans.com | — | — | TBD | `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` | https://developer.spotify.com/dashboard | Self-serve. No concert data — metadata only. |

---

## Section 4: Jake Applies — This Month (Business Approval)

| Status | API / Provider | Category | Applied Email | Date Applied | Date Approved | Key Location | Env Var | Apply URL | Notes |
|--------|----------------|----------|--------------|--------------|---------------|--------------|---------|-----------|-------|
| 🚫 NOT STARTED | GolfNow Affiliate API | Golf | jake@togetherplans.com | — | — | TBD | `GOLFNOW_API_KEY` | https://www.golfnow.com/affiliates | 1–3 week approval. Tee time booking. |
| 🚫 NOT STARTED | Expedia Rapid API | Hotel Stays | jake@togetherplans.com | — | — | TBD | `EXPEDIA_RAPID_API_KEY` | https://developers.expediagroup.com/docs/rapid | 2–4 week approval. Business verification. |
| 🚫 NOT STARTED | Booking.com Demand API | Hotel Stays | jake@togetherplans.com | — | — | TBD | `BOOKING_COM_API_KEY` | https://developers.booking.com | 2–4 week approval. Business + traffic req. |
| 🚫 NOT STARTED | OpenTable Partner API | Restaurants, Couples Events | jake@togetherplans.com | — | — | TBD | `OPENTABLE_CLIENT_ID` + `OPENTABLE_CLIENT_SECRET` | https://platform.opentable.com | 1–2 week approval. Commission per reservation. |
| 🚫 NOT STARTED | Idealist / VolunteerMatch API | Volunteering | jake@togetherplans.com | — | — | TBD | `IDEALIST_API_KEY` | https://www.idealist.org/en/api | 2–3 week approval. Licence fee. |
| 🚫 NOT STARTED | GetYourGuide Partner API | Local Experiences | jake@togetherplans.com | — | — | TBD | `GETYOURGUIDE_API_KEY` | https://partner.getyourguide.com | 2–4 week approval. Commission. |
| 🚫 NOT STARTED | Mindbody Public API v6 (Sandbox) | Wellness & Spa | jake@togetherplans.com | — | — | TBD | `MINDBODY_API_KEY` | https://developers.mindbodyonline.com | Sandbox instant. Live: 1–3 weeks. |
| 🚫 NOT STARTED | Untappd API | Wine & Drinks | jake@togetherplans.com | — | — | TBD | `UNTAPPD_CLIENT_ID` + `UNTAPPD_CLIENT_SECRET` | https://untappd.com/api/docs | Approval slow (2–6 weeks). Nice-to-have. |

---

## Section 5: Lower Priority / Future Registrations

| Status | API / Provider | Category | Notes | Apply URL |
|--------|----------------|----------|-------|-----------|
| 🚫 NOT STARTED | ACTIVE Network Activity Search | Family Events | Free tier — good supplement for sports | https://developer.active.com |
| 🚫 NOT STARTED | TrailAPI (RapidAPI) | Hiking Trails | Freemium. Good trail listing supplement | https://rapidapi.com/trailapi |
| 🚫 NOT STARTED | Golfbert API | Golf | GPS/course mapping. Paid. | https://golfbert.com/api |
| 🚫 NOT STARTED | JamBase API | Concerts | Trial then paid. Secondary to Bandsintown. | https://api.jambase.com |
| 🚫 NOT STARTED | Songkick API | Concerts | Commercial licence required. | https://www.songkick.com/developer |
| 🚫 NOT STARTED | TheCocktailDB | Wine & Drinks | Test key free. Small Patreon for production. | https://www.thecocktaildb.com/api.php |
| 🚫 NOT STARTED | Spoonacular API | Restaurants, Wine | Free tier. Food content + wine pairings. | https://spoonacular.com/food-api |
| 🚫 NOT STARTED | MovieGlu API | Movies | Showtimes per territory. Trial then paid. | https://www.movieglu.com |
| 🚫 NOT STARTED | Tiqets Affiliate API | Local Experiences | Self-serve affiliate. Museum tickets. | https://www.tiqets.com/en/partners |
| 🚫 NOT STARTED | London Theatre Direct API | Performing Arts | UK West End only. Affiliate. | Contact: https://www.londontheatredirect.com |
| 🚫 NOT STARTED | PredictHQ | Comedy, Concerts, Family, Couples, Arts | Trial then paid. Demand intelligence. | https://www.predicthq.com |
| 🚫 NOT STARTED | Duffel Stays | Hotel Stays | Per-booking fees. Modern API. | https://duffel.com/stays |
| 🚫 NOT STARTED | Streaming Availability (MovieOfTheNight) | Netflix Shows | RapidAPI freemium. Supplement Watchmode. | https://rapidapi.com/movie-of-the-night |

---

## Section 6: Deprecated / Skip List

> Do not register or implement these.

| Status | API / Provider | Category | Reason | Date Deprecated |
|--------|----------------|----------|--------|----------------|
| ❌ SKIP | Amadeus Hotel + Tours API | Hotels, Local Experiences | ⛔ Shut down free/self-serve portal July 17, 2026. Enterprise contracts only. | Jul 2026 |
| ❌ SKIP | Yelp Places API (production) | Restaurants, Family | ⚠️ $229+/mo minimum for production. Use Google Places + Foursquare instead. | Sep 2026 |
| ❌ SKIP | Eventbrite public search | All event categories | ⚠️ Removed public event search. Only organiser-ID endpoint remains. Limited utility. | 2024 |

---

## Section 7: Deep Link Only (No Public API)

> These providers have no public API. Implemented as styled deep link cards in the UI.

| Status | Provider | Category | Deep Link Template | Notes |
|--------|----------|----------|--------------------|-------|
| ✅ DONE | Netflix | Netflix Shows | `https://www.netflix.com/search?q={title}` | Official, stable URL pattern |
| ✅ DONE | AllTrails | Hiking Trails | `https://www.alltrails.com/explore?lat={lat}&lng={lng}` | Map-based redirect |
| ✅ DONE | Resy | Restaurants | `https://resy.com/cities/{city}?seats=2&date={date}` | Premium reservations |
| ✅ DONE | Tock | Restaurants, Wine & Drinks | `https://www.exploretock.com/search?query={venue}` | Chef's table / premium |
| ✅ DONE | Airbnb Experiences | Couples Events | `https://www.airbnb.com/s/experiences?location={city}` | Referral link potential |
| ✅ DONE | Vivino | Wine & Drinks | `https://www.vivino.com/search/wines?q={wine}` | Wine discovery |
| ✅ DONE | Drizly | Wine & Drinks | `https://drizly.com/liquor-store-locator` | On-demand delivery |
| ✅ DONE | CellarPass | Wine & Drinks | `https://www.cellarpass.com/wineries/{region}` | Winery tasting reservations |
| ✅ DONE | Cozymeal | Couples Events | `https://www.cozymeal.com/{city}/cooking-classes` | Cooking classes / foodie dates |
| ✅ DONE | Fever | Couples Events | `https://feverup.com/en/{city}/events` | Curated experiences |
| ✅ DONE | Vagaro | Wellness & Spa | `https://www.vagaro.com/{city}/{service}` | Salon + spa booking |
| ✅ DONE | ClassPass | Wellness & Spa | `https://classpass.com/classes/{city}` | Fitness + wellness classes |
| ✅ DONE | Fandango | Movies | `https://www.fandango.com/search?q={movie}` | Movie ticket purchase |
| ✅ DONE | Points of Light | Volunteering | `https://www.pointsoflight.org/handsonnetwork` | Volunteer network |
| ✅ DONE | SevenRooms | Restaurants | Venue-specific URLs | Premium restaurant booking |

---

## Registration Progress Dashboard

```
Total APIs tracked: 51
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DONE           (open/no-key + deep link):  23
🔄 PENDING        (Jarvis auto-registering):  15
🚫 NOT STARTED    (Jake to apply):            15
❌ SKIP           (deprecated/unavailable):    3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coverage once Jarvis done:  38 / 51  (75%)
Coverage once Jake done:    53 / 51  (full + redundancy)
```

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| Sep 2026 | Initial registration log created — all 51 APIs tracked | Jarvis |
| Sep 2026 | Amadeus marked SKIP — enterprise only since Jul 17 2026 | Jarvis |
| Sep 2026 | Yelp marked SKIP — $229/mo, not cost-effective vs. Foursquare | Jarvis |
| Sep 2026 | Deep link section populated with 15 no-API providers | Jarvis |

---

*Last updated: September 2026 — TogetherPlans Engineering*  
*⚠️ Never store actual API keys in this file. Use the secrets manager (1Password / AWS Secrets Manager / env).*
