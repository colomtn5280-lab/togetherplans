# DateMeUp — Trust, Safety, Privacy & Dating-App Compliance
**October 2026**

---

## Current Trust & Safety Pages

| Page | URL | Status | Notes |
|---|---|---|---|
| Privacy Policy | /privacy | ✅ Exists | Content not reviewed |
| Terms of Service | /terms | ✅ Exists | Content not reviewed |
| Support | /support | ✅ Exists | Basic |
| Community Guidelines | — | ❌ Missing | Required for social app |
| Safety Center | — | ❌ Missing | Best practice for social app |
| Data Deletion | — | ❌ Partially | Account deletion in Settings |
| Contact/Report | — | ⚠️ Unclear | Should be findable |

---

## App Store & Google Play Dating-App Policy Compliance

### Apple App Store — Social Networking Category Requirements
- **Age rating**: Must be 17+ if app allows user-generated content or social networking. DateMeUp allows shared content between users → set rating to 17+
- **Content moderation**: Must have a method for users to block/report other users. DateMeUp has this (block/report endpoints exist in backend).
- **No random matching**: DateMeUp does NOT match strangers — this is a significant compliance advantage. No "meet new people" functionality = simpler review
- **Privacy**: User data handling must be disclosed in App Privacy labels

### Google Play — Social Category Requirements
- **Target audience**: Content rating questionnaire must accurately reflect the app's use case
- **Dating apps**: Google Play has specific policies for dating apps that include predatory behavior detection. DateMeUp is NOT a dating app in the matching-strangers sense, but operates in adjacent space.
- **Data Safety**: Complete Data Safety form accurately — what data is collected, why, sharing practices

---

## User Profile Indexing Risk

**Current assessment:** DateMeUp does NOT index user profiles publicly. All user data, proposals, and groups are behind authentication. The public routes (/suggestions, /) do not expose user data.

**Risk:** /vote/:shareToken and /share/:shareToken expose proposal data to unauthenticated users. This is intentional (guest voting feature). These pages should:
- Not reveal user email addresses or full names
- Only show proposal title, activity options, and vote status
- Be excluded from search indexing: `<meta name="robots" content="noindex">` on these pages

---

## Recommended Additional Pages

### /safety (Priority: Medium)
Brief safety guidance page:
- DateMeUp is designed for people who already know each other
- Tips for meeting partners at suggested venues
- How to block or report a user
- Contact information for concerns

### /community-guidelines (Priority: Medium)
Even though DateMeUp is primarily a planning tool, community guidelines are increasingly required by app stores and build user trust:
- Acceptable use
- No harassing other users
- No inappropriate After Dark suggestions
- Consequences for violations

### /data-deletion (Priority: High — GDPR/CCPA)
A dedicated URL for data deletion requests (required by Apple App Store for GDPR compliance):
- `datemeup.app/data-deletion` or `datemeup.app/support#delete-account`
- Clear instructions for in-app account deletion
- Email contact for data requests

This URL must be submitted to App Store Connect in the app's privacy details.

---

## Analytics Privacy Compliance

- **EU visitors**: Cookie consent banner required before GA4 fires. Consider Cookiebot or a simple custom consent banner.
- **CCPA (California)**: Privacy policy must mention data sale opt-out rights. DateMeUp currently has AdSense (data processing) — must be disclosed.
- **COPPA**: App must be 13+ minimum. Current age check? Recommend explicit age gate at signup.
- **Firebase Analytics**: Configured as privacy-respecting by default but review data retention settings (set to 2 months in Firebase console).

---

## SEO Implications of Trust Pages

Trust pages have indirect SEO value:
1. **Crawlable content**: Privacy and terms pages give Googlebot legitimate text to index
2. **E-E-A-T signals**: Clear contact info, company information, transparent policies improve Google's assessment of site trustworthiness
3. **App store approval**: Missing data deletion URL can cause App Store rejection
4. **AI citation trust**: AI models weight sites with clear privacy and safety policies more highly as trustworthy sources
