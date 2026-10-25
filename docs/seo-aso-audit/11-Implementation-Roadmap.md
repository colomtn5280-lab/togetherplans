# DateMeUp — SEO/ASO Master Implementation Roadmap
**October 2026 | All platforms**

---

## Phase 0 — Pre-Launch Critical (Complete before any promotion)
*Target: 1 week | Engineering hours: 8-12*

| ID | Task | Platform | File | Hours | Acceptance Criteria |
|---|---|---|---|---|---|
| P0-SEO-01 | Create robots.txt | Web | web/public/robots.txt | 0.25 | curl /robots.txt returns text/plain |
| P0-SEO-02 | Create sitemap.xml | Web | web/public/sitemap.xml | 0.5 | curl /sitemap.xml returns XML |
| P0-SEO-03 | Add Schema.org JSON-LD | Web | web/index.html | 1.0 | Rich Results Test: no errors |
| P0-SEO-04 | Fix OG image (1200×630) | Web | web/public/og-image.png | 3.0 | opengraph.xyz shows correct preview |
| P0-SEO-05 | Add Smart App Banner | Web | web/index.html | 0.1 | iOS Safari shows banner |
| P0-SEO-06 | Verify Google Search Console | Web | DNS/HTML | 0.5 | GSC shows datemeup.app verified |
| P0-SEO-07 | Submit sitemap to GSC | Web | GSC dashboard | 0.1 | Status: Success |
| P0-SEO-08 | Add canonical base (index.html) | Web | web/index.html | 0.5 | curl / \| grep canonical |
| P0-SEO-09 | Fix /discover → /suggestions redirect | Web | web/src/App.tsx | 0.1 | curl /discover returns 301 |
| P0-ASO-01 | Update App Store title/subtitle/keywords | iOS | App Store Connect | 0.5 | Live in 1-2 days post-submit |
| P0-ASO-02 | Update App Store description | iOS | App Store Connect | 1.0 | Keyword-rich, accurate |
| P0-ASO-03 | Update Play Store title/short desc | Android | Play Console | 0.5 | Live within hours |
| P0-ASO-04 | Update Play Store full description | Android | Play Console | 1.0 | NLP-optimized, 4000 chars |
| P0-ANA-01 | Set up Google Analytics 4 | Web | web/index.html | 1.0 | GA4 DebugView shows events |
| P0-ANA-02 | Set up Bing Webmaster Tools | Web | bingwebmaster.com | 0.5 | Verified |

---

## Phase 1 — First 30 Days (High-impact SEO foundations)
*Engineering hours: 16-24*

| ID | Task | Platform | Impact | Hours |
|---|---|---|---|---|
| P1-SEO-01 | Install react-helmet-async, per-page meta | Web | High | 4.0 |
| P1-SEO-02 | Unique title/desc for each public page | Web | High | 2.0 |
| P1-SEO-03 | Add AASA file (Universal Links) | iOS | High | 1.0 |
| P1-SEO-04 | Add assetlinks.json (App Links) | Android | High | 1.0 |
| P1-SEO-05 | UTM parameters on all app store links | Both | Medium | 0.5 |
| P1-SEO-06 | Vite pre-rendering for public routes | Web | High | 6.0 |
| P1-SEO-07 | Create /about page (entity page) | Web | High | 3.0 |
| P1-SEO-08 | Create /date-night-planner landing page | Web | High | 4.0 |
| P1-ASO-01 | New App Store screenshots (8 screens) | iOS | High | 8.0 (design) |
| P1-ASO-02 | New Google Play screenshots | Android | High | 4.0 (design) |
| P1-ASO-03 | Google Play feature graphic (1024×500) | Android | Medium | 2.0 (design) |
| P1-ANA-01 | Firebase Analytics events (mobile) | Mobile | High | 3.0 |
| P1-ANA-02 | Custom GA4 events (proposal, vote, match) | Web | High | 2.0 |

---

## Phase 2 — Days 31–60 (Content and structured data)
*Engineering hours: 20-30 + content writing*

| ID | Task | Platform | Impact | Hours |
|---|---|---|---|---|
| P2-SEO-01 | FAQ section + FAQPage schema on landing | Web | Medium | 4.0 |
| P2-SEO-02 | /couples-activity-app landing page | Web | High | 4.0 |
| P2-SEO-03 | /group-outing-planner landing page | Web | Medium | 3.0 |
| P2-CON-01 | "50 Date Night Ideas" article | Web | High | 4.0 (writing) |
| P2-CON-02 | "What to Do Tonight" article | Web | High | 3.0 (writing) |
| P2-CON-03 | "Best Date Night Apps 2026" article | Web | High | 3.0 (writing) |
| P2-CON-04 | Blog infrastructure (/ideas/ section) | Web | Medium | 6.0 (dev) |
| P2-SEO-04 | BreadcrumbList schema for content pages | Web | Low | 1.0 |
| P2-SEO-05 | Submit to Product Hunt | All | High | 4.0 |
| P2-SEO-06 | Apple Search Ads Basic (optional) | iOS | Medium | 2.0 |
| P2-ASO-01 | ASO A/B test: App icon variants | Both | Medium | 2.0 |
| P2-ANA-01 | Conversion funnel dashboard in GA4 | Web | Medium | 2.0 |
| P2-ANA-02 | GSC weekly review routine | Web | Medium | 0.5/week |

---

