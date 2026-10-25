# DateMeUp — Cross-Platform Discoverability

**Audit Date:** October 2026  
**Domain:** https://datemeup.app  
**iOS bundle:** app.togetherplans.datenight (ASC ID 6806890578)  
**Android package:** datemeup.app  

---

## Executive Summary

DateMeUp's sharing loop is its most powerful organic growth mechanism — every shared invite card, vote link, or plan generates a URL that a new user receives. When that URL opens in a mobile browser and **doesn't redirect to the app**, the conversion is broken. Currently:

- `/join/:token` links open in mobile Safari/Chrome as a web page (no app prompt)
- `/vote/:shareToken` links open in the browser (works — but no install prompt)
- `/share/:shareToken` links open in the browser (works — but no install prompt)
- No Smart App Banner exists
- No Apple App Site Association file exists
- No Android Digital Asset Links file exists

Fixing these is the single highest-leverage action for increasing organic installs. A user who receives a vote link and completes voting in the browser is one step from installing the app — but that step is currently invisible.

---

## 1. Apple Universal Links (AASA)

### What It Is
Apple Universal Links (`apple-app-site-association`) tells iOS which URLs should open your native app instead of the browser. When a user taps a datemeup.app link in Messages, Mail, Notes, or Safari, iOS checks the AASA file and, if a match is found, opens the app directly.

Without AASA: every shared link opens in Safari.  
With AASA: `/join/:token` and `/vote/:shareToken` links open DateMeUp instantly.

### Current State
`https://datemeup.app/.well-known/apple-app-site-association` — **does not exist** (returns SPA HTML fallback).

### File to Create

**Path:** `/root/DateNight/web/public/.well-known/apple-app-site-association`

**Note:** No `.json` extension. Apple requires the file at this exact path with content-type `application/json`.

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAMID.app.togetherplans.datenight"],
        "components": [
          {
            "/": "/join/*",
            "comment": "Invite links — open app to join a date plan"
          },
          {
            "/": "/vote/*",
            "comment": "Guest voting links — open app if installed"
          },
          {
            "/": "/share/*",
            "comment": "Share card links"
          }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAMID.app.togetherplans.datenight"]
  }
}
```

> **⚠️ ACTION REQUIRED:** Replace `TEAMID` with your actual Apple Team ID. Find it at https://developer.apple.com/account → Membership Details → Team ID. It is a 10-character alphanumeric string (e.g. `A1B2C3D4E5`).

**Full example with placeholder Team ID `A1B2C3D4E5`:**
```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["A1B2C3D4E5.app.togetherplans.datenight"],
        "components": [
          {
            "/": "/join/*",
            "comment": "Invite token links"
          },
          {
            "/": "/vote/*",
            "comment": "Guest vote links"
          },
          {
            "/": "/share/*",
            "comment": "Share card links"
          }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["A1B2C3D4E5.app.togetherplans.datenight"]
  }
}
```

### Cloudflare Pages AASA Serving Requirements

Cloudflare Pages must serve this file with:
- `Content-Type: application/json`
- No redirect (must be a direct 200, not a 301/302)
- Over HTTPS (already satisfied)

Cloudflare Pages serves files from `web/public/` automatically. The `.well-known/` directory is supported. However, verify the content-type header is correct by checking:
```bash
curl -I https://datemeup.app/.well-known/apple-app-site-association
# Must return: content-type: application/json
```

If Cloudflare returns `text/html`, add a header rule in `web/public/_headers`:
```
/.well-known/apple-app-site-association
  Content-Type: application/json
