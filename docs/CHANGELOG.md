# Changelog

All notable changes to the TogetherPlans / DateNight project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## 2026-09-10

### Added
- **Activity suggestions endpoint** (`GET /api/suggestions`): live integration with Yelp Fusion, TMDB (now-playing movies), and Google Places. Falls back gracefully to a curated seed catalog of 15 activities when API keys are absent or calls fail. Results cached for 5 minutes (Redis/in-memory). Returns up to 10 shuffled results per query. Accepts `lat`, `lng`, and `category` query params. ([c59843e](https://github.com/))
- **Profile update** (`PATCH /api/auth/me`): authenticated users can update `displayName`, `latitude`, `longitude`. ([537f0f2](https://github.com/))
- **Push token registration** (`PATCH /api/auth/me/push-token`): stores Expo push notification token on the user record. Validates `ExponentPushToken[...]` format. ([537f0f2](https://github.com/))
- **Proposal cancel** (`PATCH /api/proposals/:id/cancel`): creator or group OWNER can cancel an open proposal. Returns 409 if already DECIDED or CANCELLED. ([537f0f2](https://github.com/))
- **Account deletion** (`DELETE /api/auth/me`): GDPR soft-delete — sets `deletedAt` timestamp; account data purged within 30 days. ([30c4d0c](https://github.com/))
- **Web signup alias** (`POST /api/auth/signup`): web client sends `signup` rather than `register`. New endpoint handles `firstName`/`lastName` and returns both `token` and `accessToken` for cross-client compatibility. ([c59843e](https://github.com/))
- **Prisma `pushToken` field**: added `pushToken String?` to the User model; migration applied to Cloud SQL. ([537f0f2](https://github.com/))

### Fixed
- **Suggestions route missing**: `GET /api/suggestions` was implemented as a service but never wired to an HTTP route — registered in `app.ts`. ([c59843e](https://github.com/))
- **Mobile suggestions URL**: mobile client was calling the wrong path (`/api/proposals/suggestions/list`); corrected to `/api/suggestions`. ([c59843e](https://github.com/))
- **Mobile suggestions response shape**: screen expected `{ suggestions: [] }` wrapper; API returns a plain array. Both `SuggestionsScreen` and `CreateProposalScreen` corrected. ([c59843e](https://github.com/))
- **Mobile push token body key**: `usePushToken.ts` was sending `{ token: ... }` but backend expects `{ pushToken: ... }`. ([c59843e](https://github.com/))
- **Jest/ESM conflict**: `jose` (used by Apple Sign In token verification) is ESM-only and incompatible with Jest CommonJS. Resolved with a module mock at `src/__mocks__/jose.ts`. All 9 tests pass. ([30c4d0c](https://github.com/))
- **npm audit HIGH**: added `mysql2` resolution override to clear high-severity vulnerability surfaced by `npm audit`. ([2d4a2e2](https://github.com/))
- **Password reset URL**: was `/reset-password/${token}` (path param); corrected to `/reset-password?token=${token}` (query param, matching the web router). ([537f0f2](https://github.com/))

### Deployed
- Revision `datenight-api-00028-5gk` deployed to Cloud Run with all 6 secrets (JWT_SECRET, RESEND_API_KEY, TMDB_API_KEY, YELP_API_KEY, DATABASE_URL, GOOGLE_MAPS_API_KEY) confirmed populated in Secret Manager.

---

## 2026-09-09

### Added
- **Apple Sign In** (`POST /api/auth/apple`): verifies Apple identity tokens via Apple's public JWKS, creates or links accounts. Returns JWT. ([fcac2b0](https://github.com/))
- **Apple Sign In on mobile**: integrated into Login and Register screens using `expo-apple-authentication`. Falls back gracefully on non-iOS platforms. ([fcac2b0](https://github.com/))
- **Auth guards on web**: all protected web routes now redirect to `/login` when unauthenticated. ([0b18284](https://github.com/))
- **Forgot/reset password pages on web**: `ForgotPasswordPage` and `ResetPasswordPage` added; wired to `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`. ([0b18284](https://github.com/))
- **Deep linking for invitations**: `exp://` and `https://togetherplans.app/join/:token` deep links handled in mobile; `InviteAcceptPage` added to web. ([4f225c6](https://github.com/))
- **Real location in suggestions**: mobile `SuggestionsScreen` requests foreground location permission and passes coords to the suggestions API. ([4f225c6](https://github.com/))
- **Push token registration hook** (`usePushToken.ts`): requests notification permissions, gets Expo push token, registers with backend. Wired into `AppNavigator`. ([4f225c6](https://github.com/))

---

## 2026-09-08

### Added
- **Google OAuth backend endpoint** (`POST /api/auth/google`): verifies Google ID tokens, creates new users or links existing email accounts to Google provider. Includes Prisma schema fields: `provider`, `providerId`, `avatarUrl`. ([18b1c79](https://github.com/))
- **Google Sign-In on mobile**: integrated Google authentication into the Expo React Native login and register screens. ([3a984f3](https://github.com/))
- **Google Sign-In on web**: integrated Google authentication into the React/Vite web app login and signup pages. ([8f72966](https://github.com/))
- **Figma plugin**: builds full DateNight design system (frames, color/text styles, spacing tokens) in one click from inside Figma. ([fbaf5ce](https://github.com/))
- **Figma sync script**: reads design file via REST API, extracts screens, colors, and typography tokens. ([e488c3e](https://github.com/))
- **Web preview pipeline**: Cloudflare Pages preview deploys on every PR branch; GitHub Actions wired. ([05dbcd1](https://github.com/))
- **Production HTML email templates**: welcome email, invitation email, and password reset email — all responsive HTML with TogetherPlans branding. ([c51a8bd](https://github.com/))

---

## 2026-09-07

### Fixed
- **Cloudflare Pages SPA routing**: added `_redirects` rule so that client-side routes (e.g. `/join/:token`, `/groups/:id`) no longer return 404 on hard refresh or direct navigation. ([5692f08](https://github.com/))

### Added
- **Web application**: React + Vite + TypeScript frontend deployed to Cloudflare Pages. Includes all core screens (home, login, signup, groups, proposals, voting). Also adds EAS `simulator` build profile for faster local iOS testing. ([810bf37](https://github.com/))

---

## 2026-09-01

### Documentation
- Added **screenshot guide**, **Play Console walkthrough**, and **Resend email setup guide** to the project docs. ([0838f51](https://github.com/))

### Added
- **Branded assets**: custom app icon set, splash screen, and feature graphic for app store listings. Cleaned up `app.json` configuration. ([cc87359](https://github.com/))

---

## 2026-08-31

### Configuration
- Added **Apple Team ID** (`234UWRXT57`) and **App Store Connect App ID** (`6806890578`) to EAS build configuration for iOS distribution. ([08241fa](https://github.com/))

### Fixed
- Added `ITSAppUsesNonExemptEncryption=false` to iOS plist for App Store compliance (suppresses encryption export compliance prompt). ([642097e](https://github.com/))
- Added `babel-preset-expo` to `devDependencies` — required by EAS build pipeline but previously missing, causing build failures. ([329e909](https://github.com/))
- Corrected Android adaptive icon path and notification icon asset paths in `app.json` to match actual file locations, fixing EAS build asset resolution errors. ([0667bf1](https://github.com/))

### Added
- **Expo React Native mobile app**: full mobile application with all screens (auth, groups, proposals, voting, invitations) and app store preparation (icons, splash, metadata). ([c33b52e](https://github.com/))
- **Legal pages**: `/privacy` (Privacy Policy) and `/terms` (Terms of Service) served as HTML pages directly from the Express API. GDPR-compliant with right-to-erasure documentation. ([bfc8b5c](https://github.com/))
- **Resend email service**: transactional email integration for welcome emails on registration and invitation emails when `method: EMAIL` is used. ([1abad04](https://github.com/))

---

## 2026-08-30

### CI/CD
- **Fixed database migrations in CI**: resolved migration issues by routing Cloud SQL connections through the Cloud SQL Auth Proxy during GitHub Actions workflows. Fixed CORS environment variable quoting in Cloud Run deploy step. ([2f43145](https://github.com/))
- **Keyless GCP authentication**: migrated CI/CD from service account keys to Workload Identity Federation (WIF) for secure, keyless Google Cloud authentication in GitHub Actions. ([a8644a3](https://github.com/))

### Fixed
- **Monorepo merge**: resolved nested git repository issue by merging the standalone backend repository into the monorepo root. ([8b0a1d3](https://github.com/))

### Added
- **Initial backend MVP**: Express + TypeScript + Prisma backend with:
  - JWT authentication (register, login, `/me`)
  - Group management (create, list, get)
  - Invitation system (5 methods: LINK, EMAIL, SMS, QR, USERNAME; 72-hour TTL)
  - Proposal and voting system (3–5 options, approval voting, consensus detection)
  - Activity suggestions endpoint with Redis/in-memory cache
  - Helmet security headers, CORS, global rate limiting (300 req/15 min)
  - Health check endpoint
  - Full CI/CD pipeline with Cloud Run deployment
  - PostgreSQL via Prisma (Cloud SQL in production)
  ([ae00e74](https://github.com/))
