# Mobile QA Report — DateNight Expo React Native App
**Reviewed:** All 13 screens, AppNavigator, api.ts, types/index.ts, ThemeContext, ui.tsx, and all hooks  
**Date:** 2026-09-20  
**Severity key:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low/Polish

---

## Executive Summary

The app has a solid design system and navigation skeleton, but several screens still use **hardcoded mock data instead of real API calls**, two critical pieces of functionality are **completely broken** (Sign Out, Email/SMS invites), and a number of UX dead-ends exist where buttons appear interactive but do nothing. The most urgent issues are the mock-data screens (GroupDetailScreen, GroupsScreen urgent card), the broken Sign Out, and the missing API calls for proposals.

---

## 1. AppNavigator (`src/navigation/AppNavigator.tsx`)

### 🟠 `Suggestions` route registered in both Tab and Stack navigators
`SuggestionsScreen` is registered as a Tab.Screen under `Groups` and also as a Stack.Screen in the authenticated stack. Navigating from `CreateProposalScreen` via `navigation.navigate('Suggestions', { groupId })` will push a stack screen on top of the tab, potentially creating duplicate back buttons and unexpected UX. The stack screen's title is "Discover Activities" while the tab label is "Discover" — inconsistent.

**Fix:** Remove `Suggestions` from the Stack navigator (it's already accessible via the tab) or make the stack route distinct (e.g., `SuggestionsModal`).

### 🟡 Onboarding-after-login race condition
`hasOnboarded` state is `null` while being fetched from AsyncStorage. The guard `user && hasOnboarded === null` shows a spinner. If `user` is set (from prior session) and AsyncStorage is slow, the user sees a loading screen. This is fine in practice but worth noting.

### 🟡 No fallback screen if authenticated + `hasOnboarded === false` + `Main` is somehow unreachable
If a user who has onboarded navigates directly to `/Onboarding` (e.g., via deep link), there's no guard — the Onboarding screen will render over Main.

### 🟢 `AuthenticatedHooks` rendered outside NavigationContainer scope issue
`AuthenticatedHooks` is placed inside the `NavigationContainer` JSX but after the `Stack.Navigator`. `useDeepLink` and `usePushToken` are called here. No navigation calls are made in these hooks (they use Alert/API only), so this is safe — but if a future hook calls `useNavigation()`, it would need to be inside a navigator.

---

## 2. `api.ts` (`src/services/api.ts`)

### 🔴 No 401 interceptor — expired tokens silently break the app
There is a request interceptor that attaches the token, but **no response interceptor** to handle `401 Unauthorized`. When a JWT expires, every API call silently fails. The user stays logged in with a broken app instead of being redirected to Login.

```ts
// Missing — add to api.ts:
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
      // Trigger logout — needs a ref to the auth context
    }
    return Promise.reject(error);
  }
);
```

### 🟠 No network error handling / offline detection
Every screen catches errors silently (empty `catch {}` blocks). A user with no internet sees empty states or stale data with no explanation. There's no global error boundary or network-status toast.

### 🟡 `proposalsAPI.suggestions` lives in the wrong namespace
`proposalsAPI.suggestions(lat, lng, category)` calls `GET /api/suggestions` — this is not a proposals endpoint. Should be its own `suggestionsAPI` namespace for clarity.

### 🟡 No request cancellation
Long-running fetches (SuggestionsScreen, GroupDetailScreen) are not cancelled on unmount. If a user navigates away mid-fetch, the `setState` calls will fire on an unmounted component. In newer React Native this is harmless but noisy; consider `AbortController`.

### 🟢 `err: any` used in `CreateGroupScreen`
`catch (err: any)` bypasses TypeScript's unknown-error handling. Use `err: unknown` with a type guard.

---

## 3. `types/index.ts`

### 🟡 `Group` type missing `groupType` field
The `groupsAPI.create()` call accepts `groupType` and the backend returns it, but the `Group` interface doesn't declare this field. GroupDetailScreen and GroupsScreen can't display group type (Couple/Friends/Family) without a type error or cast.

```ts
// Add to Group interface:
groupType?: 'COUPLE' | 'FRIENDS' | 'FAMILY';
```

### 🟡 `ActivityOption.votes` only has `userId` — no `optionId`
`votes?: { userId: string }[]` — the nested vote shape doesn't include `optionId`, which is fine since votes are nested per-option. But `Vote` (the flat version) does have `optionId`. This dual-shape is already commented but creates confusing conditional logic in `ProposalDetailScreen`.

### 🟡 `Proposal.status` union type too permissive
The union `'OPEN' | 'DECIDED' | 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED'` mixes old and new backend statuses. Code downstream switches on this — a clear canonical mapping or a deprecation of legacy values would reduce bugs.

### 🟢 `RootStackParamList.Main` allows `{ groupId?: string } | undefined`
This works but is awkward — `undefined` is the expected non-grouped case. A cleaner type would be `{ groupId?: string }` (always an object, field optional), since `navigation.navigate('Main', undefined)` and `navigation.navigate('Main', { groupId })` both need to work.

---

## 4. `ThemeContext` (`src/contexts/ThemeContext.tsx`)

### 🟡 Theme override not persisted across sessions
`const [override, setOverride] = useState<ThemeOverride>('system')` — the user's appearance choice (light/dark/system) is reset to `'system'` on every app restart. `ProfileScreen` lets users set this, but it's lost immediately. Needs `AsyncStorage` persistence.

### 🟢 `ThemeContext` created with `{} as ThemeCtx` default
If `useTheme()` is called outside a `ThemeProvider`, it returns an empty object and crashes at runtime. The default context value should `throw` to make this obvious:
```ts
const ThemeContext = createContext<ThemeCtx | null>(null);
// useTheme:
if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
```

---

## 5. `components/ui.tsx`

### 🟡 `DNInput` has fixed `height: 52` — breaks `multiline`
When `DNInput` is used with `multiline={true}` and `numberOfLines={4}` (in `CreateGroupScreen`), the fixed `height: 52` collapses the input. The `CreateGroupScreen` workaround (`style={{ minHeight: 100 } as any}`) fights against the component's own style. The fix: don't apply a fixed height when `multiline` is true.

```tsx
// In DNInput:
<TextInput
  style={{
    height: props.multiline ? undefined : 52,
    minHeight: props.multiline ? 52 : undefined,
    ...
  }}
  {...props}
/>
```

### 🟡 `DNButton` susceptible to double-submission
There's a race between tap and the `loading` state being set. On slow devices, two taps in quick succession before the first async call returns can double-submit. Fix: wrap with a ref-based debounce or set `loading` synchronously before the async call.

### 🟡 `DNScreenHeader` — `stickerLabel` and `rightElement` both use `marginLeft: 'auto'`
If both props are passed simultaneously, they'll both try to push to the right and overlap. The component doesn't guard against this. In practice this rarely occurs, but it should be documented or guarded.

### 🟡 `DNButton` renders `SHADOWS.card` even on `secondary` variant
`secondary` is a bordered transparent button — `SHADOWS.card` gives it a shadow that looks odd on a transparent button. Consider removing shadow from `secondary` variant.

### 🟡 `DNAvatar` splits on space for initials — fails for single-word display names
`name.split(' ').map((w) => w[0]).join('').slice(0, 2)` — if `displayName` is a single word (e.g., "Jordan"), the avatar shows only "J" instead of "JO". Minor but visually inconsistent.

### 🟢 `DNSkeleton` uses `width: width as any`
The `as any` cast is a smell. `ViewStyle['width']` accepts `number | string`, so just use `width` directly — it's already the correct type from the prop definition.

### 🟢 Back button uses `‹` (single guillemet character) not an icon
The back button in `DNScreenHeader` renders `<Text>‹</Text>`. Font rendering of this character varies by platform. Use a proper icon (e.g., `ChevronLeft` from `lucide-react-native` as used in the dock) for consistency.

---

## 6. `LoginScreen`

### 🟡 No `textContentType` or `autoComplete` on password field
`secureTextEntry` is set but `textContentType="password"` (iOS) and `autoComplete="password"` (Android) are missing. Password managers won't auto-fill correctly.

### 🟡 Google sign-in button not disabled visually when `!request`
The button has `disabled={!request}` but no visual feedback (no opacity change). The user can see the button but nothing happens when they tap it before Google auth loads.

### 🟢 Email validation is only done client-side in RegisterScreen; LoginScreen accepts any string
This is fine (server validates) but means a user can submit garbage email and get a confusing server error.

### 🟢 No "Forgot password?" link
---

## 7. `RegisterScreen`

### 🟡 Email validation too permissive — only checks for `@`
`!email.includes('@')` rejects `foo@` as valid. Should use a proper regex or at minimum check for a domain part.

### 🟡 No `textContentType="newPassword"` on password field
Same as LoginScreen — password manager hints are missing.

### 🟢 Pressing "Log in" when already on Register navigates Login — no back gesture guard
`navigation.navigate('Login')` from the footer link doesn't guard against being already on Login (if nested stacks). In practice fine, but could be `navigation.goBack()` since Login is always below Register.

---

## 8. `OnboardingScreen`

### 🟡 `slideAnim` is created but `Animated.timing` only resets to 0 — slide transition is not animated
`goNext()` calls `Animated.timing(slideAnim, { toValue: 0, duration: 0, ... })` — an instant reset, not a slide. The `slideAnim` value is never used in any `Animated.View` style. The slides are just state-switched `if/else` blocks with no animation. This is a UX gap.

### 🟡 Skip on slide 2 (group creation) doesn't warn about losing group type/name input
If the user fills in a group name then taps Skip, everything is discarded silently. A confirmation would be better UX.

### 🟡 `handleFinish` catches API error, marks onboarded, and navigates away — error message `setGroupError` is set but then `navigation.replace` is called immediately
The error is set and then immediately replaced by navigation, so the user never sees it.

### 🟢 Group name max length not enforced in UI

---

## 9. `GroupsScreen` — 🔴 Critical: Mock data in production path

### 🔴 `MOCK_URGENT` is always shown — hardcoded fake proposal
```ts
const MOCK_URGENT = {
  id: 'p1',
  title: 'Friday night dinner 🍜',
  date: 'Fri 23 May · 7 pm',
  memberCount: 2,
  groupId: 'g1',
};
const [hasUrgent] = useState(true); // mock
```
The "Needs your vote" banner with a pulsing card is **always shown** to every user, using hardcoded `proposalId: 'p1'`. Tapping "Vote now ♥" navigates to `ProposalDetail` with `proposalId: 'p1'` which will 404 in production.

**Fix:** Fetch real open proposals across all groups and pick the most urgent one. Remove `MOCK_URGENT` entirely.

### 🟠 `openCount` and `decidedCount` are hardcoded in every GroupRow
```ts
const openCount = 1; // placeholder
const decidedCount = 0; // placeholder
```
Every group card shows "1 open · 0 decided" regardless of reality. The API has `groupsAPI.proposals(id)` to fetch real counts.

### 🟠 `actionNeeded` is always `true` for every group
`<GroupRow actionNeeded>` — every group shows a "needs attention" dot. This is meaningless.

### 🟡 Avatar shows `m.userId` (a UUID) as the display name
```tsx
<DNAvatar name={m.userId} size={42} ... />
```
The `GroupMember` type doesn't include `displayName` — only `userId`. The avatar initials will be a UUID fragment. `Group.members` needs to include user display names from the API, or a separate lookup is needed.

### 🟡 Load failure is completely silent — no error state, no retry button
```ts
} catch {
  // silently fail — show empty state
}
```
Network errors look identical to "no groups yet" — the user sees the empty state and may try to create a duplicate group.

---

## 10. `GroupDetailScreen` — 🔴 Critical: All proposals are mock data

### 🔴 `MOCK_ACTIVE` and `MOCK_PAST` always shown — no real proposal API call
This is the single most critical bug in the app. When a group has members (non-empty state), the screen **always** renders `MOCK_ACTIVE` and `MOCK_PAST`:
```ts
{MOCK_ACTIVE.map((p, i) => (...))}
{MOCK_PAST.map((p) => (...))}
```
`groupsAPI.proposals(groupId)` is **never called**. Real proposals never display.

**Fix:** Add a `proposals` state, call `groupsAPI.proposals(groupId)` in `loadGroup` or a separate effect, and render real proposals.

### 🔴 Navigating to ProposalDetail from mock data uses hardcoded IDs
```tsx
onPress={() => navigation.navigate('ProposalDetail', { proposalId: p.id })}
```
`p.id` is `'p1'` or `'p2'` — these will 404 in production.

### 🟠 `group!` non-null assertion in EmptyGroupState can crash
```tsx
<EmptyGroupState group={group!} onShare={handleShare} />
```
If `group` is null (API failed or loading not done), this crashes at runtime. `isEmpty` is `!loading && otherMembers.length === 0`, which is true when `group` is null — so this can be reached.

### 🟠 `handleShare` creates an invitation then navigates to InviteMembers — InviteMembers also creates an invitation on mount
Two LINK invitations are created for every share action from GroupDetail. The first (created in `handleShare`) is thrown away as its URL is never captured.

### 🟡 `EmptyGroupState`'s "First proposal" button is a no-op
```tsx
<DNButton label="+ First proposal" onPress={() => {}} variant="tonal" ... />
```
This button does nothing. Should navigate to `CreateProposal`.

### 🟡 Load error shows empty group state (no members) incorrectly
If the API fails, `group` is null, `members` is `[]`, `isEmpty` is true, and `EmptyGroupState` renders — even for groups that have members. Users see "Invite someone" for their 5-member group.

### 🟡 `PastProposalRow` typed to `typeof MOCK_PAST[number]` — not `Proposal`
The `PastProposalRow` component accepts a mock-specific type with `counteredBy`. When real proposals are wired, this type needs to change.

---

## 11. `CreateGroupScreen`

### 🟠 Fallback to `groupId: 'new'` if API response missing ID
```ts
navigation.replace('GroupDetail', {
  groupId: newGroup?.id ?? 'new',
  groupName: newGroup?.name ?? name.trim(),
});
```
If `newGroup?.id` is undefined (unexpected API shape), the user navigates to GroupDetail with `groupId: 'new'`, causing every API call there to fail.

### 🟡 `useRef` imported but never used (leftover)
```ts
import React, { useRef, useState } from 'react';
```
`useRef` is imported but not used. Minor — lint should catch this.

### 🟡 Description `multiline` input broken by DNInput fixed height
As noted in ui.tsx section — the description field uses `style={{ minHeight: 100 } as any}` as a workaround for the fixed height in DNInput. The `as any` is a code smell.

### 🟢 No max length on group name field

---

## 12. `InviteMembersScreen`

### 🔴 Email and SMS invite send buttons are no-ops — API calls commented out
```ts
// await invitationsAPI.create(groupId, 'EMAIL', email);
// await invitationsAPI.create(groupId, 'SMS', phone);
```
Both EMAIL and SMS invite methods show a "Send" button, the spinner spins, and then nothing happens. No invitation is created, no feedback is given to the user.

### 🟠 `groupName` never loaded from API — always shows 'your group'
```ts
const [groupName, setGroupName] = useState('your group');
```
The header reads "Invite to your group" and the QR modal reads "Scan to join your group" for every group. The `groupId` is available — a `groupsAPI.get(groupId)` call could populate this.

### 🟠 Username search is completely unimplemented
The USERNAME method renders a search input but `searchResults` is always `[]`. No API call for user search exists in `api.ts`.

### 🟡 Invitation is created on screen mount unconditionally
```ts
useEffect(() => {
  invitationsAPI.create(groupId, 'LINK')
}, [groupId]);
```
Every time the user opens the Invite screen (even if they just tap it and go back), a new LINK invitation is created in the database. Invitations should be created on demand (when the user switches to LINK tab or taps "Copy").

### 🟡 QR modal close button is at hardcoded `top: 60`
On devices with dynamic islands or unusual notches, the close button may be hidden behind system UI. Should use `useSafeAreaInsets().top`.

### 🟡 `pendingInvites` never populated
```ts
const [pendingInvites] = useState<Invitation[]>([]);
```
The pending invitations section is never shown. No API call to list existing invitations.

### 🟢 `Clipboard` imported from `react-native` — deprecated
```ts
import { Clipboard } from 'react-native';
```
`Clipboard` was removed from React Native core in 0.73+. Should use `expo-clipboard` (`import * as Clipboard from 'expo-clipboard'`).

---

## 13. `ProposalDetailScreen`

### 🟠 "Counter-propose" button is a no-op
```tsx
<DNButton label="Counter-propose" variant="ink" onPress={() => {}} .../>
```
The mismatch banner (when partners vote differently) shows a counter-propose option but it does nothing. `proposalsAPI.counter()` exists in api.ts and is never called.

### 🟠 "Add to calendar" in the DECIDED overlay does nothing
```tsx
<DNButton label="Add to calendar" variant="primary" onPress={dismissDecision} .../>
```
Pressing "Add to calendar" just dismisses the overlay. There's no calendar integration. At minimum, the button label should say "Done" or the feature should be implemented using `expo-calendar`.

### 🟠 `partnerName` hardcoded to `'Partner'`
```ts
const partnerName = 'Partner'; // Would come from group members in real app
```
Every "Partner voted · waiting on you" banner, and the sticker "Partner ♥" always says "Partner". For groups with more than 2 members, "Partner" is semantically wrong.

### 🟡 "You both said yes" copy is wrong for groups with >2 members
The DECIDED overlay says "You both said yes to" — "both" implies 2 people. For a group of 5, this is incorrect.

### 🟡 `option.imageUrl` ignored — always shows StripedPlaceholder
`ActivityOption.imageUrl` exists in the type but the image slot always renders `StripedPlaceholder`. Even the placeholder says "Yelp photo" — this leaked copy should be removed if images aren't implemented.

### 🟡 `useNavigation<any>()` loses type safety
Should be `useNavigation<NativeStackNavigationProp<RootStackParamList>>()`.

### 🟡 `partnerVotedOptionId` logic uses `allVoterIds.has(v.userId)` which is always true
```ts
if (o.votes && o.votes.some((v) => v.userId !== user.id && allVoterIds.has(v.userId))) {
```
`allVoterIds` was built from `o.votes` — every userId in `o.votes` is in `allVoterIds` by definition. The `allVoterIds.has(v.userId)` check is redundant and doesn't filter non-voters.

### 🟡 `seenDecision` state set but never used in the UI
`const [seenDecision, setSeenDecision] = useState(false)` — `seenDecision` is set after dismissing the modal but the value is never read to change any UI element. Dead code.

### 🟢 `StatusBar` color not adjusted for light/dark overlay — Modal is `transparent` but StatusBar may clash

---

## 14. `CreateProposalScreen`

### 🔴 Date/time picker is completely non-functional
```tsx
<TouchableOpacity onPress={() => {
  // On a real device, you'd open a native date picker here.
  // Using a basic increment for demo purposes.
}}>
```
The date row is tappable but the `onPress` handler is an empty comment. The time row is a plain `View` — not even touchable. Users cannot change the date or time. All proposals are created for "tomorrow at 7 PM".

### 🟠 All options get hardcoded `category: 'Local Experience'`
```ts
.map((o) => ({
  name: o.name.trim(),
  category: 'Local Experience', // HARDCODED
  description: '',
  address: o.address.trim() || '',
}))
```
The `OptionRow` interface has a `category` field, and the option rows display category/address metadata, but the entered category is discarded when submitting. Every option lands in the backend as "Local Experience".

### 🟠 Submission errors are swallowed — user gets no feedback on failure
```ts
} catch (e) {
  console.warn('Failed to create proposal', e);
}
```
If the API rejects the proposal (validation error, auth failure, etc.), the user sees nothing. The submit button stops loading and the screen stays open with no explanation.

### 🟡 `navigation.goBack()` on success instead of navigating to the new proposal
After creating a proposal, the user is sent back to GroupDetail which still shows mock data. The UX should navigate to the newly created proposal's detail page.

### 🟡 Options can be deleted down to 0 — then the minimum-3 validation triggers on submit
The user can delete all 3 default options and add only 2, then see an error on submit. The "Delete" button should be disabled when `options.length <= 1` (or enforce minimum during deletion).

### 🟡 "Delete" icon is `⋯` (ellipsis) — visually misleading
`⋯` typically implies "more options" not "delete". Use `✕` or a trash icon.

### 🟡 `useNavigation<any>()` — same type-safety issue as ProposalDetailScreen

### 🟡 "From Discover" navigates to Suggestions with `groupId` but Suggestions doesn't return selections back
```ts
navigation.navigate('Suggestions', { groupId });
```
The flow navigates away to Suggestions screen. When the user taps "+ Add to proposal" there, it only updates `addedIds` locally in SuggestionsScreen — there's no callback or state-sharing mechanism to actually populate the CreateProposal options. The integration is incomplete.

---

## 15. `SuggestionsScreen`

### 🔴 "+ Add to proposal" doesn't add to any proposal — local state only
```ts
const handleAdd = (s: Suggestion) => {
  const key = s.name + (s.address ?? '');
  setAddedIds((prev) => new Set(prev).add(key));
};
```
Tapping "+ Add to proposal" only marks the card as "added" visually. No API call is made, nothing is returned to CreateProposalScreen. The feature is a UI illusion.

### 🟠 Pagination is broken — stale `page` captured in `fetchSuggestions` closure
`fetchSuggestions` depends on `page` in its dependency array (`useCallback(..., [page])`). Every time `page` changes, a new `fetchSuggestions` is created. `handleFilterChange` and `requestLocation` capture different stale versions. The practical result: `handleLoadMore` may request the wrong page slice.

Additionally:
```ts
setHasMore(data.length > (reset ? 1 : page + 1) * PAGE_SIZE);
```
When `reset=true`, this checks `data.length > 1 * PAGE_SIZE` (i.e., > 10), which is correct. But `page` here is stale from closure — on a load-more call, `page` may not reflect the current page. Should use a functional approach or a ref.

### 🟠 "Set a home area" is a no-op
```tsx
onSetHomeArea={() => {}}
```
The EmptyState shows this button prominently but it does nothing.

### 🟡 `addedIds` key is `name + address` — collision-prone
Two different venues named "Bar" with no address get the same key and both appear "added" when only one is tapped.

### 🟡 `useNavigation<any>()` — type safety issue

### 🟡 Rating sticker is hardcoded to `★ 4.5`
```tsx
<DNSticker label="★ 4.5" ... />
```
Every suggestion shows "★ 4.5" regardless of actual rating data. This is deceptive if shown to users.

### 🟡 `proposalName` hardcoded in SuggestionCard
```tsx
proposalName="proposal"
```
The "✓ In proposal" chip always says "In proposal" not the actual proposal title.

### 🟡 `requestLocation` is called on mount — no explanation shown before permission dialog
On first launch, the location permission dialog fires immediately without any contextual explanation. A pre-permission explanation screen would reduce denial rates.

### 🟢 Empty `deps` on `useEffect(() => { requestLocation(); }, [])` suppressed with lint comment
The lint disable is intentional but `requestLocation` updates when `activeFilter` or `fetchSuggestions` change. This means if `activeFilter` is set before mount-location-request finishes, the filter is ignored on the first fetch. Minor.

---

## 16. `ProfileScreen`

### 🔴 Sign Out is completely broken — `signOut` is undefined
```ts
const { user, signOut } = useAuth() as any;
```
`useAuth()` returns `{ user, token, isLoading, login, register, logout, loginWithToken }` — it does **not** return `signOut`. The `as any` cast silences the TypeScript error. Both places where `signOut` is called:
```ts
if (signOut) signOut();
```
`signOut` is always `undefined` — the condition is always false. **The Sign Out button does absolutely nothing.**

**Fix:** Use `logout` from `useAuth()`:
```ts
const { user, logout } = useAuth();
// ...
onPress={logout}
```

### 🔴 Delete account doesn't clear auth state — user stays logged in after deletion
```ts
await authAPI.deleteAccount();
setShowDeleteSheet(false);
if (signOut) signOut(); // signOut is undefined — never called
```
After the DELETE `/api/auth/me` succeeds, the token is NOT cleared and the user is NOT logged out. They stay on ProfileScreen with a deleted account, and subsequent API calls will get 401s.

**Fix:** Call `logout()` after `authAPI.deleteAccount()`.

### 🟠 Notification toggle states are not persisted — no API calls
The three notification toggles (`notifNew`, `notifVotes`, `notifReminders`) are local state only. They reset to their default values on every app launch. No API call to save or load notification preferences.

### 🟠 "Home area" setting is a no-op
```ts
onPress={() => {}}
```
`subtitle="Not set"` is always shown. No navigation to a location picker.

### 🟡 "12 plans decided" sticker is hardcoded
```tsx
<DNSticker label="12 plans decided" ... />
```
This is a fake stats sticker. Every user sees "12 plans decided" regardless of their actual usage.

### 🟡 Avatar edit badge (✏️) is decorative only — no upload functionality
Tapping the avatar or the edit badge does nothing.

### 🟡 Theme override not persisted (see ThemeContext section)

---

## 17. `ShareCardScreen`

### 🟠 `require('react-native')` inside event handler — anti-pattern
```ts
onPress={() => {
  const { Linking } = require('react-native');
  Linking.openURL(winner.ticketUrl!).catch(() => {});
}}
```
`require()` inside a component callback is a CommonJS-style dynamic import in a module system that should be static. This works but is non-idiomatic and bypasses tree-shaking. Import `Linking` at the top of the file.

### 🟡 `shareCardsAPI.generate()` is always called — even for already-generated cards
The screen always calls `generate` (POST) instead of trying `get` first. If the card was already generated, this creates a duplicate. Should try `get` first and fall back to `generate`.

### 🟡 No safe-area padding on sticky bottom button
The sticky `Animated.View` at `bottom: 0` uses `paddingBottom: SPACING.lg + 8` = 32px. On phones with a home indicator (iPhone X+), the standard inset is 34pt — the button may overlap the system indicator.

### 🟡 `emoji` is unused variable
```ts
const emoji = winner ? (CATEGORY_EMOJI[winner.category] ?? '📅') : '📅';
```
Wait — `emoji` IS used on line 259. False alarm. But `const { Linking } = require(...)` is still an issue.

### 🟢 useFadeSlide's `useEffect` missing `opacity` and `translateY` deps
```ts
useEffect(() => {
  Animated.parallel([...]).start();
}, []); // opacity and translateY are refs, so this is safe but lint will warn
```
These are `useRef` values so they're stable — empty deps is technically correct but triggers exhaustive-deps lint. Add a `// eslint-disable-line` comment or restructure.

---

## 18. `AfterDarkScreen`

### 🟠 `useEffect` missing dependencies — React Hook rule violation
```ts
useEffect(() => {
  if (status?.active) {
    loadSuggestions(selectedMood);
  }
}, [status?.active]); // missing: loadSuggestions, selectedMood
```
`loadSuggestions` and `selectedMood` are used inside but not in the deps array. This means the effect captures stale values. ESLint's `react-hooks/exhaustive-deps` rule would flag this.

### 🟠 "Active until 3 AM" is hardcoded
```tsx
<Text>Active until 3 AM · Late-night mode</Text>
```
Should use `status.activeHours.end` to compute the end time dynamically.

### 🟡 `groupId` from route params is optional — `ImpulseSheet` shows an error if missing
If the user navigates to AfterDark from a route that doesn't pass `groupId`, the impulse sheet shows "No group selected" error. The "Let's go NOW" FAB and per-card "Let's go here" buttons are available and seem functional, then fail at confirmation. Either require `groupId` in the route type, or hide impulse buttons when `groupId` is undefined.

### 🟡 `loadSuggestions` doesn't pass location coordinates
```ts
const res = await afterDarkAPI.suggestions({ mood: mood ?? undefined });
```
No lat/lng is sent. After-dark suggestions are location-unaware on the mobile side (though the API may use stored user location).

### 🟡 `useNavigation<any>()` in both `AfterDarkScreen` and `ImpulseSheet`

### 🟡 `AfterDarkScreen` uses hardcoded dark background `'#0A1018'` when active
This bypasses the theme system. In the (unlikely) event someone uses a custom theme, the hardcoded dark color won't match.

### 🟡 `ImpulseSheet` conditionally returns `null` — breaks React Hook rules
```ts
function ImpulseSheet(...) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  if (!item) return null; // Early return after hooks
```
Returning `null` after hooks is allowed in React — this is fine as long as hooks are called before the early return. ✅ Actually this is correct. No issue.

---

## 19. Hooks

### `useGoogleAuth`

#### 🟠 `alert()` instead of app-styled error
```ts
.catch(() => alert('Google sign-in failed'))
```
Uses the native `alert()` function, inconsistent with the rest of the app which uses styled inline error states.

#### 🟡 `loginWithToken` missing from `useEffect` deps
```ts
useEffect(() => {
  // uses loginWithToken
}, [response]); // missing loginWithToken
```
React will warn about this. `loginWithToken` is stable (from context) so it's safe, but the deps array should be complete.

#### 🟡 Google Client IDs hardcoded in source
The OAuth client IDs are in the source file. While they're not strictly "secrets" (they're public identifiers), they're better placed in `app.config.js` or environment variables for configurability.

