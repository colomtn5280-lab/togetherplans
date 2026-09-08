# Design Tokens — TogetherPlans / DateNight

Extracted from the live app source (`/mobile/src/`). Use these values in Figma to match the current app exactly.

---

## Colors

Defined in `src/constants/index.ts` → `COLORS`:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#FF4081` | Buttons, active tab, highlights, avatars |
| `primaryDark` | `#C60055` | Pressed/active variant of primary |
| `background` | `#FFFFFF` | Screen container backgrounds |
| `surface` | `#F8F8F8` | Card backgrounds, input backgrounds |
| `text` | `#1A1A1A` | Primary body text, titles |
| `textSecondary` | `#666666` | Captions, muted text, placeholders |
| `border` | `#E0E0E0` | Card borders, dividers, input borders |
| `success` | `#4CAF50` | Confirmed states, cost display, approved |
| `error` | `#F44336` | Error messages, delete actions |
| `warning` | `#FF9800` | Warnings, pending/review states |

**One-off colors found in source:**
| Value | Usage |
|-------|-------|
| `#fff` / `#ffffff` | Text on colored backgrounds (buttons, avatars) |
| `#7c3aed` | Splash screen background, accent brand color |
| `#E8F5E9` | Consensus banner background (light green) |
| `#2E7D32` | Consensus banner text |
| `#1B5E20` | Consensus winner text (dark green) |
| `#ddd` | Some card borders (same role as `border`) |

---

## Typography

All font sizes in use (from StyleSheet definitions across all screens):

| Token | Size (pt) | Weight | Usage |
|-------|-----------|--------|-------|
| `display` | 64 | — | Emoji/icon display size |
| `h1` | 36 | — | Large screen titles |
| `h2` | 32 | 700 | Avatar initials, screen headers |
| `h3` | 28 | 700 | Empty state titles |
| `h4` | 24 | 700 | Section headings, card titles |
| `h5` | 22 | — | Sub-headings |
| `h6` | 20 | — | Minor headings |
| `body-large` | 18 | 600 | Prominent card titles |
| `body-medium` | 16 | 400–600 | Standard body, button text |
| `body-small` | 15 | 400 | Secondary body text, descriptions |
| `caption-large` | 14 | 400–600 | Labels, category pills |
| `caption-medium` | 13 | 400 | Card descriptions, metadata |
| `caption-small` | 12 | 400–600 | Date/cost meta, card meta |
| `micro` | 11 | 600 | Status badges, category chips (uppercase) |

**Font family:** System default (SF Pro on iOS, Roboto on Android). For Figma, use **Inter** as the closest cross-platform match.

---

## Spacing

Defined in `src/constants/index.ts` → `SPACING`:

| Token | Value (dp) | CSS equiv | Usage |
|-------|-----------|-----------|-------|
| `xs` | 4 | 4px | Tight gaps, badge padding |
| `sm` | 8 | 8px | Small gaps, icon margins, badge horizontal padding |
| `md` | 16 | 16px | Standard padding (cards, sections, inputs) |
| `lg` | 24 | 24px | Section gaps, large spacing |
| `xl` | 32 | 32px | Screen-level padding, empty state spacing |
| `xxl` | 48 | 48px | Large decorative spacing |

---

## Border Radius

| Token | Value (dp) | Usage |
|-------|-----------|-------|
| `pill` | 20 | Filter chips, add buttons, category pills |
| `card` | 12 | Cards, buttons, input fields |
| `tag` | 10 | Secondary action buttons |
| `badge` | 8 | Status badges |
| `avatar` | 40 | Circular avatars (40 = half of 80px avatar) |

---

## Border Width

| Token | Value | Usage |
|-------|-------|-------|
| `hairline` | 1 | Card borders, input borders (default) |
| `focus` | 2 | Focus/active state indicator |

---

## Component Patterns

Common component recipes extracted from StyleSheet usage:

### Card
```
backgroundColor: surface (#F8F8F8)
borderRadius: 12
padding: 16 (md)
marginBottom: 8 (sm)
borderWidth: 1
borderColor: border (#E0E0E0)
```

### Primary Button
```
backgroundColor: primary (#FF4081)
borderRadius: 12
padding: 16 (md)
textColor: #fff
fontSize: 16
fontWeight: 600
```

### Secondary / Outline Button
```
backgroundColor: surface (#F8F8F8)
borderWidth: 1
borderColor: border (#E0E0E0)
borderRadius: 10
textColor: text (#1A1A1A)
```

### Text Input
```
fontSize: 16
color: text (#1A1A1A)
backgroundColor: surface (#F8F8F8)
padding: 16 (md)
borderWidth: 1
borderColor: border (#E0E0E0)
borderRadius: 12
placeholderColor: textSecondary (#666666)
```

### Category / Filter Pill
```
paddingHorizontal: 16 (md)
paddingVertical: 8 (sm)
borderRadius: 20 (pill)
backgroundColor: surface (#F8F8F8)
borderWidth: 1
borderColor: border (#E0E0E0)
— Active state:
backgroundColor: primary (#FF4081)
borderColor: primary (#FF4081)
textColor: #fff
```

### Status Badge
```
paddingHorizontal: 8
paddingVertical: 2
borderRadius: 8
fontSize: 11
fontWeight: 600
backgroundColor: statusColor + '20' (20% opacity overlay)
textColor: statusColor
```

### Avatar (initial-based)
```
width: 80, height: 80
borderRadius: 40
backgroundColor: primary (#FF4081)
textColor: #fff
fontSize: 32
fontWeight: 700
```

---

## Screen Layout Baseline

| Property | Value |
|----------|-------|
| Screen background | `#FFFFFF` |
| Safe area / container padding | `16dp` (md) on sides |
| Scroll content padding | `16dp` (md) all around |
| Card list gap | `8dp` (sm) between cards |
| Section gap | `24dp` (lg) between major sections |
| Header tint color | `primary (#FF4081)` |
| Tab bar active color | `primary (#FF4081)` |
| Tab bar inactive color | `textSecondary (#666666)` |
