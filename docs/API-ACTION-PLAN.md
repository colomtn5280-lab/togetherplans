# 🚀 DateNight / TogetherPlans — API Action Plan
**Date:** September 2026  
**Version:** 1.0  
**Purpose:** Ordered execution plan to bring all 15 categories live with data coverage

---

## Overview

| Phase | Owner | Timeline | API Count | Status |
|-------|-------|----------|-----------|--------|
| Immediate — Auto-register | Jarvis | Today | 15 APIs | 🔄 In Progress |
| This Week — Fast approval | Jake | Days 1–7 | 7 APIs | ⏳ Apply Now |
| This Month — Business approval | Jake | Weeks 1–4 | 8 APIs | 📋 Plan & Apply |
| No API (deep link) | Engineering | Sprint | ~15 providers | 🔗 Build redirects |

---

## 🤖 Immediate — Jarvis Auto-Registers Today

> These APIs are **self-serve with instant access**. Jarvis is registering them now in parallel. Keys will be available in the shared secrets manager within hours.

---

### 1. Ticketmaster Discovery API
- **Categories powered:** Comedy, Concerts, Couples Events, Family Events, Performing Arts
- **Free tier:** 5,000 calls/day, 5 calls/second
- **Key location:** Developer portal → My Apps → API Key field
- **Env var:** `TICKETMASTER_API_KEY`
- **Signup URL:** https://developer.ticketmaster.com/products-and-docs/apis/getting-started/
- **Notes:** Primary workhorse for all live events. Filter by `classificationName` per category.

---

### 2. SeatGeek API
- **Categories powered:** Comedy, Concerts, Performing Arts
- **Free tier:** Generous free tier, geo radius search supported
- **Key location:** https://platform.seatgeek.com → Dashboard → Client ID + Secret
- **Env vars:** `SEATGEEK_CLIENT_ID`, `SEATGEEK_CLIENT_SECRET`
- **Notes:** Good fallback for Ticketmaster. Strong taxonomy filtering.

---

### 3. TMDB API (The Movie Database)
- **Categories powered:** Movies (metadata, posters, cast), Netflix Shows (watch providers)
- **Free tier:** Unlimited non-commercial use
- **Key location:** https://www.themoviedb.org/settings/api → API Key (v3 auth)
- **Env var:** `TMDB_API_KEY`
- **Notes:** Use `/discover/movie` for now-playing and `/movie/{id}/watch/providers` with Netflix provider ID=8 for streaming availability.

---

### 4. OMDb API (Open Movie Database)
- **Categories powered:** Movies (ratings, metadata, IMDb data)
- **Free tier:** 1,000 requests/day
- **Key location:** https://www.omdbapi.com/apikey.aspx → email confirmation
- **Env var:** `OMDB_API_KEY`
- **Notes:** Great for ratings enrichment alongside TMDB. Upgrade to $1/mo for 100k/day.

---

### 5. Watchmode API
- **Categories powered:** Netflix Shows (streaming availability across 50+ countries)
- **Free tier:** Available; check dashboard for monthly limit
- **Key location:** https://api.watchmode.com → Dashboard → API Key
- **Env var:** `WATCHMODE_API_KEY`
- **Notes:** Best dedicated streaming availability API. Use `/sources` endpoint filtered to Netflix (source ID 203).

---

### 6. Trakt API
- **Categories powered:** Netflix Shows (trending, watchlists, community ratings)
- **Free tier:** Free for non-commercial; generous rate limits
- **Key location:** https://trakt.tv/oauth/applications → New Application → Client ID
- **Env var:** `TRAKT_API_KEY`
- **Notes:** Excellent for trending shows and community-driven recommendations. Supplement Watchmode.

---

### 7. GolfCourseAPI
- **Categories powered:** Golf (course info, ratings, GPS locations)
- **Free tier:** Free tier available
- **Key location:** https://golfcourseapi.com → Sign up → Dashboard → API Key
- **Env var:** `GOLF_COURSE_API_KEY`
- **Notes:** Course discovery only — not booking. Pair with GolfNow for tee time booking.

---

### 8. NPS API (National Park Service)
- **Categories powered:** Hiking Trails, Family Events
- **Free tier:** 1,000 requests/hour — entirely free
- **Key location:** https://www.nps.gov/subjects/developer/get-started.htm → email key delivery
- **Env var:** `NPS_API_KEY`
- **Notes:** Official US gov API. Use `/parks`, `/trails`, `/thingstodo` endpoints. Extremely reliable.

