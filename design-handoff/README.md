# Package contents (complete as of Sep 19, 2026)

Open any `.dc.html` in a browser from this folder; `support.js` and the frame files must stay beside it.

**Design boards (root)**
- `DateNight System.dc.html` — colour, type, components, icons, tab bar, headers
- `DateNight Mobile.dc.html` — all mobile screens (iOS + Android frames), turns 1–6
- `DateNight Web.dc.html` — all web pages, 1440/768/mobile, light + dark
- `DateNight Share Cards.dc.html` — 36 Share Card templates, picker/customise/send flow, camera-roll flow
- `DateNight After Dark.dc.html` — After Dark feature end to end, seed catalog
- `CLAUDE_DESIGN_DATA_PACK.md` — the original brief

**Marketing (`marketing/`)**
- `README.md` — strategy: positioning, loops, channels × app, budget, calendar, KPIs, playbooks
- `Marketing Hub.dc.html` — index and matrix · `Playbooks` · `Store Listings` · `Social Creatives` · `Landing Pages` · `Email Sequences` · `Print` · `Press Kit`

**Print documents (`pdf/`)**
- `Marketing Campaign.dc.html` — paginated campaign document (export to PDF from the browser)
- `Design Package Index.dc.html` — what each package contains and the decisions it encodes

**Runtime files:** `support.js`, `ios-frame.jsx`, `android-frame.jsx`, `browser-window.jsx`, `image-slot.js`, `pdf/doc-page.js`

---

# Handoff: DateNight / TogetherPlans redesign

## Overview
Full visual redesign of DateNight (bundle: TogetherPlans) across mobile (Expo / React Native) and web (React + Vite). It resolves the pink-vs-purple brand conflict with a single new palette (teal primary, lime partner/celebration accent, cool-grey neutrals), adds a distinctive type pairing (Sora + DM Sans), a "sticker" shape language, a proper tab bar, a voting/consensus UI, an invite picker, empty states, loading skeletons, onboarding, and dark mode for both platforms.

Source brief: `uploads/CLAUDE_DESIGN_DATA_PACK.md` (kept alongside this README in the original project).

## Decisions (confirmed by product owner, Sep 19 2026)
- **Voting model:** single heart for everyone; groups of 4+ also get one veto per member (long-press). Ranked top-3 (Mobile 6a) is **parked**, not in scope.
- **Consensus rule for groups:** all members voted AND one option has a strict majority (vetoed options excluded). Couples: both hearts match.
- **Onboarding:** three cards (Mobile 4a–4c), shown once after first sign-up; card 3 creates the first group and lands on Group Detail empty (4d). Skip always available and still sets `hasOnboarded`.
- **Copy:** all strings in the designs are approved as written, including "47 MESSAGES LATER", "Hmm, two hearts 💛", "Friday's sorted by Tuesday", "Priya's picks win 7–5".
- **Sticker density:** ship at the current level (post rotation-audit); follow the "when NOT to tilt" rule below.
- **Veto rules:** no cap on vetoes per member and no cap on proposals per member. A veto is undoable while the proposal is OPEN.
- **Vote visibility:** heart tallies stay hidden until everyone has voted. Vetoes are the exception: a veto is shown immediately on the option, labelled with who vetoed ("Vetoed by Jordan"). Only the current cycle's vetoes are shown; vetoes on earlier (countered) proposals are not carried over or tallied.
- **Reminder push:** one push at T-24h before `dateTime` to anyone who hasn't voted ("Friday's plan needs your vote"). No auto-close.
- **Counter-proposal depth:** one level only. A counter-proposal cannot itself be countered; the escape is a new proposal.
- **Share Cards (product name, capitalised, used in all UI copy):** 36 templates (DateNight Share Cards.dc.html), story 9:16, rendered server-side to 1080×1920 PNG. Two modes from one layout: vote invite (on proposal create) and official (after consensus). Originator picks template, adds note (80 chars) and photo; sends via thread + push, email (.ics attached), share sheet. Web downloads PNG + copies link. Picker filters by mood: playful / classic / dark.
- **Group photo library:** photos a member adds are visible to all members of that group and reusable on anyone's cards. Owner or group owner can delete. iOS uses limited photo access only; Android uses the system Photo Picker. Uploads: object storage per group id, 1600px resize, EXIF stripped, 20 MB cap. `Photo` model: id, groupId, ownerId, url, focalX, focalY, createdAt. Google Photos import deferred.
- **After Dark (DateNight After Dark.dc.html):** onboarding step 3 asks "who are you planning with first?" (couple vs friends & family); no account-level mode. Couples-only category, on by default for 2-person groups with an 18+ confirmation and an off switch per person. No tiers: Romantic and Spicy ideas ship together; the labels are browse filters only. Partner is asked once before seeing content. Voting is Yes / Maybe / Pass per option; a match needs two Yes; Passes are never shown to the partner. Hidden from History always; discreet push text optional. No photos, no third-party APIs; type-only Share Cards via share sheet only. Users can add their own ideas (private to the couple; needs report/block). Seed catalog: 20 Romantic + 20 Spicy. Store rating: 16+ (iOS) / Mature 17+ (Play), accepted.
- Also confirmed by default: web <768px reuses the native floating dock; Discover/Proposal photos need a 12px attribution caption (Yelp/TMDB/Places terms), space reserved under the image.

