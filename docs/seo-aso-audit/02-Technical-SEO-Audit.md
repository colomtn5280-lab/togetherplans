# DateMeUp — Technical SEO Audit

**Audit Date:** October 2026  
**Web:** https://datemeup.app (Cloudflare Pages, React 18 + Vite, CSR-only)  
**Repo path:** /root/DateNight/web/  

---

## 1. Rendering Architecture

### Current State
DateMeUp is a **pure Client-Side Rendered (CSR) SPA**. The Cloudflare Pages deployment serves a single `index.html` with an empty `<div id="root">` for every URL — including /privacy, /terms, /support, /suggestions, and /. Content is injected only after JavaScript executes in the browser.

**What Googlebot sees on first request:**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>🌙 DateMeUp - Plan Together, Go Together</title>
    <!-- no per-page description, no canonical, no schema -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index-[hash].js"></script>
  </body>
</html>
```

Google will eventually render the page in a **second wave** (hours to days after first crawl), but:
- Pages may be indexed with the empty shell first, then re-indexed
- There is no guarantee every route gets rendered — crawl budget applies
- Dynamic metadata set by `react-helmet` or similar requires JS execution to appear in Google's index

### Options

#### Option A — Cloudflare Worker Prerendering (`_worker.js`)
A Cloudflare Pages Functions file at `/functions/_middleware.js` intercepts crawler User-Agents (Googlebot, Twitterbot, etc.) and returns prerendered HTML fetched from a headless renderer (Prerender.io, or a custom worker).

- **Pros:** Works at edge, no build-time cost, handles dynamic routes
- **Cons:** Requires a prerender service or complex worker code; adds latency for bots; ongoing maintenance; Prerender.io costs ~$45/mo

#### Option B — `vite-plugin-prerender` Static HTML Generation ✅ RECOMMENDED
During `vite build`, the plugin crawls the configured routes and generates static HTML files for each. These are deployed alongside the SPA as actual HTML files that Cloudflare Pages serves without JavaScript.

- **Pros:** Zero runtime cost, static files on CDN, exact same HTML Googlebot gets as users, free
- **Cons:** Only works for static routes (not /join/:token, /vote/:shareToken); build time increases ~30s

**Routes to prerender:** `/`, `/privacy`, `/terms`, `/support`, `/suggestions`

**Do NOT prerender:** `/login`, `/signup`, `/discover`, `/join/:token`, `/share/:shareToken`, `/vote/:shareToken`

#### Option C — Strong Meta in index.html Only
Keep CSR but put the best possible title/description/OG tags in `index.html` so every page gets the same tags. Zero effort, lowest impact.

- **Pros:** 10 minutes of work
- **Cons:** All pages share identical meta — duplicate content signal; no per-page differentiation; Googlebot still gets empty body

### Recommendation
**Implement Option B** first (2-4 hours), **then** add per-page meta via react-helmet-async for the dynamic routes (Option C for routes prerendering can't reach).

**Installation:**
```bash
cd /root/DateNight/web
npm install --save-dev vite-plugin-prerender
```

**`vite.config.ts` addition:**
```typescript
import prerender from 'vite-plugin-prerender'

export default defineConfig({
  plugins: [
    react(),
    prerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: ['/', '/privacy', '/terms', '/support', '/suggestions'],
      renderer: new Renderer({
        renderAfterDocumentEvent: 'render-event',
        headless: true,
      }),
    }),
  ],
})
```

**In each page component, dispatch the render event after data loads:**
```typescript
document.dispatchEvent(new Event('render-event'))
```

---

## 2. robots.txt

### Current State
`/robots.txt` returns HTTP 200 with the SPA's `index.html` content — a full HTML page. Googlebot interprets this as a malformed robots.txt and ignores all directives, falling back to crawling everything.

**Verified:** `curl -I https://datemeup.app/robots.txt` returns `content-type: text/html` — confirmed SPA fallback.

### Fix

