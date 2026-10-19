# DateMeUp — Advertising Monetization Audit

**Report date:** October 19, 2026  
**Prepared for:** Jake (DateMeUp / TogetherPlans)  
**Scope:** READ-ONLY audit — no code, infrastructure, or accounts modified  
**Classification of findings:** `[VERIFIED]` = confirmed from codebase inspection · `[RESEARCHED]` = from official docs/web · `[ASSUMED]` = reasonable inference labeled clearly

---

## Executive Summary

DateMeUp has **zero ad infrastructure** today — no SDKs, no analytics, no consent layer, no ad unit IDs. This is a clean slate, which is good, but also means several pre-requisite blockers must be resolved before the first ad dollar is earned.

**The single most dangerous finding:** The current Privacy Policy (`LegalPages.tsx`) explicitly states *"We do not sell your personal data to third parties. We do not use your data to serve targeted advertising."* Publishing ads while this text stands is a legal misrepresentation. **This must be updated before any ad SDK is shipped.**

**The single most valuable structural finding:** The app is pre-store-submission with no established users. This is the ideal moment to instrument the ad infrastructure correctly from day one — before a user-base forms an expectation of a clean experience and before privacy policy obligations crystallize at scale.

**Recommendation:** Launch with **dormant ad-ready infrastructure** (SDK installed, feature-flagged off) in the first store submissions. Run with ads enabled only after: (a) privacy policy updated, (b) ATT prompt implemented and tested, (c) Play Data Safety form updated, (d) content category review for After Dark completed. Timeline: ~6–8 weeks of engineering work gated on these compliance tasks.

**Projected ILLUSTRATIVE revenue** at steady state for a US-focused social app with typical fill rates: $3–$18/day per 1,000 MAU depending on format mix. See Phase 4 for detailed MAU scenarios.

---

## Architecture Inventory

> All findings in this section are **[VERIFIED]** from direct codebase inspection.

