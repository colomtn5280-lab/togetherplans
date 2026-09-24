# TogetherPlans — Full Product Review ("Second Opinion")
**Date:** September 24, 2026
**Scope:** iOS, Android, Web — product vision, UX, API architecture, data quality, cross-platform consistency
**Verdict up front:** The infrastructure is solid and the collaborative core is genuinely differentiated. But the product currently breaks its own promise in 6 of 15 categories, and the discovery experience — the thing users touch first — is where trust is won or lost. Fix data truthfulness before adding any more features.

---

## 1. THE PRODUCT PROMISE vs. REALITY

The pitch: *"easily find fun, creative, engaging activities to share with people you care about."*
The test: a user in Denver taps a category. What do they actually get?

### Live data audit (Denver, Sep 24, production API)

| Category | Results | Sources | Honest assessment |
|---|---|---|---|
| Concerts | 79 | TM 28, PredictHQ 37, FSQ 14 | ✅ Excellent — real, dated, local |
| Golf | 62 | TM 19, PredictHQ 31, FSQ 12 | 🔴 **BROKEN — shows Rockies baseball, NHL hockey, womens volleyball. Zero golf.** |
| Movies | 25 | FSQ 15, TMDB 10 | 🟡 OK — theaters + now-playing, but no showtimes |
| Hiking Trails | 15 | FSQ 15 | 🟡 Thin — NPS/Overpass returning nothing; Foursquare "trailhead" data is weak |
| Comedy | 14 | TM 4, FSQ 10 | 🟡 OK — 4 real shows; FSQ padding is comedy *clubs*, not events |
| Restaurants | 13 | FSQ 13 | 🟡 Works but 13 results in DENVER is thin (should be 50+) |
| Netflix Shows | 8 | TMDB 8 | ✅ Fine for its purpose |
| Wellness & Spa | 12 | seed only | 🔴 Fake — generic ideas, no real businesses |
| Volunteering | 12 | seed only | 🔴 Fake |
| Couples Events | 12 | seed only | 🔴 Fake — includes "Reality TV guilty pleasure night" with no address |
| Family Events | — | seed only (mapped null) | 🔴 Fake |
| Hotel Stays | — | seed only (mapped null) | 🔴 Fake |

### The two failure modes, precisely:

**Failure A — Category betrayal (Golf).** `golf → 'Active'` in NEW_TO_INTERNAL maps to Ticketmaster's Sports segment. A user tapping ⛳ Golf gets baseball tickets. This is worse than an empty state — it teaches the user the app doesn't understand its own categories. Same risk pattern exists anywhere a broad internal category backs a narrow user-facing one.

**Failure B — Seed masquerading as discovery (5 categories).** Seed entries are *idea prompts* ("Escape room", "Pottery painting studio") with no address, no link, no date. Presented in the same card UI as real events, they read as broken search results, not inspiration. A third of the category grid is this.

### Why this matters more than anything else
The category grid is the first tap of every session. If 6 of 15 tiles disappoint, the user's mental model becomes "this app has fake data" — and no amount of match-celebration confetti recovers that. **Data truthfulness is the retention feature.**

---

## 2. FIXES FOR THE DATA LAYER (priority order)

### P0 — Stop the bleeding (days)
1. **Golf:** Foursquare category filter for golf courses + driving ranges + mini golf (FSQ has all three taxonomies). Remove the `golf → Active` Ticketmaster mapping entirely. Golf is a *places* category, not an events category.
2. **Seed honesty:** Render seed results in a visually distinct "Ideas ✨" section with different card styling (no fake-place framing), below any real results, with copy like "No live listings here yet — some ideas to spark the plan." Users forgive missing data; they don't forgive being lied to.
3. **Wellness & Spa:** FSQ has spa/massage/sauna taxonomies — wire them (same pattern as restaurants). This category goes from fake to real in one source file.
4. **Couples/Family Events:** These are *filters*, not sources. Route to Ticketmaster+PredictHQ with `includeFamily=only` (TM supports this natively) for Family; for Couples, query the events sources and filter/rank by evening + duo-friendly heuristics. Imperfect beats fake.

### P1 — Depth (1–2 weeks)
5. **Restaurants:** 13 results in Denver means the FSQ query is over-constrained (radius, limit, or category set). Should be 50+. Also: Google Places key already exists in .env (`GOOGLE_MAPS_API_KEY`) — it's paid-per-call but 10K free/mo basic tier covers current traffic and the data quality is the best available.
6. **Hiking:** NPS + Overpass are wired but returning 0 — debug why (likely radius units or the Overpass query shape). Denver should light up with Front Range trails.
7. **Hotel Stays:** LiteAPI/Nuitee is the fastest self-serve bookable hotel source (from your own API matrix). Until then, honest empty state.
8. **Volunteering:** Mobilize API is free/no-key and already proven working (7 no-key APIs live). Wire it.