---

### 9. RIDB API (Recreation Information Database)
- **Categories powered:** Hiking Trails, Family Events (campgrounds, rec areas)
- **Free tier:** 50 requests/minute — free
- **Key location:** https://ridb.recreation.gov/landing → Register → API Key
- **Env var:** `RIDB_API_KEY`
- **Notes:** Powers Recreation.gov. Use `/facilities` and `/campsites` with activity filters.

---

### 10. setlist.fm API
- **Categories powered:** Concerts (setlists, historical show data, venue info)
- **Free tier:** Free for non-commercial use
- **Key location:** https://api.setlist.fm/docs/1.0/index.html → Apply for key
- **Env var:** `SETLISTFM_API_KEY`
- **Notes:** Unique dataset for past concert setlists. Useful for "artist history in your city" features.

---

### 11. Every.org Charity API
- **Categories powered:** Volunteering (nonprofit search, charity profiles)
- **Free tier:** Free
- **Key location:** https://www.every.org/charity-api → Request key
- **Env var:** `EVERY_ORG_API_KEY`
- **Notes:** Clean nonprofit discovery API. Use `/search` for cause-based volunteering opportunities.

---

### 12. GlobalGiving API
- **Categories powered:** Volunteering (crowdfunded projects, global causes)
- **Free tier:** Free for nonprofits and developers
- **Key location:** https://www.globalgiving.org/api/get-key/ → Registration form
- **Env var:** `GLOBAL_GIVING_API_KEY`
- **Notes:** Good for cause-based giving campaigns tied to volunteering. Use `/projects` endpoint.

---

### 13. Foursquare Places API
- **Categories powered:** Restaurants & Dining, Wellness & Spa, Wine & Drinks
- **Free tier:** Monthly free allowance (check current limits at dashboard)
- **Key location:** https://developer.foursquare.com → Create App → API Key
- **Env var:** `FOURSQUARE_API_KEY`
- **Notes:** Strong venue categorization. Use `categories` filter: restaurants (13065), spas (11099), bars (13003), breweries (13062).

---

### 14. Tripadvisor Content API
- **Categories powered:** Restaurants & Dining, Local Experiences, Hotel Stays
- **Free tier:** 5,000 calls/month — self-serve with credit card
- **Key location:** https://www.tripadvisor.com/developers → Create App → Key
- **Env var:** `TRIPADVISOR_API_KEY`
- **Notes:** Rich review/rating data. Use `/location/search` with category filters. Excellent fallback for hotels.

---

## 📅 This Week — Jake Applies (Fast Approval, < 7 Days)

> Apply to these **today**. Most have instant sandboxes or approve within days. Mention "TogetherPlans date-night recommendation app" in all applications.

---

### 1. Viator Partner API
- **Categories powered:** Couples Events, Local Experiences, Wine & Drinks (tastings)
- **Direct URL:** https://partnerapi.viator.com/partner/v1/docs
- **Apply here:** https://www.viator.com/partner
- **What to say:** _"TogetherPlans is a date-night and couples activity app helping users discover and book local experiences. We expect to drive significant affiliate bookings across tours, tastings, and experiences. We would like to integrate Viator's Partner API to surface bookable activities in our recommendations feed."_
- **Commission:** 8% on bookings
- **Expected wait:** 1–3 business days
- **Env var:** `VIATOR_API_KEY`

---

### 2. Hotelbeds APItude
- **Categories powered:** Hotel Stays (B2B rates, full booking)
- **Sandbox URL (instant):** https://developer.hotelbeds.com → Register for sandbox
- **Live contract:** Contact sales after sandbox testing
- **Direct URL:** https://developer.hotelbeds.com/getting-started
- **What to say:** _"We are building a hotel recommendation and booking feature for our couples/date-night app. We want to start in sandbox to validate the integration, then move to live keys under a commission agreement."_
- **Expected wait:** Sandbox = instant; Live = 1–2 weeks
- **Env vars:** `HOTELBEDS_API_KEY`, `HOTELBEDS_SECRET`

---

