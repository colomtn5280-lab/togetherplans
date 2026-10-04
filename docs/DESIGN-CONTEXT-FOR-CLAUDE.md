# DateMeUp / TogetherPlans — Design Context Pack
# Share this file with Claude when collaborating on graphics and visual revisions.
# Current as of October 2026.

---

## 1. PRODUCT OVERVIEW

App name (marketing):  DateMeUp
App name (bundle/package):  TogetherPlans
Tagline:  Plan Together. Go Together.

Live URLs:
  Web:     https://datemeup.app  (Cloudflare Pages)
  Backend: https://datenight-api-mh74edz3ja-uc.a.run.app  (Cloud Run)
  iOS:     Pending App Store review (ASC ID 6806890578)
  Android: Build ready for Play Console upload

Core loop:
  1. Create a group (couple, friend group, family)
  2. Someone creates a Proposal with 3–5 activity Options
  3. Everyone in the group votes on their favorites
  4. App detects consensus and locks in the winner
  5. Counter-proposals allowed if no consensus

Target users: Couples (primary), friend groups (secondary), families (tertiary)
App Store category: Social Networking + Lifestyle


---

## 2. PLATFORMS & TECH STACK

Mobile: Expo SDK 57 / React Native
  Bundle ID: app.togetherplans.datenight
  Orientation: portrait only
  Navigation: React Navigation — floating dock (3 tabs) + native stack
  Auth: Email/password + Google Sign-In + Apple Sign-In (iOS only)
  Fonts: Sora (display/headings) + DM Sans (body)

Web: React 18 + Vite + TypeScript
  Router: React Router v6
  State: Zustand + React Query (TanStack)
  Fonts: Sora + DM Sans (via Google Fonts CDN)


---

## 3. CURRENT DESIGN SYSTEM (RESOLVED — teal + lime)

The pink/purple conflict from earlier sessions has been resolved.
Both mobile and web now share the same unified token system.


### 3a. Color Palette

Primary — teal:
  --primary / COLORS.primary        #0E8C8C   (buttons, active states, links)
  --primary-deep / primaryDeep      #086B6B   (pressed state)
  --primary-soft / primarySoft      #D9F1F0   (tonal button bg, tint surfaces)
  --on-primary / onPrimary          #FFFFFF   (text on primary)

  Dark mode equivalents:
  --primary (dark)                  #2FC4C1
  --primary-deep (dark)             #5AD6D3
  --primary-soft (dark)             rgba(47,196,193,0.12)

Accent — lime (partner / celebration):
  --lime / COLORS.lime              #7CB518
  --lime-soft / COLORS.limeSoft     #EAF6D3
  --on-lime / COLORS.onLime         #101820

  Dark mode:
  --lime (dark)                     #A8E04B
  --lime-soft (dark)                rgba(168,224,75,0.12)

Background / Surface:
  --bg / COLORS.bg                  #F4F6F8   (screen backgrounds)
  --surface / COLORS.surface        #FFFFFF   (cards, modals, inputs)
  --bg (dark)                       #0F1519
  --surface (dark)                  #18212A

Ink (text):
  --ink / COLORS.ink                #101820   (primary body text)
  --ink2 / COLORS.ink2              #5D6B76   (secondary/muted text)
  --ink (dark)                      #F0F4F8
  --ink2 (dark)                     #8A9BB0 / #93A3AF

Borders:
  --line / COLORS.border            #DDE3E8
  --line (dark)                     #263340 / #2A3641

Semantic:
  --success / success               #1E9A55   (soft: #DDF4E6)
  --warning / warning               #E39B12   (soft: #FBEFD3, on-soft: #8A5A00)
  --error / error                   #D63A3A   (soft: #FBE0E0)

Other:
  cobalt (avatar color)             #2D6CDB
  splash background                 #7c3aed → #aa3bff gradient (legacy, icon only)


### 3b. Typography

Fonts:
  Display/Headings:  Sora ExtraBold 800 (FONTS.display / FONTS.title / FONTS.heading)
  Buttons:           Sora Bold 700
  Body:              DM Sans Regular 400
  Row labels:        DM Sans SemiBold 600
  Section labels:    DM Sans Bold 700

