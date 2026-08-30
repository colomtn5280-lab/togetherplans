# App Store Submission Requirements Checklist

## Bundle Identifiers
- iOS:     app.togetherplans.datenight
- Android: app.togetherplans.datenight

## What You Need Before Submitting

### Both Stores
- [x] Privacy Policy URL: https://api.togetherplans.app/privacy
- [x] Terms of Service URL: https://api.togetherplans.app/terms
- [x] Support email: hello@togetherplans.app
- [ ] App icon (1024x1024 PNG, no alpha, no rounded corners — stores add rounding)
- [ ] Screenshots (see sizes below)

### Google Play
- [ ] Google Play Developer account approved ($25 one-time)
- [ ] App signing keystore (EAS manages this — see EAS Build section)
- [ ] Data safety form filled in Play Console
  - Data collected: email, display name, location (optional)
  - Data shared: none sold to third parties
  - Data encrypted in transit: yes
  - User can delete data: yes (30-day deletion)
- [ ] Content rating questionnaire completed (target: Everyone)

### Apple App Store
- [ ] Apple Developer account active ($99/year)
- [ ] App Store Connect app record created
  - Bundle ID: app.togetherplans.datenight
  - Name: DateNight: Plan Together
- [ ] Apple Team ID (from developer.apple.com/account)
- [ ] App Store Connect App ID (from App Store Connect)
- [ ] Update eas.json with real ascAppId and appleTeamId

---

## Screenshot Requirements

### iOS (required sizes)
- iPhone 6.7" (1290 x 2796): iPhone 15 Pro Max
- iPhone 6.5" (1284 x 2778): iPhone 14 Plus / 13 Pro Max (also covers 6.3")
- iPad 12.9" (2048 x 2732): required if supportsTablet is enabled

### Android (required sizes)
- Phone: 1080 x 1920 minimum (16:9 or 9:16)
- At least 2, up to 8 screenshots

### Recommended Screenshot Screens to Capture
1. Login / landing screen (hero shot)
2. Groups list (your plans)
3. Create proposal with activity options
4. Voting screen with options
5. Consensus reached screen
6. Discover / Suggestions screen

---

## EAS Build — How to Build for Stores

### Prerequisites
    npm install -g @expo/eas-cli
    eas login        # Expo account required (free at expo.dev)
    eas build:configure

### Build for Internal Testing (APK for Android, IPA for iOS)
    cd ~/DateNight/mobile
    eas build --platform android --profile preview   # Gets you an APK to test
    eas build --platform ios --profile development   # Needs Apple account

### Build for Production (Store submission)
    eas build --platform android --profile production
    eas build --platform ios --profile production

### Submit to Stores (after build)
    eas submit --platform android   # Uploads to Google Play internal track
    eas submit --platform ios       # Uploads to App Store Connect

---

## Permissions & Justifications (for store review)

### Location (ACCESS_FINE_LOCATION / NSLocationWhenInUseUsageDescription)
"DateNight uses your location to suggest nearby activities and restaurants."

### Camera (CAMERA / NSCameraUsageDescription)
"DateNight uses the camera for scanning QR code invitations."

### Notifications
"DateNight sends notifications when someone responds to your proposal or accepts your invitation."

---

## Data Safety (Google Play) & Privacy Details (Apple)

Data type          | Collected | Shared | Purpose
-------------------|-----------|--------|---------------------------
Email address      | Yes       | No     | Account creation, login
Display name       | Yes       | No     | Profile, visible to group members
Precise location   | Optional  | No     | Activity suggestions (user-controlled)
Device identifiers | Yes       | No     | Push notifications

Retention: Account data deleted within 30 days of account deletion request.
Encryption: All data encrypted in transit (TLS) and at rest (GCP Cloud SQL).

---

## Expo / EAS Account Setup (one-time)
1. Create free account at expo.dev
2. Run: npm install -g @expo/eas-cli
3. Run: eas login
4. Run: eas build:configure  (in ~/DateNight/mobile)
5. This creates a project on Expo's servers and links app.json

## Notes
- EAS handles signing keys for both platforms automatically
- First Android build creates a keystore; EAS stores it securely
- First iOS build requires Apple Developer account linked to EAS