**File to create:** `/root/DateNight/web/public/robots.txt`

Cloudflare Pages serves all files in `web/public/` at the root URL, so `web/public/robots.txt` → `https://datemeup.app/robots.txt`.

```
# DateMeUp robots.txt
# https://datemeup.app

User-agent: *

# Public pages — allow full crawl
Allow: /
Allow: /privacy
Allow: /terms
Allow: /support
Allow: /suggestions

# Auth flows — no crawl value
Disallow: /login
Disallow: /signup

# App routes — require auth, no crawl value
Disallow: /dashboard
Disallow: /profile
Disallow: /settings
Disallow: /plan/

# Dynamic share/vote routes — these are valuable but parameterized
# Allow Googlebot to discover them (they are the organic acquisition hook)
Allow: /vote/
Allow: /share/

# Block /join/ links (invite tokens expire; don't index them)
Disallow: /join/

# Sitemap location
Sitemap: https://datemeup.app/sitemap.xml

# Crawl-delay is not respected by Googlebot, but honored by others
Crawl-delay: 1
```

> **Note on /vote/ and /share/:** These are the guest voting routes — anyone with the link can vote without installing the app. This is a major organic acquisition loop. Allowing Googlebot to crawl them means if a shared link gets social traction, Google may index it. Each indexed vote page is a potential organic landing page. Keep them crawlable.

---

## 3. sitemap.xml

### Current State
`/sitemap.xml` returns HTTP 200 with SPA HTML — same problem as robots.txt.

### Fix

**File to create:** `/root/DateNight/web/public/sitemap.xml`

Only include static public routes. Do NOT include /vote/:shareToken, /join/:token (dynamic, not canonical), /login, /signup (no SEO value).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">

  <url>
    <loc>https://datemeup.app/</loc>
    <lastmod>2026-10-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://datemeup.app/suggestions</loc>
    <lastmod>2026-10-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://datemeup.app/support</loc>
    <lastmod>2026-09-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>https://datemeup.app/privacy</loc>
    <lastmod>2026-09-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <url>
    <loc>https://datemeup.app/terms</loc>
    <lastmod>2026-09-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

</urlset>
```

**After deployment:** Submit to Google Search Console → Sitemaps → `https://datemeup.app/sitemap.xml`.

---

## 4. Canonical URLs

### Current State
Zero `<link rel="canonical">` tags exist anywhere in the SPA. The `index.html` has no canonical. This means:
- `/suggestions` and `/discover` — which appear to render the same view — are treated as separate URLs by Google, splitting any link equity between them
- Every URL variation (`?ref=`, `?utm_source=`) that gets shared is indexed separately

### Fix

**Per-page canonical via react-helmet-async:**

Install if not already present:
```bash
cd /root/DateNight/web && npm install react-helmet-async
```

Wrap the app in `web/src/main.tsx`:
```tsx
import { HelmetProvider } from 'react-helmet-async'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
)
```

In each page component:

**Landing page (`web/src/pages/Landing.tsx` or equivalent):**
```tsx
import { Helmet } from 'react-helmet-async'

export function LandingPage() {
  return (
    <>
      <Helmet>
        <title>DateMeUp — Date Night Planner for Couples</title>
        <meta name="description" content="Stop debating where to go. DateMeUp helps couples plan date nights together — browse real venues, vote on activities, and get an instant plan. Free on iOS and Android." />
        <link rel="canonical" href="https://datemeup.app/" />
        <meta property="og:title" content="DateMeUp — Plan Date Night Together" />
        <meta property="og:description" content="Browse venues, vote together, get a plan. Date night made easy." />
        <meta property="og:image" content="https://datemeup.app/og-image.png" />
        <meta property="og:url" content="https://datemeup.app/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {/* page content */}
    </>
  )
}
```

