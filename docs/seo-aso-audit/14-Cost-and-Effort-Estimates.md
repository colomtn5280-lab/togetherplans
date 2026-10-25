# 14 — Cost and Effort Estimates

**Scope:** All SEO/ASO recommendations from this audit series
**Last updated:** October 2026
**Assumptions:** One developer, one designer (optional), Jake handling non-engineering tasks

---

## Summary Table

| Tier | Items | Engineering Hours | Design Hours | Monthly Ongoing | Cost ($) |
|------|-------|------------------|--------------|-----------------|----------|
| Zero-cost, immediate | 4 items | 0h | 0h | 0h | $0 |
| Low effort | 7 items | 8–18h | 0h | 0h | $0 |
| Medium effort | 5 items | 8–24h | 4–8h | 0h | $0 |
| Higher effort | 4 items | 40–80h | 16–40h | 0h | $0–500 |
| Ongoing (monthly) | 5 recurring | 0h | 1–2h | 4–8h | $0–150 |
| **Total** | | **56–122h** | **21–50h** | **4–8h/mo** | **$0–650/mo** |

All recommendations are achievable with **zero paid tooling at launch**. Optional paid tools listed at the bottom.

---

## Tier 1: Zero-Cost, Immediate (0 Engineering Hours)

These require no code changes. Jake or any admin can do them in a browser session.

| Task | Who | Time | Instructions |
|------|-----|------|-------------|
| **Google Search Console** — verify datemeup.app | Jake | 15 min | Add DNS TXT record in Cloudflare dashboard. See `10-Analytics-and-Measurement.md §1`. |
| **Bing Webmaster Tools** — verify datemeup.app | Jake | 15 min | Go to bing.com/webmasters → Add site → DNS verification. Bing has ~7% of US desktop search. |
| **App Store Connect metadata** — update Name, Subtitle, Keywords, Promotional Text, Description | Jake | 45 min | All metadata changes in ASC → App Information. No new build required for metadata. Resubmit for review only if binary changes. |
| **Google Play Console metadata** — update Title, Short Description, Full Description | Jake | 30 min | Play Console → Store presence → Main store listing. Goes live within hours, no review required. |

**Total: ~2 hours, $0, no engineering needed.**

---

## Tier 2: Low Effort (1–4 Hours Each)

Mostly configuration files and single-file edits. One developer, no design work required.

| Task | Engineering Hours | Complexity | Notes |
|------|------------------|------------|-------|
| **`robots.txt`** — create at `web/public/robots.txt` | 0.5h | Trivial | Allow all, point to sitemap. Cloudflare Pages serves `public/` at root. |
| **`sitemap.xml`** — static sitemap for public pages | 1h | Low | Only 4–5 public URLs: `/`, `/about`, `/privacy`, `/terms`, `/invite`. Static XML file in `public/`. |
| **AASA file** (`apple-app-site-association`) — iOS Universal Links | 2h | Low-medium | JSON file at `/.well-known/apple-app-site-association`. Enables Smart App Banner and Universal Links. Requires Cloudflare Pages `_headers` for correct MIME type. |
| **`assetlinks.json`** — Android App Links | 1h | Low | JSON file at `/.well-known/assetlinks.json`. Enables Android intent routing from web to app. |
| **Smart App Banner** — iOS | 0.5h | Trivial | Add `<meta name="apple-itunes-app" content="app-id=6806890578">` to `index.html`. Shows native "Open in App" banner in Safari. |
| **Canonical tags** — prevent duplicate content | 1h | Low | Add `<link rel="canonical" href="...">` to `index.html` via Vite plugin or hardcoded for SPA. |
| **Schema.org JSON-LD** — SoftwareApplication markup | 2h | Low | Add structured data to `index.html` `<head>`. Eligible for rich results in Google Search. See `03-Technical-SEO-Audit.md`. |

**Subtotal: 8–18h engineering, $0.**

---