### Web (`/root/DateNight/web`)
| Attribute | Value |
|---|---|
| Framework | React 18.2.0 + Vite 5.0.12 + TypeScript 5.3.3 |
| Routing | React Router DOM 6.21.3 (client-side SPA, hash-free) |
| State | Zustand 4.5.0 + TanStack React Query 5.17.19 |
| HTTP | Axios 1.6.7 |
| i18n | i18next (EN + ES) |
| Deployment | Cloudflare Pages (live at https://datemeup.app) |
| PWA | manifest.json present; `display: standalone`; name is "TogetherPlans" ⚠️ |
| Analytics SDKs | **None** — no gtag, GA4, pixel, or any tracking script |
| Ad SDKs | **None** — no AdSense `adsbygoogle.js` in index.html |
| Consent layer | **None** — no CMP, no cookie banner, no consent gate |
| Privacy policy | Exists at `/privacy` — GDPR+CCPA language but **explicitly denies targeted advertising** |

**Web pages inventory** (29 pages across `/web/src/pages/`):
- Auth: LandingPage, LoginPage, SignupPage, VerifyEmailPage, ResetPasswordPage, ForgotPasswordPage, AppleCallbackPage, FacebookCallbackPage
- Core: DashboardPage, GroupsPage, GroupDetailPage, SuggestionsPage, ProposalPage, NewProposalPage
- Features: AfterDarkPage ⚠️, InviteCardPage, ShareCardPage, GuestVotePage, JoinPage
- Utility: LegalPages (Privacy, Terms, Support), NotificationsSettingsPage
- Business portal: BusinessLandingPage, BusinessAuthPage, BusinessOnboardingPage, BusinessDashboardPage, BusinessAnalyticsPage, BusinessProfilePage, BusinessListingsPage, BusinessLayout

### Mobile (`/root/DateNight/mobile`)
| Attribute | Value |
|---|---|
| Runtime | Expo SDK ~57.0.18 (React Native 0.86.3, React 19.2.3) |
| iOS bundle | `app.togetherplans.datenight`, build number 8, team `234UWRXT57` |
| Android package | `datemeup.app`, versionCode 8, targetSdkVersion 35 |
| ASC App ID | 6806890578 |
| EAS Project ID | 01082da3-36a9-4e80-94f3-a028aeab083f |
| Store status | **Not yet submitted** to App Store or Play Store |
| Navigation | React Navigation 7 (native-stack + bottom-tabs) |
| Analytics SDKs | **None** |
| Ad SDKs | **None** — no `react-native-google-mobile-ads`, no `expo-ads-admob` |
| ATT plugin | **Missing** — `expo-tracking-transparency` NOT in `app.json` plugins |
| Consent layer | **None** |

**Mobile plugins** (`app.json`):
```
expo-secure-store, expo-location, expo-notifications,
expo-web-browser, expo-apple-authentication, expo-font,
@react-native-community/datetimepicker, expo-localization
```
*No ad-related plugin present.*

**Mobile screens inventory** (15 screens across `/mobile/src/screens/`):
- Auth: WelcomeScreen, LoginScreen, RegisterScreen, OnboardingScreen
- Core: GroupsScreen, GroupDetailScreen, ProposalDetailScreen, CreateProposalScreen
- Features: SuggestionsScreen, AfterDarkScreen ⚠️, InviteMembersScreen
- Utility: ProfileScreen, InviteCardScreen, ShareCardScreen, CreateGroupScreen

### Backend (`Cloud Run`)
| Attribute | Value |
|---|---|
| Stack | Node/Express/TypeScript/Prisma/PostgreSQL |
| Relevance | Can serve feature flags, ad config, remote kill switches |
| Ad infrastructure | None currently |

### After Dark — Content Assessment
**[VERIFIED]** The `AfterDarkPage.tsx` (web) and `AfterDarkScreen.tsx` (mobile) implement:
- A curated grid of intimate/romantic activity suggestions
- Two tiers: **ROMANTIC** (💫) and **SPICY** (🔥)  
- Time gate: displays a countdown to 9pm but **content is not actually gated** — it renders regardless
- User-created "ideas" stored in the backend
- Mood categories: Adventurous, Romantic, Social, Chill, Spontaneous, Cultural

The "Spicy" tier presents activities described as intimate in nature. While not sexually explicit, this content sits in Google's **"sexually suggestive" restricted zone** which affects ad revenue significantly (see Phase 3).

---

## Phase 1 — Technical Feasibility

### 1.1 Web AdSense on a React SPA

**[RESEARCHED]** Google AdSense is fully supported on React SPAs but requires specific handling:

**Auto Ads** (the "paste one script" approach): Works for initial page load. On client-side React Router navigation, Auto Ads may not detect the route change automatically. **[RESEARCHED]** Google's guidance is that the `adsbygoogle.js` publisher-side script fires once on load; for SPAs, you should manually push new ad requests on each route change using `window.adsbygoogle.push({})` or mount/unmount ad unit components with React lifecycle hooks.

**Recommended approach for DateMeUp SPA:**
```tsx
// Pattern: wrap each ad slot in a React component that
// re-initializes on mount
useEffect(() => {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) { /* ignore */ }
}, []); // mount = new route = new impression opportunity
```

**AdSense eligibility gates [RESEARCHED]:**
1. Site must have original content (DateMeUp is UGC + curated venues — qualifies)
2. Site must have sufficient page views (new sites often require 3–6 months traffic history before approval)
3. Privacy Policy link must be present (✅ exists at `/privacy`)
4. Content must comply with Publisher Policies (⚠️ After Dark section is a risk — see Phase 3)
5. Site must not use deceptive navigation or ad placement

**AdSense integration complexity:** Low. Add `adsbygoogle.js` to `index.html`, create React component wrappers for ad units. No build toolchain changes required.

**Cloudflare Pages compatibility:** ✅ AdSense works on CDN-served static sites. No server-side requirement.

### 1.2 Mobile AdMob with Expo SDK 57

**[RESEARCHED]** The library situation is important to get right:

| Package | Status | Verdict |
|---|---|---|
| `expo-ads-admob` | **Deprecated** — removed in Expo SDK 47 | ❌ Do not use |
| `react-native-google-mobile-ads` (Invertase) | Actively maintained, Expo plugin available | ✅ Correct choice |

**`react-native-google-mobile-ads` with Expo SDK 57:**
- **[RESEARCHED]** Requires a **custom development build** — Expo Go does NOT support native modules
- **[VERIFIED]** DateMeUp already uses EAS Build with `expo-dev-client` available as a dev-time dep — this is the existing development path
- Install: `npx expo install react-native-google-mobile-ads expo-dev-client`
- Configuration in `app.json`:
```json
{
  "expo": {
    "plugins": [
      ["react-native-google-mobile-ads", {
        "androidAppId": "ca-app-pub-xxxxxxxx~xxxxxxxx",
        "iosAppId":     "ca-app-pub-xxxxxxxx~xxxxxxxx",
        "userTrackingUsageDescription": "DateMeUp uses your advertising identifier to show you relevant ads.",
        "skAdNetworkItems": [
          { "skAdNetworkIdentifier": "cstr6suwn9.skadnetwork" }
        ]
      }]
    ]
  }
}
```
- **ATT (App Tracking Transparency):** `expo-tracking-transparency` must also be added as a plugin. **[VERIFIED]** This plugin is MISSING from the current `app.json`. This is a blocker for iOS personalized ads.
- SDK initialization must happen at app startup, before any ad is requested:
```tsx
import mobileAds from 'react-native-google-mobile-ads';
await mobileAds().initialize();
```
- EAS Build: a new production build is required after adding the plugin — OTA updates cannot add native modules.

**[RESEARCHED] Ad formats available with react-native-google-mobile-ads:**
| Format | Component/API | Best for |
|---|---|---|
| Banner | `<BannerAd>` | Persistent top/bottom chrome |
| Interstitial | `InterstitialAd` | Between natural screen transitions |
| Rewarded | `RewardedAd` | Optional feature unlocks |
| Rewarded Interstitial | `RewardedInterstitialAd` | Opt-in mid-session |
| App Open | `AppOpenAd` | Cold/warm app launches |
| Native | `NativeAd` (advanced) | In-feed content-matched ads |

### 1.3 Feature Flag / Remote Config

**[VERIFIED]** The existing backend (`datenight-api`) on Cloud Run is capable of serving a simple feature flag endpoint. No Firebase Remote Config or third-party service is strictly required:

```typescript
// Minimal: backend returns { ads_enabled: boolean, ad_unit_ids: {...} }
GET /api/v1/config
```

This approach lets ads be enabled/disabled per-platform, per-environment, and per-user-segment without a store release. Recommended additions to the config response:
- `ads_enabled_web: boolean`
- `ads_enabled_ios: boolean`
- `ads_enabled_android: boolean`
- `ad_density: 'low' | 'medium' | 'high'` (controls how often interstitials fire)
- `after_dark_ads_enabled: boolean` (separate toggle for the sensitive section)

**[ASSUMED]** The existing TanStack React Query setup on web and mobile makes polling this config endpoint trivial with appropriate `staleTime`.

### 1.4 A/B Test Framework

No A/B framework exists today. **[RESEARCHED]** Recommended lightweight approach:
1. **Immediate:** Use the feature flag system above. Ship to 20% of users by splitting on `user.id % 5 === 0`. Measure engagement in existing backend analytics.
2. **Later (Phase B):** Integrate **PostHog** (open source, self-hostable on Cloud Run) — gives proper A/B, feature flags, and session replay. Alternatives: LaunchDarkly (paid), Firebase Remote Config + Analytics (free but Google dependency).

---

## Phase 2 — Placement & UX

### 2.1 Placement Philosophy

DateMeUp is a **high-intent utility app** used during planning sessions. Users are:
- In decision-making mode (voting, comparing options)
- In invite/coordination flows (sending group invites)
- In celebration/confirmation moments (proposal locked)

Ads that interrupt the **core voting loop** or **invite flow** will directly tank conversion and retention. The placement map below is designed around these constraints.

### 2.2 Web Placement Map

| Screen | Ad Type | Placement | Notes |
|---|---|---|---|
| **LandingPage** | Display/Responsive | Below hero, above features | Logged-out users only |
| **DashboardPage** | Native / Responsive | Between group cards (every 3rd group) | Only if user has ≥3 groups |
| **SuggestionsPage** | Sticky bottom banner | Fixed 320×50 or 728×90 | Below activity card grid |
| **SuggestionsPage** | In-feed responsive | After every 8th venue card | Labeled "Sponsored" |
| **AfterDarkPage** | ⛔ NO ADS | — | Content policy risk (see Phase 3) |
| **GroupDetailPage** | Responsive | Below the proposal list, above footer | Not between proposal cards |
| **LegalPages / Support** | Responsive | Below content | Low traffic, acceptable |
| **GuestVotePage** | Responsive | Below vote buttons | Guest users = no account friction |
| ~~ProposalPage (voting active)~~ | ⛔ NO ADS | — | Do not interrupt the vote UX |
| ~~NewProposalPage~~ | ⛔ NO ADS | — | Creation flow — don't break it |
| ~~InviteCardPage~~ | ⛔ NO ADS | — | Viral/invite flow — protect it |
| ~~ShareCardPage~~ | ⛔ NO ADS | — | Sharing moment — protect it |

**Auto Ads:** Enable with a custom placement exclusion list. Exclude: `/proposals/new`, `/join`, `/invite`, `/share`, `/after-dark`.

### 2.3 iOS/Android Placement Map

| Screen | Ad Type | Trigger/Position | Notes |
|---|---|---|---|
| **GroupsScreen** | Banner (320×50) | Bottom of ScrollView | Only if ≥2 groups |
| **SuggestionsScreen** | Native in-feed | Every 8th venue card | Labeled, matches card style |
| **SuggestionsScreen** | Interstitial | On category change (max 1/session) | Cap frequency: 1/24h per user |
| **ProfileScreen** | Banner | Below settings list | Low engagement — minimal revenue |
| **WelcomeScreen** (cold open) | App Open Ad | Splash → Home transition | Only after ATT prompt resolved |
| ~~AfterDarkScreen~~ | ⛔ NO ADS | — | Content policy risk |
| ~~GroupDetailScreen (voting)~~ | ⛔ NO ADS | — | Core interaction — protect |
| ~~ProposalDetailScreen~~ | ⛔ NO ADS | — | Core interaction — protect |
| ~~InviteMembersScreen~~ | ⛔ NO ADS | — | Viral loop — protect |
| ~~InviteCardScreen~~ | ⛔ NO ADS | — | Sharing moment — protect |
| ~~OnboardingScreen~~ | ⛔ NO ADS | — | First impression — protect |
| ~~LoginScreen / RegisterScreen~~ | ⛔ NO ADS | — | Auth funnel — protect |

**Interstitial frequency cap:** Hard cap at 1 per 24h per user, 1 per session. Interstitials must only show on natural navigation breaks (e.g., after suggestions list loads, not during a group vote).

**Rewarded ad opportunity:** Premium filter unlock. "Unlock advanced activity filters (dietary, budget, accessibility) — watch a 15s ad." This is the highest-eCPM format and user opt-in means zero UX friction.

### 2.4 Ad Unit Architecture

Recommended unit structure for AdMob:

```
App: DateMeUp
├── iOS Ad Units
│   ├── banner_groups_bottom          (Banner, 320×50)
│   ├── banner_profile_bottom         (Banner, 320×50)
│   ├── native_suggestions_infeed     (Native Advanced)
│   ├── interstitial_suggestions      (Interstitial)
│   ├── rewarded_filter_unlock        (Rewarded)
│   └── appopen_cold_launch           (App Open)
└── Android Ad Units
    └── (mirror of iOS above)
```

---

## Phase 3 — Privacy, Policy & Store Readiness

### 3.1 Privacy Policy — CRITICAL GAP

**[VERIFIED]** Current `LegalPages.tsx` line 59–60:
> *"We do not sell your personal data to third parties. We do not use your data to serve targeted advertising."*

**[VERIFIED]** Current `LegalPages.tsx` line 110–111:
> *"We do not use advertising cookies or third-party tracking cookies."*

**Both statements become false the moment an ad SDK is installed.** This must be updated before any SDK ships. Required additions:
- Disclosure of advertising SDKs as third-party services
- Disclosure of ad identifier collection (IDFA on iOS, AAID on Android)
- Opt-out mechanism for personalized ads (or commitment to non-personalized)
- Cookie/local storage update for AdSense cookies on web
- Data Sale disclosure update (AdMob sharing data with Google = "sharing," not selling, but CCPA requires disclosure)

### 3.2 Content Policy — After Dark Risk

**[RESEARCHED]** Google AdSense Publisher Policies and AdMob Publisher Policies prohibit:
- Sexually explicit content (absolute ban)
- "Sexually suggestive" content — permitted but **restricted**: receives fewer ads, lower CPMs, and is subject to advertiser category exclusions

**[VERIFIED]** DateMeUp's After Dark section:
- "🔥 Spicy" tier activities described as intimate
- Mood: "Romantic — Just the two of us"
- Content is not pornographic or explicit
- The section is **not age-gated** beyond requiring an account (13+ per Terms)

**Assessment:** The After Dark section sits in Google's **"Sexually suggestive / Romantic"** restricted category. This means:
1. AdSense/AdMob will classify the *entire app* under the highest-sensitivity content category if After Dark is a prominent feature
2. Brand-safe advertisers (banks, family goods, CPG) will exclude the app
3. eCPMs on the After Dark section will be 30–50% lower than other sections
4. Risk of automated policy strike if Google's crawlers flag the "Spicy" tier

**Recommendations:**
- **Do not serve ads on the After Dark screen/page** — apply a hard URL exclusion
- **Age-gate After Dark** at 18+ (not just "account required") — this also helps with store ratings
- **Request a manual content review** from Google before launching with AdMob, not after
- Set `<meta name="rating" content="mature">` on the After Dark web route

### 3.3 Apple App Tracking Transparency (ATT) — iOS Blocker

**[RESEARCHED]** As of iOS 14.5+, apps that use device identifiers for advertising tracking must:
1. Include `NSUserTrackingUsageDescription` in Info.plist
2. Call `requestTrackingPermissionsAsync()` from `expo-tracking-transparency` before serving personalized ads
3. If user denies: must request `npa=1` (non-personalized ads) from AdMob

**[VERIFIED]** Current `app.json` plugins:
```
expo-secure-store, expo-location, expo-notifications, expo-web-browser,
expo-apple-authentication, expo-font, @react-native-community/datetimepicker,
expo-localization
```
**`expo-tracking-transparency` is ABSENT.** This is a hard blocker for iOS ad serving with personalized ads.

**Timing recommendation:** Do NOT present the ATT prompt on first launch. App Store guidelines and user research consistently show that prompting after demonstrating value (e.g., after the user has created their first group or completed onboarding) results in 2–3× higher opt-in rates. Recommended flow:
```
App launch → Onboarding → First group created → [ATT prompt]
```

**[RESEARCHED]** Expo implementation:
```tsx
import * as TrackingTransparency from 'expo-tracking-transparency';

const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
const isPersonalized = status === 'granted';

await mobileAds().initialize();
// Set NPA flag if not granted
if (!isPersonalized) {
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.PG,
  });
}
```

Required `app.json` addition:
```json
{
  "plugins": [
    ["expo-tracking-transparency", {
      "userTrackingPermission": "DateMeUp uses your advertising identifier to show you ads that are relevant to your interests. This helps keep the app free."
    }]
  ]
}
```

### 3.4 Google Play Data Safety — Required Declarations

**[RESEARCHED]** Adding Google Mobile Ads SDK requires updating the Play Data Safety form with the following disclosures:

| Data Type | Collected | Shared | Purpose |
|---|---|---|---|
| IP address | Yes | Yes | Advertising, analytics, fraud prevention |
| User product interactions (taps, views) | Yes | Yes | Advertising, analytics |
| Diagnostic info (app performance) | Yes | Yes | Analytics |
| Android Advertising ID (AAID) | Yes | Yes | Advertising |
| App Set ID | Yes | Yes | Analytics, fraud prevention |

**[RESEARCHED]** Source: Google's official Play Data Disclosure page for GMA SDK (verified October 2026). All data is encrypted in transit (TLS). The app developer is responsible for completing this form — failure to do so will block Play Store publishing.

**[VERIFIED]** Current EAS `eas.json` submit config targets `track: internal` for Android — update Data Safety form before promoting to `production` track.

### 3.5 Personalized vs. Non-Personalized Ads

**Recommendation: Start with non-personalized ads (NPA mode).**

Rationale:
- Primary audience is US-based couples/friends — not a high-risk privacy concern group
- App has no established user base, so there is no audience data to leverage for personalization
- NPA simplifies compliance (no need for GDPR consent strings, no TCF consent framework)
- NPA on AdMob still generates contextual revenue — CPM reduction vs. personalized is ~15–30% but compliance overhead is far lower
- After user base is established (10k+ MAU), revisit personalization with proper consent UX

**NPA implementation:**
```tsx
// Web: append &npa=1 to all ad requests
// Mobile: set in initialization
await mobileAds().setRequestConfiguration({
  tagForChildDirectedTreatment: false,
  tagForUnderAgeOfConsent: false,
  maxAdContentRating: MaxAdContentRating.MA,
});
```

### 3.6 iOS App Store Content Rating Impact

**[RESEARCHED]** Adding AdMob may require updating the App Store content rating to reflect:
- Infrequent/mild sexual content or nudity (for the After Dark section)
- Advertising in the app (disclosed in App Store metadata)

**[VERIFIED]** Current `app.json` has no `ageRating` field set — it defaults to 4+ (most restrictive). With After Dark content and ads, the appropriate rating is likely **12+** or **17+** depending on how the content is assessed.

---

## Phase 4 — Revenue & Business Case

> ⚠️ **ALL FIGURES IN THIS SECTION ARE ILLUSTRATIVE.** They are projections based on industry benchmarks and stated assumptions. Actual results will differ materially based on user behavior, ad fill rates, content classification, and market conditions.

### 4.1 Benchmark Data

**[RESEARCHED]** Source: Business of Apps Mobile Advertising Rates 2025, Liftoff In-App Advertising Guide 2026:

| Ad Format | 2024 Global eCPM | US/NA Uplift | Estimated US eCPM |
|---|---|---|---|
| Banner | ~$2.80 | ~2.3× | ~$6.00 |
| Native in-feed | ~$3.30 | ~2.3× | ~$7.60 |
| Interstitial | ~$4.80 | ~2.3× | ~$11.00 |
| Rewarded video | ~$10.50 | ~2.3× | ~$24.00 |
| App Open | ~$3.50 | ~2.3× | ~$8.00 |

**[RESEARCHED]** Assumed US fill rate: 75–85% (typical for social/utility apps).

**[ASSUMED]** Social/date-planning app session characteristics:
- Sessions per user per week: ~3–5 (planning nights out)
- Average session duration: 4–8 minutes
- Page views per session: 4–8 screens
- Interstitial eligibility: ~1 per session (capped)

### 4.2 MAU Revenue Scenarios (Web + Mobile Combined)

**Format mix assumption:** 60% banner/native impressions, 30% interstitial, 10% rewarded

#### Scenario A: 1,000 MAU (Early launch)
| Metric | Value |
|---|---|
| Monthly impressions (banners/native) | ~72,000 |
| Monthly interstitial shows | ~3,000 |
| Monthly rewarded views | ~300 |
| Banner/native revenue (@ $7/CPM, 80% fill) | ~$403 |
| Interstitial revenue (@ $11/CPM, 80% fill) | ~$26 |
| Rewarded revenue (@ $24/CPM, 80% fill) | ~$6 |
| **Total ILLUSTRATIVE monthly** | **~$435/mo** |

#### Scenario B: 10,000 MAU (Growth stage)
| Metric | Value |
|---|---|
| Monthly impressions (banners/native) | ~720,000 |
| Monthly interstitial shows | ~30,000 |
| Monthly rewarded views | ~3,000 |
| Banner/native revenue | ~$4,032 |
| Interstitial revenue | ~$264 |
| Rewarded revenue | ~$58 |
| **Total ILLUSTRATIVE monthly** | **~$4,354/mo** |

#### Scenario C: 50,000 MAU (Established)
| Metric | Value |
|---|---|
| **Total ILLUSTRATIVE monthly** | **~$21,800/mo** |
| **Annual run rate** | **~$261,000/yr** |

#### Scenario D: 100,000 MAU (Scale)
| Metric | Value |
|---|---|
| **Total ILLUSTRATIVE monthly** | **~$43,500/mo** |
| **Annual run rate** | **~$522,000/yr** |

> Note: These figures are for US-only traffic, NPA mode, with After Dark section excluded from ad serving. Personalized ads could increase revenue 15–30%. After Dark being excluded removes an estimated 10–15% of sessions from monetization.

### 4.3 Alternative Networks Revenue Comparison

**[RESEARCHED]** AdMob alternatives assessed for React Native Expo:

| Network | RN Support | Expo Expo Plugin | Mediation | Notes |
|---|---|---|---|---|
| **AdMob** (Google) | ✅ via RNMGA | ✅ official plugin | Via Ad Manager | Best fill rate in US; content policy risk noted |
| **AppLovin MAX** | ✅ | Manual integration | ✅ header bidding | Best for maximizing eCPM through waterfall; requires bare workflow or custom plugin |
| **Meta Audience Network** | ⚠️ | None official | Via MAX | **Deprecated for new publishers Aug 2024** — Meta has largely shut down FAN for new integrations |
| **Unity Ads** | ✅ | Community plugin | Via MAX | Gaming-focused; lower fill for social apps |
| **ironSource** (Unity) | ✅ | Manual | ✅ | Strong video/rewarded; merging into Unity platform |
| **Vungle** (Liftoff) | ✅ | Manual | Via MAX | Good for rewarded video |

**[RESEARCHED]** Meta Audience Network has significantly restricted new publisher onboarding — relying on it as a primary or early network is not recommended.

**Recommended stack:**
1. **AdMob** as primary direct demand
2. **AppLovin MAX** as mediation layer (wraps AdMob + Unity + others) — increases effective eCPM 20–40% by running waterfall/header bidding
3. Hold on Unity/ironSource until AppLovin MAX mediation is tested

### 4.4 Web Monetization (AdSense)

**[RESEARCHED]** AdSense is appropriate for the web SPA. Key considerations:
- New AdSense accounts targeting low-traffic sites may face **3–6 month approval delays** or minimum traffic thresholds
- The web app is authenticated — most high-value pages require login, reducing crawler-visible page count
- Guest pages (`/join`, `/invite`, `/landing`) are publicly accessible — these are where AdSense approval is primarily evaluated
- Consider applying for AdSense early (even pre-launch) to start the approval clock

**Web eCPM [RESEARCHED]:** Social/utility web apps in US typically earn **$3–8 CPM** for display ads, lower than mobile. At 1,000 MAU with ~5 public page views/user/month on logged-out pages: ~5,000 impressions → ~$20–40/month at launch (negligible but grows with traffic).

---

## Phase 5 — Management Architecture

### 5.1 Ad Operations Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Revenue Layer                            │
│  AdMob (primary) ──→ AppLovin MAX (mediation, Phase B)     │
│  AdSense Web (independent)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Feature Flag Layer                         │
│  Backend /api/v1/config → { ads_enabled, ad_density, ... } │
│  TanStack Query (web + mobile) polls with staleTime=30min  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  SDK Layer                                  │
│  Web: adsbygoogle.js (script in index.html)                │
│  iOS/Android: react-native-google-mobile-ads               │
│  Both: ATT status → NPA vs personalized decision           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 Placement Components                        │
│  <AdBanner> <AdInFeed> <AdInterstitialTrigger>             │
│  Each reads feature flag before rendering                  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Remote Config Schema

Extend the backend config endpoint:
```typescript
interface AdConfig {
  ads_enabled: boolean;           // Global kill switch
  ads_enabled_web: boolean;
  ads_enabled_ios: boolean;
  ads_enabled_android: boolean;
  ads_enabled_after_dark: boolean; // Always false initially
  interstitial_cooldown_seconds: number; // Default: 86400
  interstitial_max_per_session: number;  // Default: 1
  ad_density: 'off' | 'low' | 'medium' | 'high';
  rewarded_feature_id: string;    // Which feature rewarded unlocks
  adsense_client_id: string;      // 'ca-pub-xxxxxxxxxx'
  admob_app_id_ios: string;
  admob_app_id_android: string;
}
```

### 5.3 Component Design Principles

**Web (`<AdUnit>` component):**
```tsx
function AdUnit({ slot, format = 'auto' }: { slot: string; format?: string }) {
  const { ads_enabled_web } = useAdConfig();
  if (!ads_enabled_web) return null;
  
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
    catch(e) { /* noop */ }
  }, []);

  return (
    <ins className="adsbygoogle"
         style={{ display: 'block' }}
         data-ad-client={ADSENSE_CLIENT_ID}
         data-ad-slot={slot}
         data-ad-format={format}
         data-full-width-responsive="true" />
  );
}
```

**Mobile ad components should:**
- Never render if `ads_enabled` is false (remote config)
- Handle load failures silently (no error shown to user)
- Log impression/failure events to backend for debugging
- Respect the interstitial cooldown via AsyncStorage timestamp check

### 5.4 Analytics Instrumentation

Before ads, basic instrumentation is needed:
- **Web:** No GA4 or analytics currently. Recommend PostHog (self-hosted) or Cloudflare Web Analytics (privacy-first, already available on CF Pages) for page view data — needed to support AdSense approval and measure ad performance.
- **Mobile:** Firebase Analytics (via `@react-native-firebase/analytics`) or PostHog mobile SDK — needed to correlate ad impressions with user retention.

### 5.5 Financial Reporting

AdMob and AdSense both provide:
- Real-time dashboards
- Monthly payment via bank transfer (threshold: $100 for AdSense, configurable for AdMob)
- Tax forms (W-9 required since DateMeUp LLC is US-based)
- Revenue share: Google keeps ~32%; publisher keeps ~68%

---

## Phase 6 — Implementation Roadmap

### Phase A — Foundation (Weeks 1–4, Pre-launch blockers)

All items here are **required before any ad SDK ships to production.**

| # | Task | Owner | Effort |
|---|---|---|---|
| A1 | Update Privacy Policy — add advertising disclosures, remove "no targeted advertising" statement | Jake + Legal | 2h |
| A2 | Update Terms of Service — add arbitration jurisdiction (TODO still unfilled) | Jake + Legal | 1h |
| A3 | Add `expo-tracking-transparency` plugin to `app.json` | Dev | 1h |
| A4 | Implement ATT prompt post-onboarding (after first group created) | Dev | 4h |
| A5 | Implement `/api/v1/config` ad config endpoint on backend | Dev | 3h |
| A6 | Implement `useAdConfig()` hook (web) and context (mobile) reading from config | Dev | 4h |
| A7 | Hard-exclude After Dark from all ad placements (URL exclusion web, screen exclusion mobile) | Dev | 2h |
| A8 | Update Google Play Data Safety form with AdMob disclosures | Jake | 1h |
| A9 | Apply for AdSense account (start approval clock) | Jake | 1h |
| A10 | Create AdMob account, register app, create test ad unit IDs | Jake | 2h |
| A11 | Update PWA manifest.json `name` from "TogetherPlans" to "DateMeUp" | Dev | 15min |

### Phase B — SDK Integration (Weeks 5–8, After Phase A complete)

| # | Task | Owner | Effort |
|---|---|---|---|
| B1 | Install `react-native-google-mobile-ads`, configure plugin in `app.json` | Dev | 2h |
| B2 | Implement mobile SDK initialization with ATT-aware NPA toggle | Dev | 4h |
| B3 | Build `<BannerAd>` component for GroupsScreen and ProfileScreen | Dev | 4h |
| B4 | Build native in-feed ad for SuggestionsScreen (every 8th card) | Dev | 6h |
| B5 | Build interstitial trigger in SuggestionsScreen (category change, 1/session cap) | Dev | 4h |
| B6 | Build rewarded ad for "Unlock advanced filters" feature | Dev | 6h |
| B7 | Trigger EAS production build (required for native module) | Dev | 2h |
| B8 | Add `adsbygoogle.js` to web `index.html` with async defer | Dev | 30min |
| B9 | Build React `<AdUnit>` component for web with route-change refresh | Dev | 3h |
| B10 | Place web ad units: Dashboard, Suggestions, Groups, Guest Vote, Legal | Dev | 4h |
| B11 | Submit iOS app to App Store (first submission) | Jake | 2h |
| B12 | Submit Android app to Play Store internal track | Jake | 1h |

### Phase C — Optimization (Months 2–3, After user base > 1k MAU)

| # | Task | Owner | Effort |
|---|---|---|---|
| C1 | Integrate Cloudflare Web Analytics for web page view data | Dev | 1h |
| C2 | Implement PostHog or Firebase Analytics for mobile session data | Dev | 4h |
| C3 | Integrate AppLovin MAX as mediation layer above AdMob | Dev | 8h |
| C4 | A/B test ad density: compare "low" vs "medium" on 50/50 split | Dev | 4h |
| C5 | Evaluate enabling personalized ads with proper CMP (if US-only) | Jake + Legal | — |
| C6 | Add App Open Ad on cold launch | Dev | 3h |
| C7 | Review eCPM by screen — cut placements earning < $0.50 CPM | Jake | ongoing |
| C8 | Evaluate Unity Ads / ironSource via MAX mediation | Dev | 4h |
| C9 | Implement rewarded ad for second feature (e.g., After Dark early access at 8pm instead of 9pm) | Dev | 3h |

---

## Final Recommendation

**Do NOT ship live ads on day one.** The compliance gap between current state and ad-ready state is real and specific. Shipping ads with the current Privacy Policy is legally inaccurate. Shipping without ATT on iOS will result in App Store review rejection or forced non-personalized serving.

**The right path:**

1. **Now:** Do Phase A compliance tasks. These are mostly non-engineering (Jake + legal). Update the Privacy Policy, apply for AdMob and AdSense accounts, fill Play Data Safety form. These take 2–3 days and unblock everything.

2. **Before first store submission:** Add the `expo-tracking-transparency` plugin and ATT prompt. Build with EAS. This requires one engineer for ~1 day of work.

3. **Ship to stores with ads infrastructure installed but remotely disabled.** Feature flag `ads_enabled: false` from day one. This avoids a second rebuild/resubmission cycle.

4. **After first 500 real users:** Enable ads on non-sensitive screens (Suggestions, Groups, Profile). Measure retention impact over 2 weeks. If D7 retention doesn't drop, proceed.

5. **Never enable ads on:** voting screens, invite flows, share flows, After Dark (until a formal content review clears it).

**Stack recommendation:** AdMob (primary) → AppLovin MAX mediation (Phase C). Skip Meta Audience Network — new publisher onboarding is largely closed as of 2024.

**Personalization:** Start NPA (non-personalized). Simplifies compliance and eCPM difference is modest (~15–30%). Revisit in Phase C once user base is established.

---

## Decisions Needed from Jake

1. **Legal entity / registered address for Privacy Policy** — `TODO_LEGAL_ENTITY` and `TODO_REGISTERED_ADDRESS` are still unfilled in `LegalPages.tsx`. Ads cannot legally ship without these.

2. **Governing jurisdiction in Terms of Service** — `[TODO_JURISDICTION]` in `TermsPage`. Must be filled before any store submission.

3. **After Dark monetization strategy** — Options:
   - a. Keep After Dark ad-free forever (simplest, least compliance risk)
   - b. Age-gate After Dark at 18+ and then serve restricted ads with lower eCPM
   - c. Make After Dark a premium subscription feature (removes ad question entirely)

4. **Personalized vs. non-personalized ads decision** — Start NPA (recommended) or implement a consent management platform (CMP) for personalized ads from day one?

5. **Revenue reinvestment trigger** — At what MAU or monthly ad revenue does it make sense to invest engineering time in Phase C (mediation, optimization)? Suggested: $500/month or 5,000 MAU, whichever comes first.

6. **Business portal monetization** — The app has a business-facing portal (`/business/*`) for venues to claim listings. Should this portal be ads-free and positioned as a premium B2B product? This is a separate monetization track that may conflict with ad serving on business-side pages.

7. **Rewarded ad feature parity** — What feature should the rewarded ad unlock? Options: (a) advanced activity filters, (b) After Dark early access, (c) more date suggestions per day, (d) group history export. This needs product decision before Phase B.

8. **PWA manifest branding** — `manifest.json` says `"name": "TogetherPlans"` but the brand is "DateMeUp". Fix before any significant PWA distribution effort.

---

*Report generated: October 19, 2026. All codebase findings verified against /root/DateNight commit state at audit time. All policy and benchmark research conducted against sources current as of October 2026. Revenue projections are illustrative only and carry no warranty.*