Mobile type scale (TYPE):
  display:    Sora 800, 40px, letterSpacing -1.6, lineHeight 40
  title:      Sora 800, 30px, letterSpacing -0.9, lineHeight 34
  heading:    Sora 800, 17px, letterSpacing -0.34, lineHeight 22
  heading19:  Sora 800, 19px, letterSpacing -0.38, lineHeight 24
  button:     Sora 700, 15px
  buttonSm:   Sora 700, 13px
  sticker:    Sora 800, 10px, UPPERCASE, letterSpacing 0.6
  body:       DM Sans 400, 15px, lineHeight 22.5
  body16:     DM Sans 400, 16px, lineHeight 24
  rowLabel:   DM Sans 600, 15px
  secondary:  DM Sans 400, 13px, lineHeight 19.5
  section:    DM Sans 700, 11px, UPPERCASE, letterSpacing 1.32

Web CSS heading scale:
  h1: Sora 800, 48px, letterSpacing -0.04em, lineHeight 1.0
  h2: Sora 800, 34px, letterSpacing -0.03em
  h3: Sora 800, 19px, letterSpacing -0.02em
  body p: DM Sans 400, 15px, lineHeight 1.5


### 3c. Spacing Scale

  xs:     4dp / 4px
  sm:     8dp / 8px
  md:     16dp / 16px
  lg:     24dp / 24px
  xl:     32dp / 32px
  xxl:    48dp / 48px
  gutter: 20dp (mobile) / clamp(16px, 4vw, 48px) (web)


### 3d. Border Radii — "Sticker" Asymmetric Shape Language

The app uses deliberately asymmetric border radii as a signature design element.
Nothing is a perfect rectangle or circle (except icon buttons).

Primary button:    topLeft 28, topRight 20, bottomRight 28, bottomLeft 20
Secondary button:  topLeft 20, topRight 28, bottomRight 20, bottomLeft 28
Input fields:      18px uniform
Icon buttons:      999 (circle)
FAB:               topLeft 28, topRight 20, bottomRight 28, bottomLeft 20
Floating dock:     topLeft 34, topRight 28, bottomRight 32, bottomLeft 30

Cards rotate through 4 radius presets (index by position):
  Preset 0: tL 30, tR 22, bR 34, bL 20
  Preset 1: tL 22, tR 34, bR 20, bL 30
  Preset 2: tL 34, tR 20, bR 30, bL 22
  Preset 3: tL 22, tR 30, bR 24, bL 34

Option cards rotate through:
  Preset 0: tL 28, tR 40, bR 24, bL 44
  Preset 1: tL 40, tR 24, bR 44, bL 28
  Preset 2: tL 24, tR 44, bR 28, bL 40
  Preset 3: tL 44, tR 28, bR 40, bL 24

Sticker labels: tL 12, tR 6, bR 14, bL 6
Sticker small:  tL 10, tR 4, bR 10, bL 4
Chip:           tL 18, tR 12, bR 18, bL 12
Chip alt:       tL 12, tR 18, bR 12, bL 18

Web CSS card classes: .dn-card (30px 22px 34px 20px), .dn-card--alt1/alt2/alt3
Web CSS button:       border-radius: 28px 20px 28px 20px
Web CSS secondary:    border-radius: 20px 28px 20px 28px
Web CSS chip:         border-radius: 18px 12px 18px 12px


### 3e. Shadows

Card:  0 8px 24px rgba(16,24,32,.07)   [elevation 4 on Android]
Dock:  0 12px 32px rgba(16,24,32,.16)  [elevation 16 on Android]


### 3f. Sticker Rotations (cards & elements)

Elements can be lightly rotated for playfulness: -4deg, +3deg, -3deg, +4deg
Chips rotate -2deg when selected (web).


### 3g. Component Classes (Web)

.dn-btn            — primary teal button (28/20/28/20 radius)
.dn-btn--secondary — outline teal button (20/28/20/28 radius)
.dn-btn--tonal     — soft teal fill
.dn-btn--ink       — dark fill button
.dn-btn--sm        — 38px height variant
.dn-input          — 52px input, 18px radius
.dn-card           — white card, asymmetric radius, shadow
.dn-sticker        — uppercase label badge (teal/lime/warning/error/ink/success)
.dn-chip           — filter chip (rotates -2deg when .selected)


---

## 4. ACTIVITY CATEGORIES (15 + Custom)

