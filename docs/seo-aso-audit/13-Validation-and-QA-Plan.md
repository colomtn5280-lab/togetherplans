# DateMeUp — Validation & QA Plan
**October 2026**

---

## Pre-Implementation Baseline

Before any changes, record:
- `curl -I https://datemeup.app/robots.txt` → currently returns HTML (FAIL)
- `curl -I https://datemeup.app/sitemap.xml` → currently returns HTML (FAIL)
- `curl -I https://datemeup.app/og-image.png` → 200, 3142 bytes (FAIL — too small)
- LCP: 2192ms (PASS — under 2.5s threshold)
- TTFB: 211ms (PASS)

---

## Test Suite

### TC-001: robots.txt
```bash
curl https://datemeup.app/robots.txt
# Expected: Content-Type: text/plain, body starts with "User-agent:"
# Fail condition: Returns HTML doctype
```

### TC-002: sitemap.xml
```bash
curl https://datemeup.app/sitemap.xml
# Expected: Content-Type: application/xml, body starts with "<?xml"
# Must contain: datemeup.app/, datemeup.app/suggestions, datemeup.app/privacy
# Must NOT contain: /dashboard, /groups, /proposals
```

### TC-003: Canonical URLs
```bash
curl -s https://datemeup.app/ | grep "canonical"
# Expected: <link rel="canonical" href="https://datemeup.app/">
curl -s https://datemeup.app/suggestions | grep "canonical"  
# Expected: <link rel="canonical" href="https://datemeup.app/suggestions">
```

### TC-004: Schema.org
```bash
curl -s https://datemeup.app/ | grep "application/ld+json"
# Expected: Script tag present
# Validate at: https://search.google.com/test/rich-results
# OR: https://validator.schema.org
```

### TC-005: OG Image
```bash
curl -I https://datemeup.app/og-image.png
# Expected: Content-Type: image/png, Content-Length: >50000 (>50KB)
# Visual check at: https://www.opengraph.xyz/url/https%3A%2F%2Fdatemeup.app
```

### TC-006: Smart App Banner (iOS)
- Open Safari on iOS device or Simulator
- Navigate to https://datemeup.app
- Expected: Banner appears at top "DateMeUp — Open" or "View in App Store"
- Automated check: `curl -s https://datemeup.app/ | grep "apple-itunes-app"`

### TC-007: Apple AASA
```bash
curl -I https://datemeup.app/.well-known/apple-app-site-association
# Expected: HTTP 200, Content-Type: application/json
# Content validation:
curl -s https://datemeup.app/.well-known/apple-app-site-association | python3 -c "import sys,json; d=json.load(sys.stdin); print('applinks' in d)"
# Expected: True
# AASA validator: https://branch.io/resources/aasa-validator/
```

### TC-008: Android Asset Links
```bash
curl -s https://datemeup.app/.well-known/assetlinks.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['target']['package_name'])"
# Expected: datemeup.app
# Validation tool: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://datemeup.app&relation=delegate_permission/common.handle_all_urls
```

### TC-009: /discover redirect
```bash
curl -I https://datemeup.app/discover
# Expected: HTTP 301 or 302, Location: https://datemeup.app/suggestions
```

### TC-010: Core Web Vitals
- Run PageSpeed Insights: https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fdatemeup.app
- Targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Run both Mobile and Desktop

### TC-011: Google Mobile Friendly
- https://search.google.com/test/mobile-friendly?url=https://datemeup.app
- Expected: "Page is mobile friendly"

### TC-012: Google Rich Results
- https://search.google.com/test/rich-results?url=https://datemeup.app
- Expected: MobileApplication schema detected, no errors

### TC-013: Sitemap submission
- Google Search Console → Sitemaps → Submit https://datemeup.app/sitemap.xml
- Expected: Status "Success", all URLs discovered

### TC-014: App Store listing
After metadata update:
- Search "DateMeUp" in App Store — confirm new title appears
- Search "date night planner" — confirm app appears in results
- Check subtitle renders correctly (30 char limit)
- Confirm screenshots display in correct order

### TC-015: Google Play listing
After update:
- Search "DateMeUp" in Google Play — confirm listing appears
- Check short description (80 char limit not exceeded)
- Confirm feature graphic displays

### TC-016: Analytics events
After GA4 implementation:
- Open GA4 DebugView
- Create a test account → verify `sign_up` event fires
- Create a proposal → verify `create_proposal` event fires
- Cast a vote → verify `vote_cast` event fires
- Achieve consensus → verify `match_achieved` event fires

### TC-017: Universal Links (iOS)
After AASA deployment:
1. Send SMS with https://datemeup.app/join/test-token
2. Tap link on iPhone with DateMeUp installed
3. Expected: App opens directly to join screen (not Safari)

### TC-018: UTM attribution
- Visit https://datemeup.app?utm_source=test&utm_medium=test
- Install app via landing page App Store link
- Check App Store Connect Campaigns report
- Expected: Campaign appears in acquisition data

---

## Regression Tests (run after each deployment)

```bash
#!/bin/bash
# quick-seo-check.sh — run after any web deployment

BASE="https://datemeup.app"

# robots.txt
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE/robots.txt)
CONTENT_TYPE=$(curl -s -I $BASE/robots.txt | grep content-type | head -1)
echo "robots.txt: $STATUS | $CONTENT_TYPE"

# sitemap
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE/sitemap.xml)
echo "sitemap.xml: $STATUS"

# OG image
SIZE=$(curl -s -I $BASE/og-image.png | grep content-length | awk '{print $2}')
echo "og-image.png: ${SIZE} bytes"

# Canonical
HAS_CANONICAL=$(curl -s $BASE/ | grep -c "canonical")
echo "Canonical tags: $HAS_CANONICAL"

# Schema
HAS_SCHEMA=$(curl -s $BASE/ | grep -c "application/ld+json")
echo "Schema scripts: $HAS_SCHEMA"
```

---

## Acceptance Criteria Summary

| Test | Must Pass Before Launch |
|---|---|
| robots.txt returns plain text | ✅ Required |
| sitemap.xml returns XML | ✅ Required |
| Canonical URLs on public pages | ✅ Required |
| Schema.org valid (no errors) | ✅ Required |
| OG image > 50KB | ✅ Required |
| Smart App Banner visible on iOS | ⚠️ High priority |
| AASA file valid | ⚠️ High priority |
| Android assetlinks.json valid | ⚠️ High priority |
| LCP < 2.5s | ✅ Required |
| Mobile-friendly test passes | ✅ Required |
| GSC sitemap submission success | ✅ Required |
| GA4 events firing | ⚠️ High priority |
| App Store metadata updated | ✅ Required before promotion |
| Google Play metadata updated | ✅ Required before promotion |
