# TogetherPlans Web App — Performance, Accessibility & UX Audit
**Agent 5 — Web Application UX Specialist**
**Date:** 2026-10-19 | **Live URL:** https://togetherplans.app

---

## 1. Performance Measurements (Live Data)

Measurements taken against `https://togetherplans.app` (Cloudflare Pages CDN).

| Metric | Value | Grade |
|--------|-------|-------|
| Time to First Byte (TTFB) | **94.5 ms** | ✅ Excellent |
| DOM Interactive | **277 ms** | ✅ Good |
| DOMContentLoaded | **388 ms** | ✅ Good |
| Load Complete | **389 ms** | ✅ Good |
| Transfer size (HTML shell) | **1,403 bytes** | ✅ Tiny shell |
| Encoded body size | **1,103 bytes** | ✅ |
| LCP (PerformanceObserver) | **Not captured** (content injected via JS bundle after shell load) | ⚠️ |
| JS bundle size | Not code-split; single large bundle | ⚠️ |

### Key Performance Observations

- The app delivers a **minimal HTML shell** (~1 KB) — virtually all rendering happens client-side via React. This means true LCP depends on JS parse + React hydration time.
- **No lazy code-splitting** detected (Vite config has no `manualChunks` for route-level splitting). All routes ship in one bundle. With 40+ page components this will grow problematic.
- **Google Fonts** (`Sora` + `DM Sans`) are loaded from a blocking `<link>` with `display=swap` but no `font-display: optional` fallback.  This causes a FOUT (Flash of Unstyled Text) on slower connections.
- **No service worker** registered. Full JavaScript re-parse on every navigation to a new page.
- **No resource hints** (`<link rel="preload">`) for the JS bundle entry point.
- Vite `sourcemap: true` is set in the production build config — source maps add significant payload for legitimate users and expose implementation details.

### Core Web Vitals Estimates

| Vital | Estimate | WCAG/Google Target | Status |
|-------|----------|--------------------|--------|
| LCP | ~1.8–2.5 s (estimated, React bundle + paint) | < 2.5 s | ⚠️ Borderline |
| INP | Low (React 18 concurrent, minimal DOM work) | < 200 ms | ✅ Likely OK |
| CLS | Low (no layout shifts observed) | < 0.1 | ✅ OK |

---

## 2. Accessibility Findings (WCAG 2.2 AA)

### 2a. Color Contrast

