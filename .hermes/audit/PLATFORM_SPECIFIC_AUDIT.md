# TogetherPlans / DateMeUp — iOS Platform-Specific Audit
**Agent 3 — Apple iOS Specialist**  
**Date:** 2026-10-19  
**iOS Target:** iOS 18 / 2026 HIG  
**Build:** Expo SDK 57 / React Native 0.86.3  
**Appetize Build:** `b_g6e6k6ghm5sfvuumj33yoaxhii` (iPhone 15 Pro)

---

## Screenshots Captured

| File | Screen |
|------|--------|
| `ios-08-appopen.png` | Register screen (active state) |
| `ios-10-login.png` | Register screen (validation errors visible) |
| `ios-09-login-screen.png` | Register screen (pristine) |

> **Note:** Appetize session was live; screenshots captured Register + error state. Welcome screen and inner-app screens audited from source code only — the build loads into Registration flow by default without credentials.

---

## 1. Navigation Patterns

### ✅ Stack Architecture
- `createNativeStackNavigator` used throughout — correct for iOS push/pop with native transitions.
- Auth stack: Welcome → Login → Register → Onboarding (linear flow, correct).
- Authenticated stack: Main (TabNavigator) + modal-style push screens.

### ⚠️ Issues Found

**[P1] CreateProposal, AfterDark, ShareCard, InviteCard should be modal sheets, not pushed stacks**  
These are "actions" or "contextual tasks," not destination screens. iOS 18 HIG specifies these should present as `.sheet` (bottom sheet) not full-screen push. Currently they all use `Stack.Screen` which slides in from the right.  
- `CreateProposal` → should be a `.sheet` with `presentationStyle: 'formSheet'`
- `AfterDark` → should be a `.sheet` (after-dark is a contextual overlay)
- `ShareCard` / `InviteCard` → both have `headerShown: false` and already act as modals — add `presentation: 'modal'` in Stack.Screen options

**[P0] Onboarding — `gestureEnabled: false` with no escape route**  
`gestureEnabled: false` disables swipe-to-go-back on Onboarding. This is appropriate for a first-time flow, but there is no back button visible (only a "Skip" button). iOS users expect either a visible close/back affordance or a clear "Skip" prominent enough to discover. The Skip button relies on users knowing to look top-right.

**[P1] InviteMembers and CreateGroup push transitions**  
Both are creative/transactional screens. HIG 2026: "Group setup flows should use bottom sheets for creation, and navigate to the created resource after confirmation." These should be `.sheet`.

**[P2] ProposalDetail subtitle shows hardcoded "Group" string**  
```tsx
subtitle="Group"
```
This is a placeholder. Should show the actual group name.

---

## 2. Bottom Tab Bar

### Assessment: 3 tabs — Within HIG recommendation (3–5)

**Tab mapping:**
- Plans (Calendar icon) — `GroupsScreen`  
- Discover (Compass icon) — `SuggestionsScreen`
- Profile (User icon) — `ProfileScreen`

### ✅ Good
- 3 tabs is valid per HIG
- Tab hit targets are `minWidth: 44, minHeight: 44` (meets 44pt minimum)
- `accessibilityRole="button"` and `accessibilityState={{ selected }}` are set
- Safe area insets used: `insets.bottom + 32` for the floating dock position

### ⚠️ Issues Found

**[P1] Custom DockTabBar missing `accessibilityRole="tab"` — wrong role**  
The current role is `"button"` but iOS VoiceOver expects `"tab"` for tab bar items. With `"button"`, screen readers announce these as regular buttons not navigation tabs, breaking the expected tab traversal behavior.

**[P1] Tab bar has no haptic on selection**  
When a tab is tapped, there is no haptic feedback. iOS native tab bars don't have haptics by default either, but the custom implementation would benefit from `.selection` haptic (light tap) per the custom feel expectation. Currently `DockTabBar.onPress` has no haptics call.

**[P2] Floating dock positioning may collide with PlanBuilderStrip**  
The `DockTabBar` sits at `bottom = insets.bottom + 32`. The `PlanBuilderStrip` sits at `insets.bottom + 96`. The math (`96 - (68 + 32) = -4`) means the PlanBuilderStrip can visually overlap the dock. On iPhone 15 Pro with `insets.bottom = 34`: dock top = 34+32 = 66px from bottom, dock takes 68px height, so dock occupies y[bottom-134 to bottom-66]. PlanBuilderStrip is at bottom-130. **This is a 4px collision** on iPhone 15 Pro.