### P2 — Differentiation (weeks)
9. **Movies with showtimes** (Gracenote/MovieGlu trial) — "Movies" without showtimes is a metadata browser.
10. **Weather-aware ranking** — NWS is free/no-key and already integrated; boost indoor categories on rainy weekends. This is a cheap "wow, it's smart" moment.
11. **Time-of-day awareness** — don't surface brunch spots at 8pm.

---

## 3. UX / DESIGN REVIEW

### What's genuinely good
- The **Plan Builder** pattern (browse → add to plan strip → finalize) is the right architecture. It mirrors shopping-cart mental models everyone already has.
- Category grid with emoji + tagline is scannable and warm.
- Match celebration with confetti + calendar link — correct emotional peak.
- The mobile floating dock (Plans / Discover / Profile) is clean, modern, correctly minimal.
- Public Discover (guest browsing before signup) is strategically right — let value be felt before asking for commitment.

### The core loop, graded
```
Discover → Add to plan → Pick group → Propose → Others vote → Match! → Calendar/Share
```
The loop itself: **A-.** The activation path to *reach* the loop: **C.**

**Problem: the empty-state chasm.** New user signs up → Dashboard with no groups → must create a group → must invite someone → THAT PERSON must sign up → then vote. The magic moment (a match) requires a second human completing signup. This is the single biggest funnel risk in the product.

**Recommendations, ordered by leverage:**

1. **Solo-start mode.** Let a user build a plan and vote on their own options BEFORE any group exists ("planning for two? Send them a link when you're ready"). The invite becomes *sharing something already made* — dramatically lower friction than "join my empty app."
2. **Invite-to-vote without signup.** The invited partner opens the share link and votes in the browser as a guest — signup happens *after* they've experienced the core value. (JoinPage exists; extend it to guest voting on a specific proposal.) This single change could double conversion of invitees.
3. **First-session payoff:** After onboarding, drop the user directly into Discover pre-loaded with tonight's events for their location — not an empty dashboard. The dashboard is the *return-visit* screen, not the first-visit screen.
4. **Two-taps-to-proposal:** From an event card, "Plan this →" should let you pick a person + date and send in one screen. The current multi-step flow (add to strip → open strip → finalize → pick group → title → date) is 5+ interactions for the most common action ("hey, want to do this Friday?").