**Resolve /suggestions vs /discover duplication:**
Pick `/suggestions` as the canonical URL. In the `/discover` route component, add:
```tsx
<Helmet>
  <link rel="canonical" href="https://datemeup.app/suggestions" />
</Helmet>
```
Or better: add a 301 redirect. In Cloudflare Pages, add to `web/public/_redirects`:
```
/discover  /suggestions  301
```

---

## 5. OG Image

### Current State
`https://datemeup.app/og-image.png` returns a **3KB file** — this is either a 1×1 pixel placeholder, a broken/corrupt PNG, or an empty file. Facebook, Twitter/X, iMessage, and WhatsApp all preview this as a blank card.

Every invite card share, every /vote/:shareToken link shared in a chat, every web URL shared on social — all render blank. This directly suppresses the viral coefficient of the app's sharing loop.

### Fix

Create a **1200×630px PNG** (Facebook/OG standard; also renders well on Twitter at 1200×600 crop):

**Required:** `/root/DateNight/web/public/og-image.png`

Design requirements:
- Brand name "DateMeUp" prominent
- Tagline "Plan Together. Go Together."
- Show the app UI or a date night illustration
- Dark/romantic color palette consistent with the app
- Text must be readable at 600×315px (the typical Twitter small-card render)
- File size: aim for 100–300KB (PNG is fine; WebP not universally supported for OG)

**Quick option:** Use a Figma template, Canva, or generate with a script. This is the one item on the critical list that requires a designer or design tool — the rest are text files.

**Additional OG images to add (lower priority):**
- `/og-image-suggestions.png` — for the /suggestions page
- `/og-image-vote.png` — for /vote/:shareToken pages (generic, since tokens are per-instance)

---

## 6. Schema.org Structured Data

### Current State
Zero structured data markup anywhere on the site. Google's Rich Results Test returns no eligible results for datemeup.app.

### Fix — Add JSON-LD blocks to `web/index.html`

Add inside the `<head>` of `web/index.html`. These are static and don't require per-page rendering.

#### 6a. Organization
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "DateMeUp",
  "alternateName": "TogetherPlans",
  "url": "https://datemeup.app",
  "logo": "https://datemeup.app/logo.png",
  "sameAs": [
    "https://apps.apple.com/app/id6806890578",
    "https://play.google.com/store/apps/details?id=app.datemeup.datenight"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "url": "https://datemeup.app/support"
  }
}
</script>
```

#### 6b. WebSite with SearchAction
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "DateMeUp",
  "url": "https://datemeup.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://datemeup.app/suggestions?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
</script>
```

#### 6c. MobileApplication (iOS)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "DateMeUp — Date Night Planner",
  "operatingSystem": "iOS",
  "applicationCategory": "LifestyleApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "ratingCount": "1"
  },
  "downloadUrl": "https://apps.apple.com/app/id6806890578",
  "description": "DateMeUp helps couples plan date nights together. Browse real local venues, vote on activities with your partner, and get an instant consensus plan. Features include After Dark intimate suggestions and beautiful invite cards.",
  "screenshot": "https://datemeup.app/screenshots/app-screenshot-1.png",
  "softwareVersion": "1.0",
  "url": "https://datemeup.app"
}
</script>
```

#### 6d. MobileApplication (Android)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "DateMeUp — Date Night Planner",
  "operatingSystem": "Android",
  "applicationCategory": "LifestyleApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "downloadUrl": "https://play.google.com/store/apps/details?id=app.datemeup.datenight",
  "description": "DateMeUp helps couples plan date nights together. Browse real local venues, vote on activities with your partner, and get an instant consensus plan.",
  "url": "https://datemeup.app"
}
</script>
```

> **Note:** Update `aggregateRating` once you have real App Store reviews. Don't fabricate ratings — Google validates this and can penalize inflated markup.

---

## 7. Meta Tags Audit

### Current State

`web/index.html` contains:
```html
<title>🌙 DateMeUp - Plan Together, Go Together</title>
```