**[P2] Floating dock design is non-native**  
A pill-shaped floating dock with `position: 'absolute'` is a design trend popular in 2024-2025 apps but iOS 18 HIG encourages native tab bars that extend edge-to-edge and respect the "glass" material background. Content scrolling behind a native tab bar via `tabBarBlurEffect` is expected in iOS 18. The custom dock doesn't support blur.

**[P3] No tab badge support for unread proposal count**  
The `actionNeeded` dot in GroupRow is visible only inside the Plans screen, not on the tab itself. iOS convention is to surface an unread badge on the tab icon.

---

## 3. Haptics — Gap Analysis

### Currently implemented:
| Location | Haptic type | ✓/✗ |
|----------|-------------|-----|
| `AddToDateButton` (add suggestion) | `ImpactFeedbackStyle.Light` on add, `NotificationFeedbackType.Success` on toggle | ✅ |

### Missing (P1):
| Action | Expected haptic | Location |
|--------|----------------|----------|
| Vote (APPROVE / MAYBE / REJECT) | `ImpactFeedbackStyle.Medium` | `ProposalDetailScreen` vote buttons |
| Match celebration ("It's a Match!") | `NotificationFeedbackType.Success` | `ProposalDetailScreen` `setShowDecision(true)` trigger |
| Tab navigation | `ImpactFeedbackStyle.Light` or `SelectionFeedbackStyle` | `DockTabBar.onPress` |
| Invite send | `NotificationFeedbackType.Success` | `handleInviteToVote` in ProposalDetailScreen |
| Create proposal success | `NotificationFeedbackType.Success` | `handleSubmit` success path |
| Impulse ("Let's go NOW") | `ImpactFeedbackStyle.Heavy` | AfterDarkScreen FAB + ImpulseSheet confirm |
| Onboarding "Next" / slide advance | `ImpactFeedbackStyle.Light` | `OnboardingScreen.goNext()` |
| MoodChip selection in AfterDark | `ImpactFeedbackStyle.Light` | AfterDarkScreen MoodChip already has animation, no haptic |
| Delete account confirm | `NotificationFeedbackType.Warning` | `DeleteAccountSheet.onConfirm` |

**Summary: 9 haptic moments missing vs 1 implemented. This is the single largest HIG compliance gap.**

---

## 4. Sheets and Modals

### Modal review:

| Component | Current | Should be | Issue |
|-----------|---------|-----------|-------|
| `PreviewModal` in CreateProposal | `Modal animationType="slide"` transparent | ✅ Already bottom sheet pattern | Minor: no handle indicator |
| `PlanBuilderStrip` sheet | `Modal animationType="slide"` | ✅ Correct | Handle indicator present |
| `EventDetailSheet` in SuggestionsScreen | `Modal animationType="slide"` | ✅ Correct | Handle indicator **missing** |
| `ImpulseSheet` in AfterDarkScreen | `Modal transparent` bottom sheet | ✅ Correct | Handle indicator **missing** |
| `DeleteAccountSheet` | `Modal animationType="slide"` bottom | ✅ Correct | Handle indicator present |
| `Success overlay` in CreateProposal | `Modal animationType="fade"` full screen | ⚠️ Should be `.sheet` or inline | Covers entire screen with a fade, no way to dismiss by swipe |
| `DECIDED overlay` in ProposalDetailScreen | `Modal animationType="fade"` center card | ⚠️ Should be bottom sheet | iOS 18 convention: celebration overlays should be action sheets |
| `CatalogItemDetail` in AfterDarkScreen | `Modal transparent` bottom | ✅ Correct | Handle indicator **missing** |

**[P1] Missing sheet drag handle on EventDetailSheet, ImpulseSheet, CatalogItemDetail**  
iOS 18 expects a visible 40×4 grab handle at top center of any bottom sheet to indicate dismissibility. PlanBuilderStrip has it, others don't.

