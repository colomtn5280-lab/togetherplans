# TogetherPlans Web — Visual Design Audit
**Date:** October 2026 | **Auditor:** Agent 2 — Senior UI/UX Design Director
**Scope:** https://togetherplans.app — 11 screens, desktop (1440px) + mobile (390px)

---

## Screenshot Inventory
| File | Screen | Viewport |
|---|---|---|
| 01_landing.png | Landing / marketing page | 1440px |
| 01_mobile_landing.png | Landing page | 390px |
| 02_login.png | /login | 1440px |
| 02_mobile_login.png | /login | 390px |
| 03_signup.png | /signup | 1440px |
| 04_dashboard.png | /dashboard | 1440px |
| 04_mobile_dashboard.png | /dashboard | 390px |
| 05_groups.png | /groups | 1440px |
| 06_suggestions.png | /suggestions (Discover) | 1440px |
| 07_after_dark.png | /after-dark | 1440px |
| 08_proposal_decided.png | /proposals/:id | 1440px |
| 09_invite_card.png | /proposals/:id/invite-card | 1440px |
| 10_settings.png | /settings | 1440px |
| 11_notifications.png | /notifications | 1440px |

---

## Per-Screen Visual Critique

### Landing Page — Score: 6/10
Dark teal gradient hero with headline and dual CTAs. Feature sections use 3-column icon layouts.
- **No product screenshot in hero** — users cannot see what they're signing up for
- **No social proof** — no testimonials, ratings, press logos
- **Flat gradient** — reads as Bootstrap-era. Competitors use photography or illustration
- CTA hierarchy unclear — primary/secondary buttons similar visual weight
- Feature icons are generic, not custom

### Login Page — Score: 6.5/10
White pill-card on gradient background. Three social auth buttons (Google outline, Facebook blue, Apple black).
- **Three brand colors** (white/blue/black) beneath a single "or" divider = visual noise
- **ALL_CAPS field labels** — outdated, reduces readability (WCAG 1.4.12 text spacing)
- No password show/hide toggle
- "Forgot password?" is undersized gray text — easy to miss

