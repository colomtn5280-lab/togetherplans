# TogetherPlans Web — Modal, Sheet & Overlay Audit
**Agent 5 — Web Application UX Specialist**
**Date:** 2026-10-19

---

## Scope

Every modal dialog, bottom sheet, dropdown overlay, and panel overlay identified in the web app source via code inspection and live browser testing.

---

## Inventory & Classification

Each entry receives one of:
- **Retain** — works well as-is, possibly minor fixes
- **Redesign** — right pattern, needs substantial implementation fixes
- **Convert** — wrong pattern for the use case, convert to something else
- **Eliminate** — unnecessary; the feature can be delivered inline or removed

---

### 1. OnboardingModal
**File:** `web/src/components/OnboardingModal.tsx`
**Pattern:** Full-screen backdrop + centered card (fixed inset 0)
**Trigger:** First visit to `/dashboard` when `tp_onboarded` is not in localStorage
**Steps:** 4-step wizard (Welcome → Create group → Discover → Favorite categories)

#### What Works
- Backdrop click to dismiss ✅
- "Skip" button present ✅
- Progress dots allow jumping steps ✅
- Category picker embedded (step 4) with scrollable area ✅

#### What's Broken
- ❌ No `role="dialog"` — screen readers treat it as ordinary page content
- ❌ No `aria-modal="true"` — AT cannot announce it as a dialog
- ❌ No `aria-labelledby` — title not announced on open
- ❌ Focus does NOT move to modal on open
- ❌ Focus NOT trapped inside — keyboard users can tab behind the modal
- ❌ Escape key does NOT close it — tested live; `keydown` with `Escape` dispatched, modal remained open
- ❌ Progress dot `<button>` elements have no accessible name (just styled circles)
- ❌ No `autoFocus` on first interactive element

#### Classification: **Redesign**
The modal pattern is correct for a first-run onboarding wizard; it shouldn't be converted to inline content. However it needs a complete ARIA overhaul:
- Add `role="dialog" aria-modal="true" aria-labelledby="onboarding-title"`
- Move focus to modal container on mount, return focus to trigger on close
- Add `useEffect` that listens for `keydown` Escape on `document` and calls `handleClose`
- Implement focus trap (Tab cycles within modal only)
- Give progress dots `aria-label="Step N of 4"` and `aria-current={i === step ? "step" : undefined}`

---

### 2. PlanBuilderDock — Slide-up Panel
**File:** `web/src/components/PlanBuilderDock.tsx`
**Pattern:** Fixed bottom-right FAB + full-screen backdrop + right-anchored bottom sheet
**Trigger:** Any suggestion added to the plan builder (appears when `options.length > 0`); click FAB "🗓 Plan (N)"

#### What Works
- Backdrop click to close ✅
- Stoppage of backdrop click propagation to sheet content ✅
- Clear "Keep browsing" dismiss text button ✅
- "Finalize →" navigates to `/proposals/new` ✅
- scrollable options list within 80vh max-height ✅

#### What's Broken
- ❌ No `role="dialog"` on the panel
- ❌ No `aria-modal`, no `aria-label`
- ❌ Escape does NOT close — no keydown handler
- ❌ Focus does NOT move to panel on open
- ❌ Focus NOT trapped
- ❌ The dock button has no `aria-label` — announced as "🗓 Plan (2)" which is ambiguous
- ❌ Remove `<button>` for individual options has `title="Remove"` but no `aria-label` with option name ("Remove Jazz at the Blue Room")
- ❌ On desktop, panel anchors to bottom-right but sheet content width is 480px max while backdrop is full-screen — panel is not centered and feels misaligned
- ❌ `borderBottomRightRadius: 0` creates an unbalanced corner (3 rounded corners, 1 sharp)

#### Classification: **Redesign**
Keep the FAB + sheet pattern — it's appropriate for a persistent plan builder. Fix:
- `role="dialog" aria-modal="true" aria-label="Your plan"`
- Escape handler
- Focus trap with return focus on close
- `aria-label="Remove ${opt.name} from plan"` on remove buttons
- Center the sheet consistently (remove the `justifyContent: "flex-end"` on desktop; use `center` always)
- Fix bottom border radius

---

### 3. Mobile Navigation Drawer
**File:** `web/src/components/AppNav.tsx` (lines 401–466)
**Pattern:** Full-screen overlay + side drawer (`<aside>`)
**Trigger:** Hamburger button (desktop + mobile); also "More" tab in mobile bottom bar

