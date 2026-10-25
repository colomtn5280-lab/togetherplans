# DateMeUp — Engineering Implementation Specifications
**October 2026 | Ready for implementation on authorization**

---

## IMPL-001: robots.txt
**File:** `web/public/robots.txt`  
**Effort:** 15 minutes  
**Priority:** P0 — Critical

**Current:** `/robots.txt` returns the SPA HTML shell (Cloudflare serves index.html for all routes)  
**Proposed:** Create `web/public/robots.txt` — Cloudflare Pages serves static files from `/public` before the SPA catch-all

```
User-agent: *
Allow: /
Allow: /privacy
Allow: /terms
Allow: /support
Allow: /suggestions
Allow: /discover
Disallow: /dashboard
Disallow: /groups
Disallow: /proposals
Disallow: /settings
Disallow: /notifications
Disallow: /join/
Disallow: /auth/
Disallow: /reset-password
Disallow: /verify-email

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://datemeup.app/sitemap.xml
```

**Validation:** `curl https://datemeup.app/robots.txt` should return plain text, not HTML

---

## IMPL-002: sitemap.xml
**File:** `web/public/sitemap.xml`  
**Effort:** 30 minutes  
**Priority:** P0 — Critical

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://datemeup.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://datemeup.app/suggestions</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://datemeup.app/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://datemeup.app/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://datemeup.app/support</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

Note: Do NOT include /discover (duplicate of /suggestions — add canonical instead), /login, /signup, or any auth-required pages.

**Validation:** Submit to Google Search Console after robots.txt is confirmed working.

---

## IMPL-003: Canonical URL tags
**File:** `web/index.html` (base canonical) + React Helmet for per-page  
**Effort:** 2-3 hours  
**Priority:** P0

**Option A (quick):** Add base canonical in `index.html` for the homepage only:
```html
<link rel="canonical" href="https://datemeup.app/" />
```

**Option B (proper):** Install `react-helmet-async` and add per-page canonical + unique meta:

```bash
npm install react-helmet-async
```

In `web/src/main.tsx`:
```tsx
import { HelmetProvider } from 'react-helmet-async';
// Wrap <App /> with <HelmetProvider>
```

In each public page:
```tsx
import { Helmet } from 'react-helmet-async';

// LandingPage.tsx
<Helmet>
  <title>DateMeUp — Date Night Planner for Couples</title>
  <meta name="description" content="Stop asking 'what do you want to do?' DateMeUp lets couples propose date night activities, vote together, and decide automatically. Free." />
  <link rel="canonical" href="https://datemeup.app/" />
</Helmet>

// SuggestionsPage.tsx  
<Helmet>
  <title>Discover Date Night Activities Near You | DateMeUp</title>
  <meta name="description" content="Browse restaurants, concerts, outdoor adventures, and romantic activities near you. Add to your date night plan and vote with your partner." />
  <link rel="canonical" href="https://datemeup.app/suggestions" />
</Helmet>
```

Also add canonical for /discover → /suggestions redirect:
```tsx
// In App.tsx, change /discover to redirect:
<Route path="/discover" element={<Navigate to="/suggestions" replace />} />
```

---

## IMPL-004: Schema.org JSON-LD
**File:** `web/index.html`  
**Effort:** 1 hour  
**Priority:** P1

Add before `</head>`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://datemeup.app/#organization",
      "name": "DateMeUp",
      "url": "https://datemeup.app",
      "logo": {
        "@type": "ImageObject",
        "url": "https://datemeup.app/mark-teal.svg",
        "width": 512,
        "height": 512
      },
      "sameAs": [
        "https://apps.apple.com/app/id6806890578",
        "https://play.google.com/store/apps/details?id=app.datemeup.datenight"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://datemeup.app/#website",
      "url": "https://datemeup.app",
      "name": "DateMeUp",
      "description": "Date night planning app for couples and groups",
      "publisher": { "@id": "https://datemeup.app/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://datemeup.app/suggestions?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "MobileApplication",
      "name": "DateMeUp",
      "operatingSystem": "iOS, Android",
      "applicationCategory": "LifestyleApplication",
      "description": "Plan date nights together. Propose activities, vote with your partner, and let DateMeUp decide when you both agree.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "installUrl": [
        "https://apps.apple.com/app/id6806890578",
        "https://play.google.com/store/apps/details?id=app.datemeup.datenight"
      ],
      "publisher": { "@id": "https://datemeup.app/#organization" }
    }
  ]
}
</script>
```

---

## IMPL-005: Smart App Banner
**File:** `web/index.html`  
**Effort:** 5 minutes  
**Priority:** P1

Add in `<head>`:
```html
<!-- Smart App Banner (iOS Safari) -->
<meta name="apple-itunes-app" content="app-id=6806890578" />
```

This renders a native iOS banner at the top of Safari prompting "Open in DateMeUp" when app is installed, or "View in App Store" when not installed. Zero JavaScript required.

---

## IMPL-006: Apple Universal Links (AASA)
**File:** `web/public/.well-known/apple-app-site-association`  
**Effort:** 1 hour  
**Priority:** P1

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.app.togetherplans.datenight",
        "paths": [
          "/join/*",
          "/share/*",
          "/vote/*"
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAMID.app.togetherplans.datenight"]
  }
}
```