## Phase 3 — Days 61–90 (Conversion optimization)
*Engineering hours: 12-16 + content*

| ID | Task | Platform | Impact | Hours |
|---|---|---|---|---|
| P3-CRO-01 | Review prompt after match celebration | Mobile | High | 2.0 |
| P3-CRO-02 | Web registration conversion A/B test | Web | Medium | 4.0 |
| P3-CON-01 | 5 more content articles | Web | High | 10.0 (writing) |
| P3-SEO-01 | Backlink outreach: dating/couple blogs | Web | High | 8.0 (outreach) |
| P3-ASO-01 | iOS Custom Product Pages (feature-specific) | iOS | Medium | 3.0 |
| P3-SEO-02 | Localized ASO for ES + FR | Both | Medium | 4.0 |
| P3-ANA-01 | Day-7 retention tracking | Mobile | Medium | 2.0 |
| P3-SEO-03 | Monitor and fix any GSC coverage errors | Web | High | Ongoing |

---

## Phase 4 — Months 4–12 (Sustainable growth)

| Priority | Initiative | Expected Impact |
|---|---|---|
| High | Content publishing: 2 articles/week | 2,000-10,000 monthly organic visits by month 12 |
| High | Backlink development: 5-10 quality links | Domain authority growth, keyword ranking improvement |
| High | ASO iteration: monthly keyword refresh | Continued App Store ranking improvement |
| Medium | App Store In-App Events (seasonal) | Seasonal visibility spikes |
| Medium | Spanish ASO localization | Hispanic market reach |
| Medium | Press coverage: lifestyle/tech outlets | Brand awareness + links |
| Low | Podcast/creator partnerships | Awareness without SEO direct benefit |
| Low | Apple Search Ads (if budget allows) | Paid top-of-funnel |

---

## Evidence Register

### Confirmed Findings (Code + Live Site Inspection)
- ✅ robots.txt returns HTML SPA — verified: `curl https://datemeup.app/robots.txt | head -3` returns `<!doctype html>`
- ✅ sitemap.xml returns HTML SPA — same issue
- ✅ No canonical URLs in HTML source — verified: `curl https://datemeup.app/ | grep canonical` returns preconnect links only
- ✅ Zero Schema.org scripts — verified: `document.querySelectorAll('script[type="application/ld+json"]').length === 0`
- ✅ No apple-app-site-association — verified: /.well-known/apple-app-site-association returns SPA HTML
- ✅ No assetlinks.json — same
- ✅ OG image is 3,143 bytes (too small for a proper 1200×630 image) — verified by Content-Length header
- ✅ LCP: 2192ms — measured via PerformanceObserver in browser
- ✅ TTFB: 211ms — measured via performance.timing
- ✅ Google AdSense present in index.html — visible in source
- ✅ App name slug is 'togetherplans' but brand is 'DateMeUp' — confirmed in mobile/app.json
- ✅ Landing page H1: "Plan together. Go together." — confirmed in rendered DOM
- ✅ /suggestions and /discover serve identical content — confirmed in App.tsx routing
- ✅ datemeup.blog is an unrelated spam site — confirmed via web search
- ✅ App Store link: https://apps.apple.com/app/id6806890578 — in landing page source
- ✅ Google Play link: https://play.google.com/store/apps/details?id=app.datemeup.datenight — in landing page source

### Confirmed from Official Documentation
- ✅ Google renders JavaScript but with second-wave delay (source: developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- ✅ ASO ranking factors 2026 — title/subtitle/keywords primary for iOS; full description NLP for Play (source: appradar.com/academy/app-store-ranking-factors, April 2026)
- ✅ Apple AASA required for Universal Links (source: developer.apple.com)
- ✅ Google Digital Asset Links required for Android App Links (source: developer.android.com)

### Assumptions Requiring Validation
- ⚠️ Apple Developer Team ID — not available in repo, needed for AASA
- ⚠️ Android SHA256 cert fingerprint — needed for assetlinks.json
- ⚠️ Actual App Store listing current state — audit conducted without App Store Connect access
- ⚠️ Actual Google Play listing state — audit conducted without Play Console access
- ⚠️ Keyword search volumes — no paid keyword tool used; estimates based on category knowledge
- ⚠️ Competitor organic traffic — no SEMrush/Ahrefs access; analysis qualitative only
- ⚠️ Current App Store category and rating — not confirmed from ASC

### Unknown / Unavailable Data
- ❓ Current App Store review count and average rating
- ❓ Current Google Play install count and rating
- ❓ Website organic traffic (no GSC or analytics access)
- ❓ Current keyword rankings for datemeup.app
- ❓ Whether Google has indexed any pages from datemeup.app
- ❓ App Store Connect promotional text current content
- ❓ Whether firebase analytics is already configured in the Expo app

---

## SEO/ASO Assessment Complete — Awaiting Implementation Authorization.

**Recommended implementation sequence:**
1. Phase 0 (P0 items) — implement immediately, all pre-launch blockers
2. Confirm Apple Team ID and Android cert fingerprint for AASA/assetlinks.json
3. Design new OG image and app screenshots before submitting to stores
4. Set up GSC + GA4 before any promotion (can't measure what you don't track)
5. App Store + Play Store metadata updates — can be done in parallel with web fixes
6. Phase 1 after Phase 0 is live and validated

**Do not begin implementation until Jake explicitly authorizes.**
