# TogetherPlans — Modernization Roadmap
**October 2026 | Consolidated from 6-Agent Audit**

---

## Priority Classification

| Priority | Definition |
|---|---|
| P0 | Ship blocker — broken functionality, store rejection risk, or serious security issue |
| P1 | High priority — significant UX damage or major navigation failure |
| P2 | Medium — visual improvement, workflow efficiency, feature gap |
| P3 | Optional — polish, enhancement, future capability |

---

## P0 — Fix Before Any Submission (Est. 3–5 days)

| ID | Platform | Finding | Fix | Effort |
|---|---|---|---|---|
| P0-01 | iOS | Missing `NSCalendarsUsageDescription` — app crashes on calendar permission + App Store rejection | Add to app.json `infoPlist` | 30 min |
| P0-02 | iOS | Custom Apple Sign In buttons — violates Apple requirement for `AppleAuthenticationButton` | Replace TouchableOpacity with official component | 2 hrs |
| P0-03 | Android | Target SDK 35 not set — Google Play blocks all updates | Set `targetSdkVersion: 35` in app.json, rebuild | 1 hr |
| P0-04 | Android | Data Safety section not completed on Play Console | Complete Play Console form | 2 hrs |
| P0-05 | Backend | `JWT_SECRET` falls back to hardcoded `'dev-secret'` if env var missing | Throw on startup if missing, never fall back | 30 min |
| P0-06 | Backend | After Dark group membership check commented out — any authenticated user can write to any group | Uncomment and restore the membership check | 30 min |
| P0-07 | Web | `DashboardPage.tsx:236` "Vote Now →" link routes to non-existent path `/groups/:groupId/proposals/:proposalId` — 404 for every dashboard user | Fix route to `/proposals/:proposalId` | 15 min |
| P0-08 | Web | Proposal page error state is bare text "Proposal not found." on blank page — worst UX moment in app | Build proper 404/403 error state with illustration and back CTA | 3 hrs |
| P0-09 | Web/Mobile | `AfterDarkScreen.tsx` "Let's go NOW" feature always broken (groupId undefined when accessed from tab) | Pass groupId through navigation params | 1 hr |

---

## P1 — High Priority (Est. 2 weeks)

| ID | Platform | Finding | Fix | Effort |
|---|---|---|---|---|
| P1-01 | Web | After Dark has **zero navigation entry points** — not in AppNav, not in mobile bottom bar, not accessible from dashboard | Add "After Dark 🌙" to AppNav + mobile tab or dashboard card | 2 hrs |
| P1-02 | Web | manifest.json `name`/`short_name` still says "DateMeUp" — shows wrong name on PWA install | Update manifest.json | 15 min |
| P1-03 | Web | manifest.json `theme_color` is purple `#aa3bff` — wrong brand | Update to `#0E8C8C` | 15 min |
| P1-04 | Web | OnboardingModal: no `role="dialog"`, no focus trap, Escape doesn't close | Implement proper modal a11y pattern | 2 hrs |
| P1-05 | Web | Lime-green `#22C55E` rogue color on 4 screens | Replace all instances with teal tint `#D1F5F0` or primary teal | 2 hrs |
| P1-06 | Web | Gold/amber notification bell on every auth page | Replace with teal or neutral icon | 30 min |
| P1-07 | Web | "Sign out" is red text in sidebar, teal pill on settings — same action | Standardize to teal outline pill everywhere | 30 min |
| P1-08 | Web | Settings page has no profile editing (no avatar, name, password) | Add profile edit form to settings | 4 hrs |
| P1-09 | Web | Secondary text `#5d6b76` fails WCAG AA contrast at 4.5:1 | Darken to `#4B5563` or adjust usage | 2 hrs |
| P1-10 | Web | Nav inconsistency — Settings/Notifications lack AppNav bar | Add AppNav to all authenticated pages | 1 hr |
| P1-11 | Web | 766KB single bundle — no code splitting | Add `manualChunks` in vite.config.ts | 3 hrs |
| P1-12 | iOS | Haptics missing on 9 of 10 key moments (votes, match, send, tab taps) | Add `Haptics.impactAsync()` to all interaction handlers | 3 hrs |
| P1-13 | iOS | Hardcoded `bottom: 24` / `paddingBottom: 36` ignoring home indicator | Use `useSafeAreaInsets().bottom` throughout | 2 hrs |
| P1-14 | iOS | Contextual screens (CreateProposal, AfterDark, ShareCard, InviteCard) should be `presentation: 'modal'` | Update navigator config | 1 hr |
| P1-15 | iOS | Tab bar uses `accessibilityRole="button"` — must be `"tab"` with labels | Fix DockTabBar accessibility | 1 hr |
| P1-16 | iOS | Vote buttons have no `accessibilityLabel`, `accessibilityRole`, or `accessibilityState` | Add to all sentiment buttons | 2 hrs |
| P1-17 | Android | All `TouchableOpacity` lacks Android ripple feedback — feels non-native | Wrap in `Pressable` with `android_ripple` config | 4 hrs |
| P1-18 | Android | Comment delete `×` (~18dp), option remove `×` (~30dp) below 48dp M3 minimum | Expand touch targets to ≥48dp | 1 hr |
| P1-19 | Android | Custom back `‹` button on Android where system back is standard | Platform-check: hide header back button on Android | 1 hr |
| P1-20 | Backend | Web tokens stored in localStorage — XSS-vulnerable | Move refresh token to httpOnly cookie | 4 hrs |
| P1-21 | Backend | Mobile has no refresh token flow — users must re-login on 401 | Implement silent token refresh in mobile API client | 3 hrs |
| P1-22 | Backend | Missing `@@index([proposalId])` on Option table | Add migration | 30 min |
| P1-23 | Backend | No tests for vote flow, auth register/login, refresh rotation | Write test suite for critical paths | 1 day |
| P1-24 | Web | "Your turn to vote" badge missing — no persistent action indicator | Add unread vote badge on Plans tab / dashboard | 3 hrs |

