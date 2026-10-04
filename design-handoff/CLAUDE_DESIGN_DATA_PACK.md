# TogetherPlans / DateNight — Design Data Pack
# For use with Claude Design to redesign and refine the UI/UX
# Generated: September 19, 2026

---

## 1. PRODUCT OVERVIEW

App name (marketing): DateNight
App name (bundle/package): TogetherPlans
Tagline: Plan Together. Go Together.
Problem solved: Couples and groups waste time in the "what do you want to do?" loop. DateNight replaces endless text chains with a structured propose → vote → decide flow.

Core loop:
1. Create a group (couple, friend group, family)
2. Someone creates a Proposal with 3–5 activity Options
3. Everyone in the group votes on their favorites
4. App detects consensus and locks in the winner
5. Counter-proposals allowed if no one is happy

Live backend API: https://api.togetherplans.app
Web app: https://togetherplans.app (Cloudflare Pages)

---

## 2. PLATFORMS & TECH STACK

Mobile: Expo SDK 57 / React Native
  Bundle ID: app.togetherplans.datenight
  Orientation: portrait only
  Navigation: React Navigation — bottom tab (3 tabs) + native stack
  Auth: Email/password + Google Sign-In + Apple Sign-In (iOS only)
  Notifications: Expo push notifications (APNs + FCM)
  Deep links: togetherplans://join/:token and https://togetherplans.app/join/:token

Web: React 18 + Vite + TypeScript
  Router: React Router v6
  State: Zustand + React Query (TanStack)
  Forms: react-hook-form + zod

Backend: Node.js / Express / TypeScript / Prisma / PostgreSQL (Google Cloud SQL)
  Auth methods: JWT access/refresh tokens + Google OAuth + Apple Sign-In

---

## 3. CURRENT COLOR SYSTEM (NEEDS REDESIGN)

There is a color conflict between mobile and web that needs to be resolved in the redesign.

Mobile app (constants/index.ts):
  Primary:         #FF4081  (hot pink — used for buttons, active states, tab bar)
  Primary Dark:    #C60055
  Background:      #FFFFFF
  Surface:         #F8F8F8
  Text:            #1A1A1A
  Text Secondary:  #666666
  Border:          #E0E0E0
  Success:         #4CAF50
  Error:           #F44336
  Warning:         #FF9800