## Tier 3: Medium Effort (1–3 Days)

Requires non-trivial development work but no architectural changes.

| Task | Engineering Hours | Design Hours | Notes |
|------|------------------|--------------|-------|
| **Static pre-rendering** for public pages | 8–16h | 0h | Use `vite-plugin-prerender` or Cloudflare Worker for SSR-on-edge. Targets `/`, `/about`, `/privacy`, `/terms`. Solves the SPA crawlability problem. Biggest SEO ROI item in the audit. |
| **Unique per-page meta tags** | 4h | 0h | React Helmet or `vite-plugin-html`. Each public page gets its own `<title>`, `<meta description>`, `<og:*>`. |
| **OG image generation** | 4–8h | 2–4h | Static OG image (1200×630) for social shares. Can use a designed PNG or dynamic generation via Cloudflare Worker + Satori. |
| **Content landing pages** | 8–16h | 2–4h | 3–5 static pages: `/date-night-ideas`, `/couples-app`, `/date-night-planner`. Target long-tail keywords. Built as pre-rendered HTML or Astro pages. |
| **GA4 + Firebase event instrumentation** | 4–8h | 0h | See `10-Analytics-and-Measurement.md §2–3`. 10 events, two platforms. |

**Subtotal: 28–48h engineering, 4–8h design, $0.**

---

## Tier 4: Higher Effort (1–2 Weeks)

Significant investment. Prioritise carefully — most have moderate SEO ROI relative to cost.

| Task | Engineering Hours | Design Hours | Notes | Recommendation |
|------|------------------|--------------|-------|---------------|
| **App Store screenshots** (8 screens × 2 platforms) | 2h (integration) | 16–32h | Requires a designer who knows Figma and App Store specs. Can use screenshot automation tools (AppScreens.io, Previewed.app) to reduce design hours to 8h. | ✅ **Do this** — screenshots are the #1 conversion driver on both stores. |
| **App Preview video** (iOS) | 4h dev | 8h video/design | 15–30 second video showing the Propose → Vote → Match flow. Record via simulator, edit in Final Cut / CapCut. | ✅ **High ROI** — lifts iOS CVR 20–35%. |
| **Blog/content section** | 16–40h | 0h | CMS integration (Contentful, Sanity, or Markdown files). Enables long-tail SEO content: "50 Date Night Ideas," "Best Date Night Apps," etc. | 🟡 **Medium priority** — content compounds over time but takes months to rank. Build after core app is stable. |
| **Full SSR migration** | 40–80h | 0h | Move from Vite SPA to Next.js or Remix for server-side rendering. **Not recommended at this stage** — the pre-rendering approach achieves 80% of the SEO benefit at 10% of the cost. SSR is a significant architecture change with ongoing complexity. | ❌ **Skip for now** — marginal gain over pre-rendering doesn't justify the rewrite cost. |

**Subtotal: 22–130h engineering (excluding SSR), 24–40h design.**

---

## Tier 5: Ongoing Monthly (Post-Launch)

| Activity | Who | Time/Month | Cost/Month | Notes |
|----------|-----|------------|------------|-------|
| **Content publishing** | Jake or contractor | 4–8h | $0 (self-written) or $200–500 (contracted) | 1–2 blog posts per month targeting date night keywords. Compounds over 6–12 months. |
| **ASO A/B testing** | Jake | 1h | $0 | Review App Store Connect Product Page Optimization and Play Store Listing Experiments results monthly. Update losing variants. |
| **Review responses** | Jake | 1h | $0 | Reply to all 1-star and 2-star reviews within 48h. Respond to positive reviews when time allows. |
| **GSC monitoring** | Jake | 1h | $0 | Weekly check: impressions trend, coverage errors, Core Web Vitals. Fix any new crawl errors. |
| **Keyword rank tracking** | Jake | 1h | $0 (manual) or $50–150 (AppTweak/AppFollow) | Track position for target keywords: "date night planner," "date night app," "date ideas couple." |

