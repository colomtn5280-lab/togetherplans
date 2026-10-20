# TogetherPlans — Master Audit Plan
**Commissioned:** October 2026  
**Auditor:** Jarvis (Independent Review Mode)  
**Scope:** Web, iOS, Android — full ecosystem  

---

## Application Ecosystem Overview

| Layer | Technology | Version | Status |
|---|---|---|---|
| Web | React + Vite + TypeScript | React 18.2, Vite 5 | Live: togetherplans.app |
| Mobile (shared) | Expo / React Native | SDK 57, RN 0.86.3 | Live: Appetize + stores |
| Backend | Node/Express/TypeScript/Prisma | Express 4.22, Prisma 7.10 | Live: Cloud Run |
| Database | PostgreSQL (Cloud SQL) | — | Live |
| CDN/Hosting | Cloudflare Pages (web) | — | Live |
| State (web) | Zustand 4.5 | — | — |
| State (mobile) | TanStack Query 5 + AsyncStorage | — | — |
| Navigation (mobile) | React Navigation 7 | native-stack + bottom-tabs | — |
| Navigation (web) | React Router 6 | v6.21 | — |

---

## Audit Coverage Matrix

| Area | Agent | Status |
|---|---|---|
| Information Architecture & User Journeys | Agent 1 | ✅ Complete — see UX_NAVIGATION_AUDIT.md |
| Visual Design — Web | Agent 2 | In Progress |
| iOS / Apple HIG | Agent 3 | In Progress |
| Android / Material Design 3 | Agent 4 | In Progress |
| Web Performance & Accessibility | Agent 5 | In Progress |
| Backend Architecture & Quality | Agent 6 | In Progress |
| Competitive Benchmarking | Jarvis | In Progress |
| Independent Critical Review | Jarvis | Pending |
| Executive Summary | Jarvis | Pending |

---

## Screen Inventory

### Web (26 routes)
| Route | Auth | Type |
|---|---|---|
| / | No | Landing page |
| /login | PublicOnly | Auth |
| /signup | PublicOnly | Auth |
| /verify-email | PublicOnly | Auth |
| /forgot-password | No | Auth |
| /reset-password | No | Auth |
| /privacy | No | Legal |
| /terms | No | Legal |
| /support | No | Legal |
| /suggestions | No | Public Discover |
| /discover | No | Alias → /suggestions |
| /join/:token | No | Group invite |
| /share/:shareToken | No | Share card |
| /vote/:shareToken | No | Guest voting |
| /auth/facebook/callback | No | OAuth |
| /auth/apple/callback | No | OAuth |
| /dashboard | Auth | Core |
| /groups | Auth | Core |
| /groups/:groupId | Auth | Core |
| /groups/:groupId/proposals/new | Auth | Core |
| /proposals/new | Auth | Core |
| /proposals/:proposalId | Auth | Core |
| /proposals/:proposalId/share | Auth | Share card |
| /proposals/:proposalId/invite-card | Auth | Invite card |
| /groups/:groupId/after-dark | Auth | After Dark |
| /after-dark | Auth | After Dark |
| /notifications | Auth | Settings |
| /settings | Auth | Settings |

### Mobile (15 screens)
| Screen | Nav Type | Tab |
|---|---|---|
| WelcomeScreen | Stack (pre-auth) | — |
| LoginScreen | Stack (pre-auth) | — |
| RegisterScreen | Stack (pre-auth) | — |
| OnboardingScreen | Stack (pre-auth) | — |
| GroupsScreen | Tab | Plans |
| GroupDetailScreen | Stack | Plans |
| CreateGroupScreen | Stack | Plans |
| InviteMembersScreen | Stack | Plans |
| ProposalDetailScreen | Stack | Plans |
| CreateProposalScreen | Stack | Plans |
| SuggestionsScreen | Tab | Discover |
| AfterDarkScreen | Stack | — (not in tabs!) |
| ProfileScreen | Tab | Profile |
| ShareCardScreen | Stack | Profile |
| InviteCardScreen | Stack | Plans |

