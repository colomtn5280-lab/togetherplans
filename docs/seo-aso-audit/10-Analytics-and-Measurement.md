# 10 — Analytics and Measurement

**App:** DateMeUp / TogetherPlans
**Web:** https://datemeup.app
**Last updated:** October 2026

---

## Current State

| Tool | Status |
|------|--------|
| Google AdSense | ✅ Present in `web/index.html` |
| Google Analytics 4 | ❌ Not implemented |
| Google Search Console | ❌ Not verified |
| Firebase Analytics (mobile) | ❌ Not instrumented |
| App Store Connect Analytics | ✅ Available (no action needed — Apple provides automatically) |
| Google Play Console Analytics | ✅ Available (no action needed) |

**Immediate gap:** We are flying blind on user behaviour. The AdSense tag confirms Google's infrastructure is in place, but we have zero funnel data, no conversion tracking, and no visibility into which features drive engagement.

---

## 1. Google Search Console

### Setup
1. Go to https://search.google.com/search-console/
2. Add property → Domain property: `datemeup.app`
3. Verify via **DNS TXT record** (recommended — survives index.html changes):
   ```
   DNS TXT record name: datemeup.app
   Value: google-site-verification=<token>
   ```
   Add via Cloudflare DNS dashboard → DNS → Add record → TXT.
4. Alternative: HTML file verification — upload `google<token>.html` to Cloudflare Pages public directory.

### Reports to Monitor Weekly

| Report | What to look for |
|--------|-----------------|
| **Performance** | Impressions, clicks, CTR, average position per query |
| **Coverage** | Indexed pages vs. excluded pages — catch crawl errors |
| **Core Web Vitals** | LCP, FID/INP, CLS — impacts ranking |
| **Sitemaps** | Submit `https://datemeup.app/sitemap.xml` once created |
| **Links** | External sites linking to datemeup.app |
| **Manual Actions** | Check monthly — penalty indicator |

### Priority Queries to Track
- `date night planner` — primary target
- `date night ideas couple` — informational + transactional
- `what to do tonight couple` — conversational
- `date night voting app` — product-specific
- `date night app` — high volume, competitive
- `DateMeUp` — branded

### Core Web Vitals Targets (2026 thresholds)
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5–4.0s | > 4.0s |
| INP (Interaction to Next Paint) | < 200ms | 200–500ms | > 500ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1–0.25 | > 0.25 |

Note: datemeup.app is a React SPA — without pre-rendering, LCP will likely be poor (JS must load before paint). See document `03-Technical-SEO-Audit.md` for pre-rendering recommendations.

---

## 2. Google Analytics 4 (Web)

### Implementation

Add to `web/index.html` in the `<head>`, **after** the AdSense tag:

```html
<!-- Google Analytics 4 -->
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

Replace `G-XXXXXXXXXX` with the Measurement ID from GA4 → Admin → Data Streams → Web stream.

**Privacy compliance:**
- `anonymize_ip: true` — required for GDPR (EU users)
- Add cookie consent banner before firing GA4 on EU traffic (Cloudflare Zaraz or a lightweight consent library)
- Do not track personally identifiable information (PII) in event parameters

### Minimum Event Schema

Instrument these events in the React app. Use `gtag('event', ...)` or a thin wrapper:

```typescript
// analytics.ts — thin GA4 wrapper
export const trackEvent = (
  eventName: string,
  params?: Record<string, string | number | boolean>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};