### `useAppleAuth`

#### 🟡 Apple `isAvailable` is hardcoded to `Platform.OS === 'ios'`
`expo-apple-authentication` provides `AppleAuthentication.isAvailableAsync()` which checks the OS version too (Apple Sign In requires iOS 13+). Should use the async check.

### `useDeepLink`

#### 🟡 Cold-start deep link handler uses stale `handleUrl` (user=null)
The second `useEffect(() => { Linking.getInitialURL()... }, [])` runs once on mount. At mount, `user` may already be set (if token was loaded from storage). But `handleUrl` with stale `user=null` would show the "Please log in" alert to an already logged-in user. The comment acknowledges this but doesn't fix it.

#### 🟢 No UI feedback after `invitationsAPI.accept()` succeeds — only an `Alert`
After accepting an invite, `Alert.alert('Success', 'You joined the group!')` is shown but the user isn't navigated to the new group. They need to manually go to GroupsScreen and find it.

### `usePushToken`

#### 🟡 Push token re-registration check uses the token value as the "registered" flag
```ts
await SecureStore.setItemAsync(PUSH_TOKEN_REGISTERED_KEY, tokenData.data);
```
The stored value is the push token string. The check is `if (alreadyRegistered) return`. If the push token rotates (which Expo tokens can), the old token remains registered on the backend and the new one is never registered. Should store a boolean flag separately and implement token rotation logic.

