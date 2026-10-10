# Research Report: Static/Semi-Static Data Acquisition Feasibility for DateMeUp

**Date:** October 10, 2026
**Audience:** Technical founder, build-vs-buy decision
**Question:** Should DateMeUp replace or supplement live API calls (Ticketmaster, Foursquare, Overpass, PredictHQ, Viator, LiteAPI, TMDB, Tavily, Gemini) with a self-hosted, pre-populated venue/activity database?

**TL;DR verdict up front:** Yes — but only for the *venue* half of the app, and the answer changed dramatically in Nov 2024 when **Foursquare open-sourced its entire 100M+ POI dataset under Apache 2.0** (free, commercial use allowed, no share-alike). You can build a US venue database covering ~10 of your 15 categories for roughly **$0 in data cost and ~$30–80/mo in infrastructure**, loaded into the PostGIS extension of the Cloud SQL instance you already run. Events (concerts, comedy shows, sports games, family events) must stay live — no static approach works for dated inventory. The single best first step: load FSQ OS Places (US slice) + OSM trails into PostGIS behind your existing category endpoints, keep Ticketmaster/PredictHQ live, and measure coverage lift. Details and dissent below.

---

## 1. Data Sources Audit

### 1.1 The game-changers (read these first)

| Source | What it is | Coverage | License | Cost |
|---|---|---|---|---|
| **Foursquare OS Places** (opensource.foursquare.com/os-places) | The full FSQ POI dataset: 100M+ POIs globally (~23M US), with categories, names, lat/lon, addresses, websites, phone, social links. Updated monthly as Parquet on S3/Hugging Face. | Global | **Apache 2.0** — commercial use, modification, redistribution all allowed; attribution in a NOTICE file is all that's required. No share-alike. | **Free** |
| **Overture Maps Places** (overturemaps.org) | ~64–81M places merged from Meta (58.8M), Microsoft (6.1M), Foursquare (4.1M), BrightQuery (10.3M), AllThePlaces, etc. Monthly releases as GeoParquet on AWS/Azure. Includes confidence scores. | Global | **CDLA-Permissive-2.0** (Apache-like for data; no share-alike) for the places theme | **Free** |
| **OpenStreetMap** (planet/Geofabrik extracts) | What you already query live via Overpass — but as a bulk download. US extract ~10GB PBF. Restaurants, bars, gyms, trails, parks, cinemas, museums, viewpoints. | Global | **ODbL** — share-alike applies to *derivative databases* (see §4) | Free |
| **AllThePlaces** (alltheplaces.xyz) | Scrapers of official brand store-locator pages; ~5M+ POIs, chain businesses, very fresh (weekly runs). | Global, chain-heavy | **CC0** (public domain) | Free |

**Key implication:** the thing you're currently paying Foursquare per-call for is, as of late 2024, downloadable in full for free under a permissive license. This alone changes the economics of your question.

### 1.2 Per-category source audit