## About the design files
The `.dc.html` files in this bundle are **design references built in HTML** — interactive prototypes showing intended look and behaviour. They are not production code. The job is to **recreate them inside the existing codebases**:

- Mobile: Expo SDK 57 / React Native, React Navigation (bottom tabs + native stack). Fonts via `expo-font` / `@expo-google-fonts/sora` and `@expo-google-fonts/dm-sans`.
- Web: React 18 + Vite + TypeScript, React Router v6, Zustand + TanStack Query, react-hook-form + zod. Fonts via Google Fonts `<link>` or self-hosted.

Open any `.dc.html` in a browser to see it. Each has a light/dark toggle at the top. In `DateNight Mobile.dc.html` the Proposal Detail screens (1a/1b/1c/2a) and in `DateNight Web.dc.html` page 1g are clickable: tapping an option votes; Priya has pre-voted for "Jazz at the Blue Room", so matching her triggers the consensus overlay and mismatching shows the split state.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii and copy are final. Recreate pixel-close using the platform's native primitives. Illustrations are intentionally built from UI primitives (cards, stickers, chat bubbles) so no image assets are required. Photo slots (striped placeholders labelled "Yelp photo", "TMDB poster", "Places photo") are filled at runtime from the suggestion API.

## Which files hold which screens
- `DateNight System.dc.html` — tokens, type scale, shape rules, buttons, stickers, inputs, cards, avatars, dock, icons, token exports (`constants/index.ts` and `index.css` blocks, switch the toggle for the dark set).
- `DateNight Mobile.dc.html` — **Turn 3 (top-most committed set, ids 3a–3l)** is the build target: Login, Register, Plans (populated), Plans (empty), Group Detail, Create Group, Invite, QR modal, Create Proposal, Discover, Profile, Android Plans. **Turn 4 (4a–4e)**: onboarding 1–3, Group Detail empty, Discover empty. Proposal Detail build target is **1c** (interactive). Turns 1a/1b/1d–1o and 2a–2c are earlier explorations; ignore except 1c.
- `DateNight Web.dc.html` — **Turn 1 (1a–1h)** desktop 1440: Landing, Login, Signup, Dashboard, Groups, Group Detail (+ invite panel), Proposal Detail (interactive), Suggestions. **Turn 2 (2a–2e)** the 375px breakpoint: Landing, Join-via-link, Dashboard, Proposal Detail, Suggestions.
- `ios-frame.jsx`, `android-frame.jsx`, `browser-window.jsx` — device chrome only, not part of the design.

## Design tokens