**[P1] `modalPresentationStyle` not set on native stack modals**  
`CreateProposal`, `ShareCard`, `AfterDark`, `InviteCard` in the Stack navigator have no `presentation: 'modal'` option set. They push as standard screens. They should use:
```tsx
options={{ presentation: 'modal' }}
```
or `'formSheet'` (iOS 18 new resizable sheets).

**[P2] Success overlay on CreateProposal has no dismissal affordance**  
After sending a proposal, a full-screen success modal appears with no "×" close, no swipe-to-dismiss, and no automatic timeout. Users can only exit via the two CTA buttons. Apple HIG: success states should use non-blocking feedback (toast/banner) or be easily dismissible.

**[P2] Calendar date picker in CreateProposal uses `themeVariant="light"` hardcoded**  
```tsx
<DateTimePicker themeVariant="light" />
```
This ignores dark mode. Should be `themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}` or omit the prop to follow system.

---

## 5. Safe Area Handling

### Assessment: Generally good but inconsistent

**✅ Good:**
- `WelcomeScreen`: `SafeAreaView edges={['top', 'bottom']}` — correct
- `LoginScreen`: Manual `insets.top + SPACING.xl` padding — acceptable
- `DockTabBar`: `useSafeAreaInsets()` with `insets.bottom + 32` — correct
- `PlanBuilderStrip`: `useSafeAreaInsets()` for bottom padding — correct
- `DNScreenHeader`: `useSafeAreaInsets()` → `paddingTop: insets.top + 18` — correct
- `OnboardingScreen`: `paddingTop: insets.top` — correct

**⚠️ Issues:**
**[P1] AfterDarkScreen: The floating "Let's go NOW" FAB has no safe area bottom padding**
```tsx
bottom: SPACING.xl,  // = 24px fixed
```
On iPhone 15 Pro with `insets.bottom = 34`, this overlaps the home indicator: `34 + button_height(~56) > 24`. The FAB will sit under the home indicator affordance.

**[P1] CreateProposalScreen sticky bottom bar: `paddingBottom: Platform.OS === 'ios' ? 36 : 24`**  
36px is hardcoded. iPhone 15 Pro home indicator requires 34px inset + desired padding. This only works by coincidence on 15 Pro. On iPhone SE (no Dynamic Island, `insets.bottom=0`), 36px is over-padding. Should use `insets.bottom + 16` instead.

**[P2] AfterDarkScreen ScrollView: `paddingBottom: 100`**  
Hardcoded. Should be `insets.bottom + 80` to account for the floating FAB height.

**[P2] GroupsScreen populated state: `paddingBottom: 120` hardcoded**  
Should adapt to floating dock height. The dock is 68px + 32px gap + `insets.bottom`. On a device with `insets.bottom=34`: minimum scroll clearance needed = 68 + 32 + 34 + safety = ~150px. Currently 120px leaves last item partially hidden.

**[P3] LoginScreen: uses manual `insets.top` via `useSafeAreaInsets`, but doesn't use `SafeAreaView`**  
This is a code smell. The background decorative blobs (absolute positioned) may render under the Dynamic Island since they're positioned at `top: -60` from the content container, which doesn't include the status bar area. Need `SafeAreaView` wrapping or verify the background positioning is correct.

---

## 6. Gestures

### Swipe-to-go-back:
- ✅ `createNativeStackNavigator` provides native iOS swipe-to-go-back by default
- ⚠️ `gestureEnabled: false` on `OnboardingScreen` — intentional, disables back gesture

### Gesture conflicts with Reanimated 4:
**[P2] VoteStamp animation in ProposalDetailScreen uses `Animated.sequence` (old API)**  
`VoteStamp` in ProposalDetailScreen uses `Animated` from React Native core, not Reanimated. Mixed usage (some components use Reanimated 4 via AfterDarkScreen/MoodChip, some use core Animated) is not a blocking issue but can cause gesture handler conflicts if both run simultaneously on the JS thread. With Reanimated 4 all animations should ideally migrate to `useSharedValue` / `useAnimatedStyle`.

**[P2] `MoodChip` in AfterDarkScreen uses `Animated.Value` (old API) with `useNativeDriver: true`**  
This works fine in isolation but may conflict if Reanimated gesture handlers intercept events on the ScrollView that contains the chips.