```

| Event Name | Trigger | Key Parameters |
|------------|---------|----------------|
| `page_view` | Every route change | `page_title`, `page_location` |
| `sign_up` | Registration complete | `method` (email/google) |
| `login` | Login complete | `method` |
| `create_proposal` | Proposal saved/shared | `activity_count` (number of items added) |
| `vote_cast` | Each vote submitted | `vote_value` (love/maybe/nope), `proposal_id` |
| `match_achieved` | Match screen displayed | `proposal_id`, `matched_activity_name` |
| `invite_sent` | Invite link copied/shared | `invite_method` (text/copy/share) |
| `invite_card_selected` | Card template chosen | `card_template_id` |
| `after_dark_viewed` | After Dark section opened | — |
| `guest_vote_completed` | Guest voting flow finished | — |

### Conversion Events (mark as conversions in GA4)
- `sign_up`
- `match_achieved`

These two conversions map to the core value proposition. `match_achieved` = the app worked.

### Funnels to Configure (GA4 → Explore → Funnel Exploration)

**Onboarding funnel:**
`page_view (landing)` → `sign_up` → `create_proposal` → `invite_sent` → `match_achieved`

**Guest voter funnel:**
`page_view (guest vote URL)` → `vote_cast` → `guest_vote_completed`

---

## 3. Firebase Analytics (Mobile)

Firebase Analytics is included with `@react-native-firebase/analytics` and is available via Expo's Firebase integration. It is the **mobile equivalent of GA4** — data can be surfaced in both Firebase Console and GA4 (link Firebase to GA4 in Firebase Console → Project Settings → Integrations).

### Setup (Expo)

```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

Add `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) to the Expo project — download from Firebase Console → Project Settings → Your apps.

### Key Mobile Events

```typescript
import analytics from '@react-native-firebase/analytics';

// Screen views (automatic with navigation integration)
analytics().logScreenView({
  screen_name: 'ProposalScreen',
  screen_class: 'ProposalScreen',
});

// Custom events
analytics().logEvent('vote_cast', {
  vote_value: 'love', // 'love' | 'maybe' | 'nope'
  proposal_id: proposal.id,
});

