# DateNight Web App — Full QA Report

**Target:** https://togetherplans.app  
**Date:** September 20, 2026  
**Scope:** Full site — all pages, auth flows, proposals, voting, sharing, after-dark, invite, settings, legal  
**Tester:** Hermes Agent (automated exploratory QA)  
**Test Account:** test-qa@togetherplans.app / TestQA123!

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟠 High | 7 |
| 🟡 Medium | 8 |
| 🔵 Low | 6 |
| **Total** | **26** |

**Overall Assessment:** The app is partially functional — auth, proposal creation, voting, and the share/public page all work — but the group detail page (the app's core hub) crashes React entirely, and auth error states (wrong password, duplicate email) are completely silent, making the product unusable for new users in its current state.

---

## Issues

### Issue #1: Group Detail Page (/groups/:id) Crashes React — Blank White Page

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional / Console |
| **URL** | https://togetherplans.app/groups/13e56947-2bf0-41bc-956a-bc439dd88bed |

**Description:**  
Navigating to any group detail page completely crashes the React app, leaving a blank white screen. The `#root` div is emptied and all app UI disappears. This affects client-side navigation (clicking a group card from `/groups`) and hard navigation (direct URL). The crash persists until the user navigates back to `/groups` or `/dashboard`.

**Root Cause:**  
`TypeError: Cannot read properties of undefined (reading 'charAt')` at `index-C58xa0Sy.js:112`. The `user` object is `null` in localStorage (the API stores tokens but `user: null`). A component — likely the member avatar or initials display — calls `user.displayName.charAt(0)` without null-checking the user object first.

**Steps to Reproduce:**
1. Log in with any account
2. Go to `/groups`
3. Click any group card
4. Observe blank white page

**Expected Behavior:** Group detail page renders with members, proposals, invite button, and after-dark link.

**Actual Behavior:** React root is emptied. `window.__reactErrors` shows: `[{msg: "Uncaught TypeError: Cannot read properties of undefined (reading 'charAt')", filename: 'https://togetherplans.app/assets/index-C58xa0Sy.js', line: 112}]`

**Downstream Impact:** This crash propagates to every page that links back to the group detail:
- "← Back to group" on After Dark page
- "← Back to group" on New Proposal page  
- After creating a proposal (redirect goes to group detail)
- "Vote now ♥" on Dashboard

---

### Issue #2: Login with Wrong Password Shows No Error Message

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional / UX |
| **URL** | https://togetherplans.app/login |

**Description:**  
When a user enters a wrong password, the login form submits silently — no error toast, no inline error, no shake animation. The form appears to reset (fields clear or reload) and the user is left with no feedback about what went wrong.

**Steps to Reproduce:**
1. Go to `/login` (logged out)
2. Enter valid email: `test-qa@togetherplans.app`
3. Enter wrong password: `WrongPassword123!`
4. Click "Log in"
5. Wait 3 seconds

**Expected Behavior:** Error message: "Invalid email or password" or similar.

**Actual Behavior:** Form resets silently. No error state rendered. No console errors.

---

### Issue #3: Signup with Existing Email Shows No Error Message

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional / UX |
| **URL** | https://togetherplans.app/signup |

**Description:**  
When a user tries to sign up with an already-registered email, the form submits, fails silently, and stays on the signup page with no error message. The user has no idea whether their account was created or not.

**Steps to Reproduce:**
1. Go to `/signup`
2. Fill all fields with email: `test-qa@togetherplans.app` (already registered)
3. Click "Create account →"

**Expected Behavior:** Error: "An account with this email already exists. Try logging in."

**Actual Behavior:** Form remains on page. No error message rendered. `document.querySelectorAll('[class*="error"], [role="alert"]')` returns empty.

---

### Issue #4: Dashboard Shows Hardcoded Demo Data ("Friday Night Plans")

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional / Content |
| **URL** | https://togetherplans.app/dashboard |

**Description:**  
The "Your Turn — tap to vote" section on the dashboard hardcodes proposal options ("Italian Restaurant", "Movie Night", "Bowling") under the title "Friday Night Plans" regardless of the actual proposal data from the API. The actual proposal created was named "UI Test Proposal" with a `dateTime` of Sept 28, 2026. The dashboard component is NOT fetching real proposal data — it renders static demo content.

**Evidence:**
- API `GET /api/groups/:id` returns: `proposals: [{title: "UI Test Proposal", status: "OPEN"}, {title: "QA Test Proposal", status: "DECIDED"}]`
- Dashboard renders: "Friday Night Plans" (hardcoded) with "Italian Restaurant / Movie Night / Bowling" options
- `GET /api/proposals` → 404 (endpoint doesn't exist)
- `GET /api/groups/:id/proposals` → 404 (endpoint doesn't exist)

**Steps to Reproduce:**
1. Create a group and proposal with any name
2. Go to `/dashboard`
3. Observe "Your Turn" section title

**Expected Behavior:** Dashboard shows real proposal title and actual voting options from the API.

**Actual Behavior:** "Friday Night Plans" with hardcoded options shown regardless of actual data.

---

### Issue #5: Privacy Policy Contains "[TODO_LEGAL_ENTITY]" Placeholder

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Content / Legal |
| **URL** | https://togetherplans.app/privacy |

**Description:**  
The Privacy Policy contains an unfilled template placeholder: `[TODO_LEGAL_ENTITY]`. The first paragraph reads: *"This Privacy Policy explains how [TODO_LEGAL_ENTITY] ("DateNight", "we", "our", or "us") collects..."*. This is a legal compliance issue — the Privacy Policy is invalid without the legal entity name, violating GDPR/CCPA requirements the policy itself references.

**Steps to Reproduce:**
1. Go to https://togetherplans.app/privacy
2. Read the first paragraph

---

### Issue #6: All Auth/Form Pages Completely Unstyled (No Design System)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Visual / UX |
| **URL** | `/login`, `/signup`, `/forgot-password`, `/join/:token`, `/settings` |

**Description:**  
Multiple pages use zero design tokens from the established system (teal `#0E8C8C`, lime `#7CB518`, Sora/DM Sans fonts). All buttons render as browser-default gray rectangles. All links render as browser-default blue/purple. Specifically:

- **Login page**: "Log in" button = gray; "Forgot password?" = default purple link
- **Signup page**: "Create account →" button = gray
- **Forgot Password page**: Completely unstyled — no teal, no fonts, browser defaults throughout
- **Join/:token page**: "Join group →" = gray border button; "Go home" after error = default blue link
- **Settings page**: "Sign out", "Export my data", "Delete my account" = gray buttons

**Expected Behavior:** All buttons use teal (`#0E8C8C`) fill with white text. Primary links use teal color.

---

### Issue #7: Export My Data Button — Silent Failure, No Download

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Functional |
| **URL** | https://togetherplans.app/settings |

**Description:**  
Clicking "Export my data" on the Settings page produces no observable result — no download starts, no confirmation toast, no error. The page stays identical before and after the click.

**Steps to Reproduce:**
1. Log in and go to `/settings`
2. Click "Export my data"
3. Wait 5 seconds

**Expected Behavior:** JSON data file downloads OR a "Check your email for the export" confirmation message appears.

**Actual Behavior:** Nothing happens. No network request visible, no UI change.

---

### Issue #8: Notification Bell Icon is Yellow (Wrong Color)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Visual |
| **URL** | All authenticated pages with AppNav |

**Description:**  
The notification bell (🔔) icon in the top navigation renders in yellow/gold color on all pages (`/dashboard`, `/groups`, `/suggestions`, `/notifications`, `/proposals/:id`, `/proposals/:id/share`, `/groups/:id/after-dark`). The design spec uses teal `#0E8C8C` as the primary brand color.

---

### Issue #9: Duplicate "Copy link" Buttons on Proposal Share Page

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Functional / Visual |
| **URL** | https://togetherplans.app/proposals/:id/share |

**Description:**  
The share page renders TWO identical "📋 Copy link" buttons side by side. This appears to be a component rendered twice (React double-render or duplicate JSX node).

**Steps to Reproduce:**
1. Navigate to any proposal's share page: `/proposals/:id/share`
2. Observe the Share this plan section

---

### Issue #10: Calendar Emoji Shows "July 17" Everywhere (Wrong Date)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Visual / UX |
| **URL** | All pages (AppNav logo, share page, join page, proposal share) |

**Description:**  
The app uses the 📅 calendar emoji (Unicode U+1F4C5) throughout the UI — in the app logo, on share cards, in the proposal view. On Apple/macOS systems (and most browsers that use Apple's emoji set), this emoji statically renders as "July 17" regardless of the actual date. 

Affected locations:
- AppNav logo: "📅 DateNight" shows July 17 calendar
- Proposal share page large calendar: shows "July 17" not "September 27"
- /join/:token invite page header
- Public /share/:token page  
- Preview card on share page

**Fix:** Replace 📅 emoji with a custom SVG calendar icon that can display dynamic date values.

---

### Issue #11: Suggestions Page — "+ Add" Button Does Nothing

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Functional |
| **URL** | https://togetherplans.app/suggestions |

**Description:**  
Every suggestion card on the Discover page shows a "+ Add" button. Clicking it produces no result — no modal to select a group, no toast, no navigation. The button is completely non-functional.

**Steps to Reproduce:**
1. Log in and go to `/suggestions`
2. Click any "+ Add" button on any suggestion card

**Expected Behavior:** A modal or bottom sheet appears asking which group to add the suggestion to as a proposal option.

**Actual Behavior:** Nothing happens. No DOM change, no modal, no error.

---

### Issue #12: All Suggestion Card Images Are Broken (Plate Emoji Placeholder)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Visual / Functional |
| **URL** | https://togetherplans.app/suggestions |

**Description:**  
Every suggestion card on the Discover page shows a 🍽️ (plate with fork and knife) emoji placeholder instead of an actual image. Movie cards, restaurant cards, and event cards all show the same placeholder. The suggestion engine (TMDB/Foursquare/Ticketmaster) returns image URLs but they are either not loading or the `<img>` `src` is invalid.

---

### Issue #13: Suggestions Page — Only "All" Category Filter, Location Unavailable

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Functional |
| **URL** | https://togetherplans.app/suggestions |

**Description:**  
The Discover page shows "📍 Location unavailable" with a "Retry" button, and only renders a single "All" filter tab. Category filters (Food, Movies, Events, etc.) that should appear below the location banner are absent. The "Radius km" input field shows no default value. This makes the entire discovery feature unusable.

**Note:** The location issue is expected on desktop (no GPS), but the filter categories should still render based on static categories, not location.

---

### Issue #14: New Proposal Form — No "Remove Option" Button

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | UX / Functional |
| **URL** | https://togetherplans.app/groups/:id/proposals/new |

**Description:**  
The new proposal form starts with 3 pre-populated option slots. There is no way to remove an option — no "×" button, no "Remove" link. If a user doesn't fill all 3 slots, the form submits silently (no error shown, no navigation). Users who want only 2 options are stuck unless they fill all 3.

**Steps to Reproduce:**
1. Go to `/groups/:id/proposals/new`  
2. Fill only 2 of 3 option slots
3. Click "Create proposal →"

**Expected Behavior:** Either form validation error explaining all options must be filled OR a remove button to delete empty options.

**Actual Behavior:** Form stays in place with no error message (silent failure).

---

### Issue #15: New Proposal Form — Silent Failure on Validation Error

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | UX / Functional |
| **URL** | https://togetherplans.app/groups/:id/proposals/new |

**Description:**  
When form validation fails (empty option, missing date), clicking "Create proposal →" does nothing — the form stays on the page with no error message, no field highlighting, no toast. Related to Issue #14.

---

### Issue #16: New Proposal Form — Sticky Nav Overlaps Form Fields When Scrolled

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Visual / UX |
| **URL** | https://togetherplans.app/groups/:id/proposals/new |

**Description:**  
The sticky navigation bar (`position: sticky; top: 0`) overlaps the "Address" field label and the first few pixels of option input fields when the page is scrolled to the bottom of the form. The nav bar does not account for scroll offset, causing form elements to be hidden behind it.

---

### Issue #17: /join/:token — Missing Group Name in Invite Preview

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | UX / Content |
| **URL** | https://togetherplans.app/join/:token |

**Description:**  
The join page shows only "✉️ You're invited! Expires: [date]" with a "Join group →" button. There is no display of:
- Which group the user is being invited to
- Who sent the invite
- What the group is about

**Evidence:** The API `GET /api/invitations/:token` returns `{group: {name: "QA Test Group"}, inviter: {displayName: "TestQA User"}}` but this data is not displayed in the UI.

---

### Issue #18: /join/:token — Error Message Misleading for Existing Members

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | UX / Content |
| **URL** | https://togetherplans.app/join/:token |

**Description:**  
When a user who is already a group member clicks "Join group →" on their own invite link, they see: "😕 Invalid invite — Failed to join group. The invite may have expired or already been used."

The error message is incorrect — the invite is valid but the user is already a member. The error should say "You're already a member of this group."

---

### Issue #19: After Dark — Mood Selection Has No Visual Feedback

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | UX / Functional |
| **URL** | https://togetherplans.app/groups/:id/after-dark |

**Description:**  
Clicking a mood button (Adventurous, Romantic, Social, Chill, Spontaneous, Cultural) shows no active/selected state — no color change, no checkmark, no highlight. There is also no confirmation that the mood was saved to the server. The button appears completely unchanged after clicking.

---

### Issue #20: Single-Member Group Immediately Decides Proposal on First Vote

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | UX / Logic |
| **URL** | https://togetherplans.app/proposals/:id |

**Description:**  
When a group has only 1 member, voting for any option immediately sets the proposal to "DECIDED" status. This produces a confusing UX — "1/1 vote → Decided 🎉" — before any second person can participate. The consensus logic works technically but requires a minimum member count guard (min 2 members) before allowing proposals to be finalized.

---

### Issue #21: Support Page — Wrong Email Domain + Non-clickable Email

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Content / UX |
| **URL** | https://togetherplans.app/support |

**Description:**  
Two issues on the Support page:
1. The support email shows `support@datenight.io` — the OLD domain. Should be `support@togetherplans.app`.
2. The email address is plain text, not wrapped in a `<a href="mailto:...">` link. Users cannot click to open their email client.

---

### Issue #22: Support Page — FAQ Items Don't Expand

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Functional |
| **URL** | https://togetherplans.app/support |

**Description:**  
The FAQ section shows 6 questions with "+" icons suggesting expandable accordion behavior. Clicking any question (or the "+" icon) does nothing — no content expands, no animation, no JS event fires. All 6 FAQ items are non-functional.

---

### Issue #23: 404 Page — Wrong Copy ("No Votes", "This plan doesn't exist")

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Content / UX |
| **URL** | https://togetherplans.app/[any-invalid-path] |

**Description:**  
The 404 page uses proposal-specific copy: "No Votes" subtitle and "This plan doesn't exist" title. For non-proposal URLs (e.g., `/nonexistent-page-xyz`), this is confusing. Should use generic "Page not found" language. The "Go to my plans →" CTA is a blue hyperlink instead of a styled button.

---

### Issue #24: Open Graph / Twitter Meta Tags Point to Wrong Domain

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Content / SEO |
| **URL** | https://togetherplans.app/ (index.html) |

**Description:**  
The `index.html` Open Graph tags reference the old domain:
- `og:url` = `https://datenight.io` (should be `https://togetherplans.app`)
- `og:image` = `https://datenight.io/og-image.png` (broken link — file doesn't exist)
- `twitter:image` = `https://datenight.io/og-image.png` (same broken image)
- `theme-color` meta = `#aa3bff` (purple — should be `#0E8C8C` teal)

When shared on social media (WhatsApp, Twitter, iMessage), the preview will show a broken image and the wrong URL.

---

### Issue #25: Dashboard — No Google Play Badge, Missing AppNav Sections

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Visual / Content |
| **URL** | https://togetherplans.app/dashboard |

**Description:**  
The "Get the app" section in the sidebar only shows the Apple App Store link. The Google Play badge is missing entirely. Also, the "Sign out" button appears in the dashboard sidebar — sign out should only be accessible from Settings.

---

### Issue #26: Proposal Share Page Calendar Shows Wrong Date (Related to #10)

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Visual |
| **URL** | https://togetherplans.app/proposals/:id/share |

**Description:**  
The large calendar image on the proposal share page shows "July 17" (Apple calendar emoji default) despite the proposal date being September 27, 2026. The text date directly below correctly shows "Sunday, September 27, 2026" — creating a visual contradiction. See Issue #10 for root cause.

---

## Issues Summary Table

| # | Title | Severity | Category | URL |
|---|-------|----------|----------|-----|
| 1 | Group detail page crashes React (blank white) | 🔴 Critical | Functional | `/groups/:id` |
| 2 | Login — wrong password shows no error | 🔴 Critical | Functional | `/login` |
| 3 | Signup — duplicate email shows no error | 🔴 Critical | Functional | `/signup` |
| 4 | Dashboard shows hardcoded demo data | 🔴 Critical | Functional | `/dashboard` |
| 5 | Privacy Policy has `[TODO_LEGAL_ENTITY]` | 🔴 Critical | Legal | `/privacy` |
| 6 | Auth/form pages completely unstyled | 🟠 High | Visual | `/login`, `/signup`, etc. |
| 7 | Export my data — silent failure | 🟠 High | Functional | `/settings` |
| 8 | Notification bell wrong color (yellow) | 🟠 High | Visual | All auth pages |
| 9 | Duplicate "Copy link" buttons | 🟠 High | Visual | `/proposals/:id/share` |
| 10 | Calendar emoji shows "July 17" everywhere | 🟠 High | Visual | All pages |
| 11 | Discover "+ Add" button does nothing | 🟠 High | Functional | `/suggestions` |
| 12 | All suggestion card images broken | 🟠 High | Visual | `/suggestions` |
| 13 | Suggestions: only "All" filter, no location | 🟡 Medium | Functional | `/suggestions` |
| 14 | New proposal: no "Remove option" button | 🟡 Medium | UX | `/groups/:id/proposals/new` |
| 15 | New proposal: silent failure on validation | 🟡 Medium | UX | `/groups/:id/proposals/new` |
| 16 | New proposal: nav overlaps form when scrolled | 🟡 Medium | Visual | `/groups/:id/proposals/new` |
| 17 | Join invite: no group name displayed | 🟡 Medium | UX | `/join/:token` |
| 18 | Join invite: misleading error for existing members | 🟡 Medium | UX | `/join/:token` |
| 19 | After Dark: mood click has no visual feedback | 🟡 Medium | UX | `/groups/:id/after-dark` |
| 20 | Single-member group decides immediately on vote | 🟡 Medium | Logic | `/proposals/:id` |
| 21 | Support: wrong email domain + not clickable | 🟡 Medium | Content | `/support` |
| 22 | Support: FAQ items don't expand | 🟡 Medium | Functional | `/support` |
| 23 | 404: wrong proposal-specific copy | 🔵 Low | Content | Any invalid URL |
| 24 | OG meta tags point to wrong domain (datenight.io) | 🔵 Low | SEO | `/` (index.html) |
| 25 | Dashboard: missing Google Play badge | 🔵 Low | Content | `/dashboard` |
| 26 | Share page: calendar emoji wrong date | 🔵 Low | Visual | `/proposals/:id/share` |

---

## Testing Coverage

### Pages Tested
- `https://togetherplans.app/` — Landing page ✅
- `https://togetherplans.app/signup` — Account creation ✅
- `https://togetherplans.app/login` — Login ✅
- `https://togetherplans.app/forgot-password` — Password reset ✅
- `https://togetherplans.app/dashboard` — Dashboard ✅
- `https://togetherplans.app/groups` — Groups list ✅
- `https://togetherplans.app/groups/:id` — Group detail ✅ (crash confirmed)
- `https://togetherplans.app/groups/:id/proposals/new` — New proposal form ✅
- `https://togetherplans.app/proposals/:id` — Proposal detail + voting ✅
- `https://togetherplans.app/proposals/:id/share` — Share card ✅
- `https://togetherplans.app/share/:token` — Public share page ✅
- `https://togetherplans.app/groups/:id/after-dark` — After Dark ✅
- `https://togetherplans.app/suggestions` — Discover ✅
- `https://togetherplans.app/notifications` — Notifications ✅
- `https://togetherplans.app/settings` — Settings ✅
- `https://togetherplans.app/join/:token` — Invite acceptance ✅
- `https://togetherplans.app/privacy` — Privacy Policy ✅
- `https://togetherplans.app/terms` — Terms of Service ✅
- `https://togetherplans.app/support` — Support + FAQ ✅
- `https://togetherplans.app/[invalid]` — 404 page ✅

### Features Tested
- User registration (new account) ✅
- User login (success + wrong password) ✅
- Forgot password flow ✅
- Google Sign-In button (present, not tested — requires OAuth flow) ⚠️
- Group creation ✅
- Group detail navigation ✅ (crash confirmed)
- Invite link generation (via API) ✅
- Join via invite link ✅
- New proposal form submission ✅
- Proposal detail view + voting ✅
- Vote retraction (not tested)
- Share card generation ✅
- Public share page ✅
- After Dark mood selection ✅
- Discover page + filter + "+ Add" ✅
- Notifications empty state ✅
- Settings sign out ✅
- Export my data ✅ (confirmed broken)
- Delete my account (not tested — destructive)
- Footer links (Privacy, Terms, Support) ✅
- 404 page ✅

### Not Tested / Out of Scope
- Google Sign-In OAuth flow (requires real Google account interaction)
- "Delete my account" (destructive — skipped to preserve test data)
- Vote retraction (clicking a voted option again)
- Email delivery (forgot-password email, invite email, vote reminder)
- Mobile responsive layout (tested at 1280px desktop only)
- Push notifications (web push)
- QR code invite flow
- SMS invite flow

### Blockers During Testing
- Group detail page (`/groups/:id`) crashes React — blocked all downstream group-detail flows
- JavaScript value setting via `js()` does not trigger React state updates — had to use `nativeInputValueSetter` pattern for React-controlled inputs in the proposal form

---

## Key Fix Priority (Recommended Order)

1. **[CRITICAL] Fix group detail page crash** — null-check `user.displayName` before `.charAt(0)` in the avatar/initials component. The `user` key in localStorage is `null`; populate it on login or guard all `.charAt()` calls.

2. **[CRITICAL] Add error states to login and signup** — Both forms must display inline error messages on failure. Connect API error responses to the UI state (currently appears to be swallowing errors).

3. **[CRITICAL] Fix dashboard proposal data** — Replace hardcoded "Friday Night Plans" demo data with real API data from `/api/groups` (which already returns proposals in the group response).

4. **[CRITICAL] Replace `[TODO_LEGAL_ENTITY]`** — Fill in the legal entity name in Privacy Policy before any public launch.

5. **[HIGH] Replace 📅 calendar emoji with SVG icon** — The emoji is the Apple icon for "July 17" on all Apple emoji sets. Use `<CalendarIcon />` SVG instead.

6. **[HIGH] Apply design system to auth pages** — Login, signup, forgot-password, join, and settings all need teal `#0E8C8C` button styling and Sora/DM Sans fonts.

7. **[HIGH] Fix Discover "+ Add" button** — Implement group selection modal when adding a suggestion as a proposal option.

8. **[HIGH] Fix suggestion card images** — Debug why TMDB/Foursquare/Ticketmaster image URLs are failing to load (CORS, broken URLs, or missing `onError` fallback).

---

## Notes

- **API is healthy**: Direct API calls all return correct data. This is a pure frontend issue for most bugs.
- **Auth flow works**: Registration, login, logout all function correctly. The missing piece is error state display.
- **Proposal voting works**: The full vote-and-decide flow (create → vote → decided) works end-to-end.
- **Share/public page works**: `/share/:shareToken` renders correctly (minus the calendar emoji visual bug).
- **After Dark API works**: The time-gated mode is correctly implemented server-side; the frontend just needs mood selection feedback.
- The `user: null` in localStorage (vs `accessToken` being present) is the likely root cause of Issue #1. Ensure the login/signup response populates `localStorage.setItem('user', JSON.stringify(userData))`.