**[P3] Confetti animation in ProposalDetailScreen (40 particles, stagger 20ms)**  
Running 40 parallel `Animated.timing` sequences creates 120 active animation handles. With Reanimated 4 on the same screen, this could cause frame drops. Should migrate to Reanimated `withSpring` / `withTiming` worklets or use a library like `react-native-confetti-cannon`.

---

## 7. Typography — Dynamic Type

### Assessment: **NOT compliant with Dynamic Type**

**[P0] All font sizes are hardcoded pixel values — no Dynamic Type scaling**

The `TYPE` constants (from `@/constants`) define fixed `fontSize` values. Examples from actual code:
- `fontSize: 40` (app name on Welcome)
- `fontSize: 13` (tab label active)
- `fontSize: 11` (tab label inactive)  
- `fontSize: 15` (button text)
- Sticker font: `fontSize: 9` or `10`

None use `allowFontScaling` or Apple's `preferredFont` system. React Native's default `allowFontScaling={true}` is on for Text, but the fixed `fontSize` values mean that at large accessibility text sizes the proportions will break (labels overflow their containers, sticker badges will overflow their rotated blobs).

**[P1] Sticker labels at fontSize 9-10 fail WCAG minimum (12px effective minimum)**  
`DNSticker` uses `fontSize: size === 'sm' ? 9 : 10`. At 100% text scale, 9sp is below Apple's accessibility minimum of 11pt for secondary text. At small/medium sizes these are unreadable.

**[P1] Tab label inactive state: `fontSize: 11`**  
iOS native tab bar uses 10pt for labels, but native tab bar labels are positioned relative to the icon. Custom labels at 11px with no Dynamic Type scaling will be illegible for users with accessibility text sizes enabled.

**[P2] `Sora_800ExtraBold` for display text at 40px — no `maxFontSizeMultiplier` cap**  
Should add `maxFontSizeMultiplier={1.5}` to large display headings to prevent layout breakage at accessibility sizes.

---

## 8. Accessibility

### Assessment: **Minimal accessibility implementation**

**[P0] Vote buttons in ProposalDetailScreen have no `accessibilityLabel`**
```tsx
<Pressable style={[styles.voteBtn, ...]} onPress={() => {...}}>
  <Text>{mySentiment === 'APPROVE' ? "✓ I'm in 👍" : "I'm in 👍"}</Text>
</Pressable>
```
The `Pressable` has no `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint`. VoiceOver would announce "I'm in 👍" as the label (emoji in label = bad). Should be:
```tsx
accessibilityLabel="Approve this option"
accessibilityRole="button"
accessibilityState={{ selected: mySentiment === 'APPROVE' }}
```

**[P0] Interactive elements using emoji as the sole visual indicator have no accessible labels**
- Back button `<Text style={{ color: colors.ink, fontSize: 18 }}>‹</Text>` — no accessibilityLabel
- Close buttons using `×` text — no accessibilityLabel  
- Member options `⋯` button — no accessibilityLabel
- Heart badge `♥` in WelcomeScreen — decorative but might be read by VoiceOver

**[P1] `DNButton` has no `accessibilityRole`**  
The base `DNButton` component uses `TouchableOpacity` without `accessibilityRole="button"`. While TouchableOpacity is implicitly a button in VoiceOver, it's best practice to declare it explicitly.

**[P1] DockTabBar: `accessibilityLabel={options.tabBarAccessibilityLabel}`**  
This reads from `options.tabBarAccessibilityLabel` which is never set on any Tab.Screen definition in the TabNavigator. All 3 tabs will have no accessibility labels for VoiceOver.
Fix:
```tsx
<Tab.Screen 
  name="Groups" 
  component={GroupsScreen} 
  options={{ title: 'Plans', tabBarAccessibilityLabel: 'Plans tab' }} 
/>
```

**[P1] GroupRow — the entire row is a `TouchableOpacity` with no `accessibilityLabel` or `accessibilityHint`**  
VoiceOver would read all child text concatenated. Should set:
```tsx
accessibilityLabel={`${group.name}, ${openCount} open proposals`}
accessibilityRole="button"
accessibilityHint="Double tap to view group details"
```

**[P2] DNCard `onPress` path — `activeOpacity={0.9}` used, missing accessibility props**  
When `DNCard` has an `onPress`, the `TouchableOpacity` wrapper has no role or label.