### Signup Page — Score: 5.5/10
Same card as login. Adds name fields and a **lime-green "FREE" badge**.
- **"FREE" badge is acid lime-green (#22C55E)** — first instance of rogue color, jarring
- Confirm password field is an antiquated pattern
- No terms/privacy checkbox — legal risk
- Same ALL_CAPS labels

### Dashboard — Score: 5/10
White navbar, teal logo, greeting, "All caught up" state, right sidebar, suggestion cards.
- **Yellow notification bell** — rogue gold/amber, appears on every authenticated page
- **"ALL CAUGHT UP ✓" chip** — lime-green, second rogue instance
- **"1 OF 4" onboarding step badge** — lime-green, third rogue instance
- **"Sign out" in sidebar** — red text for a non-destructive action
- Onboarding modal fires on every session for test account (state not persisted)

### Groups Page — Score: 6/10
Clean layout with filter tabs and group cards.
- **Avatar placeholders show "?"** — broken images, no initials fallback
- **"Active" status chip** — lime-green, fourth rogue instance
- Yellow bell persists
- App Store/Play Store buttons in footer appear only on this page — inconsistent

### Discover / Suggestions — Score: 6.5/10
Category grid + filter pills. Loading state with house/person animation.
- **6 rogue dot colors** for categories (orange, blue, green, black, teal, dark rose) with no rationale
- Category color taxonomy is unexplained and unmemorable
- Loading state has no timeout/fallback UI

### After Dark — Score: 7/10
Dark rose card grid with emoji illustrations. Strongest visual identity in the app.
- **"After Dark" title uses gold/yellow text** — third distinct rogue accent
- 40+ items with no pagination (5000px scroll)
- No hover states visible
- "Add your own idea" link easily missed at bottom

### Proposal (DECIDED) — Score: 1/10 — CRITICAL
**Renders "Proposal not found." in salmon text on blank gray page.**
No illustration, no back link, no CTA, no explanation. The most important moment in the product — a decided plan — shows only an error. This is the worst screen in the application.

### Invite Card Gallery — Score: 8.5/10 — Best Screen
40+ distinct template designs in clean 2-column grid. Genuine product differentiation.
- No search/filter for 40+ templates
- No preview/full-size view before selection
- "Back" and "Skip" are plain links, not designed actions
- Context is lost when accessed standalone (not from a proposal)

### Settings — Score: 4/10
Sparse. "Settings" heading (~52px bold), email display, Sign out pill, Favourite categories empty state, GDPR card.
- **No profile editing** — no avatar, no name change, no password update
- **No notification preferences**
- "Settings" h1 is absurdly oversized relative to content
- "Delete my account" (red) sits next to "Export my data" without confirmation warning visible
- "Sign out" here is a teal pill; in dashboard sidebar it was red text — same action, inconsistent

### Notifications — Score: 4.5/10
Pure empty state: bell emoji + "Quiet for now" + one CTA button.
- Heading is ~52px on a near-empty page — scaffolding feel
- No notification settings, no history, no configuration
- No navbar

---

## Typography Findings

**Declared fonts:** DM Sans (body/UI) + Sora (headings)

| Issue | Severity |
|---|---|
| Heading scale inconsistent — Settings/Notifications use ~52px vs ~32px elsewhere | High |
| ALL_CAPS form labels (EMAIL, PASSWORD) — dated, accessibility concern | Medium |
| Missing SemiBold (600) weight — only Regular + Bold used | Low |
| Card description text line-height appears tight | Low |
| No h3 mid-level heading visible — gap between large titles and small subtitles | Medium |

---

## Color System Findings

**Legitimate system colors:**
- `#0E8C8C` Primary teal ✅
- `#FFFFFF` White ✅
- `#F4F4F5` Light gray background ✅
- `#1A1A1A` Near-black text ✅
- `#6B7280` Secondary gray ✅
- `#DC2626` Red (destructive only) ✅

**Rogue / undocumented colors found:**
| Color | Where | Occurrences |
|---|---|---|
| Lime-green `~#22C55E` | "FREE" badge, "Active" badge, "ALL CAUGHT UP" chip, "1 OF 4" onboarding step | 4 screens |
| Gold/amber `~#F59E0B` | Notification bell (every auth page) | All auth pages |
| Gold/yellow | "After Dark" title text | 1 screen |
| Orange `~#F97316` | Discover category dots (Comedy, Hotels, Dining) | Discover |
| Blue `~#3B82F6` | Discover category dots (Concerts, Experiences) | Discover |
| Green `~#22C55E` | Discover category dots (Family, Movies, Wellness) | Discover |
| Black | Discover category dots (Sports, Netflix, Wine) | Discover |
| Dark rose `~#BE185D` | Discover: After Dark dot; After Dark page cards | 2 surfaces |

**Total: 15+ distinct colors vs. 5-7 in defined system.** The lime-green is the most systemic — it appears 4 times and will confuse any new designer who joins the team.

---

## Component Consistency Findings

| Component | Consistency |
|---|---|
| Primary CTA buttons (teal filled pill) | ✅ Consistent |
| Outline/secondary buttons | ✅ Consistent |
| Tab filter pills | ✅ Consistent |
| Cards (white, rounded, shadow) | ✅ Consistent |
| "Sign out" button | ❌ Red text (sidebar) vs teal pill (settings) |
| Status badges | ❌ Lime-green / gray / teal — 3 different approaches |
| Heading sizes | ❌ 32px (normal) vs 52px (sparse pages) |
| Page navigation | ❌ Some pages have AppNav, some don't (Settings, Notifications) |

---

## Top 20 Visual Improvements

| # | Finding | Before | After | Priority |
|---|---|---|---|---|
| 1 | Rogue lime-green | #22C55E badges/chips in 4 contexts | Replace with `#D1F5F0` teal tint | P0 |
| 2 | Gold notification bell | Amber bell icon | Teal or neutral dark icon | P0 |
| 3 | Proposal not-found error | Bare text "Proposal not found." | Branded 404 with illustration + CTAs | P0 |
| 4 | Sign out inconsistency | Red text + teal pill | Single teal outline pill everywhere | P1 |
| 5 | Settings page missing profile edit | View-only email display | Avatar upload, name, password fields | P1 |
| 6 | Heading scale | ~52px on sparse pages | Cap all page h1s at 32-36px | P1 |
| 7 | ALL_CAPS form labels | EMAIL / PASSWORD | Email / Password (sentence case) | P1 |
| 8 | Category dot colors (6 rogue) | 6 colors for categories | 2-3 tones from primary palette | P1 |
| 9 | No dark mode | Light only | System-preference dark mode | P2 |
| 10 | Avatar fallback | "?" placeholder | Initials in teal circle | P1 |
| 11 | Landing page hero | Flat gradient, no product preview | Add app screenshot mockup | P2 |
| 12 | Landing social proof | None | App store ratings, testimonials | P2 |
| 13 | Confirm password field | Antiquated double-entry | Remove; add show/hide toggle | P1 |
| 14 | After Dark title color | Gold/yellow text | White or teal title | P1 |
| 15 | Invite card — no filter | 40+ cards, unfiltered | Category tags: Formal / Playful / Minimal | P2 |
| 16 | After Dark pagination | 5000px scroll | Paginate or lazy-load (20 at a time) | P2 |
| 17 | Password show/hide | Not present | Eye icon toggle on all password inputs | P1 |
| 18 | Nav consistency | Settings/Notifications lack AppNav | Add AppNav to all authenticated pages | P1 |
| 19 | Empty state illustrations | Text-only on most screens | Custom illustrations per empty state | P2 |
| 20 | Auth background | Flat gray-to-mint gradient | Brand-forward: subtle pattern or illustration | P3 |

---

## Overall Design Maturity Score: **5.5 / 10**

**What's working:** Consistent card shapes, clear primary action buttons, intentional After Dark personality, excellent invite card gallery concept, teal brand color used correctly in core components.

**What's dragging the score:** 15+ undocumented colors leaking through the system, critical error state on the most important screen type (proposal), Settings and Notifications are utility scaffolding not designed screens, no dark mode, broken avatar images, oversized headings on sparse pages, landing page would not convert against 2026 competitors.

**Comparable benchmarks:** Hinge 8.5/10, Airbnb 9/10, Notion 8/10. To reach 7.5/10, TogetherPlans needs formal color token governance, designed error/empty states for all screens, and a consistent typography scale.
