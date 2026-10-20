# TogetherPlans — UX Quality Scorecard
**October 2026 | Based on 6-Agent Independent Audit**

---

## Scoring Methodology
Scores are structured expert assessments based on live testing, code inspection, and platform standard comparison. Each category is scored 0–100.

---

## Web Application

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Navigation & User Flow | 20% | 52 | 10.4 |
| Interaction Efficiency | 15% | 48 | 7.2 |
| Visual Design Quality | 15% | 55 | 8.25 |
| Platform-Native Experience | 15% | 60 | 9.0 |
| Modal & Pop-up Behavior | 10% | 40 | 4.0 |
| Accessibility | 10% | 35 | 3.5 |
| Performance & Responsiveness | 10% | 62 | 6.2 |
| Feature Discoverability | 5% | 30 | 1.5 |
| **TOTAL** | **100%** | | **50.1 / 100** |

### Top 5 Opportunities — Web
1. After Dark has zero navigation entry points — feature is invisible
2. Proposal page error state is catastrophically bare ("Proposal not found." on a blank page)
3. OnboardingModal has no ARIA, no focus trap, Escape doesn't close it
4. 15+ undocumented rogue colors undermining design system integrity
5. 766KB single bundle with no code splitting — performance ceiling hit

---

## iOS Application

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Navigation & User Flow | 20% | 55 | 11.0 |
| Interaction Efficiency | 15% | 50 | 7.5 |
| Visual Design Quality | 15% | 58 | 8.7 |
| Platform-Native Experience | 15% | 50 | 7.5 |
| Modal & Pop-up Behavior | 10% | 45 | 4.5 |
| Accessibility | 10% | 30 | 3.0 |
| Performance & Responsiveness | 10% | 65 | 6.5 |
| Feature Discoverability | 5% | 35 | 1.75 |
| **TOTAL** | **100%** | | **50.5 / 100** |

### Top 5 Opportunities — iOS
1. Missing NSCalendarsUsageDescription — will crash + be rejected by App Store
2. Custom Apple Sign In buttons instead of required AppleAuthenticationButton component
3. Haptics missing on 9 of 10 key interaction moments
4. AfterDarkScreen.tsx FAB at hardcoded bottom:24px overlaps home indicator on iPhone 15 Pro
5. Zero accessibilityLabel/accessibilityRole on vote buttons and tab items

---

## Android Application

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Navigation & User Flow | 20% | 50 | 10.0 |
| Interaction Efficiency | 15% | 48 | 7.2 |
| Visual Design Quality | 15% | 55 | 8.25 |
| Platform-Native Experience | 15% | 30 | 4.5 |
| Modal & Pop-up Behavior | 10% | 42 | 4.2 |
| Accessibility | 10% | 28 | 2.8 |
| Performance & Responsiveness | 10% | 60 | 6.0 |
| Feature Discoverability | 5% | 35 | 1.75 |
| **TOTAL** | **100%** | | **44.7 / 100** |

### Top 5 Opportunities — Android
1. Target SDK 35 not set — Google Play blocks all updates as of Aug 2025
2. Data Safety form not completed — blocks Play Store updates
3. All TouchableOpacity lacks Android ripple — feels non-native throughout
4. Comment delete "×" (~18dp) and option remove "×" (~30dp) critically below 48dp M3 minimum
5. Predictive back gesture not validated — conflicts with custom back buttons

---

## Cross-Platform Overall

| Platform | Score | Grade |
|---|---|---|
| Web | 50.1 | C |
| iOS | 50.5 | C |
| Android | 44.7 | D+ |
| **Ecosystem Average** | **48.4** | **C** |

### Assessment
The app is **functional and has genuine product differentiation** (invite cards, 3-state voting, After Dark) but is **not commercially launch-ready** as of this audit. Critical P0 blockers exist on all three platforms. The design system lacks governance. Accessibility is broadly insufficient for App Store/Play Store standards. The core product loop works but has rough edges on every screen.

**Target score for commercial launch: 70+ on all platforms.**
**Estimated effort to reach launch-ready: 3–4 weeks of focused remediation.**