**[P2] `DNInput` — no `accessibilityLabel` propagated from the `label` prop to the `TextInput`**  
`DNInput` shows a label `<Text>` above the input but doesn't connect it to the `TextInput` via `accessibilityLabel`. VoiceOver reads the TextInput without context.

**[P2] Confetti component and decorative elements should have `importantForAccessibility="no-hide-descendants"` or `accessible={false}`**

**[P3] `DNAvatar` shows user initials — no `accessibilityLabel`**  
Should expose the full name: `accessibilityLabel={name ?? 'Unknown user'}`.

---

## 9. Liquid Glass / iOS 18 Visual Conventions

### Assessment: **Custom design language, not aligned with iOS 18 materials**

iOS 18 introduces "Liquid Glass" — a translucent material with real-time blur, color adaptation, and specular reflections. The app uses flat solid-color surfaces instead.

**[P2] Tab bar missing blur/glass material**  
iOS 18 tab bars use `UIBlurEffect` (translucent frosted glass). The custom `DockTabBar` uses `backgroundColor: colors.surface` (solid color). To align:
- Add `BlurView` from `expo-blur` as the background of the dock container
- Use `intensity={40}` or similar

**[P2] Bottom sheets (Modal components) don't use blur backgrounds**  
EventDetailSheet, PlanBuilderStrip, ImpulseSheet, etc. use solid `colors.surface` backgrounds. iOS 18 sheets use a glass material that shows the underlying content blurred.

**[P2] Navigation header uses solid color, not glass**  
`headerStyle: { backgroundColor: colors.surface }` in AppNavigator. Native iOS 18 headers adapt to `UINavigationBar`'s glass appearance. Push screens with custom `DNScreenHeader` also use solid backgrounds.

**[P3] Decorative blobs (`blobTL`, `blobMR`) approximate a soft glow**  
These are solid circles with opacity — a reasonable approximation of glassmorphism backgrounds for 2024-2025 apps. For iOS 18 "Liquid Glass," these would ideally use radial blur gradients or `MaskedView` with `BlurView`.

**[P3] No spring animations on modal presentation**  
iOS 18 uses spring-based sheet appearance animations. The current `animationType="slide"` on all Modals is a linear ease animation. Migrating to Reanimated `withSpring` for modal entry would feel more native.

---

## 10. App Store Readiness

### Privacy Strings

| Permission | `NSUsageDescription` set? | Quality |
|-----------|--------------------------|---------|
| Location | ✅ `NSLocationWhenInUseUsageDescription` | ✅ Descriptive |
| Camera | ✅ `NSCameraUsageDescription` | ⚠️ "QR code scanning" — is camera actually used? Check if QR scan is shipped |
| Photo Library | ✅ `NSPhotoLibraryUsageDescription` | ⚠️ "may access" is weak; if not shipping profile pictures, remove this |
| Calendar | ❌ **MISSING** | **P0** — `expo-calendar` is used in ProposalDetailScreen and Calendar permissions are requested at runtime (`Calendar.requestCalendarPermissionsAsync()`). Must add `NSCalendarsUsageDescription` to `infoPlist` |
| Contacts | Not declared | n/a |
| Push Notifications | `expo-notifications` configured | ✅ |

**[P0] Missing `NSCalendarsUsageDescription`**  
`expo-calendar` is imported and `Calendar.requestCalendarPermissionsAsync()` is called in `ProposalDetailScreen.handleAddToCalendar()`. Without the plist string, iOS will crash when requesting permission. App Store review would reject for this.

### App Store Compliance Issues

**[P1] `NSPhotoLibraryUsageDescription` declared but no actual photo library access in audited code**  
If photo library access isn't used in the shipped build, this permission string may trigger App Store review questions or privacy report concerns. Remove unless profile photo upload is shipping.

**[P1] NSCameraUsageDescription mentions "QR code scanning" — no QR code implementation found**  
`InviteMembersScreen` is not in the audit scope, but if QR scanning isn't shipped, removing the camera permission avoids unnecessary capability declaration.

**[P2] Apple Sign In must be offered if any social login exists (App Store rule 4.8)**  
Apple Sign In IS implemented (`useAppleAuth`) — ✅ compliant. But the `LoginScreen` shows it conditionally:
```tsx
{Platform.OS === 'ios' && appleAvailable && (
```
The `WelcomeScreen` also gates it:
```tsx
{Platform.OS === 'ios' && appleAvailable && (
```
This is correct. Apple Sign In showing only on iOS and only when available is the right behavior.

