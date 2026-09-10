# Google Play Console — Data Safety Form
# Pre-filled answers for TogetherPlans / DateNight
# Generated: September 10, 2026
#
# HOW TO USE:
# 1. Go to Play Console → Your App → Policy → App content → Data safety
# 2. Click through each section and copy-paste these answers.
# All answers are based on the actual backend schema and API behavior.

---

## Section 1: Data Collection and Security

**Does your app collect or share any of the required user data types?**
→ YES

**Is all of the user data collected by your app encrypted in transit?**
→ YES
(All API traffic uses TLS 1.2+. Cloud Run enforces HTTPS. No plaintext connections.)

**Do you provide a way for users to request that their data is deleted?**
→ YES
(Users can delete their account from Profile → Delete Account in the app.
Account is soft-deleted immediately; all data is purged within 30 days.)

---

## Section 2: Data Types

### Personal info

**Name**
- Collected: YES
- Shared: YES (display name is visible to other members of groups the user joins)
- Processed ephemerally: NO
- Required for core functionality: YES
- Purpose: App functionality (display in group chats and proposals)
- User can opt out: NO (required to use the app)

**Email address**
- Collected: YES
- Shared: NO (never shared with third parties or other users)
- Processed ephemerally: NO
- Required for core functionality: YES
- Purpose: Account management, transactional email (welcome, invitations, password reset)
- User can opt out: NO (required to create an account)

### Location

**Approximate location**
- Collected: YES (optional — user grants permission)
- Shared: NO
- Processed ephemerally: YES (used only at request time to query nearby suggestions; not stored persistently unless user explicitly saves their home location)
- Required for core functionality: NO (app works without location; suggestions fall back to curated seed data)
- Purpose: App functionality (suggest nearby restaurants and activities)
- User can opt out: YES (deny location permission; app continues to work)

### App activity

**App interactions**
- Collected: NO

**In-app search history**
- Collected: NO

### Device or other IDs

**Device or other identifiers**
- Collected: YES (Expo push notification token)
- Shared: NO (token is stored on our server only; used to deliver push notifications via Expo's push service)
- Processed ephemerally: NO
- Required for core functionality: NO (app works without push notifications)
- Purpose: App functionality (push notifications for proposal responses, invitation acceptances)
- User can opt out: YES (deny notification permission on first launch)

---

## Section 3: Data Handling Practices

**Is the data collected used for purposes beyond what is required for core app functionality?**
→ NO
(Data is used only to operate the app. Email is used for transactional messages only — no marketing. Location is used only for suggestion queries.)

**Is any data shared with third parties?**
→ NO
(Display name is visible to group members within the app. No data is sold or shared with advertisers or data brokers.)

---

## Section 4: Content Rating Questionnaire (separate from Data Safety)

These answers are for the Play Console Content Rating questionnaire:

- Violence: NO
- Sexual content: NO
- Profanity: NO (user-generated content possible, but app has no profanity mechanism)
- Controlled substances: NO
- Gambling: NO
- Social features (users can interact): YES — users can create groups, send invitations, vote on proposals
- User-generated content: YES — proposal titles and descriptions
- Shares location with other users: NO (location is only used server-side for suggestions)
- Allows communication between users who don't know each other: NO (groups require explicit invitation)

**Recommended content rating: Everyone (E)**
(App is appropriate for all ages. No mature content.)

---

## Notes for Play Console Upload

When uploading the production AAB:

1. Go to: Play Console → Testing → Internal testing → Create release
2. Upload the AAB (download from EAS: https://expo.dev/accounts/colomtn5280s-team/projects/togetherplans/builds)
   - Look for the build with profile "production" and platform "Android"
3. Release name: 1.0.0 (or match your app.json version)
4. Release notes (required — add for at least English):
   "Initial release of TogetherPlans — plan date nights and group activities together.
    Create groups, suggest activities, vote on proposals, and get real-time updates."

5. After internal testing is live, promote to Production when ready.