### Design language
- Web (teal #0E8C8C + lime, Sora/DM Sans) is fresh and differentiated. It no longer reads "side project."
- 🔴 **Cross-platform drift:** mobile screens carry a hardcoded *legacy* category color map ("Live Music & Concerts", "Cooking & Classes" — categories that no longer exist) in `SuggestionsScreen.tsx`, `CreateProposalScreen.tsx`, and web `SuggestionsPage.tsx` duplicates it with a *third* variant. New categories fall through to grey `#F0F0F0`. Consolidate: one `categories.ts` with `color` added per category, all three clients keyed by category **id**.
- Mobile still uses purple-era `COLORS` constants in places while web is teal — brand should be one thing everywhere. Audit `mobile/src/constants`.

### Naming decision needed
Repo/internal = "DateNight", store/domain = "TogetherPlans", and the app serves couples AND friends/family. The category "Couples Events" beside "Family Events" is fine, but ensure no user-visible "DateNight" strings survive in mobile (audit strings before resubmission — Apple already rejected once; brand inconsistency invites metadata-rejection).

---

## 4. API ARCHITECTURE ASSESSMENT

**Strong:** parallel `Promise.allSettled` fan-out, graceful per-source failure, normalize→dedupe→sort pipeline, cache with event-aware TTL, category resolution accepting slugs + display names + legacy strings. This is a properly built aggregator skeleton. The 117-API matrix work was worth it.

**Weaknesses:**
1. **Zip → lat/lng table is 20 metro prefixes** with fallback to the geographic center of the US (Kansas). A Boulder zip (803xx) silently searches from Kansas — 500 miles of error. Replace with the free `zippopotam.us` API or a proper zip database (a 42K-row CSV, one-time load into Postgres).
2. **The category filter drops uncategorized results** *after* seedOnly short-circuits, but note `filtered = allResults.filter(...)` uses `!s.category || s.category === category` — sources that return adjacent-category items (FSQ returning a bar under `golf` query) leak through if unlabeled. Tighten per-source category requests instead of post-filtering.
3. **No per-source observability.** `sourceSummary` is logged, but you can't answer "which sources are silently failing in prod this week?" Add a `/api/internal/source-health` snapshot (last success timestamp + last result count per source) — 30 minutes of work, permanent debugging leverage. (NPS/Overpass returning 0 right now proves the need — nothing alerted.)
4. **Cache doesn't vary on dateFilter** — `cacheKey` omits it, so "tonight" and "anytime" hit the same key. First query wins and poisons the other for an hour. **This is a live bug.**
5. Seed padding threshold (`minExternal = 5`) mixes seeds into good result sets — combined with Failure B above, real results and idea-prompts interleave. Separate the streams in the API response (`{ results: [...], ideas: [...] }`) so clients can render them differently.

---

## 5. CROSS-PLATFORM CONSISTENCY

| Concern | State |
|---|---|
| Category source-of-truth | 🔴 Triplicated by design ("keep in sync" comment) + legacy color maps diverging NOW. Move to a shared package or codegen step. |
| Auth flows | 🟡 Web: Google + FB + Apple callbacks exist. Mobile: hooks exist for all three. The Sept-21 cross-platform account bug (Android signup → web login fails, no verification email) — **verify this is actually fixed end-to-end; it was never explicitly closed in session history.** |
| Onboarding | Web: 3-step modal. Mobile: OnboardingScreen. Fine to differ in form, but ensure the *content/promise* matches. |
| Plan Builder | Exists on both (contexts + strip/dock). Good parity. |
| After Dark | Web has it in nav; mobile has AfterDarkScreen. Parity OK. |
| iOS build | Still needs: rebuilt binary with current fixes, screenshots, ASC submission. Apple's prior rejection reasons must be addressed explicitly in resubmission notes. |

---

## 6. WHAT MAKES THIS A "COMPELLING FORCE" — STRATEGIC VIEW

The honest competitive frame: the alternative isn't another app — it's the couple's group text plus Google. To beat that, three things must be true:

1. **Discovery must feel alive** (real events, tonight, near me) — currently true in 3–4 categories, fake in 5. → Section 2 is the whole ballgame.
2. **Deciding together must be easier than texting** — guest voting via link (no signup) is the unlock. A share link that says "Sarah proposed 3 things for Friday — tap to vote" is *better* than texting because it's structured. That link is also your viral loop: every proposal shared is an acquisition channel.
3. **The plan must land somewhere real** — calendar integration exists at match time. Consider post-match: reminder day-of, "how was it?" the day after (memory log → the app becomes the couple's shared history — sticky in a way no aggregator can copy).

**Sequencing recommendation:**
- **Week 1:** P0 data fixes (golf, seed honesty, wellness, couples/family filters) + dateFilter cache bug + zip table. *Make the grid honest.*
- **Week 2:** Guest voting via share link + solo-start + first-session lands in Discover. *Fix the activation chasm.*
- **Week 3:** Category color/brand consolidation, mobile brand audit, restaurant depth, hiking debug, source-health endpoint.
- **Week 4:** iOS rebuild + screenshots + resubmission (with all of the above in the binary — resubmit once, strong).
- **Then:** memory log, weather-aware ranking, business portal monetization experiments.

The business portal (routes/pages already scaffolded) is the eventual revenue engine — featured listings from local venues into a high-intent "what should we do" audience is a genuinely good model. But it only works if consumer-side discovery earns trust first. Park it until the grid is honest.

---

## 7. TOP 10 ACTIONS, RANKED

| # | Action | Type | Effort | Impact |
|---|---|---|---|---|
| 1 | Fix Golf (FSQ golf taxonomies, kill →Active map) | Data bug | Hours | Kills a trust-destroyer |
| 2 | Seed results → separate "Ideas" section, distinct styling | UX honesty | 1 day | Grid becomes truthful |
| 3 | Fix cacheKey missing dateFilter | Live bug | Minutes | Correct results |
| 4 | Wire Wellness & Spa via Foursquare | Data | Hours | Fake→real category |
| 5 | Family/Couples → TM/PredictHQ filtered queries | Data | 1–2 days | 2 more fake→real |
| 6 | Guest voting on share links (no signup to vote) | Growth | 2–3 days | Activation + viral loop |
| 7 | Solo-start + first-session lands in Discover | Growth | 2 days | Fixes empty-state chasm |
| 8 | Real zip→geo lookup | Data bug | Hours | Non-metro users |
| 9 | Single category constants w/ colors, all platforms keyed by id | Debt | 1 day | Stops the drift |
| 10 | Source-health internal endpoint + NPS/Overpass debug | Ops | Hours | See silent failures |

*Everything above is executable by Jarvis without external approvals except #5 (may want PredictHQ paid tier eventually) and the iOS resubmission (needs your ASC screenshots sign-off).*