### Color (light / dark)
| token | light | dark | use |
|---|---|---|---|
| bg | #F4F6F8 | #0F1519 | screen paper |
| surface | #FFFFFF | #18212A | cards, dock, inputs on bg |
| ink | #101820 | #EEF3F6 | headings, body, ink buttons |
| ink2 | #5D6B76 | #93A3AF | secondary text, inactive icons |
| line | #DDE3E8 | #2A3641 | dividers, skeleton, disabled |
| primary | #0E8C8C | #2FC4C1 | my actions, active tab, my vote, OPEN |
| primaryDeep | #086B6B | #5AD6D3 | pressed, link text |
| primarySoft | #D9F1F0 | #123637 | tonal buttons, blobs |
| onPrimary | #FFFFFF | #0F1519 | text on primary |
| lime | #7CB518 | #A8E04B | partner avatar/votes, DECIDED, celebration |
| limeSoft | #EAF6D3 | #253A0F | partner tints, blobs |
| onLime | #101820 | #101820 | text on lime (always dark) |
| success | #1E9A55 | #3FC77A | saved / sent / copied only |
| successSoft | #DDF4E6 | #173B27 | |
| warning | #E39B12 | #F3B84A | COUNTERED, PENDING (dark text on it) |
| warningSoft | #FBEFD3 | #3D2E12 | split-decision banner |
| onWarningSoft | #8A5A00 | #F3B84A | text on warningSoft |
| error | #D63A3A | #FF6B6B | validation, destructive |
| errorSoft | #FBE0E0 | #3D1A1A | |
| shadow | 0 8px 24px rgba(16,24,32,.07) | 0 8px 24px rgba(0,0,0,.4) | cards |
| dock | 0 12px 32px rgba(16,24,32,.16) | 0 12px 32px rgba(0,0,0,.5) | floating dock, modals |

Extra member avatar colors (after me = primary, partner = lime): cobalt #2D6CDB (white text), warning, ink.
Rules: primary = "me", lime = "the other person". Never teal on lime. DECIDED is lime, not success green. Mobile dark mode follows system (`useColorScheme`), web follows `prefers-color-scheme`.

### Type
- Display: Sora 800, 34–48px mobile titles / 40–76px web, letter-spacing -0.04em, line-height 1.0
- Title: Sora 800 30px, -0.03em
- Heading: Sora 800 17–19px, -0.02em
- Button: Sora 700 15–16px (13–14px compact)
- Sticker: Sora 800 10–12px, +0.06em, uppercase
- Body: DM Sans 400 15–16px, line-height 1.5
- Row label: DM Sans 600 15px
- Secondary: DM Sans 400 12–13px, ink2
- Section label: DM Sans 700 11px, +0.12em, uppercase, ink2
- Mono (links/tokens): ui-monospace 13px

### Spacing
Unchanged: 4 / 8 / 16 / 24 / 32 / 48. Screen gutter 20px (mobile), 24px on forms. Web content column max 1160px with 40px gutters.

### Shape
- Card: four different radii, e.g. `30px 22px 34px 20px`; rotate the four values per sibling (`22 34 20 30`, `34 20 30 22`, `22 30 24 34`). No border. Shadow token. Selected/highlighted card: 2px primary border.
- Option card (vote): `28 40 24 44` / `40 24 44 28` / `24 44 28 40` / `44 28 40 24`.
- Button: `28px 20px 28px 20px`, height 54 (52 web, 44–46 compact, 38 mini). Secondary mirrors: `20 28 20 28`.
- Input: even 18px radius, height 52, bg = bg on surface or surface on bg, no border; focus = 2px primary; error = 2px error + inline message with a rotated "!" sticker.
- Sticker tag: padding 5px 10px, radius `12px 6px 14px 6px`, rotate alternating −4° / +3° / −3° / +4°, sits 10–12px above the card's top edge (`position:absolute; top:-12px`), shadow token. Small variant: padding 4px 9px, radius `10 4 10 4`, 10px font.
- **When NOT to tilt (rotation audit):** filter chips, type/segment chips, settings rows, form inputs and their labels, list-row avatars, nav avatars, emoji category blobs inside dense lists, error text. Tilt is reserved for: status/category stickers, hero avatars (pairs only), empty-state and onboarding illustrations, the celebration card, the app mark. Rule of thumb: one tilted element per card, none inside forms.
- Chip (filters, invite methods): height 38–40, radius `18px 12px 18px 12px` alternating with `12 18 12 18`; selected = ink fill, bg text, rotate −2°.
- Avatar: blob radius `50% 45% 55% 50%` (alternate `45% 55% 50% 50%`, `55% 50% 45% 50%`); sizes 28 / 42 / 54 / 76; Sora 800 initials; stacked with −12/−14px margin and 3px surface border; hero pair rotated −6° / +6°.
- Blob background: one per screen header, 260–300px, `border-radius:48% 52% 45% 55%/55% 45% 55% 45%`, primarySoft or limeSoft, bleeding off a corner, behind content.
- Icon button (back, close): 42×42 blob `50% 45% 55% 50%`, surface + shadow.
- Vote stamp: 56×56 blob `50% 48% 52% 50%`, heart icon 26px; unvoted = bg fill, line border, ink2 outline heart; voted = primary fill + border, onPrimary filled heart, `dn-pop` animation.

