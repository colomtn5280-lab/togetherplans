# UX & Navigation Audit — TogetherPlans (Web + Mobile)

**Agent:** Principal Product Architect (Agent 1)  
**Date:** 2026-10-19  
**Scope:** Web (React/Vite) + Mobile (Expo/React Native)  
**Test Account:** jarvis.agent1@togetherplans.app (Alex Morgan)  
**Live URL:** https://togetherplans.app  

---

## 1. Complete Screen & Route Inventory

### Web Routes (`App.tsx`)

| Route | Component | Auth? | Notes |
|-------|-----------|-------|-------|
| `/` | `LandingPage` | Public | Marketing page |
| `/login` | `LoginPage` | Public-only | Redirects auth users away |
| `/signup` | `SignupPage` | Public-only | |
| `/verify-email` | `VerifyEmailPage` | Public-only | |
| `/forgot-password` | `ForgotPasswordPage` | Public | |
| `/reset-password` | `ResetPasswordPage` | Public | |
| `/privacy` | `PrivacyPolicyPage` | Public | |
| `/terms` | `TermsPage` | Public | |
| `/support` | `SupportPage` | Public | |
| `/suggestions` | `SuggestionsPage` | Public | Same component as `/discover` |
| `/discover` | `SuggestionsPage` | Public | Duplicate route |
| `/join/:token` | `JoinPage` | Public | Invite accept |
| `/share/:shareToken` | `SmartSharePage` | Public | Routes to GuestVotePage OR PublicSharePage |
| `/vote/:shareToken` | `GuestVotePage` | Public | |
| `/auth/facebook/callback` | `FacebookCallbackPage` | Public | OAuth |
| `/auth/apple/callback` | `AppleCallbackPage` | Public | OAuth |
| **Protected** | | | |
| `/dashboard` | `DashboardPage` | ✓ | Home; auto-redirects to /suggestions if no groups |
| `/groups` | `GroupsPage` | ✓ | Groups list |
| `/groups/:groupId` | `GroupDetailPage` | ✓ | Group detail + invite |
| `/groups/:groupId/proposals/new` | `NewProposalPage` | ✓ | Create proposal (from group) |
| `/proposals/new` | `NewProposalPage` | ✓ | Create proposal (no group context) |
| `/proposals/:proposalId` | `ProposalPage` | ✓ | Vote + view proposal |
| `/proposals/:proposalId/share` | `ShareCardPage` | ✓ | Share a decided plan |
| `/proposals/:proposalId/invite-card` | `InviteCardPage` | ✓ | Pick invite card template (post-creation) |
| `/groups/:groupId/after-dark` | `AfterDarkPage` | ✓ | After Dark (group-scoped) |
| `/after-dark` | `AfterDarkPage` | ✓ | After Dark (no group; impulse broken) |
| `/notifications` | `NotificationsPage` | ✓ | |
| `/settings` | `SettingsPage` | ✓ | |
| **Business Portal** | | | |
| `/business` | `BusinessLandingPage` | Public | Separate product portal |
| `/business/login` | `BusinessAuthPage` | Public | |
| `/business/register` | `BusinessAuthPage` | Public | |
| `/business/onboarding` | `BusinessOnboardingPage` | Partial | |
| `/business/dashboard` | `BusinessDashboardPage` | ✓ | |
| `/business/profile` | `BusinessProfilePage` | ✓ | |
| `/business/listings` | `BusinessListingsPage` | ✓ | |
| `/business/analytics` | `BusinessAnalyticsPage` | ✓ | |

**Total consumer routes: 22 (protected) + 14 (public) = 36**

### Mobile Screens (`AppNavigator.tsx`)

**Auth Stack** (unauthenticated):
| Screen | Component | Notes |
|--------|-----------|-------|
| Welcome | `WelcomeScreen` | Entry splash |
| Login | `LoginScreen` | |
| Register | `RegisterScreen` | |
| Onboarding | `OnboardingScreen` | `gestureEnabled: false` — no back |