### 3. LiteAPI / Nuitee
- **Categories powered:** Hotel Stays (fastest hotel booking integration)
- **Direct URL:** https://www.liteapi.travel/hotel-booking-api
- **Apply here:** https://app.liteapi.travel/register
- **What to say:** _"We want to add hotel booking capability to TogetherPlans. LiteAPI's simple REST API is ideal for our use case. We're looking for a test key first, then a production agreement."_
- **Expected wait:** Instant (self-serve sign-up)
- **Env var:** `LITE_API_KEY`
- **Notes:** Fastest path to live hotel booking. Start here before Expedia/Booking.com approval comes through.

---

### 4. Tripadvisor Content API
- **Categories powered:** Restaurants, Local Experiences, Hotel Stays
- **Direct URL:** https://www.tripadvisor.com/developers
- **What to say:** _"TogetherPlans recommends date-night activities, restaurants, and hotels. We want to surface Tripadvisor ratings and review counts alongside our activity cards."_
- **Expected wait:** Self-serve with credit card — access in minutes
- **Env var:** `TRIPADVISOR_API_KEY`
- **Notes:** Already being registered by Jarvis — Jake should verify billing card is on file for sustained usage.

---

### 5. Bandsintown
- **Categories powered:** Comedy (stand-up tours), Concerts
- **Direct URL:** https://www.bandsintown.com/api
- **Apply here:** https://artists.bandsintown.com/support/api-installation
- **What to say:** _"TogetherPlans is a couples activity discovery app. We want to surface concert and comedy tour dates from Bandsintown to help users find live music and comedy events near them. Non-commercial fan-facing use case."_
- **Expected wait:** 3–7 business days
- **Env var:** `BANDSINTOWN_APP_ID`
- **Notes:** Free if approved for non-commercial use. Excellent artist tour date coverage.

---

### 6. International Showtimes API
- **Categories powered:** Movies (cinema showtimes, 50+ countries)
- **Direct URL:** https://www.internationalshowtimes.com/apirequest
- **What to say:** _"We are building a 'Movies' category in our date-night app and need real-time cinema showtimes. We would like to start with the 30-day free trial to validate the integration, then move to a commercial plan."_
- **Expected wait:** 30-day trial is effectively instant (form submission)
- **Env var:** `INTERNATIONAL_SHOWTIMES_KEY`
- **Notes:** Best dedicated showtimes API. After trial, evaluate cost vs. SerpApi fallback.

---

### 7. Groupon Partner API (Affiliate)
- **Categories powered:** Couples Events, Wellness & Spa
- **Direct URL:** https://affiliate.groupon.com
- **Apply here:** https://www.groupon.com/merchant/affiliates
- **What to say:** _"TogetherPlans surfaces date-night deals including spa packages, dining, and couples experiences. We want to integrate Groupon's affiliate feed to show deal pricing alongside activity recommendations."_
- **Commission:** Revenue share on conversions
- **Expected wait:** 2–5 business days
- **Env var:** `GROUPON_TS_TOKEN`

---

## 🗓️ This Month — Jake Applies (Business Approval, 1–4 Weeks)

> These require **business verification** and sometimes a sales call. Apply early — they gate your most valuable booking-capable integrations.

---

### 1. GolfNow Affiliate API
- **Categories powered:** Golf (tee time booking — primary booking source)
- **Direct URL:** https://www.golfnow.com/affiliates
- **Requirements:** Business registration, expected traffic/volume projection, US entity preferred
- **What to say:** _"TogetherPlans is a lifestyle app for couples and friend groups. We plan to feature a 'Golf' category allowing users to browse courses and book tee times. We project [X] monthly active users in the golf category within 90 days of launch."_
- **Expected wait:** 1–3 weeks
- **Commission:** Per-booking commission on tee time purchases
- **Env var:** `GOLFNOW_API_KEY`

---

### 2. Expedia Rapid API
- **Categories powered:** Hotel Stays (large inventory, brand trust)
- **Direct URL:** https://developers.expediagroup.com/docs/rapid
- **Requirements:** Travel industry affiliation, business registration, projected GMV
- **What to say:** _"TogetherPlans adds a hotel booking feature for date-night getaways and weekend trips. We expect high-intent bookings from couples planning overnight experiences. We want to integrate Expedia Rapid API for hotel search and booking."_
- **Expected wait:** 2–4 weeks
- **Commission:** Negotiated commission on bookings
- **Env var:** `EXPEDIA_RAPID_API_KEY` *(add to env)*

---

