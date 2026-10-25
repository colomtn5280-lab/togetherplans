# DateMeUp — SEO/ASO Executive Summary Audit

**Audit Date:** October 2026  
**Product:** DateMeUp (brand) / TogetherPlans (internal)  
**URL:** https://datemeup.app  
**Platform:** React 18 + Vite SPA → Cloudflare Pages (CSR-only, no SSR)  
**iOS:** app.togetherplans.datenight (ASC ID 6806890578)  
**Android:** datemeup.app  

---

## TL;DR

DateMeUp has a **working product with real differentiation** and near-zero organic discoverability. The web presence is invisible to search engines: no robots.txt, no sitemap, no structured data, a broken OG image, and no per-page metadata. The App Store and Google Play listings are under the slug `togetherplans` while the brand is `DateMeUp` — a mismatch that leaks direct search traffic. None of the platform's unique features (3-state voting, guest voting, After Dark, invite cards) appear in any indexable copy. These are pre-launch blockers, not nice-to-haves.

The good news: every gap identified has a known fix. Most are configuration files and static HTML additions — no backend changes, no architectural rewrites. A focused 4-week sprint can move the readiness scores from failing to solid before significant paid UA spend begins.

---

## Current SEO/ASO Readiness Scores

| Domain | Score | Rubric |
|--------|-------|--------|
| **Website (Technical SEO)** | **12 / 100** | robots.txt missing (−20), sitemap missing (−20), no canonical tags (−15), broken OG image (−10), no Schema.org (−10), CSR-only SPA (−8), no per-page meta (−5) |
| **iOS App Store (ASO)** | **34 / 100** | Slug mismatch `togetherplans` vs brand `DateMeUp` (−20), title/subtitle keyword optimization unknown (−15), screenshots not audited yet (−15), no Universal Links / AASA file (−10), no Smart App Banner on web (−6) |
| **Android Play Store (ASO)** | **31 / 100** | Package `app.datemeup.datenight` (verify vs task: `datemeup.app`), no assetlinks.json (−15), Play Store listing copy not audited (−15), no App Links deep linking (−15), release listing metadata unknown (−24) |
| **Cross-Platform Discoverability** | **8 / 100** | No AASA file (−25), no assetlinks.json (−25), no Smart App Banner (−20), no UTM tracking on store links (−12), no deferred deep linking (−10) |
| **Analytics / Measurement** | **15 / 100** | No Search Console property verified, no organic keyword baseline, no App Store Connect Analytics review, no Play Console metrics review, no UTM attribution on store links, LCP/CLS not tracked |

**Composite: 20 / 100** — Failing. Insufficient to support any organic growth.

### Score Rubric

Each domain scored on:
- **Foundations** (40 pts): Files that must exist — robots.txt, sitemap, AASA, assetlinks.json, Search Console verification
- **Content signals** (30 pts): Per-page meta, Schema.org, H1 quality, listing copy keyword density
- **Technical performance** (20 pts): LCP, CLS, TTFB, indexability
- **Measurement** (10 pts): Analytics, tracking, attribution

---

## Top 10 Highest-Impact Findings