**Problems:**
1. **Emoji in title** — The `🌙` renders inconsistently across search engines and operating systems. Google often strips emojis or shows them as □. More importantly, it signals brand immaturity and looks unusual in SERPs. Remove it.
2. **Same title for all pages** — /privacy, /terms, /support all show "DateMeUp - Plan Together, Go Together". Google may de-prioritize pages with identical titles.
3. **No `<meta name="description">`** — Not present in the current index.html. Google will auto-generate a snippet, often poorly.
4. **No `<meta name="viewport">`** — Verify this exists (critical for mobile-first indexing).

### Required Per-Page Meta

| Route | `<title>` | `<meta name="description">` |
|-------|-----------|------------------------------|
| `/` | DateMeUp — Date Night Planner for Couples | Stop debating where to go. Browse local venues, vote with your partner, and get an instant date night plan. Free on iOS & Android. |
| `/suggestions` | Date Night Ideas & Activity Suggestions — DateMeUp | Discover date night ideas near you. Browse restaurants, experiences, and activities — then vote with your partner to find what you both love. |
| `/support` | Help & Support — DateMeUp | Get help with DateMeUp. FAQ, contact options, and guides for planning your perfect date night. |
| `/privacy` | Privacy Policy — DateMeUp | How DateMeUp collects, uses, and protects your personal data. |
| `/terms` | Terms of Service — DateMeUp | Terms of service governing use of the DateMeUp app and website. |
| `/vote/:shareToken` | Vote on Tonight's Plan — DateMeUp | Your partner wants your input! Vote APPROVE, MAYBE, or REJECT on date night options. No app required. |

**Fix file:** `web/index.html` — update title (static fallback), add description meta. Then implement per-page overrides via react-helmet-async (see §4 above).

**Updated `web/index.html` head:**
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DateMeUp — Date Night Planner for Couples</title>
  <meta name="description" content="Stop debating where to go. DateMeUp helps couples plan date nights together — browse real venues, vote on activities, and get an instant plan. Free on iOS & Android." />
  <meta name="theme-color" content="#1a1a2e" />
  <link rel="canonical" href="https://datemeup.app/" />

  <!-- OG / Social -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="DateMeUp" />
  <meta property="og:title" content="DateMeUp — Plan Date Night Together" />
  <meta property="og:description" content="Browse venues, vote together, get a plan. Date night made easy." />
  <meta property="og:image" content="https://datemeup.app/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://datemeup.app/" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="DateMeUp — Plan Date Night Together" />
  <meta name="twitter:description" content="Browse venues, vote together, get a plan. Date night made easy." />
  <meta name="twitter:image" content="https://datemeup.app/og-image.png" />

  <!-- App store links -->
  <meta name="apple-itunes-app" content="app-id=6806890578" />

  <!-- Schema.org blocks here (see §6) -->
</head>
```

---

## 8. H1 Structure Audit

### Landing Page
Landing page H1: **"Plan together. Go together."** — Good. Emotionally resonant, brand-aligned. However, it contains zero keyword signal. Consider:

- Keep as-is for brand voice
- Ensure the first visible text block under the H1 (the subheading/lede) contains the primary keyword: "date night planner", "date night app", "plan your date night"

### Other Pages
Verify in code that each public page has exactly one `<h1>`. Common SPA bug: the H1 only exists in the landing page component, and navigating to /support or /privacy renders with no H1 (or the wrong one from a previous route).

Recommended H1s:
- `/suggestions` — "Find Your Perfect Date Night Activity"
- `/support` — "DateMeUp Help & Support"
- `/privacy` — "Privacy Policy"
- `/terms` — "Terms of Service"
- `/vote/:shareToken` — "Vote on Tonight's Date Plan"

---

## 9. Internal Linking

### Current State
- **Footer:** `/privacy`, `/terms`, `/support` — good
- **Nav:** `#how`, `#groups`, `/support` — good for single-page anchors

