# DateNight / TogetherPlans — Figma Component Map

> This document maps every screen and shared UI pattern in the app to what should exist in the Figma file.  
> Use it as the source of truth for what Jake needs to design.

---

## Navigation Architecture

```
Auth Stack
├── LoginScreen
└── RegisterScreen

Main Tab Navigator
├── Tab: Plans          → GroupsScreen
├── Tab: Discover       → SuggestionsScreen
└── Tab: Profile        → ProfileScreen

Modal/Stack Screens (pushed from Plans tab)
├── GroupDetailScreen   ← from GroupsScreen
├── CreateGroupScreen   ← from GroupsScreen header button
├── InviteMembersScreen ← from GroupDetailScreen
├── CreateProposalScreen← from GroupDetailScreen
└── ProposalDetailScreen← from GroupDetailScreen
```

---

## Screens

---

### 1. LoginScreen

**Route:** `Login`  
**Navigation:** Auth root → pushes `Register` | replaced by `Main` on success

**What it shows:**
- App logo (🗓️ emoji at 64px)
- Brand title "DateNight" (primary pink, 36px bold)
- Subtitle "Plan together, decide together"
- Email text input
- Password text input (secure entry)
- "Sign In" primary CTA button
- "Continue with Google" OAuth button
- "Don't have an account? **Sign up**" link

**Key Figma frames to produce:**
1. **Default state** — fields empty
2. **Filled state** — inputs populated
3. **Loading state** — Sign In button shows spinner

**Layout:** `KeyboardAvoidingView` → `ScrollView`, vertically centered, `padding: 32`

---

### 2. RegisterScreen

**Route:** `Register`  
**Navigation:** Pushed from Login → replaced by `Main` on success

**What it shows:**
- Title "Create Account" (28px bold)
- Subtitle "Join DateNight and start planning"
- Display name input
- Email input
- Password input (8+ chars hint)
- Confirm password input
- "Create Account" primary CTA button
- "Continue with Google" OAuth button
- Legal disclaimer with "Terms of Service" and "Privacy Policy" links (primary pink)

**Key Figma frames:**
1. **Default state**
2. **Filled state**
3. **Loading state**
4. **Error state** (native Alert — no custom component)

---

### 3. GroupsScreen (Tab: Plans)

**Route:** `Main → Groups tab`  
**Navigation:** Taps card → `GroupDetail` | Header "+ New" → `CreateGroup`

**What it shows:**
- Header row: "Your Plans" title (28px) + "+ New" pill button (primary)
- Empty state: 📅 emoji, "No plans yet" heading, description text, "Create First Plan" CTA
- List state: `FlatList` of Group Cards with pull-to-refresh

**Group Card:**
- Name (18px semibold)
- Optional description (14px secondary)
- Created date (12px secondary)
- Background: surface `#F8F8F8`, border, radius 12, padding 16

**Key Figma frames:**
1. **Empty state**
2. **List with 2–4 group cards**
3. **Card component** (standalone)

---

### 4. GroupDetailScreen

**Route:** `GroupDetail`  
**Params:** `groupId`, `groupName` (shown in nav header)  
**Navigation:** "+ Proposal" → `CreateProposal` | "Invite" → `InviteMembers` | Proposal card → `ProposalDetail`

**What it shows:**
- Group description (if present)
- Action row: "**+ Proposal**" (primary) + "**Invite**" (secondary outline) buttons side-by-side
- "Proposals" section heading
- `FlatList` of Proposal Cards
- Empty state if no proposals

**Proposal Card:**
- Header row: title (16px semibold, flex:1) + Status Badge
- Optional description (14px, 2-line clamp)
- Meta: "`N options · date`"

**Status Badge variants:** ACTIVE (pink), ACCEPTED (green), REJECTED (red), COUNTERED (orange)

**Key Figma frames:**
1. **With description + proposals list**
2. **Empty proposals state**
3. **Proposal card — each status variant** (4 cards)

---

### 5. CreateGroupScreen

**Route:** `CreateGroup`  
**Navigation:** Replaces with `GroupDetail` on success

**What it shows:**
- "Plan Name *" label + text input
- "Description (optional)" label + multiline input (height 100)
- "Create Plan" primary button

**Key Figma frames:**
1. **Default/empty**
2. **Filled**
3. **Loading**