| # | Finding | Severity | Effort | Impact |
|---|---------|----------|--------|--------|
| 1 | **No robots.txt** — /robots.txt returns SPA HTML. Googlebot sees 200 OK with JavaScript, not directives. Crawl budget wasted on /login, /signup, /vote/* auth routes. | 🔴 CRITICAL | 15 min | Crawl efficiency, indexability |
| 2 | **No sitemap.xml** — Google has no authoritative list of public routes. Cloudflare Pages serves SPA fallback for /sitemap.xml. | 🔴 CRITICAL | 30 min | Indexation rate, coverage |
| 3 | **Broken OG image** — /og-image.png is 3KB (a placeholder/empty file). Every social share renders a blank card. Zero viral coefficient on invite card shares. | 🔴 CRITICAL | 2 hrs | Social traffic, app installs from shares |
| 4 | **No Apple App Site Association** — Deep links to /join/:token and /vote/:shareToken open in mobile browser, not the app. Breaks every shared invite flow on iOS. | 🔴 CRITICAL | 1 hr | iOS conversion, sharing loop |
| 5 | **No Android assetlinks.json** — Same problem on Android. Shared vote links don't open the app. | 🔴 CRITICAL | 1 hr | Android conversion, sharing loop |
| 6 | **Zero Schema.org markup** — No Organization, no SoftwareApplication, no MobileApplication JSON-LD. Google cannot generate rich results, Knowledge Panel, or app install snippets. | 🔴 CRITICAL | 3 hrs | Rich results, brand SERP |
| 7 | **Slug/brand mismatch** — App Store slug is `togetherplans`; the brand is `DateMeUp`. Users searching "DateMeUp app" may not find the App Store listing. | 🟠 HIGH | App Store review | ASO direct search |
| 8 | **CSR-only SPA with no prerendering** — /privacy, /terms, /support, /suggestions serve empty `<div id="root">` to crawlers until JS executes. Second-wave indexing adds days of delay and risks exclusion of key pages. | 🟠 HIGH | 4 hrs | Indexation quality of all pages |
| 9 | **No canonical URLs** — /suggestions and /discover both resolve to the same SPA shell. Duplicate content signal. No page tells Google its preferred URL. | 🟠 HIGH | 2 hrs | Deduplication, link equity |
| 10 | **datemeup.blog is a spam site** — A third-party site at datemeup.blog exists and may rank for branded queries, confusing users and siphoning installs. | 🟠 HIGH | Legal/outreach | Brand SERP control |

---

## Pre-Launch Critical Issues Checklist

These must be resolved **before significant paid UA spend begins**. Paid traffic landing on a broken social share or a blank OG card wastes every dollar.

```
[ ] 1. Create web/public/robots.txt — block /login, /signup, /vote/* (private); allow all public routes
[ ] 2. Create web/public/sitemap.xml — all public static routes with lastmod dates
[ ] 3. Replace /og-image.png with a real 1200×630px branded image
[ ] 4. Create web/public/.well-known/apple-app-site-association (AASA)
[ ] 5. Create web/public/.well-known/assetlinks.json
[ ] 6. Add <meta name="apple-itunes-app" content="app-id=6806890578"> to web/index.html
[ ] 7. Add Organization + SoftwareApplication Schema.org JSON-LD to index.html
[ ] 8. Add <link rel="canonical"> to every public route (via react-helmet or per-page)
[ ] 9. Verify datemeup.app in Google Search Console + submit sitemap
[ ] 10. Add UTM parameters to all App Store / Google Play links on landing page
[ ] 11. Resolve App Store slug — either rename to datemeup or add datemeup as subtitle keyword
[ ] 12. Audit /suggestions vs /discover duplication — pick canonical, 301 the other
```

---

## 3-Month Organic Growth Opportunity

DateMeUp occupies an **uncontested keyword niche**: "date night planning app", "couples activity voting app", "date planner for couples". No incumbent is optimized for this exact intent cluster. The competitive field is split between dating apps (wrong audience) and generic scheduling tools (wrong context).

### Month 1 — Foundation (Weeks 1–4)
- Deploy all pre-launch critical fixes above
- Establish Google Search Console baseline: impressions, clicks, coverage errors
- Submit sitemap; target 100% indexation of 6 public routes within 2 weeks
- Fix AASA + assetlinks.json → measure /vote/:shareToken-to-install rate before and after

**Expected outcome:** Routes indexed. Rich results eligible. Social shares render correctly. Deep links work.

### Month 2 — Content Signals (Weeks 5–8)
- Add prerendering for /, /privacy, /terms, /support, /suggestions via vite-plugin-prerender
- Per-page unique title + description tags targeting primary keyword clusters
- Publish 2–3 SEO-targeted landing pages: "date night ideas app", "couples activity planner", "group outing voting app" — these can be static HTML appended to the SPA shell
- Begin App Store metadata optimization: title, subtitle, keyword field (100-char limit), first 3 screenshots with text overlay

**Expected outcome:** 50–200 weekly organic impressions. App Store keyword ranking for tier-2 terms.

### Month 3 — Authority & Sharing Loop (Weeks 9–12)
- The guest voting feature (/vote/:shareToken) is a **stealth SEO asset**: every shared vote link is a unique URL. If these pages get indexed and optimized with proper meta ("Vote on tonight's date plan"), they become landing pages for every recipient who Googles the link. Add per-token OG images (dynamic or template-based) to maximize share virality.
- Guest voters who install the app via that link = organic install with zero paid UA cost
- Target: 5% of vote-link recipients click through → 20% of those install app = compounding organic loop
- Build first backlinks: pitch to couples/relationship bloggers covering date night content — datemeup.app/suggestions is a natural resource link target

**Expected outcome:** 500–2,000 weekly organic impressions. Measurable organic installs via guest voting loop.

---

## Files Changed by This Audit

*None yet — this document is diagnostic. All recommended file changes are specified in 02-Technical-SEO-Audit.md and 07-Cross-Platform-Discoverability.md.*

---

*Next document: [02-Technical-SEO-Audit.md](./02-Technical-SEO-Audit.md)*