### 3. Booking.com Demand API
- **Categories powered:** Hotel Stays (European + global strength)
- **Direct URL:** https://developers.booking.com
- **Requirements:** Verified business, website with traffic, affiliate agreement
- **What to say:** _"We are an activity and hotel discovery app targeting couples and date-night planners. Booking.com's global inventory would complement our hotel category. We are looking to integrate the Demand API with a commission model."_
- **Expected wait:** 2–4 weeks
- **Commission:** Standard affiliate/demand commission
- **Env var:** `BOOKING_COM_API_KEY` *(add to env)*

---

### 4. OpenTable Partner API
- **Categories powered:** Restaurants & Dining, Couples Events (dinner reservations)
- **Direct URL:** https://platform.opentable.com
- **Requirements:** Business registration, use case review, integration plan
- **What to say:** _"TogetherPlans recommends restaurants for date nights and couples events. We want to embed OpenTable reservation widgets and/or API calls directly in restaurant cards so users can book without leaving the app."_
- **Expected wait:** 1–2 weeks
- **Commission:** Per-seated-diner or per-reservation fee
- **Env vars:** `OPENTABLE_CLIENT_ID`, `OPENTABLE_CLIENT_SECRET`

---

### 5. Idealist / VolunteerMatch API
- **Categories powered:** Volunteering (primary volunteer opportunity database)
- **Direct URL:** https://www.idealist.org/en/api (Idealist) / https://www.volunteermatch.org/recruiters/api/ (VolunteerMatch)
- **Requirements:** Approved use case, licence fee, non-profit sector alignment
- **What to say:** _"TogetherPlans includes a Volunteering category that helps couples and groups find local volunteer opportunities to do together. We want to surface listings from Idealist/VolunteerMatch with attribution and links back to the original platform."_
- **Expected wait:** 2–3 weeks
- **Cost:** Licence fee (negotiate based on usage)
- **Env var:** `IDEALIST_API_KEY`

---

### 6. GetYourGuide Partner API
- **Categories powered:** Local Experiences (tours, activities, attractions)
- **Direct URL:** https://partner.getyourguide.com
- **Requirements:** Business registration, travel/lifestyle sector, projected booking volume
- **What to say:** _"TogetherPlans connects couples with bookable local experiences. GetYourGuide's deep inventory of tours and activities is a perfect fit for our Local Experiences category. We are looking for a Partner API agreement with commission-based monetization."_
- **Expected wait:** 2–4 weeks
- **Commission:** Commission on confirmed bookings
- **Env var:** `GETYOURGUIDE_API_KEY` *(add to env)*

---

### 7. Mindbody Public API v6
- **Categories powered:** Wellness & Spa (class booking, spa appointments)
- **Direct URL:** https://developers.mindbodyonline.com
- **Sandbox:** Self-serve sandbox access (instant)
- **Live:** Requires Mindbody approval after sandbox testing
- **What to say:** _"TogetherPlans includes a Wellness & Spa category for couples. We want to surface class schedules, spa services, and enable booking directly through Mindbody's API for venues already on the platform."_
- **Expected wait:** Sandbox = instant; Live approval = 1–3 weeks
- **Cost:** Per-booking API transaction fees
- **Env var:** `MINDBODY_API_KEY`

---

## 🔗 Deep Link Build List (Engineering Sprint)

> These providers have **no public API**. Build deep link redirect cards in the UI — they appear in results but open the provider's web/app directly.

| Provider | Category | Deep Link Template |
|----------|----------|--------------------|
| Netflix | Netflix Shows | `https://www.netflix.com/search?q={title}` |
| AllTrails | Hiking Trails | `https://www.alltrails.com/explore?lat={lat}&lng={lng}` |
| Resy | Restaurants | `https://resy.com/cities/{city}?seats=2&date={date}` |
| Tock | Restaurants, Wine | `https://www.exploretock.com/search?query={venue}` |
| Airbnb Experiences | Couples Events | `https://www.airbnb.com/s/experiences?location={city}` |
| Vivino | Wine & Drinks | `https://www.vivino.com/search/wines?q={wine}` |
| Drizly | Wine & Drinks | `https://drizly.com/liquor-store-locator` |
| CellarPass | Wine & Drinks | `https://www.cellarpass.com/wineries/{region}` |
| Cozymeal | Couples Events | `https://www.cozymeal.com/{city}/cooking-classes` |
| Fever | Couples Events | `https://feverup.com/en/{city}/events` |
| Vagaro | Wellness | `https://www.vagaro.com/{city}/{service}` |
| ClassPass | Wellness | `https://classpass.com/classes/{city}` |
| Fandango | Movies | `https://www.fandango.com/search?q={movie}` |
| Points of Light | Volunteering | `https://www.pointsoflight.org/handsonnetwork` |
| SevenRooms | Restaurants | Venue-specific URLs |