---

## P2 — Medium Priority (Est. 2–3 weeks after P1)

| ID | Platform | Finding | Fix | Effort |
|---|---|---|---|---|
| P2-01 | Web | No past plans / history screen | Add "Past Plans" section to dashboard or groups | 1 day |
| P2-02 | Web | Proposal editing not possible after creation | Add edit flow for date, options | 1 day |
| P2-03 | Web | No activity photos in voting cards | Populate imageUrl from Foursquare API when available | 1 day |
| P2-04 | Web | Invite card gallery has no search/filter | Add category filter tabs (Formal/Playful/Minimal/Bold) | 3 hrs |
| P2-05 | Web | After Dark: 40+ items with no pagination | Paginate 20 per page or add virtual scroll | 2 hrs |
| P2-06 | Web | Visual vote matrix missing — tally is text only | Add icon grid showing who voted what per option | 4 hrs |
| P2-07 | Web | "Save for later" / wishlist on Discover items | Add heart icon to Discover cards, saved list in profile | 1 day |
| P2-08 | Web/Mobile | Post-match experience has no "message partner" CTA | Add native share/SMS CTA in celebration screen | 2 hrs |
| P2-09 | Web | Landing page has no product screenshot in hero | Add device mockup with real app screenshot | 4 hrs |
| P2-10 | Web | No dark mode | Implement CSS custom property dark theme + system preference | 1 day |
| P2-11 | iOS | All font sizes hardcoded — Dynamic Type not respected | Use `allowFontScaling={true}` + relative sizes | 3 hrs |
| P2-12 | Android | Target SDK 35 edge-to-edge inset handling | Audit all screens for WindowInsets compatibility | 1 day |
| P2-13 | Android | No Extended FAB for "New Plan" primary action on GroupsScreen | Add FAB component | 2 hrs |
| P2-14 | Backend | 8s polling generates 375 DB queries/sec at 1000 users | Implement SSE for real-time proposal updates | 1 week |
| P2-15 | Backend | `/register` and `/signup` are identical duplicated endpoints | Deprecate `/signup`, keep `/register` | 1 hr |
| P2-16 | Backend | No API versioning | Add `/api/v1/` prefix | 2 hrs |
| P2-17 | Web | Heading scale inconsistency (52px on sparse pages) | Cap all page h1s at 32–36px | 1 hr |
| P2-18 | Web | ALL_CAPS form labels | Switch to sentence case | 30 min |
| P2-19 | Web | 6 category dot colors with no system | Reduce to 3 tones from primary palette | 2 hrs |
| P2-20 | Web | Avatar broken images show "?" | Show initials in teal circle as fallback | 1 hr |

---

## P3 — Polish (Post-Launch)

| ID | Platform | Finding |
|---|---|---|
| P3-01 | Web | Keyboard shortcuts for power users (Ctrl+N new plan, etc.) |
| P3-02 | Web | Progressive Web App — service worker, offline shell |
| P3-03 | Web | Landing page social proof (testimonials, ratings) |
| P3-04 | iOS/Android | Liquid Glass / blur materials on iOS, M3 Expressive on Android |
| P3-05 | Web/Mobile | Bucket list / wishlist of saved activities |
| P3-06 | Web/Mobile | Plan history / "Our Story" view |
| P3-07 | Backend | Soft deletes and audit log |
| P3-08 | Backend | Cursor-based pagination for activity feeds |
| P3-09 | Web | Partner activity view (see what partner voted on) |
| P3-10 | All | i18n — EN + ES (already planned, execute pre-submission) |

---

## Implementation Sequence

```
Week 1: P0 blockers (all critical — unblock both stores + security)
Week 2: P1 quick wins (nav entry points, colors, manifest, a11y labels)  
Week 3: P1 deeper (settings profile, token security, test suite)
Week 4: P1 mobile (haptics, touch targets, ripple, safe areas)
Week 5–6: P2 (history, editing, photos, SSE, dark mode)
Week 7–8: P2 polish + P3 starts
Pre-submission: i18n scaffold (EN + ES)
```