```

### iOS App Configuration (Already Needed in Xcode)

In `mobile/ios/DateNight.xcodeproj` (or via EAS build config), ensure:
1. Associated Domains entitlement is enabled: `applinks:datemeup.app`
2. The Expo config in `mobile/app.json` or `mobile/app.config.js` includes:
```json
{
  "ios": {
    "associatedDomains": ["applinks:datemeup.app"]
  }
}
```

For EAS builds, this is compiled into the entitlements automatically from `app.json`.

---

## 2. Android App Links (Digital Asset Links)

### What It Is
Android App Links use `assetlinks.json` to verify that `datemeup.app` and the Android app `datemeup.app` are owned by the same entity. When verified, Android opens matching URLs directly in the app without showing a disambiguation dialog.

Without assetlinks.json: Android shows "Open with" dialog (browser vs app), or just opens in Chrome.  
With assetlinks.json: `/vote/*` and `/join/*` links open the app automatically.

### Current State
`https://datemeup.app/.well-known/assetlinks.json` — **does not exist**.

### File to Create

**Path:** `/root/DateNight/web/public/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.datemeup.datenight",
      "sha256_cert_fingerprints": [
        "REPLACE_WITH_YOUR_SHA256_CERTIFICATE_FINGERPRINT"
      ]
    }
  }
]
```

> **⚠️ ACTION REQUIRED:** Replace `REPLACE_WITH_YOUR_SHA256_CERTIFICATE_FINGERPRINT` with the actual SHA-256 fingerprint of your Android signing certificate.

**How to get the SHA-256 fingerprint:**

If signing with a keystore (local):
```bash
keytool -list -v -keystore /path/to/your/keystore.jks -alias your_alias
# Look for "SHA256:" in the output
```

If using Google Play App Signing (recommended — EAS uses this):
1. Go to Google Play Console → Your App → Setup → App Signing
2. Copy the SHA-256 certificate fingerprint from the "App signing key certificate" section
3. It looks like: `AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78`

**If using EAS / Play App Signing, you need TWO fingerprints** — one for the upload key, one for the signing key:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.datemeup.datenight",
      "sha256_cert_fingerprints": [
        "PLAY_APP_SIGNING_KEY_SHA256_HERE",
        "UPLOAD_KEY_SHA256_HERE"
      ]
    }
  }
]
```

**Verify after deployment:**
```bash
curl https://datemeup.app/.well-known/assetlinks.json
# Should return the JSON above

# Google's verification tool:
# https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://datemeup.app&relation=delegate_permission/common.handle_all_urls
```

### Android App Configuration

In `mobile/android/app/src/main/AndroidManifest.xml`, the intent filter for App Links must be present (EAS/Expo handles this via `app.json`):

In `mobile/app.json` or `mobile/app.config.js`:
```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "https",
            "host": "datemeup.app",
            "pathPrefix": "/join"
          },
          {
            "scheme": "https",
            "host": "datemeup.app",
            "pathPrefix": "/vote"
          },
          {
            "scheme": "https",
            "host": "datemeup.app",
            "pathPrefix": "/share"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

---

## 3. Smart App Banner

### What It Is
A native iOS banner that appears at the top of Safari when visiting datemeup.app on an iPhone/iPad. Shows the app icon, name, rating, and an "Open" or "Get" button. Apple renders this automatically from a single meta tag.

### Current State
No Smart App Banner meta tag in `web/index.html`.

### Fix

**File to modify:** `/root/DateNight/web/index.html`

Add to `<head>`:
```html
<meta name="apple-itunes-app" content="app-id=6806890578" />
```

**For deep-linking the banner to a specific page (e.g., on vote pages):**
```html
<!-- On /vote/:shareToken pages, add the app-argument to open the right screen -->
<meta name="apple-itunes-app" content="app-id=6806890578, app-argument=https://datemeup.app/vote/TOKEN_HERE" />
```

This requires per-page meta (via react-helmet-async) for the vote and join routes:

```tsx
// In the VotePage component:
import { Helmet } from 'react-helmet-async'

export function VotePage({ shareToken }: { shareToken: string }) {
  return (
    <>
      <Helmet>
        <meta 
          name="apple-itunes-app" 
          content={`app-id=6806890578, app-argument=https://datemeup.app/vote/${shareToken}`} 
        />
        <title>Vote on Tonight's Plan — DateMeUp</title>
        <meta name="description" content="Your partner wants your vote! Choose APPROVE, MAYBE, or REJECT for tonight's date options. No app required." />
      </Helmet>
      {/* page content */}
    </>
  )
}
```

> **Note:** The Smart App Banner only appears in Safari on iOS, not in Chrome for iOS or any Android browser. It is still worth implementing — Safari is the default browser on iOS, and most shared links will open in Safari.

---

## 4. Web-to-App Funnel: UTM Tracking

### Current State
The landing page has App Store and Google Play download buttons, but no UTM parameters. Every install from the website is attributed as "organic" in App Store Connect / Play Console — indistinguishable from App Store search installs.

### Fix

Add UTM parameters to all app store links in the landing page:

**App Store links by traffic source:**

| Context | URL |
|---------|-----|
| Landing page hero CTA | `https://apps.apple.com/app/id6806890578?pt=XXXXXXXX&ct=web_landing_hero&mt=8` |
| Landing page footer | `https://apps.apple.com/app/id6806890578?pt=XXXXXXXX&ct=web_landing_footer&mt=8` |
| /vote page install prompt | `https://apps.apple.com/app/id6806890578?pt=XXXXXXXX&ct=vote_page_install&mt=8` |
| /share page install prompt | `https://apps.apple.com/app/id6806890572?pt=XXXXXXXX&ct=share_page_install&mt=8` |