### Motion
- `dn-pop`: scale .6→1.06→1, opacity 0→1, 350–500ms ease-out. Vote stamp, consensus card, sticker reveals.
- `dn-rise`: translateY(40px)→0 + fade, 300–450ms cubic-bezier(.2,.8,.2,1). Bottom sheets, banners.
- `dn-confetti`: 26 (mobile) / 40 (web) 8–16px rects/circles from centre, translate to `--dx/--dy` (radius 120–280px, biased up 60–80px) with 720° rotation and fade, 0.9–1.5s staggered 50ms. Colors: primary, lime, primarySoft, limeSoft, warning. Use `react-native-reanimated` or a small confetti lib on mobile.
- `dn-pulse`: box-shadow ring 0→10px primary at 45% alpha, 2.4s infinite, on the "YOUR TURN" card.
- `dn-shimmer`: skeleton gradient sweep 1.4s linear infinite.
- Card press: scale .98, 150ms. Web card hover: translateY(−2px).
- Haptics on consensus: success notification.

## Icons
24px grid, 2.2 stroke, round caps/joins. Use `lucide-react-native` / `lucide-react`: calendar (Plans tab), compass (Discover), user (Profile), heart, plus, chevron-left, x, user-plus, link, mail, message-square, qr-code, at-sign, map-pin, clock, check, share, bell, log-out, trash-2. Home tab (web only): house.

## Navigation

### Mobile
- No default React Navigation header. Every stack screen draws its own header: 42px blob back button, muted 13px context line (group name), optional sticker status on the right, then a 34px Sora title. Top padding = safe-area + 18px.
- Tab bar: custom `tabBar` component. Floating dock 68px tall, inset 20px left/right, 32px above the home indicator (16px above the Android gesture bar), radius `34px 28px 32px 30px`, surface + dock shadow. Active tab = 48px primary pill with icon + Sora 700 13px label; inactive = icon over DM Sans 600 11px label in ink2. Scroll content needs ~120px bottom padding.
- Android: same dock; primary FAB ("+ New", 56px, radius `28 20 28 20`) 20px right, above the dock.