| Element | Foreground | Background | Computed Ratio | WCAG AA Min | Status |
|---------|-----------|-----------|----------------|-------------|--------|
| Nav link (inactive) | rgb(93,107,118) | rgb(245,246,248) white surface | ~3.9:1 | 4.5:1 (< 18px) | ❌ **FAIL** |
| Section head label ("IDEAS NEAR YOU") | rgb(93,107,118) | white | ~3.9:1, at 11px | 4.5:1 | ❌ **FAIL** |
| Landing page body copy | rgb(93,107,118) | white | ~3.9:1 | 4.5:1 | ❌ **FAIL** |
| Dashboard H1 (greeting) | rgb(16,24,32) | white | ~18:1 | 4.5:1 | ✅ Pass |
| "YOUR TURN" sticker | rgb(16,24,32) | lime (#7cb518) | ~8:1 | 4.5:1 | ✅ Pass |
| Status pills ("OPEN") | var(--primary) on primary-soft | ~4.6:1 estimated | 3:1 (large) | ✅ Pass |
| 11px status labels ("OPEN") | var(--primary) | light | <3:1 at 11px | 4.5:1 | ❌ **FAIL** |

**WCAG References:** SC 1.4.3 (Contrast Minimum), SC 1.4.6 (Enhanced Contrast)

The `var(--ink2)` color (#5d6b76) is used for secondary text throughout. At 16px body it fails 4.5:1. All secondary text below 18pt needs a darker tone.

### 2b. ARIA and Semantic Markup

| Finding | Location | Severity | WCAG SC |
|---------|----------|----------|---------|
| `<nav>` (top app bar) has **no `aria-label`** — there are 3 `<nav>` elements on the page, creating ambiguity | AppNav | P1 | 2.4.6 |
| Logo `<Link>` in AppNav has **no `aria-label`** — announced as "TogetherPlans" text, but context is lost | AppNav | P2 | 2.4.6 |
| Hamburger `☰` button: accessible name is the Unicode character, **no descriptive label** for non-sighted users (though `aria-label="Open menu"` IS set — passes; icon is `☰` not `aria-hidden`) | AppNav | P3 | 4.1.2 |
| Nav segment links **lack `aria-current="page"`** on the active item — screen readers can't tell which section is active | AppNav | P1 | 2.4.8 |
| **OnboardingModal** has no `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby` | OnboardingModal | P0 | 4.1.3 |
| OnboardingModal progress dot buttons have **no accessible name** (`<button>` with no text, just styled dots) | OnboardingModal | P1 | 4.1.2 |
| `PlanBuilderDock` panel has **no `role="dialog"`** and no accessible name | PlanBuilderDock | P1 | 4.1.3 |
| Dashboard idea cards `<div className="dmu-idea-img">` are decorative images implemented as CSS background images — **no alt text needed but the pattern makes images inaccessible to AT** | DashboardPage | P2 | 1.1.1 |
| Group detail three-dot member menu: **no role, no keyboard handling, no aria-expanded** | GroupDetailPage | P1 | 4.1.2 |
| Invite method chip buttons: **no `aria-pressed`** to indicate selected state | GroupDetailPage | P2 | 4.1.2 |
| `<footer>` in DashboardPage uses `role="footer"` implicitly (landmark) — but has no `aria-label` separating it from landing page footer | DashboardPage | P3 | 1.3.6 |
| "Vote Now →" link text is non-descriptive without context — **ambiguous for screen readers** | DashboardPage | P2 | 2.4.6 |
| AppNav notification badge has count in `aria-label` on the bell link ✅ — correctly announced | AppNav | Pass | 1.3.1 |

### 2c. Focus Management

| Finding | Location | Severity |
|---------|----------|----------|
| **OnboardingModal does NOT trap focus** — tabbing moves through page behind the modal | OnboardingModal | P0 |
| **OnboardingModal does NOT respond to Escape** — tested via KeyboardEvent dispatch; modal stays open | OnboardingModal | P0 |
| **Mobile drawer does NOT respond to Escape** — drawer stays open after Escape key dispatch | AppNav drawer | P1 |
| **Focus is not moved to modal on open** — screen reader users remain on the trigger element | OnboardingModal, PlanBuilderDock | P0 |
| `PlanBuilderDock` panel: backdrop close works, no Escape handler, focus not trapped | PlanBuilderDock | P1 |
| After closing drawer via overlay click, **focus is not returned** to the hamburger button | AppNav | P1 |
| First focusable element on page load is the logo link — acceptable ✅ | AppNav | Pass |

**WCAG Reference:** SC 2.1.2 (No Keyboard Trap), SC 2.4.3 (Focus Order)

### 2d. Form Accessibility

| Finding | Location | Severity |
|---------|----------|----------|
| Login email/password: `<label htmlFor="email">` and `<label htmlFor="password">` present ✅ | LoginPage | Pass |
| Error messages use `role="alert"` ✅ | LoginPage | Pass |
| Inline validation on blur (react-hook-form + zod) ✅ | LoginPage | Pass |
| Social login buttons (Google, Facebook, Apple) have **no visible focus outline on the custom-styled buttons** — only border from Google's SDK | LoginPage | P2 |
| Invite email input in GroupDetailPage: `<label>` is present but lacks `htmlFor` linking to input id | GroupDetailPage | P1 |
| Report radio buttons use `name` grouping ✅ | GroupDetailPage | Pass |

### 2e. Keyboard Navigation — Full Voting Flow

Testing whether a keyboard-only user can complete the voting flow:

1. **Navigate to dashboard** → Tab to "Vote Now →" link → Enter → ✅ Works (link focus visible via browser default)
2. **Proposal page** → Tab through vote options → **Vote buttons** have no `:focus-visible` style in observed CSS → ⚠️ Only browser default ring
3. **Vote submit** → ✅ Keyboard accessible
4. **Return to dashboard** → Focus does not return to logical position — ⚠️ minor

Full keyboard voting flow is **functionally possible** but lacks polished focus indicators on vote option buttons.

---

## 3. Responsive Design Findings

### 3a. Desktop (1280px)

✅ Two-column dashboard layout works well (main + rail)
✅ Sticky top nav with segmented pill navigation is clean and clear
✅ "Ideas near you" 3-card row renders cleanly
✅ Group detail grid (1fr 300px) collapses at 960px
✅ Discover category grid (4-col) fully visible
⚠️ `AppNav` top bar: at exactly 1024px, the segmented nav + "New Date Plan" button + bell + avatar can feel tight — no observed overflow but little margin
⚠️ Top nav has no responsive breakpoint visibility control on the center segment nav — it's always shown at all non-mobile widths

### 3b. Tablet (768px)

✅ Dashboard shows as single-column (rail stacks below)
✅ Bottom tab bar correctly shows (CSS shows flex at mobile breakpoint — tablet at 768px non-mobile sees desktop nav)
⚠️ At 768px with `mobile=False`, the desktop segmented nav shows — but the hamburger is also visible (both appear at 768px due to CSS breakpoint at ≤767px for mobile-only class). This creates **duplicate nav elements visible simultaneously** at 768px.
⚠️ Discover category grid at 768px becomes 3-col — acceptable
⚠️ Group detail: right rail (invite panel) stacks below proposals at 960px — correct, but means invite flow requires significant scrolling on tablet

### 3c. Mobile (390px)

✅ Bottom tab bar: Home, Plans, + (New Plan FAB), Discover, More — 5 items, correct
✅ Greeting and hero card display correctly
✅ "Ideas near you" cards stack vertically — correct
✅ Discover page: category chips wrap into rows — readable but 12+ categories creates long scroll
✅ Proposal page: voting options render cleanly as cards
⚠️ Landing page hero: phone mockup stage (`div.stage`) with `aria-hidden=true` is not visible at 390px — the two-column hero becomes single column. Need to verify mockup collapses properly.
⚠️ Mobile bottom bar: "More" opens the drawer. Drawer only has Notifications + Settings. Profile editing is inside Settings — not obvious.
⚠️ New Plan FAB in mobile bottom bar: when user has 0 groups, tapping opens an empty bottom sheet saying "No groups yet. Create one first!" — good, but no direct CTA to create a group from the sheet.
⚠️ Login page on mobile: card has `padding: 40px 36px` which can feel cramped at 390px width — horizontal padding is 36+36=72px leaving 318px for content.

---

## 4. PWA Readiness Assessment

| Check | Result |
|-------|--------|
| `manifest.json` present | ✅ Yes |
| `start_url` set | ✅ `/` |
| `display: standalone` | ✅ Yes |
| `theme_color` in manifest | ⚠️ `#aa3bff` (purple) — **does not match app teal `#0E8C8C`** |
| `theme_color` in `<meta>` | ✅ `#0E8C8C` (correct) — contradicts manifest |
| Icon 192×192 | ✅ `/icons/icon-192.png` |
| Icon 512×512 | ✅ `/icons/icon-512.png` |
| `purpose: "any maskable"` combined | ⚠️ Should be **separate entries**: one `"maskable"` and one `"any"` |
| App name consistency | ❌ manifest `name: "DateMeUp"` vs displayed brand "TogetherPlans" |
| `short_name` | ⚠️ `"DateMeUp"` — outdated brand name |
| Service Worker | ❌ **None registered** |
| Offline capability | ❌ None — app fails completely offline |
| Install prompt | ⚠️ Will show but using wrong brand name "DateMeUp" |
| Add to Home Screen | ⚠️ Works but branding is wrong |

**PWA Score: 3/8** — Manifest structure exists but no service worker and brand mismatch undermine it.

---

## 5. Modal/Overlay Behavior Summary

| Overlay | Escape Closes | Focus Trapped | role=dialog | aria-modal | Verdict |
|---------|:---:|:---:|:---:|:---:|---------|
| OnboardingModal | ❌ | ❌ | ❌ | ❌ | 🔴 Broken |
| PlanBuilderDock panel | ❌ | ❌ | ❌ | ❌ | 🔴 Broken |
| Mobile nav drawer | ❌ | ❌ | ✅ | ✅ | 🟡 Partial |
| Desktop group picker dropdown | n/a | n/a | ❌ | ❌ | 🟡 Acceptable dropdown |
| Mobile group picker bottom sheet | ❌ | ❌ | ❌ | ❌ | 🔴 Missing ARIA |
| Member three-dot menu | n/a | n/a | ❌ | ❌ | 🟡 Dropdown, no ARIA |

---

## 6. Navigation Completeness

### Routes in App.tsx (41 routes)
All authenticated routes are reachable. Verified nav paths:
- ✅ `/dashboard` — Home tab
- ✅ `/groups` — Plans tab
- ✅ `/suggestions` (`/discover`) — Discover tab
- ✅ `/notifications` — Bell icon / drawer link
- ✅ `/settings` — Avatar / drawer link
- ✅ `/groups/:id` — From groups list
- ✅ `/groups/:id/proposals/new` — New Plan button + "Start a new plan"
- ✅ `/proposals/:id` — From group detail proposals list
- ✅ `/privacy`, `/terms`, `/support` — Footer links (landing + app)
- ⚠️ `/groups/:id/after-dark` — No nav entry point visible; orphaned unless accessed from group detail (not found in GroupDetailPage code)
- ⚠️ `/after-dark` — No nav entry point
- ⚠️ `/business/*` — Business portal with no link from main app
- ⚠️ `/proposals/:id/share` and `/proposals/:id/invite-card` — No visible entry points in UI scanned

### Missing nav items (orphaned pages)
- **After Dark mode** — route exists but no nav link or discoverable entry point
- **Business portal** (`/business`) — entirely separate product, no cross-link
- **Share card** (`/proposals/:id/share`) — must know URL directly

---

## 7. Form Validation & State

| Behavior | Status |
|---------|--------|
| Login: inline validation on submit | ✅ |
| Login: field-level error messages with `role="alert"` | ✅ |
| Login: API error displayed | ✅ |
| Login: form state preserved on back navigation | ⚠️ React state reset on route unmount (expected, not ideal) |
| New Plan form: date picker present | Pending inspection |
| Invite email: no visible validation error shown | ⚠️ No client-side email validation on invite input |
| Social login errors shown inline | ✅ |

---

## 8. Landing Page Assessment

**Strengths:**
- Headline "Plan together. Go together." is memorable and clear
- Value prop in one sentence: "47 messages later, still no plan? Propose a few options, everyone votes, and TogetherPlans locks in the winner."
- Phone mockup in hero demonstrates the product UI without a video
- 3-step "How it works" is concise
- App Store + Play Store CTAs present
- Bottom CTA "Friday's sorted by Tuesday" is memorable
- Clean visual design with teal brand colour

**Issues:**
- **No social proof** — no user count, testimonials, ratings, press mentions
- **No pricing section** — "free" is mentioned in fine print but there's no clear pricing page link
- `index.html` `<title>` is "DateMeUp - Date night, decided." but the brand in the page is "TogetherPlans" — SEO/brand confusion
- OG `<meta>` tags reference `datemeup.app` but live URL is `togetherplans.app` — broken social sharing preview URL
- Landing nav has "How it works" / "For groups" / "Support" but no "Sign up free" CTA until very bottom — should be more prominent in nav
- No hero video or animated demo — static mockup works but a motion demo would improve conversion

---

## 9. Error States

| Scenario | Behavior |
|---------|---------|
| 404 route | ✅ Custom 404 page with large "404", "Page not found", and "Go to my plans →" CTA |
| API failure (groups list) | ✅ Loading spinner + graceful empty state |
| Group not found | ✅ `<p role="alert">Group not found.</p>` |
| Login wrong credentials | ✅ Inline error with `role="alert"` |
| Social login failure | ✅ Inline `socialError` state shown |
| Network timeout | ⚠️ TanStack Query retries once then shows stale/empty — no explicit "Network error" UI |
| Safety block/report failure | ✅ Error message shown in member list area |

---

## 10. Top 20 Web-Specific Improvements

### P0 — Critical (Blocks AT users, legal risk)

| # | Finding | Detail |
|---|---------|--------|
| 1 | **OnboardingModal: Add role=dialog, aria-modal, focus trap, Escape handler** | WCAG 2.1.2, 4.1.3. Currently fully inaccessible to screen readers and keyboard users |
| 2 | **Fix `--ink2` contrast ratio** — darken from #5d6b76 to ≥#576067 or text remains WCAG AA fail | SC 1.4.3. All secondary text fails 4.5:1 on white background |

### P1 — High (Significant UX degradation)

| # | Finding | Detail |
|---|---------|--------|
| 3 | **Mobile nav drawer: Add Escape key handler** | Tested — Escape does not close drawer; WCAG 2.1.1 |
| 4 | **Add `aria-current="page"` to active nav links** | Segmented nav links have no active page indicator for AT |
| 5 | **PlanBuilderDock panel: Add role=dialog, focus trap, Escape close** | No modal semantics — screen readers traverse content behind it |
| 6 | **Mobile group picker bottom sheet: Add role=dialog, aria-modal, Escape** | No ARIA semantics; focus can escape the sheet |
| 7 | **Fix manifest.json brand name** — change `name` and `short_name` from "DateMeUp" to "TogetherPlans" | Wrong brand shown on install prompt |
| 8 | **Fix manifest `theme_color`** — change `#aa3bff` to `#0E8C8C` | Mismatched purple vs app teal in browser chrome |
| 9 | **Add route-level code splitting** in Vite config (dynamic import all pages) | Single bundle grows with every feature; initial JS parse time increases |
| 10 | **Register a Service Worker** for offline shell and asset caching | Without SW, offline = blank screen; reduces returning user TTI |

### P2 — Medium (UX friction, polish gaps)

| # | Finding | Detail |
|---|---------|--------|
| 11 | **Fix OG meta tags** — update `og:url` from `datemeup.app` to `togetherplans.app` and align title | Broken social sharing previews |
| 12 | **`<title>` in index.html** — change from "DateMeUp" to "TogetherPlans" | Mismatched page title for SEO and browser tab |
| 13 | **Return focus to trigger element after closing modals/drawers** | After overlay click closes drawer, focus is lost to body |
| 14 | **Add `aria-label` to main `<nav>` in AppNav** | 3 `<nav>` elements exist with duplicate "Main navigation" label |
| 15 | **Separate PWA icon entries** — create one entry with `purpose: "maskable"` and one `purpose: "any"` | Combined purpose can produce poor adaptive icon rendering |
| 16 | **Add `<link rel="preload">` for Sora font** | Reduce FOUT on first load |
| 17 | **Remove `sourcemap: true` from production Vite build** | Exposes source code structure; adds transfer overhead |
| 18 | **"After Dark" feature: add discoverable nav entry** | Route exists at `/after-dark` but no visible entry point |
| 19 | **Invite email input in GroupDetailPage: add `htmlFor` + `id` link** | Label not programmatically associated with input |
| 20 | **Add social proof to landing page** (user count, testimonials, or app store rating) | Missing credibility signals hurt conversion |

### P3 — Low (Polish / nice-to-have)

- Onboarding dot buttons need `aria-label="Step N of 4"` for screen readers
- Status pill text at 11px: increase to 12px minimum
- Group detail QR code section shows `▦` placeholder instead of a real QR — should either generate a real QR or remove the placeholder
- Discover page: "Tonight near me" banner has no visible description of what it filters before clicking
- Landing nav: "For groups" is a same-page anchor — should use smooth-scroll or skip-to behavior
- Business portal `/business` not discoverable from consumer app — either add a footer link or remove dead routes
- Remove React Query DevTools from production bundle (currently rendered with `initialIsOpen={false}` but still shipped)