---

### 6. InviteMembersScreen

**Route:** `InviteMembers`  
**Params:** `groupId`  
**Navigation:** Shares system sheet or shows Alert on success

**What it shows:**
- "Invite Method" section heading
- 5-button method selector grid (wrapping row): 🔗 Link, 📧 Email, 💬 SMS, 📱 QR, 👤 Username
- Conditional target input (for Email, SMS, Username methods)
- Conditional info callout box (for Link and QR methods) — amber bg
- "Send Invitation" primary button

**Method button states:** default (surface + border) / active (primary fill, white text)

**Key Figma frames:**
1. **Link method selected** (default) — shows info callout
2. **Email method selected** — shows email input
3. **SMS method selected** — shows phone input
4. **QR method selected** — shows info callout
5. **Username method selected** — shows username input
6. **Loading state**

---

### 7. ProposalDetailScreen

**Route:** `ProposalDetail`  
**Params:** `proposalId`  
**Navigation:** No onward nav; back to GroupDetail

**What it shows:**
- Proposal title (24px bold)
- Optional description
- Optional scheduled date (📅 prefix)
- Consensus banner (green, shown when group agrees)
- "Activity Options" section heading
- List of Option Cards (tap to vote when ACTIVE and unvoted)

**Option Card states:**
- **Default** — surface bg, 2px border (border color)
- **My vote** — 2px primary border; shows "✓ Your vote" badge (pink)
- **Winner** — 2px success border, `#F1F8E9` bg; shows "🏆 Winner" badge (green)
- **With vote bar** — horizontal progress bar (primary 25% fill) + vote count text
- **Loading vote** — ActivityIndicator
- **Tap to vote hint** — right-aligned pink text

**Option Card content:**
- Title (16px semibold)
- Optional description
- Location (📍 prefix, 13px secondary)
- Estimated cost (💰 prefix)
- Estimated duration (⏱ prefix)
- Vote bar + count (if consensus data present)

**Key Figma frames:**
1. **Proposal with all options — pre-vote (ACTIVE)**
2. **Proposal — voted state (user has voted)**
3. **Proposal — consensus reached (winner highlighted)**
4. **Option card — default variant**
5. **Option card — voted variant**
6. **Option card — winner variant**

---

### 8. CreateProposalScreen

**Route:** `CreateProposal`  
**Params:** `groupId`  
**Navigation:** Replaces with `ProposalDetail` on success

**What it shows:**
- "Proposal Title *" label + text input
- "Description (optional)" label + multiline input
- "Date / Time (optional)" label + text input
- "Create Proposal" primary button
- Divider
- "Need ideas?" heading + "Load suggestions" link (right-aligned, primary)
- Grid of Suggestion Tap-Cards (tapping fills title/description)

**Suggestion Tap-Card:**
- Title (15px semibold)
- Meta: "category · duration · cost" (13px secondary)
- Background: surface, border, radius 10

**Key Figma frames:**
1. **Empty form**
2. **Filled form + suggestions loaded** (2–4 suggestion cards)

---

### 9. SuggestionsScreen (Tab: Discover)

**Route:** `Main → Discover tab`  
**Navigation:** No onward navigation

**What it shows:**
- Header: "Discover" (28px bold) + search input
- Horizontal scrollable category pill bar: All, Dining, Entertainment, Outdoors, Arts, Nightlife, Relaxation
- 2-column `FlatList` grid of Activity Cards
- Empty state if no results

**Activity Card (2-col grid):**
- Category label (11px, `700`, primary, UPPERCASE)
- Title (15px semibold)
- Description (13px secondary, 2-line clamp)
- Footer row: duration (left, 12px secondary) + cost (right, 12px success green)

**Key Figma frames:**
1. **With categories + grid of 6 cards**
2. **Filtered by category (active pill)**
3. **Search active**
4. **Empty state**
5. **Activity card component**

---

### 10. ProfileScreen (Tab: Profile)

**Route:** `Main → Profile tab`  
**Navigation:** Opens URLs via `Linking.openURL`; logout returns to Login