analytics().logEvent('match_achieved', {
  proposal_id: proposal.id,
  matched_activity: activity.name,
});
```

### Automatic Firebase Events (no instrumentation needed)
| Event | What it tracks |
|-------|---------------|
| `first_open` | First app launch (UA equivalent) |
| `app_open` | Every subsequent open |
| `session_start` | Each session |
| `os_update` | OS version changes |
| `screen_view` | With navigation integration |

### Firebase Console Reports to Review Weekly
- **Dashboard** → Active users, new users, events
- **Retention** → Day-1, Day-7, Day-30 cohorts
- **Funnels** → Onboarding funnel
- **Audiences** → Users who created a proposal vs. didn't

---

## 4. App Store Connect Analytics

Available automatically once the app has downloads. No instrumentation required.

### Weekly Review Checklist
Navigate to App Store Connect → Analytics:

| Metric | Where | What to watch |
|--------|-------|--------------|
| Impressions | Acquisition → Impressions | Trending up/down; seasonal spikes |
| Product Page Views | Acquisition → Product Page Views | View-to-download conversion |
| Downloads | Acquisition → Downloads | New installs by source |
| **Conversion rate** | Impressions ÷ Downloads | Target: >3% from search |
| Sessions | Engagement → Sessions | Engagement trend |
| Active Devices | Engagement → Active Devices | D1, D7, D28 retention proxy |
| Crashes | Performance → Crashes | Should be <1% |

### Acquisition Sources (filter by)
- App Store Search — organic keyword traffic
- App Store Browse — category/editorial traffic
- App Referrals — cross-promotion
- Web Referrals — from datemeup.app Smart App Banner
- App Clips (if built)

---

## 5. Google Play Console Analytics

Available automatically. Review weekly in Play Console → Grow → Acquisition reports.

| Report | Metric | Target |
|--------|--------|--------|
| Store listing visitors | Listing visitors | Trend up |
| Store listing conversion rate | Visitors → Installers | Target: >30% |
| Acquisition channels | Organic Search, Explore | Organic should be dominant post-launch |
| Android Vitals | Crash rate | < 1% |
| Android Vitals | ANR rate | < 0.47% |
| Ratings | Average rating | > 4.3 |
| Ratings | Rating velocity | No spike of 1-stars |

---

## 6. KPI Framework

### Tier 1: North Star KPIs (review weekly)

| KPI | Definition | Data Source | Target |
|-----|-----------|-------------|--------|
| **Match achieved rate** | % of proposals where all voters complete voting and a match is found | Firebase / GA4 `match_achieved` ÷ `create_proposal` | > 60% |
| **Day-7 retention** | % of users who open the app again 7 days after first open | Firebase → Retention | > 25% |
| **App Store search → install CVR** | Impressions from App Store Search ÷ Downloads from that source | App Store Connect Analytics | > 3% |
| **Play Store listing → install CVR** | Store Listing Visitors ÷ Installs | Play Console | > 30% |

### Tier 2: Growth KPIs (review weekly)

| KPI | Definition | Data Source | Frequency |
|-----|-----------|-------------|-----------|
| Organic search impressions | Total impressions in Google Search for datemeup.app URLs | Google Search Console | Weekly |
| Organic search clicks | Clicks through from Google Search | GSC | Weekly |
| Organic search CTR | Clicks ÷ Impressions | GSC | Weekly |
| Avg. position for target queries | Position for "date night planner", "date ideas couple" etc. | GSC | Weekly |
| Organic web registrations | `sign_up` events from `organic` traffic source | GA4 | Weekly |
| First-open → registration rate | Users who sign up ÷ users with `first_open` event | Firebase | Weekly |

### Tier 3: Engagement KPIs (review monthly)

| KPI | Definition | Data Source |
|-----|-----------|-------------|
| Proposal creation rate | % of registered users who create ≥1 proposal within 7 days of sign-up | Firebase `create_proposal` cohort |
| After Dark engagement rate | % of sessions that include `after_dark_viewed` | Firebase |
| Invite card selection rate | % of proposals where a card is selected | Firebase `invite_card_selected` |
| Guest vote completion rate | % of guest vote links that result in `guest_vote_completed` | Firebase / GA4 |
| Average vote session length | Time from first vote to last vote per proposal | Firebase |

### KPI Dashboard Setup

Create a **Looker Studio** (free) dashboard pulling from:
1. GA4 (web events, conversions, user counts)
2. GSC (search performance via Looker Studio connector)
3. Firebase (via BigQuery export → Looker Studio — requires Spark/Blaze plan)
4. Manual weekly inputs for ASC and Play Console (no API connector, copy key metrics)

Template structure:
```
Page 1: Executive Summary (weekly snapshot)
Page 2: Acquisition (search, app stores, web)
Page 3: Engagement (funnel, feature usage)
Page 4: Retention (D1/D7/D30 cohorts)
Page 5: App Store Health (ratings, vitals)
```

---

## 7. Privacy and Compliance

| Requirement | Action |
|-------------|--------|
| GDPR (EU users) | Cookie consent banner before GA4 fires. IP anonymization enabled. |
| CCPA (California users) | Privacy policy must include data sale opt-out. |
| Apple ATT (iOS 14.5+) | `NSUserTrackingUsageDescription` in Info.plist if using cross-app tracking. Firebase Analytics is exempt from ATT if not used for ad targeting. |
| App Store privacy labels | Data safety section in ASC must list: Usage Data (app interactions), Diagnostics (crash data). Mark as not linked to identity if not sending user IDs to analytics. |
| Play Store data safety | Complete the Data Safety form: Usage and diagnostics (Firebase), Analytics (GA4). Encryption in transit: yes. Users can request deletion: yes (link to account deletion flow). |

---

## 8. Implementation Priority

| Priority | Task | Effort | Owner |
|----------|------|--------|-------|
| 🔴 P0 | GSC DNS verification | 15 min | Jake |
| 🔴 P0 | GA4 tag in index.html | 1 hour | Dev |
| 🔴 P0 | Core event instrumentation (sign_up, create_proposal, match_achieved) | 4 hours | Dev |
| 🟡 P1 | Firebase Analytics on mobile | 4 hours | Dev |
| 🟡 P1 | Full event schema (all 10 events) | 4 hours | Dev |
| 🟡 P1 | GA4 funnels configured | 1 hour | Jake |
| 🟢 P2 | Looker Studio dashboard | 2 hours | Jake |
| 🟢 P2 | Cookie consent banner (EU) | 4 hours | Dev |
| 🟢 P2 | Firebase → BigQuery → Looker Studio | 4 hours | Dev |