> **Note:** `pt=` is your App Store provider token (numeric, from App Store Connect). `ct=` is your campaign token (up to 40 chars, any string you choose). Find your provider token in App Store Connect → Analytics → Sources.

**Google Play links by traffic source:**

| Context | URL |
|---------|-----|
| Landing page hero CTA | `https://play.google.com/store/apps/details?id=app.datemeup.datenight&utm_source=datemeup_web&utm_medium=landing&utm_campaign=hero_cta` |
| /vote page install prompt | `https://play.google.com/store/apps/details?id=app.datemeup.datenight&utm_source=datemeup_web&utm_medium=vote_page&utm_campaign=guest_voter` |

**File to modify:** Find the App Store / Google Play button links in:
- `web/src/pages/Landing.tsx` (or Landing component equivalent)
- Any component that renders store badges

---

## 5. Deferred Deep Linking

### What It Is
When a user on mobile clicks a `/join/:token` link but doesn't have the app installed, deferred deep linking:
1. Redirects to the App Store / Play Store
2. Remembers the original URL
3. After the user installs and opens the app, navigates them to the original destination

Without deferred deep linking: user installs app, opens to home screen, loses the invite context.  
With deferred deep linking: user installs, opens app, lands directly on the plan they were invited to.

### Current State
No deferred deep linking implemented.

### Implementation Options

#### Option A: Branch.io (Recommended for Speed)
- Free tier: up to 10,000 MAU
- Provides universal links, app links, and deferred deep linking in one SDK
- ~2 hours to integrate

**Expo integration:**
```bash
cd /root/DateNight/mobile
npx expo install react-native-branch
```

Follow: https://help.branch.io/developers-hub/docs/react-native

#### Option B: Firebase Dynamic Links
- **⚠️ Firebase Dynamic Links is deprecated** (shut down August 2025). Do NOT implement.

#### Option C: Custom Implementation
- Store the invite token in AsyncStorage before redirecting to App Store
- On first launch, check AsyncStorage for pending invite
- Limitations: doesn't survive app install on iOS (AsyncStorage is cleared on fresh install); doesn't work for completely new users

**Recommendation:** Use Branch.io Option A. The /join/:token invite flow is a key conversion event — a broken invite experience means every shared invite card results in a dropped conversion.

### Minimum Viable Deferred Deep Link (No SDK)

If Branch.io is deferred, implement a web-side prompt instead:

On `/join/:token` in mobile browser, show a banner:
```
"Open this invite in the DateMeUp app for the best experience"
[Open in App]  [Continue in Browser]
```

The "Open in App" button links to:
- iOS: `datemeup://join/TOKEN` (if app installed) → falls back to App Store
- Android: intent URL or play store link

This is a UX compromise — it doesn't pass the token through install — but it at least makes the prompt visible.

---

## 6. Guest Voting as Organic Acquisition

### Why This Matters
The `/vote/:shareToken` route allows anyone to vote on a date plan **without installing the app**. This is:
- A friction-free entry point for partners who don't have the app yet
- A viral acquisition surface — every plan owner's partner receives a vote link
- A potential SEO landing page if made discoverable

### Current SEO State of Vote Pages
- No meta tags specific to vote pages (inherits generic index.html title)
- OG image is broken (3KB placeholder) — vote links shared in WhatsApp/iMessage render blank
- No structured data
- Title in meta: "🌙 DateMeUp - Plan Together, Go Together" — generic, doesn't describe the page

### Fixes

**1. Per-page meta for /vote/:shareToken (via react-helmet-async):**
```tsx
<Helmet>
  <title>Vote on [Partner's Name]'s Date Plan — DateMeUp</title>
  <meta name="description" content="Your input is needed! Vote on tonight's date options — no app required. DateMeUp makes planning date nights easy for couples." />
  <meta property="og:title" content="Vote on Tonight's Date Plan" />
  <meta property="og:description" content="[Partner] wants your vote on tonight's date night options. Tap to vote — no app needed." />
  <meta property="og:image" content="https://datemeup.app/og-image-vote.png" />
  <meta name="apple-itunes-app" content={`app-id=6806890578, app-argument=https://datemeup.app/vote/${shareToken}`} />