---

## 🔑 Environment Variables Reference

> Complete `.env` reference for all API integrations. Copy to `.env.example` and populate via secrets manager.

```bash
# ============================================================
# AUTO-REGISTERED BY JARVIS (self-serve, instant)
# ============================================================
TICKETMASTER_API_KEY=
SEATGEEK_CLIENT_ID=
SEATGEEK_CLIENT_SECRET=
TMDB_API_KEY=
OMDB_API_KEY=
WATCHMODE_API_KEY=
TRAKT_API_KEY=
GOLF_COURSE_API_KEY=
NPS_API_KEY=
RIDB_API_KEY=
SETLISTFM_API_KEY=
EVERY_ORG_API_KEY=
GLOBAL_GIVING_API_KEY=
FOURSQUARE_API_KEY=
TRIPADVISOR_API_KEY=

# ============================================================
# NO KEY NEEDED (free, open — hardcode the base URLs)
# ============================================================
OSM_OVERPASS_URL=https://overpass-api.de/api/interpreter
NPS_API_URL=https://developer.nps.gov/api/v1
OPEN_BREWERY_DB_URL=https://api.openbrewerydb.org/v1
TVMAZE_URL=https://api.tvmaze.com
NWS_URL=https://api.weather.gov
PROPUBLICA_URL=https://projects.propublica.org/nonprofits/api/v2
MOBILIZE_URL=https://api.mobilize.us/v1

# ============================================================
# JAKE REGISTERS — THIS WEEK (fast approval)
# ============================================================
VIATOR_API_KEY=
GROUPON_TS_TOKEN=
HOTELBEDS_API_KEY=
HOTELBEDS_SECRET=
LITE_API_KEY=
BANDSINTOWN_APP_ID=
INTERNATIONAL_SHOWTIMES_KEY=

# ============================================================
# JAKE REGISTERS — THIS MONTH (business approval)
# ============================================================
GOLFNOW_API_KEY=
OPENTABLE_CLIENT_ID=
OPENTABLE_CLIENT_SECRET=
IDEALIST_API_KEY=
MINDBODY_API_KEY=
GETYOURGUIDE_API_KEY=
EXPEDIA_RAPID_API_KEY=
BOOKING_COM_API_KEY=

# ============================================================
# JAKE REGISTERS — LOWER PRIORITY (when above are live)
# ============================================================
UNTAPPD_CLIENT_ID=
UNTAPPD_CLIENT_SECRET=
SEATGEEK_CLIENT_SECRET=

# ============================================================
# DO NOT USE — DEPRECATED / UNAVAILABLE AS OF SEP 2026
# ============================================================
# AMADEUS_API_KEY=  ← Enterprise only since Jul 17, 2026. Skip.
# YELP_API_KEY=     ← $229/mo minimum. Not cost-effective. Skip.
```

---

## 📋 Decision Log

| Decision | Rationale |
|----------|-----------|
| Skip Amadeus | Shut down free/self-serve Jul 17 2026. Enterprise contracts only. Not viable. |
| Skip Yelp for primary | $229/mo minimum for production. Use Google Places + Foursquare instead. |
| LiteAPI before Expedia/Booking | LiteAPI is instant self-serve — gives us hotel booking NOW while Expedia/Booking.com approvals come through (2–4 weeks). |
| TMDB for Netflix Shows | Netflix has no public API. TMDB's watch providers endpoint (Netflix = ID 8) is the best official-ish alternative. |
| OSM Overpass for Hiking | AllTrails has no API. OSM Overpass is free, global, and reliable for trail geometry. |
| Deep links for Resy/Tock | No APIs exist. Deep links maintain user flow to reservation. Better than nothing. |
| setlist.fm for Concerts | Unique historical setlist dataset — good for "Artist played your city last year" features. |

---

*Last updated: September 2026 — TogetherPlans Engineering*
