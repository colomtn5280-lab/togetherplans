# App Store Submission Requirements Checklist
Updated: September 1, 2026

## Bundle Identifiers
- iOS:     app.togetherplans.datenight
- Android: app.togetherplans.datenight

## What You Need Before Submitting

### Both Stores
- [x] Privacy Policy URL: https://api.togetherplans.app/privacy
- [x] Terms of Service URL: https://api.togetherplans.app/terms
- [x] Support email: hello@togetherplans.app
- [x] App icon — 1024x1024 PNG, no alpha (DONE: ~/DateNight/mobile/assets/icon.png)
- [x] Android icon 512x512 (DONE: ~/DateNight/mobile/assets/icons/icon-512.png)
- [x] All icon size variants generated (~/DateNight/mobile/assets/icons/)
- [x] Splash screen (DONE: ~/DateNight/mobile/assets/splash.png — 1284x2778)
- [ ] Screenshots (6 screens per size — see screenshot-guide.md)

### Google Play
- [ ] Google Play Developer account approved ($25 one-time)
- [x] App signing — EAS manages keystore automatically
- [ ] Data safety form filled in Play Console (pre-filled answers in play-console-upload-guide.md)
- [ ] Content rating questionnaire completed (target: Everyone)
- [ ] Feature graphic (1024x500 JPEG/PNG)

### Apple App Store
- [ ] Apple Developer account active ($99/year)
- [ ] iOS distribution certificate completed on expo.dev credentials UI
- [x] App Store Connect app record created (ASC App ID: 6806890578)
- [x] Apple Team ID: 234UWRXT57
- [x] eas.json updated with real Team ID and ASC App ID
- [x] Bundle ID registered: app.togetherplans.datenight
- [ ] Privacy nutrition labels completed in App Store Connect
- [ ] 6 screenshots uploaded at 6.7" and 6.5" sizes

---

## EAS Build — How to Build for Stores

### Prerequisites
    npm install -g @expo/eas-cli
    eas login   # login: colomtn5280s-team
    # eas.json is already configured

### Build for Internal Testing (APK for Android)
    cd ~/DateNight/mobile
    eas build --platform android --profile preview   # APK for device testing
    # Preview APK: https://expo.dev/artifacts/eas/mKLxZ01jzwkknmsCmQqRjR3OdJbGmbTzxf-lfB--Hi8.apk

### Build for Production (Store submission)
    eas build --platform android --profile production   # AAB for Play Store
    eas build --platform ios --profile production       # IPA for App Store (requires Apple cert)

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

Data type          | Collected | Shared              | Purpose
-------------------|-----------|---------------------|----------------------------
Email address      | Yes       | No                  | Account creation, login
Display name       | Yes       | With group members  | Profile, visible in groups
Approx location    | Optional  | No                  | Activity suggestions
Device identifiers | Yes       | No                  | Push notifications

Retention: Account data deleted within 30 days of deletion request.
Encryption: All data encrypted in transit (TLS) and at rest (GCP Cloud SQL).
User can request deletion: Yes — via account settings in the app.

---

## Useful Links
- EAS Builds: https://expo.dev/accounts/colomtn5280s-team/projects/togetherplans/builds
- App Store Connect: https://appstoreconnect.apple.com
- Play Console: https://play.google.com/console
- Apple Developer: https://developer.apple.com/account
- Resend Dashboard: https://resend.com

## See Also (in this folder)
- listing-copy.md — App name, descriptions, keywords for both stores
- screenshot-guide.md — How to capture and upload screenshots
- play-console-upload-guide.md — Step-by-step Play Console walkthrough
- resend-setup-guide.md — How to complete Resend email setup