#### What Works
- `role="dialog"` ✅
- `aria-modal="true"` ✅
- `aria-label="Navigation menu"` ✅
- Close button with `aria-label="Close menu"` ✅
- Backdrop overlay click to close ✅
- Drawer closes on route change ✅
- Outside click closes desktop group picker ✅

#### What's Broken
- ❌ Escape key does NOT close drawer — confirmed in live test
- ❌ Focus does NOT move to drawer on open; does not return to hamburger on close
- ❌ Focus is NOT trapped within drawer while open — tabbing escapes into the page behind
- ❌ When drawer is open, page body scrolls freely (no `overflow: hidden` on body)
- ❌ `aria-hidden="true"` on overlay is correct, but backdrop `div` also needs `tabIndex="-1"` so focus can't land on it
- ❌ Both the top-bar hamburger AND the "More" bottom tab trigger the same drawer — but both elements remain focusable while drawer is open, creating two visible trigger elements with misleading state
- ❌ Mobile tab bar: bottom bar remains interactive while drawer overlay is open (focus should be trapped in drawer)

#### Classification: **Redesign**
The drawer architecture is right; the implementation is incomplete:
- Add `useEffect` with `keydown` Escape listener that calls `setDrawerOpen(false)`
- On `drawerOpen` set `document.body.style.overflow = 'hidden'`; reset on close
- On open: `drawerRef.current?.focus()` (drawer container needs `tabIndex="-1"`)
- On close: return focus to the triggering element (need a `triggerRef`)
- Add focus trap within `<aside>` (cycle Tab/Shift+Tab within drawer's focusable children)
- Set `aria-expanded` on hamburger button to match `drawerOpen`

---

### 4. Desktop Group Picker Dropdown (AppNav)
**File:** `web/src/components/AppNav.tsx` (lines 276–297)
**Pattern:** Inline absolute-positioned dropdown
**Trigger:** "New Date Plan" button when user has 2+ groups

#### What Works
- Outside click closes it ✅ (via `mousedown` event on `document`)
- Renders near the trigger ✅
- Clean list of group name buttons ✅
- Empty state message ✅

#### What's Broken
- ❌ No `role="listbox"` or `role="menu"` on the container
- ❌ No `aria-expanded` on the trigger button
- ❌ No `aria-haspopup="listbox"` on trigger
- ❌ No keyboard navigation (arrow keys to move through groups, Enter to select)
- ❌ No Escape to close dropdown
- ❌ Focus does not move into dropdown on open

#### Classification: **Retain** (with targeted fixes)
The pattern is appropriate for a small context dropdown. Apply:
- `role="menu"` on container + `role="menuitem"` on each `<button>`
- `aria-expanded={showGroupPicker}` + `aria-haspopup="menu"` on trigger
- Escape closes and returns focus to trigger
- Arrow-key navigation between items

---

### 5. Mobile Group Picker Bottom Sheet (AppNav)
**File:** `web/src/components/AppNav.tsx` (lines 526–579)
**Pattern:** Fixed full-screen backdrop + bottom sheet
**Trigger:** "New Plan" (+) tab in mobile bottom bar when user has 2+ groups

#### What Works
- Backdrop click closes it ✅ (`onClick={() => setShowGroupPicker(false)}`)
- `stopPropagation` on sheet content ✅
- Empty group state message ✅
- Safe area inset bottom padding ✅

#### What's Broken
- ❌ No `role="dialog"` or `role="bottomsheet"` on the outer container
- ❌ No `aria-modal` on sheet content
- ❌ No `aria-label`/`aria-labelledby` — "Choose a group" title is a `<div>`, not a heading
- ❌ No Escape key handler
- ❌ Focus not trapped
- ❌ Same `showGroupPicker` state controls BOTH desktop dropdown (AppNav lines 276–297) AND this mobile sheet — at mobile viewport the desktop dropdown is CSS-hidden but still rendered in the DOM, creating duplicate content

#### Classification: **Redesign**
Separate the mobile sheet from the desktop dropdown states, or conditionally render only one. Add full dialog semantics.

---

### 6. Group Detail — Member Three-dot Context Menu
**File:** `web/src/pages/GroupDetailPage.tsx` (lines 626–827)
**Pattern:** Absolute-positioned popup with actions (Block, Report → nested reason picker)
**Trigger:** `⋯` button next to non-owner group members

#### What Works
- Opens/closes via toggle ✅
- Closes when another menu opens ✅
- Report reason transitions inline (no second modal) ✅
- Error/success messages shown ✅

#### What's Broken
- ❌ No `role="menu"` on container, no `role="menuitem"` on buttons
- ❌ No `aria-expanded` on the `⋯` trigger
- ❌ No `aria-label` on the `⋯` button (only `title="Member options"` — not AT-friendly)
- ❌ No outside-click close handler — closes only when another member's menu opens; clicking elsewhere keeps it open
- ❌ No Escape to close
- ❌ Focus does not move into menu on open
- ❌ Block action is immediate with no confirmation — destructive actions need a confirmation step

#### Classification: **Redesign**
Keep the inline context menu pattern (correct for this use case) but add:
- `aria-label="Options for ${memberName}"` on the trigger
- `role="menu"` + `role="menuitem"` semantics
- Outside-click close handler (similar to group picker)
- Escape to close
- Confirmation step before Block (which is irreversible)

---

### 7. Group Detail — Delete Group Confirmation
**File:** `web/src/pages/GroupDetailPage.tsx` (lines 841–879)
**Pattern:** Inline expand/collapse confirmation — not a modal
**Trigger:** "Delete group" button; expands to show confirmation box with "Yes, delete" and "Cancel"

#### What Works
- Inline pattern avoids the complexity of a modal ✅
- Warning copy is clear ✅
- Disabled state during mutation ✅
- Error state shown on failure ✅
- Cancel returns to initial state ✅

#### What's Broken
- ⚠️ No `role="alert"` or `aria-live` on the confirmation box — AT users won't know it appeared
- ⚠️ The "Yes, delete" button doesn't get auto-focus when confirmation expands — keyboard users must re-tab to it

#### Classification: **Retain**
The inline confirmation is the right pattern for this context — it avoids modal overhead for a page-scoped destructive action. Minor fixes:
- Add `aria-live="assertive"` to the confirmation box container
- Move focus to "Cancel" (safer default) or "Yes, delete" when it appears

---

### 8. OnboardingModal — Category Chip Scroll Area (Step 4)
**File:** `web/src/components/OnboardingModal.tsx` (lines 151–155)
**Pattern:** Embedded scrollable region within modal
**Trigger:** Step 4 of OnboardingModal ("What are you into?")

#### What Works
- `maxHeight: 260, overflowY: 'auto'` contains the chip list ✅
- Chips show selected state visually ✅

#### What's Broken
- ❌ No `aria-label` on the scrollable region
- ❌ Chips need `aria-pressed` (toggle buttons) — they look like buttons but lack role indication
- ❌ Max 5 selection enforcement has no AT announcement when limit is hit

#### Classification: **Retain** (within modal redesign)
Fix chips to use `aria-pressed="true|false"` and announce the "max 5" constraint via `aria-live` region.

---

## Summary Table

| # | Overlay | Pattern | A11y Score | Verdict |
|---|---------|---------|:----------:|---------|
| 1 | OnboardingModal | Full-screen modal | 1/10 | **Redesign** |
| 2 | PlanBuilderDock Panel | Bottom sheet | 2/10 | **Redesign** |
| 3 | Mobile Nav Drawer | Side drawer | 5/10 | **Redesign** |
| 4 | Desktop Group Picker | Dropdown | 3/10 | **Retain + fix** |
| 5 | Mobile Group Picker | Bottom sheet | 2/10 | **Redesign** |
| 6 | Member Context Menu | Context popup | 2/10 | **Redesign** |
| 7 | Delete Group Confirm | Inline expand | 6/10 | **Retain + fix** |
| 8 | Category Chips (in modal) | Scrollable region | 4/10 | **Retain + fix** |

---

## Shared Fix Pattern (Apply to All Redesigns)

```tsx
// Reusable hook for modals — add to src/hooks/useModalA11y.ts
import { useEffect, useRef } from "react";

export function useModalA11y(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Capture trigger before focus moves
      triggerRef.current = document.activeElement as HTMLElement;
      // Move focus into modal
      containerRef.current?.focus();
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Restore scroll
      document.body.style.overflow = "";
      // Return focus
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return containerRef;
}
```

Pair with a `<FocusTrap>` component (or use `@radix-ui/react-focus-trap`) and set:
```tsx
<div
  ref={containerRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  tabIndex={-1}
>
```

---

## Priority Order for Modal Fixes

1. **P0** — OnboardingModal (shown to every new user; completely inaccessible)
2. **P0** — PlanBuilderDock (core feature; used heavily on Discover page)
3. **P1** — Mobile Nav Drawer (Escape + scroll lock)
4. **P1** — Mobile Group Picker (Escape + role)
5. **P2** — Desktop Group Picker (keyboard nav, ARIA)
6. **P2** — Member Context Menu (ARIA, outside click close)
7. **P3** — Delete Group Confirm (aria-live, focus)
8. **P3** — Category Chips (aria-pressed)