#### 🟡 No handling for the case where push token registration fails on the backend
`await api.post('/api/auth/me/push-token', ...)` can fail, but the outer `catch` in `usePushToken` swallows all errors silently.

---

## 20. Cross-cutting Issues

### 🟠 `GroupMember` has no `displayName` — avatars show UUIDs everywhere
`GroupMember` only has `userId`. `GroupsScreen` and `GroupDetailScreen` render `<DNAvatar name={m.userId} />`, which generates initials from a UUID like "3f". The Group/Member API needs to return user display names in the member list, or a separate `/api/users/batch` endpoint needs to be called.

### 🟡 No empty state error differentiation — network error looks like "no data"
Every screen's catch block falls through to the empty state. A user with no internet thinks they have no groups/proposals.

### 🟡 Accessibility: `accessibilityRole` missing on most touchable elements
Only the DockTabBar buttons have `accessibilityRole="button"`. Other `TouchableOpacity` elements (cards, method chips, social buttons) lack `accessibilityLabel` and `accessibilityRole`. Screen readers will announce "button" generically or not at all.

### 🟡 `FlatList` used in only one place (SuggestionsScreen) — others use `ScrollView` with `.map()`
ProposalDetailScreen maps options in a ScrollView; GroupsScreen maps groups in a ScrollView. For large lists, FlatList is more performant. Low priority for current data sizes.