Web app (index.css CSS variables):
  --accent:        #aa3bff  (purple — used as primary CTA color)
  --accent-bg:     rgba(170, 59, 255, 0.1)
  --text:          #6b6375
  --text-h:        #08060d
  --bg:            #FFFFFF
  --border:        #e5e4e7
  Light mode + dark mode supported (dark: --bg #16171d, --accent #c084fc)

App icon / splash / brand: Purple (#7c3aed → #aa3bff gradient) — calendar + heart motif
Marketing site: Purple (#7c3aed) used as primary brand color

NOTE: Mobile uses pink (#FF4081), web uses purple (#aa3bff), brand assets use purple.
This inconsistency needs to be resolved — the redesign should pick ONE primary brand color
and apply it consistently across mobile and web.

---

## 4. TYPOGRAPHY

Mobile: System font (SF Pro on iOS, Roboto on Android) — no custom font installed
Web: system-ui / 'Segoe UI' / Roboto sans-serif (also system font)
Heading font: same as body (no distinct heading typeface yet)
Mono: ui-monospace / Consolas

Spacing scale (mobile):
  xs: 4px  |  sm: 8px  |  md: 16px  |  lg: 24px  |  xl: 32px  |  xxl: 48px

---

## 5. MOBILE APP — SCREENS & NAVIGATION

Bottom Tab Navigator (3 tabs):
  Tab 1: Plans (Groups screen)       icon: needs design
  Tab 2: Discover (Suggestions)     icon: needs design
  Tab 3: Profile                    icon: needs design

Auth Stack (unauthenticated):
  - Login Screen
  - Register Screen

Main Stack (authenticated, pushed on top of tabs):
  - Group Detail
  - Create Group
  - Invite Members
  - Proposal Detail
  - Create Proposal
  - Suggestions (also accessible as tab)

--- SCREEN DETAILS ---

LOGIN SCREEN
  Elements: Logo (🗓️ emoji + "DateNight" text), subtitle "Plan together, decide together"
  Inputs: Email, Password
  Actions: Login button, Google Sign-In button, Apple Sign-In button (iOS only), "Create account" link
  State: loading spinner on submit, error alert on failure

REGISTER SCREEN
  Elements: Back button, title "Create Account"
  Inputs: Display Name, Email, Password
  Actions: Register button, Google Sign-In, Apple Sign-In (iOS only), "Already have account" link

GROUPS SCREEN (Plans tab)
  Header: "Your Plans" + "+ New" button
  Empty state: 📅 emoji, "No plans yet", description, "Create First Plan" button
  List: FlatList of group cards, pull-to-refresh
  Card: group name (bold), optional description, created date
  Tap card: navigates to Group Detail

GROUP DETAIL SCREEN
  Header: group name (from route param)
  Sections: member list, active proposals, past proposals
  Actions: "+ New Proposal" button, invite members button
  Proposal list items: title, status badge (OPEN/COUNTERED/DECIDED), created date

CREATE GROUP SCREEN
  Title: "New Plan"
  Inputs: Group name (required), optional description
  Action: Create button

INVITE MEMBERS SCREEN
  Title: "Invite People"
  5 invitation methods (tabs or cards):
    LINK: generate/copy shareable link
    EMAIL: enter email address, send invite
    SMS: enter phone number, send SMS
    QR: display QR code to scan
    USERNAME: search by display name
  Each method shows status/confirmation

PROPOSAL DETAIL SCREEN
  Title: "Proposal"
  Shows: proposal title, proposed date/time, status badge
  Options list: 3–5 activity options, each with name, category, description, address
  Vote UI: each option has a vote button; user can vote for one
  Consensus result: shown when all members voted — winning option highlighted
  Counter-proposal button: shown when status is OPEN

CREATE PROPOSAL SCREEN
  Title: "New Proposal"
  Inputs: Title (required), Date/Time picker
  Options section: add 3–5 activity options
    Option form: name, category picker, description, address
    "Add from Suggestions" button — opens suggestions to pick from
  Submit button

SUGGESTIONS SCREEN (Discover tab)
  Header: "Discover Activities"
  Filters: category filter (All, Dining, Movies, Outdoors, Arts, Nightlife)
  List: activity cards with name, category, description, address
  Card action: "Add to Proposal" button
  Data sources: Yelp Fusion (restaurants), TMDB (movies), Google Places + seed catalog

PROFILE SCREEN
  Shows: display name, email, avatar placeholder
  Sections: Push notification settings, location settings
  Actions: Edit profile, Delete account, Sign out

---

## 6. WEB APP — PAGES & ROUTES

Public (no auth required):
  /                  Landing Page
  /privacy           Privacy Policy (GDPR/CCPA)
  /terms             Terms of Service
  /support           Support + FAQ
  /forgot-password   Forgot Password
  /reset-password    Reset Password (query param: ?token=...)

Public-only (redirect authenticated users to dashboard):
  /login             Login Page
  /signup            Signup Page
  /verify-email      Email Verification

Protected (redirect unauthenticated to /login):
  /dashboard         Dashboard
  /groups            Groups list
  /groups/:id        Group Detail
  /groups/:id/proposals/new  New Proposal
  /proposals/:id     Proposal Detail
  /suggestions       Activity Suggestions
  /notifications     Notification Settings
  /settings          Account Settings

Error:
  * (catch-all)      404 Not Found (🗓️ emoji, 404 heading, back-to-home link)

--- PAGE DETAILS ---

LANDING PAGE (/)
  Hero: "/DateNight" app name, "Plan Together. Go Together." tagline, subtext, CTA to /signup
  Features section: 3 columns
    "Stop the 'What should we do?' loop"
    "Suggest. Counter. Lock It In."
    "Works for Couples & Groups"
  How it works: 3 numbered steps (Invite → Propose → Agree)
  App store badges: "Download on App Store", "Get it on Google Play" (placeholders)
  Auth CTA: Get started / Login links

LOGIN PAGE (/login)
  Email + password form
  Google Sign-In button
  "Create account" link → /signup
  "Forgot password" link → /forgot-password

SIGNUP PAGE (/signup)
  First name, Last name, email, password form
  Google Sign-In button
  "Already have account" link → /login
  On success: redirects to /dashboard

DASHBOARD (/dashboard)
  Summary of user's active groups and proposals
  Quick actions: Create group, Browse suggestions

GROUPS PAGE (/groups)
  List of user's groups (cards)
  "+ Create Group" button
  Each card: group name, member count, last activity date

GROUP DETAIL PAGE (/groups/:id)
  Group name header
  Member list with roles (OWNER badge)
  Active proposals section (cards with status, title, option count)
  Invite button → opens invite flow
  "+ New Proposal" button → /groups/:id/proposals/new

NEW PROPOSAL PAGE (/groups/:id/proposals/new)
  Form: Title, Date/Time
  Options builder: add/remove activity options (name, category, description, address)
  "Browse Suggestions" panel to pull in activities

PROPOSAL DETAIL PAGE (/proposals/:id)
  Proposal title + scheduled date/time
  Status badge
  Options list with vote buttons
  Consensus result panel (when decided)
  Counter-proposal button

SUGGESTIONS PAGE (/suggestions)
  Category filter tabs
  Activity cards grid/list
  "Add to proposal" action per card

---

## 7. DATA MODELS (from Prisma schema)

User
  id, email, passwordHash, displayName
  provider (google/apple/null), providerId, avatarUrl
  pushToken (Expo notification token)
  latitude, longitude (optional home location)
  deletedAt (GDPR soft delete)

Group
  id, name, createdAt
  members → GroupMember[]
  invitations → Invitation[]
  proposals → Proposal[]

GroupMember
  groupId, userId, role (OWNER | MEMBER), joinedAt

Invitation
  method (LINK | EMAIL | SMS | QR | USERNAME)
  token (unique, used in share URLs)
  target (email/phone/username depending on method)
  status (PENDING | ACCEPTED | EXPIRED | DECLINED)
  expiresAt (72 hours from creation)

Proposal
  title, dateTime (scheduled outing time)
  status (OPEN | COUNTERED | DECIDED | CANCELLED)
  parentId (if counter-proposal, links to original)
  options → Option[]

Option (activity option within a proposal)
  name, category, description, address
  latitude, longitude
  externalRef (Yelp/TMDB/Google Place ID)
  votes → Vote[]

Vote
  userId, optionId (one vote per user per proposal)

Suggestion (API response only, not stored)
  name, description, category, address, latitude, longitude
  source: Yelp (restaurants), TMDB (movies), Google Places (activities), or seed catalog

---

## 8. KEY USER FLOWS

ONBOARDING FLOW
  App open → Login screen
  → (new user) Register → email/password or Google/Apple
  → Dashboard / Groups screen (empty state)

CREATE & INVITE FLOW
  Groups tab → "+ New" → Create Group form → success
  → Group Detail → "Invite People" → choose method (LINK / EMAIL / SMS / QR / USERNAME)
  → Invitee receives link/SMS → taps → joins group

PROPOSE & VOTE FLOW
  Group Detail → "+ New Proposal"
  → Enter title + date + 3–5 activity options (manual or from Suggestions)
  → Submit → group members get push notification
  → Each member opens Proposal Detail → taps vote on favorite option
  → When all voted: consensus shown, winning option highlighted
  → If no consensus: any member can create counter-proposal

COUNTER-PROPOSAL FLOW
  Proposal Detail (status: OPEN) → "Counter-Propose"
  → Creates new Proposal linked to parent (status: COUNTERED on parent)
  → Same vote flow on new proposal

DISCOVER FLOW
  Discover tab → browse by category (Dining / Movies / Outdoors / Arts / Nightlife)
  → Tap activity → "Add to Proposal" → select which group/proposal
  OR: inside Create Proposal → "Browse Suggestions" → tap to add to options

---

## 9. API ENDPOINTS (for UI state reference)

Auth:
  POST /api/auth/register       — email/password signup
  POST /api/auth/signup         — alias (web client uses this, accepts firstName/lastName)
  POST /api/auth/login          — returns { token, accessToken, user }
  GET  /api/auth/me             — current user profile
  PATCH /api/auth/me            — update displayName, lat/lng
  PATCH /api/auth/me/push-token — register Expo push token
  DELETE /api/auth/me           — GDPR account deletion (soft, 30-day purge)
  POST /api/auth/forgot-password
  POST /api/auth/reset-password
  POST /api/auth/google         — Google OAuth token exchange
  POST /api/auth/apple          — Apple Sign-In token exchange

Groups:
  GET    /api/groups            — list user's groups
  POST   /api/groups            — create group
  GET    /api/groups/:id        — group detail with members
  DELETE /api/groups/:id        — delete group (owner only)

Invitations:
  POST /api/groups/:id/invitations   — create invitation (method + optional target)
  GET  /api/invitations/:token       — get invitation details (for join screen)
  POST /api/invitations/:token/accept — join group via invitation

Proposals:
  GET    /api/groups/:id/proposals   — list group proposals
  POST   /api/groups/:id/proposals   — create proposal with options
  GET    /api/proposals/:id          — proposal detail with options + votes
  PATCH  /api/proposals/:id/cancel   — cancel proposal
  POST   /api/proposals/:id/votes    — cast vote for an option
  POST   /api/proposals/:id/counter  — create counter-proposal

Suggestions:
  GET /api/suggestions?lat=&lng=&category=  — returns up to 10 activity suggestions
  Sources: Yelp (restaurants), TMDB (now-playing movies), Google Places, seed catalog

Legal (no auth):
  GET /privacy   — Privacy Policy HTML
  GET /terms     — Terms of Service HTML

---

## 10. DESIGN CONSTRAINTS & REQUIREMENTS

Platform constraints:
  - Mobile: portrait only, no tablet support
  - iOS: SF Pro system font, safe area insets required at top and bottom
  - Android: material design patterns expected (ripple feedback, etc.)
  - Web: responsive, mobile-first — must work at 375px wide
  - Dark mode: web supports prefers-color-scheme; mobile currently light only

Functional requirements for the redesign:
  - Resolve pink vs purple brand color conflict — pick one and apply consistently
  - Bottom tab bar must be clearly usable (Plans, Discover, Profile)
  - Voting UI must make it obvious how to vote and show current vote state
  - Consensus result must be prominent and celebratory when reached
  - Invitation method picker (5 options) needs clean UX — currently undefined
  - QR code display needs a dedicated full-screen modal view
  - Empty states (no groups, no proposals, no suggestions) need illustration/guidance
  - Loading skeletons preferred over spinners for list screens
  - Counter-proposal flow needs clear visual distinction from original proposal

Authentication UX:
  - Login + Register must support email/password, Google, and Apple (iOS)
  - Social login buttons follow platform guidelines (Google = Google branding, Apple = black button on iOS)
  - Error states must be inline (not just alert modals) for form validation

Accessibility:
  - Minimum touch target 44x44pt on mobile
  - Color contrast AA minimum
  - Screen reader labels on icon-only buttons

---

## 11. BRAND & TONE

Name: DateNight / TogetherPlans
Voice: Friendly, decisive, light — not corporate, not overly casual
Emoji usage: tasteful, in empty states and onboarding only
Icon motif: calendar + heart (established in app icon)
Target users: Couples (primary), friend groups (secondary), families (tertiary)

App Store category: Social Networking + Lifestyle
Rating: 4+ (all ages)

---

## 12. KNOWN UX GAPS TO ADDRESS

These are specific issues identified from testing and code review:

1. Color system inconsistency — pink mobile vs purple web (see Section 3)
2. No custom fonts — system fonts only; a distinctive typeface would strengthen brand
3. Bottom tab icons — currently undefined/placeholder; need proper icon set
4. Invite flow UX — 5 methods are implemented but the picker UI is not designed
5. Vote UI — no clear visual state for "I've voted" vs "not voted yet"
6. Consensus celebration — no moment/animation when a plan gets locked in
7. Proposal status badges — status is shown as raw text (OPEN, COUNTERED, DECIDED)
8. Group cards — minimal info, no member avatars or activity indicators
9. Suggestion cards — no images, purely text-based, low visual appeal
10. Profile screen — placeholder only, no avatar upload or settings grouping
11. Navigation header — default React Navigation header, no branding
12. Web landing page — functional but not visually refined
13. Web dashboard — exists as route but minimal content defined
14. No onboarding flow — new users land directly in empty state with no guidance
15. Dark mode — web supports it but mobile does not yet

---

## 13. ASSETS & FILES

App icon: /root/DateNight/mobile/assets/icon.png (1024x1024, purple gradient, calendar+heart)
Splash screen: /root/DateNight/mobile/assets/splash.png (1284x2778, purple bg)
Icon variants: /root/DateNight/mobile/assets/icons/ (16px through 512px)
Android foreground icon: /root/DateNight/mobile/assets/android-icon-foreground.png
Android background icon: /root/DateNight/mobile/assets/android-icon-background.png

---

## 14. WHAT TO DELIVER FROM CLAUDE DESIGN

Priority screens for redesign (mobile):
  1. Login Screen
  2. Register Screen
  3. Groups Screen (Plans tab) — empty + populated state
  4. Group Detail Screen
  5. Create Group Screen
  6. Invite Members Screen (all 5 methods)
  7. Proposal Detail Screen — voting state + consensus state
  8. Create Proposal Screen
  9. Suggestions / Discover Screen
  10. Profile Screen

Priority pages for redesign (web):
  1. Landing Page (/)
  2. Login Page
  3. Signup Page
  4. Dashboard
  5. Groups Page
  6. Group Detail Page
  7. Proposal Detail Page (voting + consensus)
  8. Suggestions Page

Deliverables needed:
  - Unified color palette (resolve pink vs purple, define primary + secondary + surface + semantic colors)
  - Typography scale (consider adding a custom display/heading font)
  - Component library: buttons, inputs, cards, badges, modals, tab bar, navigation headers
  - Icon set for tab bar and actions
  - All priority screens at mobile (375x812) and web (1440px) widths
  - Dark mode variants for web screens
  - Empty state illustrations/guidance for: no groups, no proposals, no suggestions
  - Consensus celebration moment (animation concept or static frame)
