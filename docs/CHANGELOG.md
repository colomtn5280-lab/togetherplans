# Changelog

All notable changes to the TogetherPlans / DateNight project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## 2026-09-08

### Added
- **Google OAuth backend endpoint** (`POST /api/auth/google`): verifies Google ID tokens, creates new users or links existing email accounts to Google provider. Includes Prisma schema fields: `provider`, `providerId`, `avatarUrl`. ([18b1c79](https://github.com/))
- **Google Sign-In on mobile**: integrated Google authentication into the Expo React Native login and register screens. ([3a984f3](https://github.com/))
- **Google Sign-In on web**: integrated Google authentication into the React/Vite web app login and signup pages. ([8f72966](https://github.com/))

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