id                  name                 emoji  color (pastel tint)
comedy              Comedy               🎤     #FEF9C3
concerts            Concerts             🎸     #EBD5FB
couples-events      Couples Events       💑     #FCE4EC
family-events       Family Events        👨‍👩‍👧     #D5EFD5
sports-active       Sports & Active      🏟️     #FFE0B2
hiking-trails       Hiking Trails        🥾     #D4EDDA
hotel-stays         Hotel Stays          🏨     #CFE3FB
local-experiences   Local Experiences    📍     #FFE8D1
movies              Movies               🎬     #D5E8FD
netflix-shows       Netflix Shows        📺     #E2E8F0
performing-arts     Performing Arts      🎭     #F3D9FA
restaurants-dining  Restaurants & Dining 🍽️     #FDEBD0
volunteering        Volunteering         🤝     #D0F4E4
wellness-spa        Wellness & Spa       💆     #D0F4F1
wine-drinks         Wine & Drinks        🍷     #F5D9DE
custom              Custom               ✏️     #F0F0F0


---

## 5. MOBILE APP — SCREENS & NAVIGATION

Navigation structure:
  Floating Dock (3 tabs):
    Tab 1: Plans (Groups screen)
    Tab 2: Discover (Suggestions/search)
    Tab 3: Profile

  Auth Stack (unauthenticated): Login, Register
  Main Stack (modal/push over tabs): GroupDetail, CreateGroup, InviteMembers,
    ProposalDetail, CreateProposal, VoteScreen, ShareToken/GuestVote

Screen inventory:

LOGIN
  Logo: app name + tagline
  Inputs: Email, Password
  Actions: Sign in button, Google Sign-In, Apple Sign-In (iOS only), Create account link
  Errors: inline (not alert modals)

REGISTER
  Inputs: Display Name, Email, Password
  Actions: Register button, Google, Apple, Already have account link

GROUPS (Plans tab)
  Header: "Your Plans" + "+ New" button
  Empty state: guided, points to creating first plan
  List: group cards (name, member count, last activity)
  Pull-to-refresh

GROUP DETAIL
  Group name header
  Member list (avatars, OWNER badge)
  Active proposals section
  Past proposals section
  Actions: "+ New Proposal", Invite People

CREATE GROUP
  Inputs: Group name (required), optional description

INVITE MEMBERS (5 methods)
  LINK: generate/copy shareable link
  EMAIL: send invite to email
  SMS: send invite via text
  QR: display QR code full-screen
  USERNAME: search by display name

PROPOSAL DETAIL
  Proposal title + scheduled date/time + status badge
  Options list (3–5 activity cards) with vote buttons
  Current vote state clearly shown
  Consensus panel (celebratory when all voted + consensus reached)
  Counter-proposal button when status=OPEN
  Guest vote tally ("+N guest" annotations)
  Share/invite button to send voting link

CREATE PROPOSAL
  Inputs: Title, Date/Time picker
  Options builder: name, category picker, description, address
  "Add from Suggestions" flow
  Min 2 options guard

DISCOVER / SUGGESTIONS (tab)
  Hero banner "Tonight near me"
  Date chips (Tonight / This Weekend / etc.)
  Category filter pills (horizontal scroll)
  Radius picker (10/25/60/150mi)
  Activity cards grid
  "Add to Proposal" per card

PROFILE
  User avatar (initials-based, teal bg)
  Display name, email
  Favorite categories (up to 5, ★ shown on Discover)
  Notification settings
  Sign out, Delete account

ONBOARDING (4 steps, new users)
  Step 1: Welcome
  Step 2: Create/join a group
  Step 3: Propose activities
  Step 4: "What are you two into?" — category picker (≤5)


---

## 6. WEB APP — PAGES & ROUTES

Public:
  /                  Landing Page
  /privacy           Privacy Policy
  /terms             Terms of Service
  /support           Support + FAQ
  /forgot-password   Forgot Password
  /reset-password    Reset Password

Auth (redirect if logged in):
  /login
  /signup
  /verify-email

Protected:
  /dashboard         Dashboard
  /groups            Groups list
  /groups/:id        Group Detail
  /groups/:id/proposals/new  New Proposal
  /proposals/:id     Proposal Detail
  /suggestions       Activity Suggestions
  /notifications     Notification feed
  /settings          Account Settings

Special (public, shareable):
  /vote/:shareToken  Guest voting page (no auth required)
  /join/:token       Invitation accept page

Error:
  *                  404

Page details:

LANDING PAGE (/)
  Hero: App name + tagline + CTA → /signup
  Features: 3 columns ("Stop the what do you want to do loop", "Suggest Counter Lock It In", "Works for Couples & Groups")
  How it works: 3 numbered steps (Invite → Propose → Agree)
  "Tonight near me" hero banner with date chips
  App store badges (placeholders)
  Auth CTA: Get started / Login