### Web
- ≥768px: 72px top bar — logo blob + "DateNight", segmented control (Home / Plans / Discover) as a surface pill with the active item a primary pill, bell + avatar right. Content column max-width 1160, 40px gutters. Two-column grids `1.4fr 1fr`.
- <768px: top bar collapses to logo + bell + avatar; segmented control becomes the same floating dock as native (64px, 96px above Safari's bar). Everything stacks single column.
- Join page `/join/:token` (2b): shows inviter avatar + "?" placeholder, sticker INVITATION, group name/description, one open proposal if any, primary "Join & vote", Google button, expiry, "Open in the app" link.

## Screens — mobile (build from Turn 3 unless noted)

**Login (3a)** — Blobs top-left (primarySoft) and mid-right (limeSoft). 72px logo blob rotated −6° with a lime heart badge. "DateNight!" 40px, subtitle. Inputs email / password (error state shown). Primary "Log in", "or" divider, Google (surface), Apple (#000, iOS only). Footer link "Create account".

**Register (3b)** — Back blob, title "Create your account" with a lime "free" sticker. Fields Display name (focused) / Email / Password with 12px labels. Primary CTA, Google + Apple half-width, "Log in" link. Web signup uses First/Last name instead.

**Plans, populated (3c)** — Greeting + "Your plans" 34px, "+ New" compact primary button. Section "Needs your vote": card with 2px primary border, YOUR TURN sticker, `dn-pulse`, tonal "Vote now ♥" button. Section "Groups": rows with stacked blob avatars, name, "1 open · 12 decided", primary dot when action needed. Last row is the skeleton pattern (avatar + two bars, shimmer). Dock with Plans active.

**Plans, empty (3d)** — Two tilted cards + "Friday?" sticker + lime heart as the illustration. "Nothing planned. Yet." 26px, copy, 3-step checklist rows (step 1 active, 2–3 at 60% opacity), primary "Create your first group".

**Group Detail (3e)** — Header with Invite pill. Hero avatars 54px rotated, name 28px, "2 members" + OWNER sticker. Primary "New proposal". Active: card with OPEN sticker, title, date, lime progress bar + "1 / 2 voted". Past: rows with DECIDED / COUNTERED stickers; a countered proposal is 70% opacity with strikethrough title and its replacement indented 24px under a warning-colored elbow connector.

**Group Detail, empty (4d)** — Partner avatar is a dashed "?" blob. STEP 1 card (lime border) with the share link (Share / Text / Email / QR), STEP 2 card at 75% with dashed "+ First proposal".

**Create Group (3f)** — Cancel / primary "Create" in header. Type chips (Couple selected, ink, −2°), Group name (focused), Description. Keyboard up.

**Invite (3g)** — Title "Invite Priya", "expires in 72 h". Five method chips wrap (Link selected). Method card with ONE USE sticker, description, link field + Copy, "Share sheet" / "Show QR". Pending list: email row with PENDING (warning) sticker. Other methods: Email/SMS show an input + "Send", Username shows a search field with results rows, QR opens the modal.

**QR modal (3h)** — Full-screen primary background with two translucent blobs. Close blob top-right. "Scan to join Sam & Priya" 30px onPrimary, 250px white QR card rotated −2° with a lime "72 H" sticker, mono URL, "Share link instead" surface button. Raise screen brightness while visible.

**Create Proposal (3i)** — Title, date + time inputs, "Options" label with lime "3 of 5" sticker, option rows (emoji blob, name, category · address, ⋯ menu), dashed "+ Add your own" + tonal "✦ From Discover". Sticky bottom primary "Send to Priya ♥" over a bg gradient. Validation: 3–5 options, title required.

**Proposal Detail (1c, interactive)** — Header with sticker status (OPEN primary / DECIDED lime). Title with rotated "!". Date pill. Tally line. Option cards with vote stamp; partner's card carries a "Priya ♥" sticker. States: not voted → "Priya voted · waiting on you"; voted & mismatch → warning-soft banner "Hmm, two hearts 💛" with ink "Counter-propose" and an outline secondary; voted & match → dim backdrop, confetti, centred card with LOCKED IN sticker, 🎉, "You both said yes to", winner, "Add to calendar" primary, "Done". Tapping your own stamp again un-votes; tapping another switches.

**Discover (3j)** — Title + "Near Mission District · tonight". Filter chips. Cards: 150px image slot with category sticker top-left (primary, −4°) and rating sticker top-right (lime, +4°); name, one line meta; primary "+ Add to proposal" or lime-soft "✓ In Friday night" when already added. Dock with Discover active.

**Discover, empty (4e)** — Chips dimmed, illustration (map-pin card + "where are you?" sticker), "Nothing nearby, yet", primary "Use my location", secondary "Set a home area", link to add a manual option.

**Profile (3k)** — 76px avatar blob with edit badge, name 26px, email, lime-soft "12 plans decided" sticker. Grouped cards: Notifications (three toggles), Location (Home area, Appearance), Account (Sign out, Delete account in error color). Toggles 50×30 pill, primary when on.

**Onboarding (4a–4c)** — Shown once after first sign-up, before the tab navigator. Skip top-right always. Dots: active 24×8 primary pill. 1: chat-bubble scene + "47 MESSAGES LATER" sticker, "Sound familiar?". 2: three tilted option cards with one voted + "LOCKED IN 🎉" sticker, "Tap a heart. Match, and it's a plan." 3: "Who do you plan with most?" — three choice cards (partner pre-selected with MOST POPULAR sticker), "Name it" input, CTA "Create group & invite Priya" → creates the group and lands on Group Detail empty (4d).

**Group voting, 4+ members (Mobile 5a/5b)** — Same option cards plus a tally strip under each: lime progress bar (share of votes cast), stacked 22px voter avatars, count. "LEADING" lime sticker on the current leader. Header tray: voted avatars left, "4 of 6 voted", unvoted avatars dashed right, "Waiting on you and Dev" + "Nudge Dev 👋" button (POST a push to that member, once per 12 h). Veto: long-press → "M can't 🚫" ink sticker, card at 85% opacity, excluded from consensus; one veto per member. Consensus (5b) = all voted and strict majority; card lists who picked the winner as lime-soft avatar chips and a friendly line for the minority.

**Counter-propose (5c)** — Warning "TAKE 2" sticker, "Replaces Friday night. Votes reset; Priya gets a nudge." Original shown struck-through at 75% with an ORIGINAL sticker and a warning elbow connector into the new form. Title pre-filled "…, take 2"; options pre-checked from parent (voted ones first), dropped ones struck at 55%. CTA is an ink button "Send take 2".

**Notifications (5d)** — Copy: "Priya voted 🎷 / Friday night: 1 of 2 in. Your turn to pick." · "Locked in: Bouldering 🧗 / Sunday crew · Sun 2 PM at Mission Cliffs. Added to your calendar." · "Take 2 from Priya / Movie night was countered. 3 new options, votes reset." · "Dev joined Sunday crew 👋 / That's 6 of you now." Thread id = group id. Deep links: `togetherplans://proposals/:id` (vote, locked → open on consensus card), `groups/:id` (joined). Landing from a vote link shows an ink context banner (5e) for 6 s with the sender's avatar; unvoted stamps pulse.

**Auth edges (5f–5i, Web 3c–3f)** — Forgot: email + "Send reset link", then SENT card with Open Mail / Resend countdown (60 s). Reset: strength meter (4 lime segments), confirm with inline mismatch, CTA disabled until valid; expired token replaces form with "Request a new link". Verify: 6 boxes 44×56, auto-advance, paste fills all; link in email also verifies. Delete account: bottom sheet with PERMANENT error sticker, consequences copy, optional "Transfer group to …" and "Email my data" checkboxes, type DELETE to enable the error-colored button; 30-day soft delete per API. 404: teal 140px numerals with "NO VOTES" sticker, "This plan doesn't exist", primary "Go to my plans".

**Product proposals (Mobile 6a–6e), not yet in API** — Ranked voting (top-3 stamps 1/2/3, #1 weighted ×3, groups of 4+); Quick-propose sheet from a Discover card (pick group, pick time chip, auto-adds 2 alternatives); Recurring "ritual" (every N weeks on a weekday, auto-open Tuesday, deadline Thursday, skip per occurrence); Availability grid before proposing (slots × days, counts, BEST sticker); History ("12 nights out", category counts, who-wins line, ↻ re-propose).

**Brand assets (6f–6h)** — Icon: gradient #12A3A3→#086B6B, white calendar outline, lime #7CB518 heart badge rotated 10° bottom-right; below 60px the heart becomes a plain lime dot; favicon = teal square + lime dot. Splash: same gradient, mark centred, "DateNight" Sora 800, tagline small-caps bottom. Store screenshots: 1290×2796, solid teal / lime / ink backgrounds, Sora 800 30px headline top-left, tilted product card bleeding off the bottom.

**Web settings (3a/3b)** — Settings tabs Account / Notifications / Privacy as chips. Account: avatar card with upload, first/last name, home area, appearance segmented, Save / Discard, danger zone (sign out everywhere, delete). Notifications: matrix of event × (Push, Email) toggles, quiet hours, device status card with "Send a test".

**Tablet 768 (3g)** — Top nav stays (segmented control shrinks to 34px items), content single column with 28px gutters, option cards remain 2-up, votes tray becomes a horizontal card above the grid with Counter-propose inline.

## Screens — web (Turn 1 desktop, Turn 2 mobile)
**Landing (1a / 2a)** — Nav, hero grid `1.1fr 1fr`: lime sticker, 76px headline "Plan together. Go together.", 20px subtext, primary + secondary CTAs, store badges (ink). Right: two tilted product cards (voting card −4°, consensus card +5°). Three feature cards, "How it works" 1-2-3 with blob numerals, primary CTA band with a translucent blob, footer.
**Login / Signup (1b / 1c)** — Centred 420px card radius `44 36 48 40`, dock shadow, two blobs behind. Signup has first/last name grid and a lime "free" sticker.
**Dashboard (1d / 2c)** — "One plan needs you." 40px; grid `1.4fr 1fr`. Left: YOUR TURN card (option chips, partner's chip lime-soft, "Vote now ♥"), "Coming up" two DECIDED cards. Right: group rows, "Get the app" tonal card. Empty dashboard = the Plans-empty pattern.
**Groups (1e)** — 3-column cards, radius rotated per card, stacked avatars, count line, footer line, sticker for 1 OPEN / DECIDED; last cell dashed "New group".
**Group Detail (1f)** — Breadcrumb, hero, Invite + New proposal buttons. Left column same as mobile; right column invite panel (method chips, link + Copy, QR 170px card −2°, members list with OWNER sticker).
**Proposal Detail (1g / 2d)** — 48px title, sticker status right. Options 2-up with 110px image slot + stamp. Right: Votes card (avatars, "Not voted yet" / choice + time, tally line), split banner or "Not feeling any of these? Counter-propose" card. Consensus = centred 460px modal + confetti.
**Suggestions (1h / 2e)** — Title, source line, "Adding to: Friday night · 3 / 5" context pill with "Change". Filter chips. 4-up cards (1-up at 375).

## State (both platforms)
- `theme`: system | light | dark (Profile > Appearance).
- Proposal: `options[]`, `votes{userId: optionId}`, `status` OPEN | COUNTERED | DECIDED | CANCELLED, `parentId`. `decided = every member voted && all votes equal` (from API). Show consensus overlay once per decision (persist `seenDecisionIds`).
- Vote: optimistic; POST `/api/proposals/:id/votes`; re-tap same option = retract (DELETE or POST null per API), tap other = switch.
- Invite: `method` LINK | EMAIL | SMS | QR | USERNAME, `token`, `status`. Link and QR share the token.
- Discover: `category`, `location` (null → empty state 4e), `activeProposalId` for the "Adding to" context.
- Onboarding: `hasOnboarded` in AsyncStorage / localStorage; skipping still sets it.

## Accessibility
All tap targets ≥44pt (stamps 56, dock items 48, chips 38–40 with 44 hit slop). Icon-only buttons carry labels ("Back", "Close", "Invite", "Vote for Noodle Bar Kōji"). Contrast checked in both themes; lime and warning always take dark text, primary in dark takes dark text (`onPrimary`). Reduce-motion: skip confetti and pulse, keep pop.

## Dark mode notes
Tokens are a straight swap except: soft tints are lifted (primarySoft #154243, limeSoft #2B4412) so header blobs remain visible on #0F1519; dock/modal shadow deepens to 0 16px 40px rgba(0,0,0,.65); primary buttons take dark text (onPrimary #0F1519). Photo slots: add a 10% ink overlay in dark so bright Yelp photos don't glare.

## Validation plan (to run before build-out)
1. Hallway test, 5 users, 15 min each, on the interactive Proposal Detail (Mobile 1c or Web 1g): task = "vote, then get to a decision". Watch for: is the heart stamp recognised as a vote; do they understand the split state; do they find Counter-propose; does the consensus card feel earned or interruptive. Success: 4/5 vote without prompting, 3/5 describe the split state correctly.
2. Group-of-six walkthrough with a real friend group using 5a as a paper prototype: does "LEADING" create bandwagon pressure; is the nudge welcome.
3. Copy review by the product owner: all strings are in the HTML; the ones most in need of a decision are "47 MESSAGES LATER", "Hmm, two hearts 💛", "Friday's sorted by Tuesday", "Priya's picks win 7–5".
4. Photo test: drop 10 real Yelp/TMDB images into the Discover and Proposal slots; check teal stickers over warm food photography, consider a 12% ink scrim under stickers.

## Accessibility checklist
- VoiceOver / TalkBack: dock items announce "Plans, tab, 1 of 3, selected"; vote stamp announces "Vote for Noodle Bar Kōji, button, not selected" and "Your vote, selected"; stickers are decorative unless they carry state (OPEN/DECIDED are read as status text).
- Focus order on Proposal Detail: back → status → options in order (stamp is the focusable element, whole card is the hit area) → split banner buttons → counter-propose.
- Dynamic Type / font scaling to 130% without truncating option names (wrap, never ellipsize).
- Reduce motion: no confetti, no pulse, no rise; keep 150 ms opacity fades.
- Contrast verified: primary/onPrimary 5.1:1 light, 8.9:1 dark; lime/onLime 8.6:1; ink2 on bg 5.3:1 light, 5.8:1 dark; warning stickers use #101820 text (7.4:1).
- Hit areas: stamps 56, chips 38 + 4 px hit-slop, dock 48, toggles 50×30.
- Colour is never the only signal: voted = filled heart + label; DECIDED/OPEN/COUNTERED are words; leading option has text "LEADING".

## Assets
None required. Logo mark = calendar icon in a blob (`38% 62% 55% 45% / 50% 40% 60% 50%`, rotated −6°) with a lime heart badge; refresh the store icon to teal + lime from the existing calendar + heart motif. Google button follows Google branding; Apple button black on iOS only.


## Added Sept 20, 2026
- `emails/` — 12 send-ready transactional email templates (01–12) + README with triggers, merge fields, .ics rules. Review board: `emails/Email Templates.dc.html`. Approved as-is.
- `DateNight App Icon.dc.html` — 8 icon directions (1a–1h); 1b recommended, not yet selected.
- Google Play short + full description delivered in chat; also in marketing/Store Listings.dc.html.
- Decision: After Dark proposals send no email (in-app only). Reminder email is sent once at T-24h to non-voters, only when push is off.


## Brand rename — Sept 20, 2026
- Display name is now **Together Plans** (two words) in all UI, store listings, marketing, emails. Package/bundle/legal stays TogetherPlans; domain togetherplans.app. "Date night, decided." is the couples campaign line.
- Logo: `DateNight App Icon.dc.html` turn 3. 3a (two figures, white + lime on teal) = app icon + logo; 3b ticket stub = Share Cards sub-mark; 3c = splash/marketing hero. Inline SVG source in that file.
- Emails rebranded: header = mark + "Together Plans" + togetherplans.app; footer repeats both. Replace the inline SVG mark with a hosted PNG before sending (Gmail strips SVG).
- Design file names are unchanged (DateNight *.dc.html) to keep repo paths stable.

- Logo 3a confirmed final. Assets in `brand/` (icon 1024 + adaptive layers, marks, lockups, splash, email mark PNG, Share Cards sub-mark).

- Web landing: `web/landing.html` is the production reference for togetherplans.app/ (design 1a, final logo). Implement 1:1; see web/README.md.

## Together Plans for Business (DateNight Business.dc.html)
- Screens 1a–1j: /business landing + pricing, 4-step register, pending review, dashboard, listing & offers manager with live card preview, billing (Stripe-hosted card, proration), Premium monthly PDF report, consumer Discover Featured card + "Add from Featured" on Create proposal, admin moderation queue, mobile landing + dashboard.
- Tiers: Free $0 · Featured $49/mo or $490/yr · Premium $149/mo or $1,490/yr (annual = 2 months free). Premium = top placement in category+radius, mood tags (Romantic, Lively, Cosy, Adventurous) for Discover filters, monthly analytics PDF with category rank and top 3 above, up to 3 locations.
- After Dark is NOT part of any business tier (decision Sept 20). Businesses never appear in After Dark.
- Disclosure: Featured badge on card + "Sponsored · Featured listing" in the ⋯ menu; Free listings unlabeled. Ranking never overrides votes; the consumer copy says so.
- Tracking events per business: impression, card_open, add_to_proposal, plan_locked (match), offer_redemption (= locked while offer live). Dashboard shows funnel, by-day chart, category rank (#n of N within 2 mi), recent plans (group size + time only, no names).
- Visual: same tokens/fonts; data surfaces use 14px radius and 1px borders (no blobs, no asymmetric radii); stickers only on FEATURED / offer / status badges; CTAs keep the asymmetric pill.
- Backend (from brief): Prisma Business, FeaturedListing, BusinessImpression (+ Offer, BusinessEvent recommended); /api/business register, stats, listing CRUD; suggestions ranking boost for Featured/Premium when location+category match; Stripe subscriptions with proration.

## Oct 4 2026 · Rebrand to DateMeUp (datemeup.app)
- Review board: `DateMeUp Rebrand.dc.html` — logo 1a–1d, app icon 2a–2d, mobile welcome 3a–3d (3d = Android), web dashboard 4a–4b. Pending selection.
- Dashboard fixes in both options: one centered container (720 or 1080), "Get the app" moved to the footer, Sign out is a button (account menu in 4a, account card in 4b).
- Live site meta description still says "DateNight"; update to DateMeUp.
- Approved (Oct 4): mobile welcome **3a** (sticker stack; Android = 3d layout), web dashboard **4b** (centered 1080, right rail, footer app badges, Sign out button in account card).
- Logo/icon still open: shortlist 1c/1d + 2c/2d; turn 5 explores 1c with leaning figures (5a chevron above, 5b chevron joins heads, 5c high-five arms).
- **Logo 5a approved (Oct 4).** Ink app-icon tile. Production assets in `brand/` replace the Together Plans set. Emails rebranded to DateMeUp / datemeup.app with the 5a mark.
- App icon tile switched to **teal** #0E8C8C (white + lime figures); splash and email mark follow. Ink tile kept as icon-ios-1024-ink-alt.svg.