### Gaps
1. **No link from landing page to /suggestions** — The app's core value prop page is unlinked from the homepage. This means /suggestions gets zero internal link equity.
2. **No breadcrumbs** — Not critical for a small site, but /support should link back to /
3. **App download CTAs lack UTM** — The App Store and Google Play buttons on the landing page have no UTM parameters. Attribution is impossible.

**Fix:** Add `/suggestions` to the landing page nav or as a CTA. Add UTM to app store links:
```
https://apps.apple.com/app/id6806890578?utm_source=datemeup_web&utm_medium=landing_cta&utm_campaign=organic
https://play.google.com/store/apps/details?id=app.datemeup.datenight&utm_source=datemeup_web&utm_medium=landing_cta&utm_campaign=organic
```

---

## 10. URL Structure & Duplicate Content

### Issue: /suggestions vs /discover
Both `/suggestions` and `/discover` resolve to the SPA (which renders the same component, per the context notes). This creates:
- **Duplicate content:** Two URLs, same content, Google must choose which to index
- **Split link equity:** Any inbound links to /discover don't consolidate with /suggestions
- **Canonical confusion:** Neither page declares a canonical

**Fix (pick one):**
1. **Preferred:** Add to `web/public/_redirects`:
   ```
   /discover  /suggestions  301
   ```
2. **Alternative:** Add `<link rel="canonical" href="https://datemeup.app/suggestions">` to the /discover route component

---

## 11. Performance

### Measured Values
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| TTFB | 211ms | <600ms | ✅ Good (Cloudflare CDN) |
| LCP | 2192ms | <2500ms | ⚠️ Borderline |
| Full Load | 2397ms | — | ⚠️ Heavy |
| FID/INP | Not measured | <200ms | ❓ Unknown |
| CLS | Not measured | <0.1 | ❓ Unknown |

### LCP Root Cause
LCP of 2192ms on a static SPA almost certainly means the **Largest Contentful Paint element is an image** (the hero image or logo) that loads after the JS bundle executes and renders the DOM. 

**Fix options:**
1. Add `<link rel="preload" as="image" href="/hero-image.jpg">` to `web/index.html` `<head>`
2. Inline the LCP image as a base64 data URL (only if <10KB)
3. Use `fetchpriority="high"` on the hero `<img>` tag
4. Verify the hero image is served from Cloudflare CDN (it should be, but check the URL is relative not pointing to an external host)

### JS Bundle
Bundle is split into vendor chunks — good practice, already in place. Verify with:
```bash
cd /root/DateNight/web && npm run build -- --report
# or
npx vite-bundle-visualizer
```

Chunks over 500KB are a problem. The After Dark content library and invite card templates (36 templates) are potential bloat candidates — consider lazy loading them.

---

## Summary: Files to Create/Modify

| File | Action | Section |
|------|--------|---------|
| `web/public/robots.txt` | CREATE | §2 |
| `web/public/sitemap.xml` | CREATE | §3 |
| `web/public/_redirects` | CREATE/MODIFY — add `/discover → /suggestions 301` | §10 |
| `web/index.html` | MODIFY — title, meta description, OG tags, Schema.org JSON-LD | §6, §7 |
| `web/public/og-image.png` | REPLACE — current 3KB file with real 1200×630px image | §5 |
| `web/src/main.tsx` | MODIFY — wrap with HelmetProvider | §4 |
| `web/vite.config.ts` | MODIFY — add vite-plugin-prerender | §1 |
| `web/src/pages/Landing.tsx` | MODIFY — add Helmet with canonical, title, meta | §4, §7 |
| `web/src/pages/Suggestions.tsx` | MODIFY — add Helmet | §4, §7 |
| `web/src/pages/Support.tsx` | MODIFY — add Helmet | §4, §7 |
| `web/src/pages/Privacy.tsx` | MODIFY — add Helmet | §4, §7 |
| `web/src/pages/Terms.tsx` | MODIFY — add Helmet | §4, §7 |

---

*Next: [03-Keyword-Research.md](./03-Keyword-Research.md)*