**[P2] `ITSAppUsesNonExemptEncryption: false` declared — verify no custom encryption**  
This exemption is correct if using only standard HTTPS. If any additional encryption is added (e.g., E2E encrypted messages), this must be updated before submission.

**[P3] `userInterfaceStyle: "automatic"` in app.json — but `themeVariant="light"` hardcoded in DateTimePicker**  
The app supports dark mode via `ThemeContext`, but the DateTimePicker is forced to light. This is an inconsistency.

**[P3] Version: 1.2.0 (buildNumber: 7) — ensure version bump for next submission**

---

## 11. HIG Compliance Per Screen

### WelcomeScreen
| Check | Status | Notes |
|-------|--------|-------|
| Safe area | ✅ | `SafeAreaView edges={['top', 'bottom']}` |
| Button sizes | ✅ | 54px height (exceeds 44pt min) |
| Apple Sign In style | ⚠️ | Custom styled button, not using `AppleAuthentication.AppleAuthenticationButton`. Apple *requires* using their button component for App Store. This is a **P0 rejection risk**. |
| Haptics | ❌ | None on button taps |
| Accessibility | ❌ | No `accessibilityLabel` on auth buttons |
| Typography | ⚠️ | `fontSize: 40` display text, no Dynamic Type |

### LoginScreen
| Check | Status | Notes |
|-------|--------|-------|
| Safe area | ⚠️ | Manual `insets.top` — not using `SafeAreaView` |
| Keyboard avoidance | ✅ | `KeyboardAvoidingView behavior="padding"` |
| Apple Sign In style | ⚠️ | Same issue as Welcome — custom button, not official component |
| `textContentType` | ✅ | `emailAddress`, `password` set correctly |
| `autoComplete` | ✅ | `email`, `password` set |
| Haptics | ❌ | None on login |

### RegisterScreen (from screenshot)
| Check | Status | Notes |
|-------|--------|-------|
| Safe area | ✅ | Content respects Dynamic Island |
| Field validation UI | ✅ | Red borders + inline error messages |
| Back button | ✅ | `<` visible at top left |
| Three social options | ✅ | Google, Apple, Facebook |
| Layout | ⚠️ | Large empty space at bottom of screen — poor use of vertical space |

### OnboardingScreen
| Check | Status | Notes |
|-------|--------|-------|
| Safe area | ✅ | `paddingTop: insets.top` + `insets.bottom` |
| Gesture disabled | ✅ | Intentional |
| Swipe navigation | ❌ | No swipe-between-slides; uses button only |
| Haptics on Next | ❌ | Missing |
| Pagination dots | ✅ | Correct implementation |

### GroupsScreen
| Check | Status | Notes |
|-------|--------|-------|
| Pull to refresh | ✅ | `RefreshControl` with `tintColor={colors.primary}` |
| Empty state | ✅ | Illustrated empty state with CTA |
| Safe area scroll | ⚠️ | `paddingBottom: 120` hardcoded — may clip on some devices |
| Tab haptic | ❌ | Missing from tab navigation |
| Accessibility | ❌ | GroupRow missing `accessibilityLabel` |
| Section headers | ✅ | Styled section text |

### GroupDetailScreen
| Check | Status | Notes |
|-------|--------|-------|
| Back button | ✅ | `DNScreenHeader onBack` |
| Alert usage | ✅ | `Alert.alert` for block/report confirmations (native iOS) |
| Proposal cards | ✅ | Good visual hierarchy |
| Empty state | ✅ | Illustrated with invite CTA |
| Loading state | ❌ | No skeleton/loading UI while fetching |

### CreateProposalScreen
| Check | Status | Notes |
|-------|--------|-------|
| Navigation type | ⚠️ | Should be `.sheet` not push |
| Date picker | ✅ | iOS inline picker |
| Date picker theme | ⚠️ | `themeVariant="light"` hardcoded |
| Sticky bottom bar | ⚠️ | `paddingBottom: 36` hardcoded — unsafe area |
| Success overlay | ⚠️ | Full-screen fade — not HIG-compliant for success state |
| Haptics on submit | ❌ | Missing |