**What it shows:**
- Avatar circle (80×80, primary pink, initial letter at 32px)
- Display name (22px bold)
- Email (15px secondary)
- "Legal" section: Privacy Policy → Terms of Service (list rows with arrow ›)
- "Support" section: Contact Us (list row)
- "Sign Out" outline button (surface bg + border)
- "Delete Account" danger text button (error red)
- Version string "DateNight v1.0.0 · togetherplans.app"

**List Row pattern:** `flexDirection:row, justifyContent:space-between` — label left, `›` right, surface bg, border, radius 12

**Key Figma frames:**
1. **Profile screen — default**
2. **List row component**

---

## Shared UI Components (Patterns, No Separate Files Yet)

The following patterns appear in multiple screens and should be extracted as Figma components:

---

### Button/Primary

| Prop | Value |
|------|-------|
| Height | ~52px (padding 16 top + 16 bottom + text) |
| bg | `#FF4081` |
| borderRadius | 12 |
| label | 16px, weight 600, `#FFFFFF` |
| loading | `ActivityIndicator` replaces label |
| disabled | Same visual, opacity can be added |

**Variants:** Default, Loading, Disabled

---

### Button/Secondary (Outline)

| Prop | Value |
|------|-------|
| bg | `#F8F8F8` |
| border | 1px `#E0E0E0` |
| borderRadius | 12 |
| label | 16px, weight 600, `#1A1A1A` |

---

### Button/Google

| Prop | Value |
|------|-------|
| bg | `#FFFFFF` |
| border | 1px `#DDDDDD` |
| borderRadius | 12 |
| label | "Continue with Google", 16px, weight 600, `#333333` |

---

### TextInput

| Prop | Value |
|------|-------|
| bg | `#F8F8F8` |
| border | 1px `#E0E0E0` |
| borderRadius | 12 |
| padding | 16 |
| fontSize | 16 |
| color | `#1A1A1A` |
| placeholder color | `#666666` |

**Variants:** Single-line, Multiline (height 100)

---

### Card/Content

Base content card used across GroupsScreen, GroupDetailScreen, ProposalDetailScreen, SuggestionsScreen.

```
bg: #F8F8F8
borderRadius: 12
padding: 16
borderWidth: 1
borderColor: #E0E0E0
```

---

### Chip/Category

Pill-shaped filter chip used in SuggestionsScreen and InviteMembersScreen.

```
Default: bg #F8F8F8, border #E0E0E0, text #1A1A1A
Active:  bg #FF4081, border #FF4081, text #FFFFFF
borderRadius: 20
paddingH: 16, paddingV: 8
```

---

### Badge/Status

Small colored badge for proposal status.

```
paddingH: 8, paddingV: 2, borderRadius: 8
bg: statusColor + '20' (20% alpha)
text: 11px, 700, statusColor
```

Colors: ACTIVE=#FF4081, ACCEPTED=#4CAF50, REJECTED=#F44336, COUNTERED=#FF9800

---

### Avatar/Initial

Circular avatar with user initial.

```
size: 80×80, borderRadius: 40
bg: #FF4081
initial: 32px, 700, #FFFFFF
```

---

### EmptyState

Reusable empty state pattern (GroupsScreen):
```
emoji: 64px, centered
title: 24px, 700, #1A1A1A
description: 16px, #666666, centered
CTA button: primary style, paddingH: 32
```

---

### ConsensusBanner

Green success callout when group consensus is reached.

```
bg: #E8F5E9
borderRadius: 12
padding: 16
body text: 14px, #2E7D32
winner title: 18px, 700, #1B5E20
```

---

### VoteProgressBar

Inline horizontal bar showing vote percentage within an option card.

```
height: 20
bg: #E0E0E0
borderRadius: 10
overflow: hidden
fill: #FF408140 (primary 25% opacity), borderRadius: 10
label: 12px, #1A1A1A, overlaid
```

---

## Figma Page / Frame Recommendations

For Jake's Figma file structure:

```
📄 Cover
📄 Design Tokens      → Color styles, text styles, spacing grid
📄 Components         → All atomic components above
📄 Auth Screens       → Login, Register
📄 Plans Flow         → Groups, GroupDetail, CreateGroup, InviteMembers
📄 Proposals Flow     → ProposalDetail, CreateProposal
📄 Discover           → SuggestionsScreen (all states)
📄 Profile            → ProfileScreen
📄 Component States   → All variants for cards/buttons/badges
```