**Subtotal: 7–11h/month, $0–650/month.**

---

## Optional Paid Tools (Not Required at Launch)

These tools add efficiency but are not blocking. Evaluate after the app has 3+ months of data.

| Tool | Cost | Use Case | Recommendation |
|------|------|----------|---------------|
| **AppFollow** | $50–100/mo | ASO rank tracking, review management, competitor monitoring | Consider at 500+ installs |
| **AppTweak** | $69–149/mo | ASO keyword research, market intelligence, competitor analysis | Consider when running paid UA campaigns |
| **Ahrefs / Semrush** | $99–129/mo | Web SEO keyword research, backlink analysis, content ideas | Consider when content section launches |
| **AppScreens.io** | $29–99 one-time | Screenshot design automation | Use for initial screenshot creation to reduce design hours |
| **Previewed.app** | $29/mo | App mockup and video generation | Alternative to AppScreens |

---

## AI / Hermes Usage Estimate

| Phase | Estimated Tokens | Notes |
|-------|-----------------|-------|
| This audit (7 documents) | ~15,000–20,000 tokens | Research, analysis, document generation |
| Implementation — pre-rendering | ~10,000–20,000 tokens | Code generation, testing, debugging |
| Implementation — analytics | ~5,000–10,000 tokens | Event schema, GA4 config, Firebase setup |
| Implementation — content landing pages | ~15,000–30,000 tokens | Copy, HTML, routing, SEO meta |
| App Store screenshots (if Hermes assists design) | ~5,000–10,000 tokens | Figma prompts, copy iteration |
| Blog content (per post) | ~3,000–5,000 tokens per post | If using Hermes to draft/edit |
| **Total (audit + implementation)** | **~53,000–95,000 tokens** | Spread across multiple sessions |

---

## Phased Delivery Plan

### Phase 0 — This Week (0 hours engineering)
1. GSC DNS verification
2. Bing Webmaster Tools verification
3. App Store Connect metadata update (Name, Subtitle, Keywords, Description, Promo Text)
4. Play Store metadata update (Title, Short Description, Full Description)

**Result:** First measurable improvements in ASO and search visibility within 1–2 weeks.

### Phase 1 — Next Sprint (8–18h engineering)
1. `robots.txt` and `sitemap.xml`
2. Schema.org JSON-LD
3. Smart App Banner meta tag
4. AASA + assetlinks.json
5. GA4 tag + core 5 events (sign_up, create_proposal, vote_cast, match_achieved, invite_sent)

**Result:** Search crawlability fixed, app linking ready, basic analytics live.

### Phase 2 — Following Sprint (28–48h engineering + design)
1. Static pre-rendering for public pages
2. Unique per-page meta tags + OG images
3. Full Firebase Analytics instrumentation
4. App Store screenshots and App Preview video (parallel design track)

**Result:** Core SEO problems solved. Store conversion rate tracking live.

### Phase 3 — Month 2–3 (varies)
1. Content landing pages (3–5 pages targeting date night keywords)
2. Blog section (optional)
3. Looker Studio analytics dashboard
4. ASO A/B tests launched

**Result:** Organic content strategy underway. Full measurement visibility.

---

## ROI Summary

| Investment | Effort | Expected Organic Impact (6 months) |
|------------|--------|-------------------------------------|
| Metadata updates (iOS + Android) | 2h (Jake) | +15–30% store search CVR |
| Pre-rendering | 8–16h dev | Indexable by Google — enables all web SEO |
| Schema.org markup | 2h dev | Rich results eligibility — +10–20% web CTR |
| Screenshots + video | 24h design | +20–35% App Store CVR (video alone) |
| Content landing pages | 16–40h dev | Organic web traffic from long-tail queries |
| Analytics | 8h dev | Data to make all other decisions correctly |

**Highest ROI / lowest effort:** App Store metadata updates + pre-rendering. These two items unlock the largest untapped gains in the shortest time.