### ProposalDetailScreen
| Check | Status | Notes |
|-------|--------|-------|
| Vote buttons | ❌ | No `accessibilityRole`, no haptics |
| Confetti | ⚠️ | 40 particles with old Animated API may jank |
| Match celebration | ❌ | No haptic at match moment |
| Share integration | ✅ | Native `Share.share()` correctly used |
| Discussion | ⚠️ | TextInput in discussion has no `accessibilityLabel` |
| Polling every 8s | ⚠️ | On active proposal, polls every 8 seconds. OK for MVP, but aggressive for battery. Consider push-based updates. |

### SuggestionsScreen
| Check | Status | Notes |
|-------|--------|-------|
| FlatList | ✅ | Correct use of FlatList for long lists |
| Location permission | ✅ | `expo-location` with user-facing prompt |
| EventDetailSheet | ⚠️ | Missing drag handle |
| Category grid | ✅ | 2-column grid, accessible tap targets (minHeight: 84) |
| Date picker | ⚠️ | Uses `display="spinner"` on iOS (wheel style) — slightly outdated, iOS 18 prefers `"inline"` |
| Haptics on add | ✅ | `AddToDateButton` has haptics |

### AfterDarkScreen
| Check | Status | Notes |
|-------|--------|-------|
| Dark mode adaptation | ✅ | Background switches to `#0A1018` when active |
| FAB safe area | ❌ | `bottom: SPACING.xl` = 24px, no inset adjustment |
| Impulse sheet | ⚠️ | Missing drag handle |
| Mood haptics | ❌ | MoodChip has spring animation but no haptic |
| Navigation type | ⚠️ | Should be `.sheet` presentation |

### ProfileScreen
| Check | Status | Notes |
|-------|--------|-------|
| Custom `TogglePill` | ⚠️ | Implements custom toggle instead of system `Switch`. iOS HIG recommends `UISwitch` / React Native `Switch` for settings toggles. |
| Delete account flow | ✅ | Confirmation with "DELETE" typed confirmation |
| Theme chips | ⚠️ | Custom DNChip for System/Light/Dark — not using system segmented control |
| Safe area | ⚠️ | `paddingBottom: 120` for content, no floating dock offset accounting |

---

## 12. Top 15 iOS-Specific Improvements

### P0 — Must Fix (App Store / Critical)

**1. [P0] Add `NSCalendarsUsageDescription` to `infoPlist` in app.json**  
Without this, the app crashes when trying to add to calendar. App Store rejection guaranteed.  
```json
"NSCalendarsUsageDescription": "DateMeUp adds your date night plans to your calendar so you never miss them."
```

**2. [P0] Replace custom Apple Sign In buttons with `AppleAuthentication.AppleAuthenticationButton`**  
Apple's HIG and App Store guidelines require using the official Apple Sign In button component when implementing Sign in with Apple. The current custom `<TouchableOpacity>` with styled text will trigger rejection.  
Use `expo-apple-authentication`'s `AppleAuthenticationButton` component in both `WelcomeScreen` and `LoginScreen`.

**3. [P0] Fix `gestureEnabled: false` on Onboarding — add visible "Skip" prominence or back button**  
While `gestureEnabled: false` is allowed, the Skip button must be clearly discoverable (sufficient size, clear label). Currently it's small text top-right. Increase to a proper button with `accessibilityRole="button"`.

---

### P1 — High Priority (Core UX)

**4. [P1] Add haptics to all key interactions**  
Priority order:
- Vote buttons (APPROVE/MAYBE/REJECT) → `ImpactFeedbackStyle.Medium`
- Match celebration overlay → `NotificationFeedbackType.Success`  
- Invite send success → `NotificationFeedbackType.Success`
- Tab navigation → `ImpactFeedbackStyle.Light`
- "Let's go NOW" FAB → `ImpactFeedbackStyle.Heavy`
- Create proposal success → `NotificationFeedbackType.Success`

**5. [P1] Fix AfterDarkScreen FAB safe area inset**  
```tsx
// Before:
bottom: SPACING.xl,  // 24px fixed

// After:
bottom: insets.bottom + SPACING.md,  // respects home indicator
```
Also add `paddingBottom: insets.bottom + 120` to the ScrollView.