---

## Environmental Constraints

| Constraint | Impact |
|---|---|
| No physical iOS device | iOS native testing via Appetize only |
| No Android emulator | Android testing via Appetize only |
| No Sentry/error monitoring | Cannot see real user errors |
| No analytics | Cannot measure real user flows |
| Web auth token in localStorage | Security consideration |

---

## Audit Artifacts

| File | Owner | Status |
|---|---|---|
| AUDIT_MASTER_PLAN.md | Jarvis | ✅ This file |
| UX_NAVIGATION_AUDIT.md | Agent 1 | In Progress |
| VISUAL_DESIGN_AUDIT.md | Agent 2 | In Progress |
| PLATFORM_SPECIFIC_AUDIT.md | Agents 3+4 | In Progress |
| PERFORMANCE_ACCESSIBILITY_AUDIT.md | Agent 5 | In Progress |
| MODAL_OVERLAY_AUDIT.md | Agent 5 | In Progress |
| ARCHITECTURE_QUALITY_AUDIT.md | Agent 6 | In Progress |
| COMPETITIVE_BENCHMARK.md | Jarvis | In Progress |
| UX_NAVIGATION_AUDIT.md | Agent 1 | ✅ Complete |
| MODERNIZATION_ROADMAP.md | Jarvis | Pending |
| UX_SCORECARD.md | Jarvis | Pending |
| EXECUTIVE_SUMMARY.md | Jarvis | Pending |

---

## Agent 1 Findings: IA & Navigation (Key Issues for Cross-Agent Reference)

### Critical Bugs Found

| ID | File | Issue | Severity |
|----|------|-------|----------|
| A1-B1 | `DashboardPage.tsx:236` | "Vote Now" link uses non-existent route `/groups/:groupId/proposals/:proposalId` — will 404 | 🔴 Critical |
| A1-B2 | `ProposalPage.tsx:1000` | "Counter-propose" links to group page, not new proposal form | 🔴 Critical |
| A1-B3 | `AfterDarkScreen.tsx:281` | Impulse creation fails when `groupId` is undefined (always when accessed from tab) | 🔴 Critical |
| A1-B4 | `ProposalDetailScreen.tsx:482` | "Pick invite card" in celebration modal opens web browser — native InviteCardScreen unused | 🟠 High |

### Key Architecture Issues

| ID | Issue | Impact |
|----|-------|--------|
| A1-I1 | After Dark has no navigation entry point on web or mobile tabs | Feature is invisible |
| A1-I2 | InviteCard is a mandatory detour after proposal creation (adds 2 steps) | Friction |
| A1-I3 | New group/proposal creation doesn't navigate to the created item | Navigation confusion |
| A1-I4 | Dashboard silently redirects new users to /suggestions via localStorage hack | Trust/confusion |
| A1-I5 | `/suggestions` and `/discover` are duplicate routes (same component) | Code smell |
| A1-I6 | Web mobile nav (5 tabs) ≠ Native mobile nav (3 tabs) — inconsistent IA | Platform confusion |
| A1-I7 | No history/completed plans view anywhere | Retention gap |
| A1-I8 | GroupDetailPage `.slice(0,5)` proposals with no "View all" | Content hidden |
| A1-I9 | Two separate "share" UX paths for decided proposals (modal vs. full page) | Confusing |
| A1-I10 | Vote notes are hidden until after voting — not discoverable | Feature buried |

### Journey Step Counts

| Journey | Current Steps | Target |
|---------|--------------|--------|
| Signup → first value | 8 | 5 |
| Create group + invite partner | 8 | 4 |
| Create proposal (with Discover) | 10 | 6 |
| Find After Dark (web) | ∞ | 2 |
| Mobile onboarding → first invite | 9 taps | 5 taps |