DASHBOARD (/dashboard)
  Summary of active groups and proposals
  Quick actions: Create group, Browse suggestions

GROUPS PAGE (/groups)
  List of user's groups (cards)
  "+ Create Group" button

GROUP DETAIL (/groups/:id)
  Group name + member list (avatars, OWNER badge)
  Active proposals (cards with status, title, option count)
  Past proposals
  Invite button, "+ New Proposal" button

PROPOSAL DETAIL (/proposals/:id)
  Title + scheduled date/time + status badge
  Options list with vote buttons (clear voted/unvoted state)
  Consensus result panel
  Counter-proposal button
  Guest vote share link + WhatsApp/SMS share

SUGGESTIONS (/suggestions)
  Category filter tabs/chips
  Radius picker
  "Tonight near me" filter
  Activity cards grid/list
  "Add to proposal" per card

VOTE PAGE (/vote/:shareToken)  — public, no auth
  Guest name input
  Option cards with vote buttons
  Confirmation of vote cast


---

## 7. KEY UX NOTES FOR REVISION

Design language summary:
  - Asymmetric "sticker" border radii everywhere — no perfect rectangles
  - Cards can be lightly rotated (+/-3–4deg) for personality
  - Teal primary + lime accent = the two brand colors
  - Sora for all headings/buttons, DM Sans for body text
  - Both light and dark mode supported (web + mobile)

Current known visual gaps:
  1. Suggestion cards: no images (Foursquare photos not wired for restaurants)
  2. Dashboard (/dashboard): renders blank on prod web — React doesn't mount root content
  3. Proposal option-card grid: no horizontal page padding at mobile widths — cards clip
  4. Family-events category: returns stale/wrong-date events (date filtering issue)
  5. Mobile: listing-copy.md still says "DateNight: Plan Together" — needs refresh before store resubmission

UI tone: Friendly, decisive, light. Not corporate, not overly casual.
Emoji use: tasteful — empty states and onboarding only, not in nav or data UI.
Icon motif: calendar + heart (established in app icon, splash)


---

## 8. ASSET PATHS (local, for reference)

App icon (1024x1024):         /root/DateNight/mobile/assets/icon.png
Splash screen (1284x2778):    /root/DateNight/mobile/assets/splash.png
Android fg icon:              /root/DateNight/mobile/assets/android-icon-foreground.png
Android bg icon:              /root/DateNight/mobile/assets/android-icon-background.png
Brand mark SVG:               /root/DateNight/web/public/mark-teal.svg

iOS store screenshots (1320×2868 @ 6.9", 1290×2796 @ 6.7"):
  /root/DateNight/mobile/store/screenshots/ios-6.9/01-discover.png
  /root/DateNight/mobile/store/screenshots/ios-6.9/02-events.png
  /root/DateNight/mobile/store/screenshots/ios-6.9/03-voting.png
  /root/DateNight/mobile/store/screenshots/ios-6.9/04-guest-vote.png
  /root/DateNight/mobile/store/screenshots/ios-6.9/05-match.png
  /root/DateNight/mobile/store/screenshots/ios-6.9/06-landing.png
  (same set under ios-6.7/)

Earlier app screenshots (various):
  /root/DateNight/screenshots/01-groups.png
  /root/DateNight/screenshots/02-voting.png
  /root/DateNight/screenshots/03-match.png
  /root/DateNight/screenshots/04-discover.png
  /root/DateNight/screenshots/05-after-dark.png


---

## 9. COLLABORATION WORKFLOW (how to hand off revisions to Jarvis)

Once you've finalized visual direction with Claude, send Jarvis any of:
  - A screenshot of the desired design (circle what needs to change)
  - A text description ("the proposal cards need X")
  - A Figma frame link

Jarvis will:
  1. Create a feature branch and implement the change
  2. Deploy a web preview automatically via GitHub Actions
  3. Preview URL pattern: https://[branch-name].togetherplans-preview.pages.dev
  4. Report back with the preview URL for review
  5. Merge to main on Jake's approval → production in ~10 min

For mobile changes: Jarvis implements on branch, Jake reviews on datemeup.app (mobile browser)
or via Expo Go / Appetize.io (iOS simulator) for native-only UI changes.


---

## 10. TEST ACCOUNT

Email:    demo@togetherplans.app
Password: Demo1234!
Group:    "Review Crew" (open proposal "Weekend plans")
Works on: web (datemeup.app), iOS (App Store / Appetize), Android (Play Store)