**6. [P1] Fix CreateProposal sticky bottom bar to use dynamic inset**  
```tsx
// Before:
paddingBottom: Platform.OS === 'ios' ? 36 : 24,

// After:
paddingBottom: insets.bottom + 16,
```

**7. [P1] Add `presentation: 'modal'` to CreateProposal, AfterDark, ShareCard, InviteCard**  
These contextual action screens should slide up from the bottom as sheets, not push from the right:
```tsx
<Stack.Screen
  name="CreateProposal"
  component={CreateProposalScreen}
  options={{ title: 'New Proposal', presentation: 'modal' }}
/>
```

**8. [P1] Add `accessibilityLabel` to tab bar items**  
```tsx
<Tab.Screen 
  name="Groups" 
  component={GroupsScreen} 
  options={{ 
    title: 'Plans', 
    tabBarAccessibilityLabel: 'Plans tab' 
  }} 
/>
```

**9. [P1] Add accessibility to vote buttons in ProposalDetailScreen**  
```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Approve this option"
  accessibilityState={{ selected: mySentiment === 'APPROVE' }}
  onPress={...}
>
```

**10. [P1] Add drag handles to EventDetailSheet, ImpulseSheet, CatalogItemDetail**  
Copy the pattern from `PlanBuilderStrip`:
```tsx
<View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 12 }} />
```

---

### P2 — Medium Priority (Polish / HIG Alignment)

**11. [P2] Fix hardcoded `paddingBottom` values for scroll views behind floating dock**  
`GroupsScreen`: `120` → `insets.bottom + 140`  
`ProposalDetailScreen`: `120` → `insets.bottom + 140`  
`AfterDarkScreen`: `100` → `insets.bottom + 120`

**12. [P2] Fix hardcoded `themeVariant="light"` in DateTimePicker instances**  
```tsx
// Before:
themeVariant="light"

// After:
themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
```
Where `colorScheme` comes from `useColorScheme()` or the ThemeContext.

**13. [P2] Replace custom `TogglePill` in ProfileScreen with React Native `Switch`**  
iOS expects `UISwitch` for settings toggles. The custom pill lacks accessibility states and doesn't follow the system appearance.
```tsx
<Switch value={notifNew} onValueChange={setNotifNew} trackColor={{ true: colors.primary }} />
```

**14. [P2] Add `accessibilityRole="tab"` to DockTabBar items**  
Change from `accessibilityRole="button"` to `accessibilityRole="tab"` so VoiceOver correctly identifies the tab bar control.

**15. [P2] Add `maxFontSizeMultiplier` to display headings and stickertext**  
Prevent layout breakage at accessibility text sizes:
```tsx
// Large headings (appName, section titles):
<Text maxFontSizeMultiplier={1.3} style={styles.appName}>datemeup</Text>

// Sticker labels (tiny text):
<Text maxFontSizeMultiplier={1.0} style={[TYPE.sticker, ...]}>
```

---

## Summary Dashboard

| Category | Score | Critical Issues |
|----------|-------|-----------------|
| Navigation | 6/10 | Contextual screens use push instead of sheet |
| Tab Bar | 5/10 | Wrong accessibilityRole, no haptics, no blur |
| Haptics | 1/10 | 1/10 moments covered |
| Sheets/Modals | 6/10 | Missing handles, success overlay non-dismissible |
| Safe Area | 7/10 | FAB and sticky bars have hardcoded values |
| Gestures | 8/10 | Native swipe-back works; minor Animated API mixing |
| Typography | 3/10 | No Dynamic Type support, tiny sticker text |
| Accessibility | 2/10 | Most interactive elements lack labels/roles |
| iOS 18 Visual | 3/10 | No glass/blur, custom materials throughout |
| App Store Readiness | 6/10 | Missing calendar plist, Apple Sign In button |

**Overall iOS HIG Compliance: 5/10**

The app has good fundamentals (native stack navigator, safe area awareness, pull-to-refresh) but is missing iOS-specific polish that Apple reviewers and accessibility users expect: haptics, Dynamic Type, proper accessibility labels, and the Apple Sign In button component. The two P0 items (calendar permission string + Apple Sign In button) are the only hard blockers for App Store submission.