### 🟡 All `paddingBottom: 120` values are magic numbers
The bottom padding (to clear the floating dock) is `120` everywhere. This value should be derived from the dock height constant (`DOCK_H = 68`) plus bottom safe area inset plus margin, not hardcoded.

### 🟢 No `ErrorBoundary` component
A React ErrorBoundary wrapping the main navigator would prevent a crash in one screen from killing the whole app.

### 🟢 TypeScript `as any` casts in several places
- `ProfileScreen`: `useAuth() as any`  
- `CreateProposalScreen`: `style={{ minHeight: 100 } as any}`  
- `DNSkeleton`: `width as any`  
Each suppresses a type error that should be fixed properly.

---

## Priority Fix List

| # | File | Issue | Severity |
|---|------|-------|----------|
| 1 | `ProfileScreen` | `signOut` undefined — Sign Out broken | 🔴 |
| 2 | `ProfileScreen` | Token not cleared after delete account | 🔴 |
| 3 | `GroupDetailScreen` | All proposals from MOCK — never calls API | 🔴 |
| 4 | `GroupsScreen` | MOCK_URGENT always shown — fake urgent card | 🔴 |
| 5 | `InviteMembersScreen` | EMAIL/SMS send is commented-out no-op | 🔴 |
| 6 | `CreateProposalScreen` | Date/time picker does nothing | 🔴 |
| 7 | `api.ts` | No 401 interceptor — expired tokens silently break app | 🔴 |
| 8 | `GroupsScreen` | openCount/decidedCount hardcoded; actionNeeded always true | 🟠 |
| 9 | `GroupDetailScreen` | `group!` crash when group null; EmptyGroup shows on API error | 🟠 |
| 10 | `GroupDetailScreen` | handleShare + InviteMembers mount both create invitations | 🟠 |
| 11 | `InviteMembersScreen` | groupName never fetched; username search unimplemented | 🟠 |
| 12 | `InviteMembersScreen` | Invitation created on every screen mount | 🟠 |
| 13 | `CreateProposalScreen` | category hardcoded to 'Local Experience' | 🟠 |
| 14 | `CreateProposalScreen` | Errors swallowed; no user feedback on submit failure | 🟠 |
| 15 | `SuggestionsScreen` | "+ Add to proposal" is visual-only — no API/callback | 🔴 |
| 16 | `SuggestionsScreen` | Pagination broken — stale `page` in closure | 🟠 |
| 17 | `ProfileScreen` | Notification toggles not persisted | 🟠 |
| 18 | `AfterDarkScreen` | Missing hook deps — stale closure bug | 🟠 |
| 19 | `ThemeContext` | Theme override not persisted across sessions | 🟡 |
| 20 | `types/index.ts` | `Group` missing `groupType` field | 🟡 |
| 21 | `ProposalDetailScreen` | Counter-propose is no-op | 🟠 |
| 22 | `ProposalDetailScreen` | "Add to calendar" is no-op | 🟠 |
| 23 | `DNInput` | Fixed height breaks multiline | 🟡 |
| 24 | `useGoogleAuth` | `alert()` used for errors | 🟠 |
| 25 | `InviteMembersScreen` | `Clipboard` from react-native is deprecated | 🟢 |
| 26 | `ShareCardScreen` | `require()` inside event handler | 🟡 |
| 27 | All nav screens | `useNavigation<any>()` — type safety lost | 🟡 |
| 28 | All screens | GroupMember has no displayName — avatars show UUIDs | 🟠 |
| 29 | `AppNavigator` | Suggestions registered in both Tab and Stack | 🟠 |
| 30 | `usePushToken` | Push token rotation not handled | 🟡 |