</Helmet>
```

If the plan name and owner name are available from the API at page load, include them in the OG title dynamically. This dramatically increases click-through rate on shared links.

**2. OG image for vote pages:**
Create `/root/DateNight/web/public/og-image-vote.png` — a 1200×630px image with copy like "Your vote is needed for tonight's plan" or "Plan together. Vote together." — something that makes recipients curious and compels them to tap.

**3. Post-vote install prompt:**
After a guest completes voting, show a conversion moment:
```
"Want to plan your own date nights together?
 Download DateMeUp — it's free"
[Download on App Store]  [Get on Google Play]
```

This is the highest-intent moment for guest voters — they just experienced the product value.

**4. SEO discoverability of vote pages:**
Currently, `robots.txt` doesn't exist. Once created, vote pages should be **allowed** (not disallowed) — individual vote links may accumulate inbound links or social shares if a plan goes viral in a group chat. See `robots.txt` in 02-Technical-SEO-Audit.md §2.

---

## 7. Complete File Manifest

### Files to Create

**`/root/DateNight/web/public/.well-known/apple-app-site-association`**
```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAMID.app.togetherplans.datenight"],
        "components": [
          { "/": "/join/*", "comment": "Invite links" },
          { "/": "/vote/*", "comment": "Guest vote links" },
          { "/": "/share/*", "comment": "Share card links" }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAMID.app.togetherplans.datenight"]
  }
}
```
*(Replace `TEAMID` with your 10-character Apple Team ID)*

**`/root/DateNight/web/public/.well-known/assetlinks.json`**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.datemeup.datenight",
      "sha256_cert_fingerprints": [
        "REPLACE_WITH_PLAY_APP_SIGNING_SHA256",
        "REPLACE_WITH_UPLOAD_KEY_SHA256"
      ]
    }
  }
]
```
*(Get fingerprints from Google Play Console → Setup → App Signing)*

### Files to Modify

**`/root/DateNight/web/index.html`** — Add:
```html
<meta name="apple-itunes-app" content="app-id=6806890578" />
```

**`/root/DateNight/web/public/_headers`** — Add (to ensure correct content-type for AASA):
```
/.well-known/apple-app-site-association
  Content-Type: application/json

/.well-known/assetlinks.json
  Content-Type: application/json
```

**`/root/DateNight/mobile/app.json`** — Add associated domains and intent filters (see §1 and §2 above).

---

## 8. Verification Checklist

After deploying all files, verify with:

```bash
# AASA
curl -sI https://datemeup.app/.well-known/apple-app-site-association | grep content-type
# Must return: content-type: application/json
curl -s https://datemeup.app/.well-known/apple-app-site-association | python3 -m json.tool
# Must return valid JSON

# Android App Links
curl -s https://datemeup.app/.well-known/assetlinks.json | python3 -m json.tool
# Must return valid JSON

# Google's Digital Asset Links validator:
# https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://datemeup.app&relation=delegate_permission/common.handle_all_urls

# Smart App Banner (check in Safari on an iPhone):
# Visit https://datemeup.app — should see app banner at top

# OG tags (use Facebook Sharing Debugger):
# https://developers.facebook.com/tools/debug/?q=https://datemeup.app

# Twitter Card validator:
# https://cards-dev.twitter.com/validator
```

---

## Priority Order

| Priority | Item | Time | Dependency |
|----------|------|------|-----------|
| 🔴 1 | Get Apple Team ID | 5 min | Developer account access |
| 🔴 2 | Get Android SHA-256 from Play Console | 10 min | Play Console access |
| 🔴 3 | Create AASA file with real Team ID | 15 min | #1 |
| 🔴 4 | Create assetlinks.json with real SHA-256 | 15 min | #2 |
| 🔴 5 | Add `_headers` to fix content-type | 5 min | None |
| 🔴 6 | Add Smart App Banner meta tag to index.html | 5 min | None |
| 🟠 7 | Add UTM params to all store links | 30 min | None |
| 🟠 8 | Per-page meta for /vote/:shareToken via react-helmet | 1 hr | react-helmet-async installed |
| 🟡 9 | Create og-image-vote.png | 2 hrs | Design work |
| 🟡 10 | Post-vote install prompt in VotePage component | 2 hrs | Design sign-off |
| 🟡 11 | Evaluate Branch.io for deferred deep linking | 4 hrs | Product decision |

---

*Related documents: [01-Executive-Summary.md](./01-Executive-Summary.md) | [02-Technical-SEO-Audit.md](./02-Technical-SEO-Audit.md)*