**Restaurants & Dining**
- Best: FSQ OS Places (`4d4b7105d754a06374d81259` dining tree; ~1.2–1.5M US food POIs) + Overture places cross-check + AllThePlaces for chains. Free, commercial-OK.
- OSM: ~400–600k US `amenity=restaurant/cafe/bar` — thinner than FSQ, patchy rural, but adds outdoor seating/cuisine tags.
- Commercial upgrade: **SafeGraph Places** (~$10k–50k+/yr custom contracts, >90% fill rates, visit-pattern data you don't need), **Data Axle** (licensing deals typically $10k–100k+/yr for the full 17M US business file; their self-serve API plans $30–75/mo are tiny quotas), **Yelp Fusion** (API only, caching prohibited beyond 24h; the famous **Yelp Open Dataset is education-only — explicitly bans commercial use**), **Google Places** (ToS §3.2.3 bans bulk export, pre-fetching, caching >30 days, and building a database — a hard no).
- Scraping Yelp/Google/TripAdvisor: ToS violation, active enforcement, reputational and legal risk. Don't. Not needed anyway.
- Verdict: **FSQ OS + Overture is sufficient. $0.**

**Live Music & Concerts**
- Inherently dynamic (dated inventory). No static dataset of *upcoming concerts* exists for purchase at startup prices.
- Static piece: the **venues** (amphitheaters, clubs, arenas). FSQ OS "Music Venue"/"Concert Hall" categories (~15–25k US) + OSM `amenity=music_venue/theatre`. NIVA counts ~3,000 independent US venues.
- Ticketmaster Discovery API ToS: cache only "for reasonable periods" — you can cache event responses for hours/days but cannot archive their catalog as your database.
- Keep live: Ticketmaster (free tier 5k calls/day), PredictHQ (paid, custom pricing typically $500–2k+/mo — this is likely one of your biggest line items; FSQ OS venue data + Ticketmaster may let you drop it), plus free alternatives: **Bandsintown API** (free for app partners), **SeatGeek API** (free tier).
- Verdict: **venues static, events live.**

**Comedy**
- Static venues: FSQ OS "Comedy Club" (~500–800 US dedicated clubs) + OSM. Small category; could be hand-curated for the top 100 metros in a weekend.
- Shows: Ticketmaster covers major tours; club calendars need live/Tavily. Verdict: **venues static, schedules live.**

**Sports & Active**
- Bowling (~3,500 US centers), climbing gyms (~700), mini-golf, skating rinks, batting cages, go-karts, pool halls, gyms (~115k US fitness facilities per IHRSA): all in FSQ OS + OSM `leisure=*`. Excellent static fit.
- Pro sports games: Ticketmaster/ESPN APIs, live. Verdict: **mostly static.**

**Hiking & Outdoors**
- **USGS National Digital Trails dataset** (public domain, free bulk download via National Map) — nationwide aggregated trails.
- **OSM** is actually the gold standard here: US trail coverage in OSM is *better than any commercial source* (AllTrails itself builds on OSM). `highway=path/footway` + `route=hiking` relations; hundreds of thousands of US trail segments.
- **PAD-US** (USGS Protected Areas Database, public domain): every park, forest, wildlife area boundary in the US. **NPS API** (free, public domain): all 429 park units, amenities, alerts. **Recreation.gov RIDB API** (free, gov open data): campgrounds, rec areas, permits.
- State open-data portals: most states publish state-park and trail shapefiles, usually public domain or CC-BY.
- Verdict: **best-served category for static; entirely free and public domain. This is where your current Overpass-only coverage is weakest rurally and where a bulk load helps most.**

**Movies**
- Theaters: FSQ OS + OSM `amenity=cinema` (~5,800 US cinema sites per NATO). Static.
- Showtimes: no free bulk source; **Gracenote/TMS** (Nielsen) licenses showtimes data (enterprise, ~$1k+/mo), **SerpAPI showtimes** scrape (~$75+/mo, gray area). TMDB (which you use) explicitly *allows* caching movie metadata with attribution — keep it, cache aggressively.
- Verdict: **theaters static, showtimes stay live or stay a known gap.**

**Streaming Night**
- TMDB + JustWatch availability data. TMDB ToS permits caching; JustWatch partner API is B2B. No geo component — tiny dataset, cache everything. Verdict: **effectively static already; just add a cache table.**

**Wellness & Spa**
- FSQ OS "Spa", "Massage Studio", "Nail Salon", "Yoga Studio" etc. (~22k US spa locations per ISPA, plus ~40k massage/yoga). OSM coverage weak here (~20–30% of FSQ's). Verdict: **static via FSQ OS.**

**Volunteering**
- Hardest category. No good open POI dataset — volunteering is opportunity-based (dated), not venue-based.
- **VolunteerMatch** has a partner API (application required, often free for mission-aligned apps). **Idealist** API similar. **AmeriCorps/ VolunteerMatch, Points of Light** — partnership route.
- IRS **Exempt Organizations BMF** (free, public domain): every 501(c)(3) with address — usable as a static "nonprofits near you" layer but addresses are often offices, not opportunities.
- Verdict: **partner (VolunteerMatch), don't build.**

**Arts & Culture**
- **IMLS Museum Data Files** (free, public domain): ~30k US museums with lat/lon. FSQ OS galleries/theaters/museums. OSM `tourism=museum/gallery` is decent. Performances stay live (Ticketmaster). Verdict: **venues static (free, gov data), performances live.**

**After Dark**
- Bars, lounges, speakeasies, karaoke, late-night food: FSQ OS nightlife tree (~130k US). FSQ's historic DNA is literally nightlife check-ins — this is its strongest category. Verdict: **static.**

**Family Events**
- Venues (zoos ~230 AZA, aquariums ~60, trampoline parks ~1,000, arcades, children's museums): FSQ OS + IMLS. Static.
- Dated family events (festivals, fairs): PredictHQ/Ticketmaster/Eventbrite live, or Tavily. Verdict: **split.**

**Hotel Stays**
- Static layer: FSQ OS + OSM `tourism=hotel` (~64k US properties per AHLA; FSQ has ~80k+ US lodging POIs including motels/B&Bs). Good for *discovery* ("romantic hotels near you").
- Rates/availability **must** stay live — LiteAPI is already the right call and its ToS requires live pricing. Verdict: **discovery static, booking live.**

**Experiences**
- Viator inventory is contractually theirs — the Viator Partner API prohibits building a standalone database of their product catalog (you may cache per their partner terms, typically 24h). Static complement: FSQ OS "Escape Room" (~2,300 US), wineries (~11k), breweries (~9,700 per Brewers Association; **Open Brewery DB is free/open**), distilleries, paint-and-sip, cooking schools. Verdict: **venue layer static, bookable tours stay Viator.**

**Custom**
- User-generated; Gemini + whatever DB you have. A richer static venue DB makes Gemini grounding *better* (RAG over your own PostGIS instead of Tavily searches). Verdict: **benefits indirectly.**

### 1.3 Commercial vendors — when would you ever pay?

| Vendor | Product | Realistic cost | Verdict for DateMeUp |
|---|---|---|---|
| SafeGraph | Places flat file, custom | $10k–50k+/yr | No — FSQ OS is the same lineage of data, free |
| Data Axle (Infogroup) | 17M US business file license | $10k–100k+/yr | No |
| Precisely / Localeze (Foursquare-owned now) | World Places | enterprise | No |
| Google Places | API only | $17–32/1,000 calls; **bulk storage prohibited** | Legally unusable for this purpose |
| Yelp | Fusion API / Data Licensing | enterprise licensing $$$; open dataset non-commercial | No |
| Gracenote (Nielsen) | Movie showtimes | ~$1k+/mo | Later, if Movies KPIs justify |
| PredictHQ | Events intelligence | ~$500–2k+/mo typical | Candidate to *cut* once Ticketmaster+Bandsintown+SeatGeek cover event needs |

**Bottom line of the audit: for 10 of 15 categories the best source is free and permissively licensed. Money only buys you marginal gains, and the vendors who have genuinely better data than FSQ OS (Google, Yelp) won't sell it to you at any startup-viable price.**

---

## 2. Database Scale Estimation

### 2.1 US record counts (realistic, deduplicated)

| Category | Est. US records | Primary source |
|---|---|---|
| Restaurants/cafés/bars | ~900k–1.2M | FSQ OS (NRA: ~730k restaurant establishments; +cafés/bars) |
| After Dark (nightlife) | ~130k (overlaps above) | FSQ OS |
| Gyms/fitness/active venues | ~150k | FSQ OS (IHRSA: ~115k fitness facilities) |
| Hiking trails (segments→routes) | ~250–400k trail entities | OSM + USGS NDT |
| Parks/protected areas | ~120k | PAD-US + OSM |
| Hotels/lodging | ~90k | FSQ OS (AHLA: 64k hotels + motels/B&Bs) |
| Spas/wellness | ~60k | FSQ OS |
| Museums/galleries/theaters | ~50k | IMLS (30k museums) + FSQ |
| Cinemas | ~6k | FSQ/OSM (NATO: ~5,800) |
| Music/comedy venues | ~25k | FSQ OS |
| Family venues (zoos, arcades, etc.) | ~40k | FSQ OS |
| Experience venues (wineries, breweries, escape rooms…) | ~50k | FSQ OS + Open Brewery DB |
| Nonprofits (volunteering layer) | ~300k (optional) | IRS BMF |
| **Total US venue rows** | **~2–2.5M** (deduped) | |

### 2.2 Storage math

A venue row (id, name, lat/lon geography, category, address, phone, website, hours JSONB, rating, source, attribution) ≈ 1–2 KB. 
- **2.5M rows ≈ 3–5 GB** with GiST spatial index, GIN trigram index on name, and category B-tree. 
- Trail geometries (LineStrings) add ~2–4 GB. 
- **Total: under 10 GB.** This is a *small* database. Your existing Cloud SQL instance barely notices it.
- Worldwide: FSQ OS full = 100M+ rows ≈ 120–200 GB with indexes — still fine on a single modest Postgres instance when you go global. Not a re-architecture event.

### 2.3 Technology

- **PostGIS on your existing Cloud SQL Postgres** — correct and sufficient. `CREATE EXTENSION postgis;` is supported on Cloud SQL. Radius queries via `ST_DWithin` on a GiST index return in single-digit milliseconds at 2.5M rows.
- **pg_trgm** for fuzzy name search. You do not need Elasticsearch at this scale; add it only if search relevance becomes a product problem at >20M rows.
- ETL: DuckDB reads the FSQ/Overture GeoParquet directly from S3 (`SELECT ... FROM read_parquet('s3://fsq-os-places/...')` filtered to US + your categories) and writes CSV → `COPY` into Postgres. A one-day script, re-runnable monthly.

---

## 3. Cost Analysis

### 3.1 Acquisition (one-time)

| Item | Cost |
|---|---|
| FSQ OS Places download (egress via HF/S3) | $0–10 |
| Overture, OSM Geofabrik, USGS, PAD-US, IMLS, IRS BMF, Open Brewery DB | $0 |
| Engineering: ETL + dedupe + category mapping + API integration | ~2–4 founder-weeks (the real cost) |
| **Total cash** | **≈ $0** |

### 3.2 Ongoing infrastructure

- Cloud SQL storage: 10 GB × ~$0.17/GB/mo SSD ≈ **$1.70/mo**. 
- You may want one instance tier bump for query headroom at 50k DAU (e.g., to a 2-vCPU instance): **~$50–100/mo**, and you'd need that for 50k DAU regardless of this project.
- Monthly refresh pipeline: a Cloud Run job reading new FSQ/Overture release, ~1 hr of compute: **<$5/mo**. Quarterly refresh: effectively free; the cost is the cron job existing.

### 3.3 Query cost at 50k DAU

50k DAU × 3 queries ≈ 150k queries/day ≈ 4.5M/mo.

| Approach | Est. monthly cost |
|---|---|
| **Live APIs** (status quo at scale): Foursquare Places API (~$3–5/1k calls on paid tiers), Google-class pricing if you ever switched ($17–32/1k), PredictHQ subscription, Tavily ($0.005–0.01/search), Gemini calls | **$8,000–25,000/mo** if most requests hit paid APIs; even aggressive caching leaves you $2–5k/mo + PredictHQ sub |
| **Static venue DB + live events only**: Postgres queries (marginal cost ≈ $0), Ticketmaster free tier / Bandsintown free, TMDB free, LiteAPI per-booking, Tavily only for Custom/long-tail, Gemini only for plan generation | **$300–1,500/mo** (dominated by Gemini + Tavily + any paid event API) |

**TCO delta at 50k DAU: roughly $5k–20k/mo saved**, plus elimination of rate-limit ceilings (Ticketmaster's 5k/day free tier would be exhausted by ~1,700 DAU of event queries if every request hit it live — caching into your DB with short TTLs fixes this within their ToS).

At your *current* <1k DAU, live API costs are near zero on free tiers — the savings today are ~$0. The build is a bet on (a) scale and (b) the coverage/reliability improvements, not on today's bill.

### 3.4 Refresh economics

POI churn is ~5–10%/yr (restaurant closures skew high, ~10–15%). A **monthly** full re-sync from FSQ OS releases costs pennies and keeps staleness bounded at 30 days — better freshness than many paid vendors' quarterly files. Stale-closure risk (recommending a dead restaurant) is the main quality tax of going static; mitigate with FSQ's `date_closed` field, Overture confidence scores, and a user "report closed" button.

---

## 4. Legal & Licensing Risk

**Green — explicitly safe for a proprietary commercial database:**
- FSQ OS Places: Apache 2.0. Keep the NOTICE/attribution file. Done.
- Overture places theme: CDLA-Permissive-2.0. Attribution per docs. No share-alike.
- US government data (USGS, NPS, PAD-US, IMLS, IRS, Recreation.gov): public domain (17 U.S.C. §105). Zero restrictions.
- AllThePlaces: CC0.
- Open Brewery DB: open.
- TMDB: free commercial API with attribution; caching allowed.

**Yellow — usable with care:**
- **OSM/ODbL:** share-alike applies to "derivative databases." If you *mix* OSM rows into the same table as FSQ rows and the result is a derivative database, ODbL arguably requires you to offer that database (or the diff) publicly on request. The OSMF's Collective Database Guideline gives an out: keep OSM-sourced data in a **separate table/column-set** (a "collective database"), don't use OSM data to correct/augment non-OSM rows, and share-alike stays contained to the OSM part — which is already public anyway. Practical rule: `venues_fsq` and `trails_osm` as separate sources with a UNION view, never cross-pollinated. This is a well-trodden pattern; risk is low if you follow it. Attribute "© OpenStreetMap contributors" in-app.
- Ticketmaster/Viator/LiteAPI: cache within ToS windows ("reasonable period" / ~24h). Short-TTL event cache tables are fine; a permanent archive of their catalogs is not.

**Red — do not use for bulk:**
- **Google Places:** ToS explicitly prohibits caching beyond 30 days, bulk export, and creating a database. No workaround. 
- **Yelp:** Open Dataset is education-only; Fusion API prohibits >24h caching; scraping violates ToS.
- **Scraping at scale (Yelp/TripAdvisor/Google/AllTrails):** *hiQ v. LinkedIn* ended badly for the scraper — the 9th Circuit said public scraping likely isn't a CFAA violation, but on remand hiQ **lost on breach-of-contract (ToS)** grounds, settled, took a permanent injunction, and deleted everything. Translation: CFAA criminal risk is low for public pages, but civil ToS/contract liability is alive and well, and a funded startup is a suable target. With FSQ OS free, scraping has negative expected value. Don't.

---

## 5. Coverage Quality Assessment

- **OSM urban US:** good-to-excellent for restaurants/bars in major metros (estimated 60–85% completeness vs. ground truth), weak for hours/phone/website attributes.
- **OSM rural US:** poor for businesses (often <30% of POIs mapped; a rural town may show 2 of its 9 restaurants). **This matches your observed thin non-urban coverage — the problem isn't Overpass, it's OSM's rural business data.**
- **OSM trails/parks:** best-in-class, including rural — the mapping community prioritizes outdoors. Keep OSM as the trail source.
- **FSQ OS rural US:** materially better than OSM for businesses — FSQ's data came from a decade of check-ins plus commercial aggregation; small-town restaurants, bowling alleys, and diners are present at an estimated 80–90%+ completeness. Weaknesses: some stale/closed venues, duplicate records (use their dedupe flags), thin attributes for long-tail POIs.
- **Overture (Meta-sourced):** 58M of its places come from Facebook business pages — strong for small businesses that have a FB page but no other web presence (very common in rural America). Cross-joining FSQ + Overture and keeping high-confidence union rows is the best free coverage achievable, and it is genuinely competitive with SafeGraph/Data Axle paid files.
- **Biggest residual gaps:** movie showtimes, small-club event calendars, volunteering opportunities, and real-time anything. None are solved by purchased static data either — they're live-data problems.
- **Is purchased data materially better?** For your use case (discovery, not fulfillment): **no.** Paid vendors win on attribute fill (phone, hours, chain hierarchy) and closure detection, not on raw coverage. Not worth $10k+/yr at this stage.

---

## 6. Hybrid Approach Analysis

The correct architecture is unambiguous — a **static spine + live edges** model:

| Category | Static (your PostGIS) | Live (API, short-TTL cache) |
|---|---|---|
| Restaurants & Dining | ✅ everything | — |
| After Dark | ✅ everything | — |
| Wellness & Spa | ✅ everything | — |
| Sports & Active | ✅ venues | pro-game schedules (Ticketmaster) |
| Hiking & Outdoors | ✅ everything | weather/alerts (NPS API) |
| Arts & Culture | ✅ venues/museums | performance dates |
| Movies | ✅ theaters; TMDB metadata cached | showtimes |
| Streaming Night | ✅ cached TMDB/JustWatch | — |
| Hotel Stays | ✅ property discovery | rates/availability (LiteAPI) |
| Experiences | ✅ wineries, breweries, escape rooms… | bookable tours (Viator) |
| Family Events | ✅ venues | dated events |
| Live Music & Concerts | ✅ venues | events (Ticketmaster/Bandsintown) |
| Comedy | ✅ clubs | show calendars |
| Volunteering | partial (IRS orgs) | VolunteerMatch partner API |
| Custom | DB as Gemini grounding corpus | Tavily fallback |

Estimated request mix for a date-night app: **~70–80% of result cards are venue-type (static-servable); ~20–30% are dated events.** The hybrid model removes rate limits, third-party downtime, and per-call cost from the majority path, while the event path keeps freshness. It also unlocks product capability you can't build on live APIs: cross-category "plan a full evening" queries (dinner + trail + bar within one `ST_DWithin` radius) in one SQL query instead of four rate-limited API fan-outs — plus better Gemini grounding.

---

## 7. Feasibility Verdict

**Viable? Yes — unusually so.** This would have been a $50k+/yr data-licensing question in 2023. Post-FSQ-open-sourcing, it's a 2–4 week engineering project with ~zero cash cost, a <10 GB database on infrastructure you already run, and a permissive-license legal posture. The risks are engineering time (the scarce resource at your stage) and data staleness (manageable with monthly refreshes).

**What it is NOT:** a replacement for event APIs. Anyone selling you a "static events database" is selling stale data. Events stay live, full stop.

**Phased implementation:**
- **Phase 1 (MVP, ~1–2 weeks):** DuckDB script pulls FSQ OS US slice for your category taxonomy → dedupe → `COPY` into a `venues` table in Cloud SQL with PostGIS + pg_trgm indexes. Map FSQ categories → your 15 categories. Route Restaurants, After Dark, Wellness, Sports-venues, Hotels-discovery through it with live-API fallback when results < N. Ship behind a flag; measure result-count lift in rural test geos.
- **Phase 2 (~1 week):** OSM trails + PAD-US parks + NPS + IMLS museums into separate source tables (ODbL isolation). Hiking & Outdoors and Arts & Culture venue layers go static.
- **Phase 3 (~1 week):** Overture cross-merge for coverage union; monthly refresh Cloud Run job; "report closed" feedback loop; event-response cache tables (24h TTL) to stretch Ticketmaster's free tier.
- **Phase 4 (later/optional):** drop PredictHQ if Ticketmaster+Bandsintown+SeatGeek suffice; evaluate Gracenote showtimes if Movies engagement warrants; VolunteerMatch partnership.

**Minimum viable dataset that materially improves the product:** Phase 1 alone — FSQ OS restaurants/nightlife/wellness/active/hotels (~1.5M US rows). It directly attacks your stated pain (rural coverage, rate limits, per-call cost) in the categories with the most user demand.

**Build vs. buy vs. partner:** **Build on open data.** Buy nothing (revisit SafeGraph/Gracenote only post-traction). Partner for volunteering (VolunteerMatch) and keep existing partners for bookables (LiteAPI, Viator).

---

## 8. Recommendation

**Do it, now, in the Phase 1 scope — and stop there until the metrics tell you more.**

Reasoning, without hedging:
1. The marginal cost collapsed to ~zero. FSQ OS Places under Apache 2.0 is the exact dataset you're paying to query live, available in bulk, free, commercially. Not loading it is leaving your main coverage/cost/reliability problem unsolved out of inertia.
2. It fixes your actual complaint. Rural coverage is thin because Overpass reflects OSM's rural business gaps; FSQ OS is markedly denser there. Rate limits and uptime dependency vanish for ~75% of request volume.
3. It's cheap insurance against your scaling cliff. At 50k DAU the live-API path costs $5k–20k/mo and hits free-tier walls at ~2k DAU. The static path costs <$100/mo. You don't need the savings today, but you need the architecture before growth, and it's 2 weeks of work now vs. a fire drill later.
4. The things it can't do (events, showtimes, availability, volunteering), no purchasable static dataset can do either — so "buy a full proprietary database" is off the table regardless. The hybrid is the only coherent design.

**What NOT to do:** don't buy SafeGraph/Data Axle, don't scrape Yelp/Google/AllTrails, don't bulk-store Google Places or Ticketmaster catalogs (ToS), don't attempt a static events DB, and don't let this become a 3-month data-platform project — the MVP is a single table, one ETL script, and a fallback path.

**Single best first step:** one afternoon spike — run DuckDB against the FSQ OS Places S3 bucket, extract all US POIs in your dining + nightlife categories for two test markets (one major metro, one rural county where coverage is currently bad), load into a PostGIS table, and compare result counts against your current live Foursquare responses for the same queries. If the rural lift is real (it will be), proceed to Phase 1.

---

### Appendix: key sources
- Foursquare OS Places: https://opensource.foursquare.com/os-places/ (Apache 2.0, 100M+ POIs, monthly)
- Overture Maps Places guide + licensing: https://docs.overturemaps.org/guides/places/ , https://docs.overturemaps.org/attribution/ (CDLA-P-2.0; Sept 2026 release ~81M source rows across providers)
- OSM ODbL + Collective Database Guideline: https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ
- USGS National Digital Trails: https://www.usgs.gov/national-digital-trails/data
- PAD-US, NPS API, Recreation.gov RIDB, IMLS Museum Data Files, IRS EO BMF — all US-gov public domain
- US restaurant count ~720–730k establishments (National Restaurant Association / industry stats)
- US hotels: 64,000+ properties, 5.7M rooms (AHLA 2025 State of the Industry)
- Yelp Open Dataset ToU (non-commercial): https://business.yelp.com/data/resources/open-dataset/
- Ticketmaster Partner API ToU (caching limits): https://developer.ticketmaster.com/support/terms-of-use/partner/
- hiQ v. LinkedIn outcome (ToS breach, permanent injunction, data deletion): ZwillGen & Morgan Lewis analyses, Dec 2022
- AllThePlaces (CC0): https://www.alltheplaces.xyz/