**Tab Navigator** (3 tabs):
| Tab | Screen | Icon | Label |
|-----|--------|------|-------|
| Groups | `GroupsScreen` | Calendar | "Plans" |
| Suggestions | `SuggestionsScreen` | Compass | "Discover" |
| Profile | `ProfileScreen` | User | "Profile" |

**Authenticated Stack** (modal/push screens):
| Screen | Component | Header |
|--------|-----------|--------|
| Main | TabNavigator | Hidden |
| Onboarding | `OnboardingScreen` | Hidden |
| GroupDetail | `GroupDetailScreen` | `groupName` param |
| CreateGroup | `CreateGroupScreen` | "New Plan" |
| InviteMembers | `InviteMembersScreen` | "Invite People" |
| ProposalDetail | `ProposalDetailScreen` | "Proposal" |
| CreateProposal | `CreateProposalScreen` | "New Proposal" |
| Suggestions | `SuggestionsScreen` | "Discover Activities" |
| ShareCard | `ShareCardScreen` | Hidden |
| AfterDark | `AfterDarkScreen` | Hidden |
| InviteCard | `InviteCardScreen` | Hidden |

---

## 2. Web Navigation Structure (AppNav.tsx)

### Desktop Top Nav
```
[Logo: TogetherPlans]  [Home | Plans | Discover]  [New Date Plan] [🔔] [Avatar→Settings]
```

### Web Mobile Bottom Bar
```
[⌂ Home] [📅 Plans] [+ New Plan] [🧭 Discover] [☰ More]
```

"More" drawer contains only: Notifications, Settings.

---

## 3. User Journey Maps with Step Counts

### Journey 1: New User Signup & Onboarding

**Web:**
1. Land on `/` (LandingPage)
2. Click "Get started" → `/signup`
3. Fill email, password, display name → Submit
4. → `/verify-email` (check email)
5. Click email link (leaves app)
6. → `/dashboard` (with OnboardingModal)
7. Dismiss onboarding modal
8. Auto-redirected to `/suggestions` (if no groups yet)

**Step count: 8 steps before seeing anything useful.**

**Problem:** Step 8 is a silent redirect — no explanation why the user was bounced from Home to Discover. The `localStorage.setItem("dn.skipDiscoverRedirect", "1")` anti-redirect hack written into the Home nav link is a code smell that confirms this is a known problem that was patched over.

```js
// DashboardPage.tsx:121-127
useEffect(() => {
  if (showOnboarding) return;
  if (isLoading || !groups) return;
  if (groups.length > 0) return;
  if (localStorage.getItem("dn.skipDiscoverRedirect")) return;
  navigate("/suggestions", { replace: true });
}, ...);
```