Replace `TEAMID` with the actual Apple Developer Team ID (find in Apple Developer portal → Membership).

**Note:** File must be served at `/.well-known/apple-app-site-association` with Content-Type `application/json`, no file extension. Cloudflare Pages serves files from `public/.well-known/` correctly.

**Validation:** `curl -I https://datemeup.app/.well-known/apple-app-site-association` should return `content-type: application/json`

---

## IMPL-007: Android Digital Asset Links
**File:** `web/public/.well-known/assetlinks.json`  
**Effort:** 1 hour  
**Priority:** P1

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "datemeup.app",
      "sha256_cert_fingerprints": [
        "REPLACE_WITH_ACTUAL_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

Get SHA256 fingerprint from EAS:
```bash
eas credentials:view --platform android
```
Or from Google Play Console → Setup → App signing → App signing key certificate.

---

## IMPL-008: Fix /discover duplicate content
**File:** `web/src/App.tsx`  
**Effort:** 5 minutes  
**Priority:** P1

Change:
```tsx
<Route path="/discover" element={<SuggestionsPage />} />
```
To:
```tsx
<Route path="/discover" element={<Navigate to="/suggestions" replace />} />
```

This prevents two URLs from serving identical content without a canonical.

---

## IMPL-009: OG Image
**File:** `web/public/og-image.png`  
**Effort:** 2-4 hours (design work)  
**Priority:** P1

Current: 3KB file (likely placeholder or corrupted)  
Required: 1200×630px PNG, <300KB

Design brief:
- Teal (#0E8C8C) background
- DateMeUp logo (white) top-left
- Headline: "Date night, decided." in Sora Bold
- Subhead: "Propose • Vote • Go" 
- App screenshot mockup (voting screen)
- App Store + Google Play badges bottom-right

Validate with: https://www.opengraph.xyz (enter https://datemeup.app)

---

## IMPL-010: UTM Parameters on App Store Links
**File:** `web/src/pages/LandingPage.tsx`  
**Effort:** 30 minutes  
**Priority:** P2

Current:
```tsx
<a href="https://apps.apple.com/app/id6806890578">App Store</a>
<a href="https://play.google.com/store/apps/details?id=app.datemeup.datenight">Google Play</a>
```

Proposed:
```tsx
<a href="https://apps.apple.com/app/id6806890578?pt=PUBLISHER_TOKEN&ct=web-landing&mt=8">
  App Store
</a>
<a href="https://play.google.com/store/apps/details?id=app.datemeup.datenight&referrer=utm_source%3Dwebsite%26utm_medium%3Dlanding%26utm_campaign%3Dorganic">
  Google Play
</a>
```

This enables attribution tracking: which web visitors convert to app installs.

---

## IMPL-011: Vite Pre-rendering for Public Pages
**File:** `web/vite.config.ts` + new plugin  
**Effort:** 4-8 hours  
**Priority:** P1 (for SEO)

Install:
```bash
npm install vite-plugin-prerender --save-dev
```

Update `web/vite.config.ts`:
```typescript
import prerender from 'vite-plugin-prerender';

export default defineConfig({
  plugins: [
    react(),
    prerender({
      routes: ['/', '/privacy', '/terms', '/support', '/suggestions'],
      renderer: '@prerenderer/renderer-puppeteer',
    }),
  ],
  // ... existing config
});
```

This generates static HTML files for the public routes at build time. Googlebot sees real HTML content on the first request instead of waiting for JS execution. Dramatically improves indexing reliability.

**Alternative (simpler):** Use Cloudflare Pages `_routes.json` to serve a pre-built HTML for specific paths, keeping the SPA for auth routes. See Cloudflare Pages docs.

---

## IMPL-012: Google Analytics 4
**File:** `web/index.html`  
**Effort:** 1 hour  
**Priority:** P1

```html
<!-- Google Analytics 4 — add after existing scripts -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure'
  });
</script>
```

Replace `G-XXXXXXXXXX` with actual GA4 Measurement ID from Google Analytics.

Add custom events in web/src/api/client.ts or relevant components:
```typescript
// After successful signup
gtag('event', 'sign_up', { method: 'email' });

// After proposal created
gtag('event', 'create_proposal', { proposal_id: id });

// After vote cast
gtag('event', 'vote_cast', { sentiment: 'APPROVE' });

// After match achieved
gtag('event', 'match_achieved', { proposal_id: id });
```

---

## Validation Checklist

After each implementation:
- [ ] `curl https://datemeup.app/robots.txt` returns plain text
- [ ] `curl https://datemeup.app/sitemap.xml` returns XML
- [ ] Google Rich Results Test passes for Schema.org
- [ ] Smart App Banner visible in iOS Safari
- [ ] AASA validates at branch.io/resources/aasa-validator
- [ ] OG image validates at opengraph.xyz
- [ ] GSC sitemap submission: no errors
- [ ] Google Mobile-Friendly Test passes
- [ ] /discover redirects to /suggestions (301/302)