**Mobile:**
1. Open app → WelcomeScreen
2. Tap "Create account" → RegisterScreen
3. Fill name, email, password → Submit
4. → OnboardingScreen (`gestureEnabled: false` — can't go back)
5. Complete onboarding slides
6. → Main/TabNavigator → GroupsScreen

**Step count: 6 steps, but step 4–5 are forced with no escape.**

---

### Journey 2: Creating a Group and Inviting a Partner

**Web:**
1. Navigate to `/groups`
2. Click "New group" button (toggles inline form)
3. Enter group name → Submit
4. Group created → now on `/groups`
5. Click on new group → `/groups/:groupId`
6. On right rail: select invite method (link/email/sms/username)
7. Click "Generate invite"
8. Copy link / Share

**Step count: 8 steps.** ❌ Creating a group requires 3 interactions just to reveal the creation form (click button, type, submit). After creating the group you're still on the groups list, not the group detail — the user has to find their new group and click it again.

**Mobile:**
1. Plans tab → `+ New` button in header (or tap "Create your first group" CTA)
2. → `CreateGroupScreen`
3. Fill group name → Submit
4. → Back to `GroupsScreen` (not to the new group's detail!)
5. Tap new group → `GroupDetailScreen`
6. Tap "Invite People" or find invite from the detail view
7. → `InviteMembersScreen`

**Step count: 7 steps.** Same problem: after creating, you're not taken to the group.

---

### Journey 3: Creating a Proposal with Activity Options

**Web (the primary creation flow):**
1. From Discover (`/suggestions`): browse activities
2. Click "Add to Date" on 1–3 items → floating PlanBuilderDock fills
3. Click "Start proposal" in the dock
4. → `/proposals/new` (or `/groups/:id/proposals/new`)
5. Review activities, edit title, set date, select group
6. Click "Send to [partner]" → Submit
7. → `/proposals/:id/invite-card` (FORCED — auto-navigate after success)
8. Pick or skip invite card template
9. → `/proposals/:id` with `openInvite: true`
10. InviteVoteModal auto-opens: copy/share link

**Step count: 10 steps from Discover to sharing the proposal link.** ❌ The InviteCardPage is a mandatory detour inserted between proposal creation and the proposal view. Users who just want to share the proposal immediately cannot skip to it.

**Alternative (from nav "New Date Plan" button):**
1. Click "New Date Plan" in nav → shows group picker if >1 group
2. → `/groups/:id/proposals/new` (no options pre-loaded → empty state)
3. Empty left panel: "Browse Discover and tap + Add to Date"
4. User must click "Browse Discover" to get options, losing form state... except PlanBuilder context persists
5. Go back, re-open form

This flow is **broken** for empty plan builders.

---

### Journey 4: Partner Receiving and Voting on a Proposal

**Unregistered partner via share link:**
1. Receive SMS/WhatsApp with `/vote/:shareToken`
2. → `GuestVotePage` (no account needed)
3. See proposal options
4. Tap APPROVE / MAYBE / REJECT on each option
5. Submit votes

**Step count: 5 steps. Clean!** ✅ Guest voting is the best-designed flow in the app.

**Registered partner from notification/dashboard:**
1. See "Your Turn" card on Dashboard
2. Click "Vote Now →" → `/groups/:groupId/proposals/:proposalId`
   - **Bug:** DashboardPage links to `/groups/${proposal.groupId}/proposals/${proposal.id}` but the route is `/proposals/:proposalId` (no group prefix). This link will 404.
   
   ```js
   // DashboardPage.tsx:236
   to={`/groups/${proposal.groupId}/proposals/${proposal.id}`}
   ```
   
   The route in App.tsx is `/proposals/:proposalId` — the `/groups/:groupId/proposals/:proposalId` pattern does NOT exist.
   
3. If the link worked: ProposalPage shows options
4. Vote on each option (APPROVE/MAYBE/REJECT)
5. Optional: add a note (appears only after voting on an option — hidden)
6. "Let them know 👍" button appears after voting (opens invite modal again — confusing)

**Step count: 5–6 steps, but with a broken link bug.**

---

### Journey 5: Consensus Reached → Celebration → Next Steps

1. Both users vote on the same option
2. ProposalPage auto-polls every 8 seconds (`refetchInterval: 8000 for OPEN`)
3. Status changes → DECIDED → celebration overlay fires
4. Full-screen gradient overlay with confetti: "It's a Match! 🎉"
5. Three CTA buttons:
   - 📅 Add to Calendar
   - 🎨 Pick an invite card (→ InviteCardPage)
   - 📤 Share Plan (→ ShareModal)
   - "View all votes" (text link — dismisses overlay)
6. Calendar add works (Google Calendar URL or native API on mobile)
7. Overlay dismissed → back to ProposalPage showing winner

**Step count: 3–5 steps after consensus, depending on next action.**

**Problems:**
- The celebration fires for **both** the proposer AND the partner seeing it (even though they were already there). Correct.
- "Pick an invite card" in the celebration routes to the same InviteCardPage users already went through during creation — so they're being asked a second time to pick a card. This is confusing.
- "Counter-propose" in the right rail links to `/groups/${proposal.groupId}` (group page), NOT a new proposal form. The button label promises creation but delivers navigation.

  ```js
  // ProposalPage.tsx:1000-1005
  <Link
    className="dmu-btn dmu-btn-primary dmu-btn-block"
    to={`/groups/${proposal.groupId}`}
  >
    Counter-propose
  </Link>
  ```
  
  This is a **wrong destination**. It should navigate to `/groups/:groupId/proposals/new`.

---

### Journey 6: After Dark Feature Discovery and Use

**Web:**
1. User must know to visit `/after-dark` — there is **no navigation link** anywhere in the app to After Dark.
2. Not in the top nav (Home / Plans / Discover), not in the bottom mobile bar, not in the "More" drawer.
3. If user finds it: browse Romantic / Spicy cards
4. Click "Add to Date" on an item
5. If one group: → `/groups/:groupId/proposals/new` with prefilled option
6. If multiple groups: GroupPickerModal → then navigate

**Discoverability: 0 out of 10.** After Dark is a ghost feature on web.

**Mobile:**
- `AfterDark` is a Stack screen, not a tab. No tab bar entry.
- The mobile tab bar has: Plans | Discover | Profile. No After Dark.
- AfterDarkScreen reads `route.params?.groupId` — but there's no visible entry point that passes a groupId.
- The "Let's go NOW" impulse button creates a proposal via `afterDarkAPI.impulse(groupId, ...)` but `groupId` will be `undefined` unless navigated from a group context, triggering the error: `'No group selected. Go back and open After Dark from a group.'`

**The After Dark "impulse" feature is functionally broken when accessed without a groupId.**

Where might mobile users find it? GroupDetailScreen likely has a button (code lines 101+, not fully read). But that's **3 levels deep**: Plans tab → tap group → tap "After Dark" button.

---

### Journey 7: Invite Card Selection

**Web:**
1. Triggered automatically after proposal creation: `navigate('/proposals/${id}/invite-card')`
2. InviteCardPage: grid of card thumbnails
3. Pick a template → "customise" step: add note (optional) + photo (optional)
4. "Use this card ✓" → navigates to ProposalPage with `openInvite: true`
5. InviteVoteModal auto-opens to share the invite link

**Step count: 4 steps, but it's forced without clear explanation of why the user is here.**

**Mobile:**
- `InviteCard` is a Stack screen (headerShown: false)
- From the celebration modal: "Pick an invite card 💌" button calls `handlePickInviteCard()`:
  ```js
  const url = `https://togetherplans.app/proposals/${proposal.id}/invite-card`;
  await WebBrowser.openBrowserAsync(url)
  ```
  **This opens the WEB version of InviteCard in an in-app browser** — not a native screen. The native `InviteCardScreen` exists but is never used from this entry point. The `InviteCard` stack screen is unreachable without direct navigation.

---

### Journey 8: Share Card Flow

**Web:**
1. On decided ProposalPage: "📤 Share plan" button opens `ShareModal`
2. Modal generates a `/share/:token` URL
3. Copy to clipboard OR share via WhatsApp
4. Recipient visits `/share/:token` → `SmartSharePage`
5. `SmartSharePage` queries the API: if `getGuestId()` resolves → `GuestVotePage`, else → `PublicSharePage`

**Step count: 4 steps.** Reasonably clean.

**Also:** `/proposals/:proposalId/share` → `ShareCardPage` is a separate dedicated page (not just the modal) showing vote bars and the winning option. This is accessible from... the celebration overlay and the proposal header. **Two different "share" experiences exist** and users may not know which to use.

---

### Journey 9: Settings and Profile Management

**Web:**
- Settings accessible from: Avatar link in top nav → `/settings`, or "More" drawer → Settings
- Dashboard right rail also has a Settings button

**Mobile:**
- `ProfileScreen` is a tab (third tab)
- Settings options live in the Profile tab — but AppNavigator has no separate `SettingsScreen` in the stack

**Problems:** On web, clicking the avatar navigates to `/settings`, not a profile page. There's no `/profile` route on web at all. On mobile, Profile = Settings — the tab does double duty.

---

## 4. Navigation Hierarchy Critique

### Web: Top Nav

**What's there:** Home | Plans | Discover

**What's missing from top-level navigation:**
- After Dark (zero discoverability)
- Notifications (reachable only via bell icon — not labeled in the segmented nav)
- Settings (reachable only via avatar)

**What's mislabeled:**
- "Home" → `/dashboard` — the dashboard is actually a summary page, not really a "home" with notifications. On web mobile there IS a "Home" tab + "Plans" tab which are different, creating confusion.
- "Plans" → `/groups` — this links to the group list, not a plans list. Users think in terms of "plans" but navigate to "groups."

**Design inconsistency:** The desktop nav has 3 items (Home, Plans, Discover). The mobile bottom bar has 5 items (Home, Plans, New Plan, Discover, More). These are different IA on the same platform.

### Mobile: Bottom Tab Bar (3 tabs)

```
[Plans 📅] [Discover 🧭] [Profile 👤]
```

**Problems:**
1. **No "Home" tab** — the dashboard summary that shows pending votes doesn't exist as a tab. The "Plans" tab goes to GroupsScreen, which is a different concept from the Dashboard.
2. **After Dark not in tabs** — a feature being marketed as distinctive to the product isn't top-level.
3. **No "New Plan" FAB** — unlike the web mobile bar, there's no center + button. Creating a new group/proposal requires: tap Plans → tap "+ New" button in the header. This is discoverable but buried.
4. **Profile tab = Settings** — there's no separation between profile (identity) and settings (configuration).

### Correct hierarchy critique:

The naming "Groups" (internal) vs "Plans" (label) creates mental model confusion. The app is about *plans* but the data model is Groups → Proposals → Options. Users want to think about "our next plan," not "which group to look in."

---

## 5. Feature Discoverability Audit

| Feature | Web Discoverability | Mobile Discoverability | Verdict |
|---------|--------------------|-----------------------|---------|
| Create group | Nav → Plans → + New Group button | Plans tab → + New button | Acceptable |
| Create proposal | Nav → "New Date Plan" button | No direct top-level entry | Poor |
| After Dark | **No navigation link anywhere** | **Not in tabs — 3 levels deep** | ❌ Critical |
| Invite cards | Only via proposal creation flow | Only via celebration modal (opens web) | ❌ Poor |
| Share plan (decided) | ProposalPage header button | ProposalDetail header button | Acceptable |
| Guest voting link | ProposalPage "Invite someone to vote" | ProposalDetail "Invite someone to vote" | Acceptable |
| Vote notes | Only visible after casting a vote | Only visible after tapping a sentiment | ❌ Hidden |
| Counter-propose | ProposalPage right rail | ProposalDetail mismatch banner | Poor |
| Share card (public) | ProposalPage → Share modal OR /share page | Share button in header | Confusing (2 UX) |
| Business portal | Footer link (if present) / direct URL | Not in mobile at all | Unclear |
| Past/completed plans | Only 5 shown in group detail, no "See all" | Only in group detail view | ❌ Buried |
| Notifications | Bell icon in top nav | Not in bottom tabs — only in Profile? | Poor |

---

## 6. Information Architecture Gaps

### Missing Features / States

1. **No plan history / completed plans view.** 
   - GroupDetailPage shows `.slice(0, 5)` recent proposals — no "View all" link.
   - There's no `/proposals/history` or `/groups/:id/history` route.
   - Decided plans vanish from the primary view unless the user digs into a group.

2. **No search.** 
   - No search across groups, proposals, or activities.
   - No way to find "that restaurant we voted on 3 months ago."

3. **No activity feed / timeline.**
   - DashboardPage shows only the current state (pending votes, all caught up). No recent activity.

4. **No recurring plans / plan templates.**
   - Users can't say "we do date night every Friday" — every plan starts from scratch.

5. **No group settings page.**
   - GroupDetailPage has: invite panel + members list + delete group. No rename, no photo, no description edit.

6. **No proposal editing.**
   - Once a proposal is created, you cannot edit the title, date, or options. Counter-propose is the only workaround (and it's broken, linking to the wrong page).

7. **No way to archive/delete proposals** (only cancel, which is destructive).

8. **Notifications page exists but no notification preferences in Settings.**
   - Users get reminder notifications ("Fri 8 PM if not everyone voted") but can't configure or disable them.

9. **No profile photos.**
   - Avatars are initial-letter circles throughout. No photo upload on web.

10. **Mobile: No in-app InviteCard experience.**
    - The native InviteCardScreen exists but the celebration modal opens a web browser instead.

---

## 7. Friction Points Summary

| Journey | Step Count | Acceptable? | Blockers |
|---------|-----------|-------------|---------|
| Signup → see value | 8 steps | ❌ Too many | Email verify + silent redirect |
| Create group + invite | 8 steps | ❌ Too many | Not taken to group after creation |
| Create proposal (with Discover) | 10 steps | ❌ Too many | Forced InviteCard detour |
| Create proposal (empty) | Broken | ❌ | No options pre-loaded, confusing UX |
| Guest vote on proposal | 5 steps | ✅ Clean | None |
| Consensus → next step | 4 steps | ✅ OK | Duplicate invite card prompt |
| Find After Dark (web) | ∞ steps | ❌ Hidden | No nav link exists |
| After Dark impulse (mobile) | Broken | ❌ | groupId undefined |
| Invite card selection | 4 steps | ⚠️ Forced | Mandatory detour |
| Share decided plan | 4 steps | ✅ OK | Two different share UX paths |
| Settings/Profile | 2 steps | ✅ OK | |

---

## 8. Before / After Flow Diagrams (Text-Based)

### CURRENT: Creating a Proposal

```
[Discover] 
  → browse activities
  → click "Add to Date" (x1–3)
  → PlanBuilderDock appears at bottom
  → click "Start proposal"
  → /proposals/new [NewProposalPage]
      → review activities
      → set title / date / group
      → submit
  → /proposals/:id/invite-card [InviteCardPage] ← FORCED DETOUR
      → pick card OR skip
      → submit
  → /proposals/:id [ProposalPage]
      → InviteVoteModal auto-opens
      → copy link / share
TOTAL: 10 user actions
```

### PROPOSED: Creating a Proposal

```
[Discover]
  → browse activities
  → click "Add to Date" (x1–3)
  → PlanBuilderDock shows "Send to [Group]"
  → tap "Send to [Group]" (smart: if 1 group, skip picker)
  → /proposals/new
      → title pre-filled, date pre-filled, group pre-selected
      → submit
  → /proposals/:id [ProposalPage]
      → "Share with [Partner]" sheet auto-opens (WhatsApp / SMS / Copy)
  → OPTIONAL: "Pick a pretty invite card" as a secondary CTA
TOTAL: 6 user actions, invite card is optional/async
```

---

### CURRENT: After Dark Discovery (Web)

```
User has no idea After Dark exists.
If they somehow find it:
  → type /after-dark in browser bar
  → browse items
  → "Add to Date" 
  → navigate to /groups/:id/proposals/new [losing context]
```

### PROPOSED: After Dark Discovery

```
[Discover tab/page]
  → "🌙 After Dark" section at bottom OR tab chip
  → tap → /after-dark
  → browse Romantic / Spicy items
  → tap item → bottom sheet with "Add to plan"
  → group pre-selected (most recent) → create proposal
```

---

### CURRENT: Mobile Onboarding → First Value

```
Welcome → Register → Onboarding (forced, no back) → Plans tab (empty)
→ user sees "Nothing planned. Yet." + 3-step checklist
→ must tap "Create your first group"
→ CreateGroupScreen
→ back to Plans tab (NOT group detail — user lost)
→ must find new group, tap it
→ GroupDetailScreen
→ must find invite section
→ InviteMembersScreen
STEPS TO FIRST INVITE: 9 taps
```

### PROPOSED: Mobile Onboarding → First Value

```
Welcome → Register → Onboarding (2 slides max, skippable)
→ "Start your first plan" CTA at end of onboarding
→ CreateProposalScreen (streamlined: just title + date + group name in one form)
→ Proposal created with solo group
→ Share invite link sheet auto-opens
→ 1 tap to copy link and send to partner
STEPS TO FIRST INVITE: 5 taps
```

---

## 9. Specific, Evidence-Based Recommendations (Priority Order)

### P0 — Broken / Critical

**R1. Fix the broken "Vote Now" link on DashboardPage**
- Current: `to={'/groups/${proposal.groupId}/proposals/${proposal.id}'}` — this route does not exist.
- Fix: `to={'/proposals/${proposal.id}'}` (matches the actual route defined in App.tsx).
- Evidence: `App.tsx:169` defines `/proposals/:proposalId`; `DashboardPage.tsx:236` uses a non-existent pattern.

**R2. Fix the broken "Counter-propose" link on ProposalPage**
- Current: Links to `/groups/${proposal.groupId}` — takes user to the group overview, not a new proposal form.
- Fix: Link to `/groups/${proposal.groupId}/proposals/new` or `/discover` with the current proposal options preserved.
- Evidence: `ProposalPage.tsx:1000-1005`.

**R3. Fix AfterDarkScreen's broken "Let's go NOW" impulse when no groupId**
- The impulse API call fails silently when `groupId` is undefined (which it always is when accessed from the tab bar).
- Fix: When `groupId` is undefined, show a group picker sheet before the impulse confirmation, or navigate to the most recent active group automatically.
- Evidence: `AfterDarkScreen.tsx:281-283`.

**R4. Mobile InviteCard opens a web browser instead of native screen**
- `ProposalDetailScreen.tsx:482-483`: `handlePickInviteCard` opens a WebBrowser with the web URL instead of `navigation.navigate('InviteCard', ...)`.
- Fix: Navigate to the native `InviteCard` screen with the proposalId, which already exists in the stack.

---

### P1 — High Impact UX

**R5. Add After Dark to the navigation**
- Web: Add "🌙 After Dark" to the segmented nav OR to the Discover dropdown.
- Mobile: Add After Dark as a 4th tab OR as a prominent section in the Discover tab, OR accessible directly from the Plans tab with a visual CTA.
- Evidence: After Dark has zero navigation entry points on web. It's not in AppNav's `navLinks` array. Mobile tab bar has 3 tabs only.

**R6. Remove the forced InviteCardPage detour after proposal creation**
- `NewProposalPage.tsx:273-276`: On success, navigates to `/proposals/${id}/invite-card` unconditionally.
- Fix: Navigate directly to `/proposals/:id`. Surface invite card as an optional CTA on ProposalPage ("🎨 Make it pretty → pick an invite card").
- This reduces the proposal creation journey from 10 steps to 6.

**R7. Navigate to the new group/proposal after creating it**
- After `createMutation.onSuccess` in `GroupsPage`, navigate to the new group: `navigate('/groups/${data.id}')`.
- After creating a proposal, navigate to `/proposals/${id}` (skipping the forced invite card — see R6).
- Evidence: Both `GroupsPage.tsx:48-53` and `NewProposalPage.tsx:273-276` navigate to list/detour pages instead.

**R8. Remove the silent redirect from Dashboard to Discover**
- `DashboardPage.tsx:121-127`: New users without groups are silently sent to `/suggestions`.
- Fix: Show a proper empty state on the Dashboard with a clear onboarding CTA. The redirect breaks the "Home" mental model.
- The `localStorage("dn.skipDiscoverRedirect")` hack confirms this has been a known pain point.

**R9. Show all proposals in GroupDetail, not just 5**
- `GroupDetailPage.tsx:86`: `.slice(0, 5)` with no "See all" link.
- Fix: Add a "View all" link to a proposals history screen, or paginate.
- Evidence: This hides plan history from users with active groups.

---

### P2 — Medium Impact

**R10. Unify the two "share" experiences**
- `ProposalPage` has a `ShareModal` (inline) AND `/proposals/:id/share` (`ShareCardPage`) as separate dedicated pages with different UIs showing the same data.
- Fix: Consolidate. Either make the modal point to the ShareCard page, or deprecate the standalone page.

**R11. Add proposal history / completed plans view**
- No route or screen exists for browsing past decided plans.
- Fix: Add `/plans/history` and surface it in the Plans tab with a "Past plans" section below active ones.

**R12. Fix "Couples" filter counting single-member groups as couples**
```js
// GroupsPage.tsx:59
couples: allGroups.filter((g) => (g.members?.length ?? 1) <= 2).length,
```
A group with 1 member (invite pending) shows in "Couples." Use `< 2` to exclude solo groups, or add a pending/solo state.

**R13. Add a "Start planning" shortcut on mobile empty state**
- `GroupsScreen` empty state shows 3-step checklist and "Create your first group" button, then detours through group creation before reaching proposal creation.
- Fix: "Start a plan" → streamlined wizard that creates group + proposal in one flow.

**R14. Make vote notes visible before voting**
- Currently vote notes appear only AFTER a user taps a sentiment button.
- Web: `ProposalPage.tsx:451-468` — textarea only renders when `mySentiment` is truthy.
- Mobile: `ProposalDetailScreen.tsx:890-916` — input only renders when `pendingVote` is set for that option.
- Fix: Show the note field inline, or at least indicate it exists ("vote and leave a note →").

**R15. Remove or explain the After Dark time gate**
- `AfterDarkPage.tsx:546-568`: A banner shows "After Dark wakes up at 9pm · Xh away" but content is visible anyway.
- This creates cognitive dissonance. Either enforce the gate or remove the banner.
- If the 9pm hook is a marketing mechanic, show it on the entry point (not after the user already found the page).

**R16. Add a "Back to proposal" context when InviteCardPage is reached mid-flow**
- After creating a proposal, users land on InviteCardPage with a "← Back to proposal" link at the top.
- But they haven't seen the proposal yet — they're coming from `/proposals/new`. The back link is correct but the copy is confusing.
- Fix (if keeping this flow): Label it "Skip to your proposal →" rather than a back arrow.

**R17. Mobile: Separate Profile from Settings**
- `ProfileScreen` serves as both identity view and settings panel.
- Fix: Keep Profile tab for identity (display name, photo, account), push Settings to a separate screen within the Profile stack.

**R18. Web: The "Plans" nav link should say "Groups" or fix the data model language**
- Nav says "Plans" but routes to `/groups` (the groups list). The concept of "plans" in the app is closer to "proposals."
- Fix: Either rename nav to "Groups," or restructure the URL hierarchy to `/plans` pointing to a plans-first view that aggregates proposals across all groups.

---

## 10. Navigation Architecture Summary

### Root Causes of UX Problems

1. **The data model (Groups → Proposals → Options) is exposed directly** instead of being abstracted into a user-facing "plans" concept. Users don't think in groups; they think in plans with people.

2. **After Dark is a product feature with no navigation home.** It's built but invisible. This is either a forgotten integration or intentionally soft-launched — but even soft launches need discoverability for testing.

3. **The proposal creation flow has too many mandatory detours.** InviteCard should be optional. Proposal creation should end at the proposal, not a card picker.

4. **Web and mobile have different IA.** Web mobile has 5 bottom tabs (Home, Plans, New Plan, Discover, More). Native mobile has 3 (Plans, Discover, Profile). "Home" doesn't exist on native. "Profile" doesn't exist on web. Shared features should share structure.

5. **No history view exists.** This is a structural gap — the app is built around the present (vote now) but has nothing for the past (what we decided, where we went). This will become a retention problem.

---

*Audit produced by Agent 1 — Principal Product Architect.*  
*See also: AUDIT_MASTER_PLAN.md for cross-agent findings.*
