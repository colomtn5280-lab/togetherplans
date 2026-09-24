# HOW TO ACCESS & TEST THE v1.2.0 BUILDS

## Quick Reference: Build URLs

**Save these — you won't need to rebuild if you test multiple times.**

| Platform | Type | URL | Build ID | How to Use |
|----------|------|-----|----------|-----------|
| **iOS** | Production IPA | https://expo.dev/artifacts/eas/2Z7WcqcjzmX0Kplz1GDStmQIxrrqizsbDfgaO3Zw6jA.ipa | f445f7ce | Upload to Appetize.io (recommended) or install on real device |
| **iOS** | Simulator | https://expo.dev/artifacts/eas/rZ9QWQvb8hUdbrOO_t3c2g7oLj3RdyQzK3OjGtxzIFI.tar.gz | 45e401eb | Extract and run on macOS simulator (faster for quick testing) |
| **Android** | Production AAB | https://expo.dev/artifacts/eas/vwz5j0l7d7dFr0JyR0GujPzQGNpsvANB2H65KYzhz6E.aab | 276b65e8 | Sideload or upload to Play Console internal track |
| **Web** | Live | https://togetherplans.app | N/A | Open in browser, login with demo account |

---

## TESTING OPTIONS

### Option 1: iOS via Appetize (RECOMMENDED - No Device Needed)

**Why:** You don't own an iPhone, Appetize lets you test in the browser instantly.

**Steps:**
1. Go to https://appetize.io (free signup)
2. Click "Upload app" and select the iOS IPA from the link above
3. Wait ~30s for it to start
4. A browser-based iPhone simulator appears — interact normally (tap, swipe, scroll)
5. Test all flows (login, discover, voting, guest link, etc.)

**Pros:** No device needed, instant, free, repeatable  
**Cons:** Simulator only (not real hardware), no physical gestures  

**Cost:** Free tier allows 1 hour/month; upgrade to $9/mo for unlimited if you test repeatedly.

---

### Option 2: iOS Simulator on macOS (Fast Local Testing)

**Why:** Instant, no uploads needed, best for rapid iteration.

**Prerequisites:**
- macOS with Xcode installed (`xcode-select --install`)
- Xcode Command Line Tools active

**Steps:**
1. Download the simulator .tar.gz file
2. Extract: `tar -xzf <filename>.tar.gz`
3. This creates a directory with an .app bundle inside
4. Run: `xcrun simctl install booted path/to/extracted/.app`
5. Simulator opens and the app installs automatically
6. Launch the app from the home screen

**Pros:** Instant, no external services, fastest iteration  
**Cons:** macOS only, simulator quirks (sometimes slow)  

---

### Option 3: Android via Sideload (Real Device)

**Why:** Test on actual hardware, catches device-specific issues.

**Prerequisites:**
- Android phone or tablet (any version 8+)
- USB-C/micro-USB cable
- ADB installed (`brew install android-platform-tools` on macOS/Linux)
- Developer Mode enabled on your Android device (Settings → About → tap "Build Number" 7x)

**Steps:**
1. Download the Android AAB file
2. Connect device via USB; authorize debugging prompt
3. Run: `adb install -r <filename>.aab`
4. App installs and appears on your home screen
5. Tap to launch

**Pros:** Real hardware, real performance, real gestures  
**Cons:** Need physical device, USB setup  

**Troubleshooting:**
- If `adb` not found: restart terminal after brew install
- If device not recognized: check USB cable, enable "File Transfer" mode
- If install fails: run `adb uninstall app.togetherplans.datenight` first, then retry

---

### Option 4: Android via Android Studio Emulator

**Why:** No physical device needed, still realistic testing.

**Prerequisites:**
- Android Studio installed (https://developer.android.com/studio)
- Android Virtual Device (AVD) set up in Android Studio

**Steps:**
1. Open Android Studio → AVD Manager
2. Launch a virtual device (e.g., Pixel 6, Android 13)
3. Wait for emulator to boot
4. Download the AAB file
5. Drag the AAB onto the emulator window → auto-installs
6. Tap app icon on emulator home screen

**Pros:** No physical device, respectable performance, can test multiple screen sizes  
**Cons:** Slower than real device, requires Android Studio  

---

### Option 5: Web in Browser (Instant, No Downloads)

**Why:** Fastest way to test the core flows, no installation.

**Steps:**
1. Go to https://togetherplans.app
2. Click "Log In"
3. Enter: demo@togetherplans.app
4. Password: Demo1234!
5. You're logged in to the dashboard

**Test flows:**
- Discover: click categories, view events
- Voting: go to Plans tab, open proposal, vote
- Guest link: copy the vote link, test in private window (no login)
- After Dark: click moon icon in nav
- Responsive: resize browser window to test mobile width

**Pros:** Instant, zero setup, shared between all users  
**Cons:** Limited to web UX (no native iOS/Android feel), no offline testing  

---

## TEST CREDENTIALS

**Demo Account:**
- Email: demo@togetherplans.app
- Password: Demo1234!
- Group: Review Crew
- Pre-seeded proposals: Weekend plans, Friday date night

**What's already in this account:**
- 2 groups (Review Crew, others)
- 2 open proposals with 3 real Denver events each
- Vote history from previous tests

**First-time login on any platform:**
- Accept notifications prompt (optional, but verify the modal appears)
- Dismiss onboarding if you see "What are you two into?" (or complete it to test personalization)

---

## TROUBLESHOOTING

### Build Won't Install / Gets Stuck

**iOS (Appetize):**
- Clear browser cache (hard refresh: Cmd+Shift+R on Mac, Ctrl+Shift+R on Linux)
- Try a different browser (Chrome, Firefox, Safari)
- If upload stalls: check file size (~50MB), try a slower connection

**iOS (Simulator):**
- If simctl fails: run `xcrun simctl erase all` and try again (clears all simulators)
- If .app won't extract: `tar` might be hung — try `7z x` or macOS Archive Utility

**Android (Sideload):**
- If adb can't find device: run `adb devices` to list; if blank, reconnect USB and retry
- If install fails with "failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE]": app is from an older build. Uninstall first: `adb uninstall app.togetherplans.datenight`

### App Crashes on Launch

- Verify you're connected to WiFi/mobile data (app needs to fetch suggestions)
- Try clearing app cache: Settings → Apps → TogetherPlans → Clear Cache
- If still crashing: kill and reopen
- Check browser console (web) for errors: F12, Console tab

### Can't Log In

- Verify email exactly matches: demo@togetherplans.app (no spaces)
- Verify password exactly: Demo1234! (capital D, the number 1, exclamation mark)
- If account locked: contact Jake via Telegram

### No Events Showing

- Verify location is set to Denver (39.7392, -104.9903) or your current city
- Check geolocation permission: Settings → Location → allow app access
- If still blank: check radius filter isn't set to 0 miles (look for radius picker in Discover)
- Refresh the suggestions: pull-to-refresh on iOS/Android, or reload page on web

### Vote Tally Won't Update

- Verify you're online
- Refresh the proposal: pull-to-refresh or reload page
- Try voting on a different option, then back
- If still stuck: this is a bug — report it with the platform and exact steps

### Guest Voting Link Returns 404

- Verify you're copying the FULL link from the share popup
- Make sure it's the /vote/ link, not a different share format
- Try in an incognito window (sometimes cookies interfere)
- If still 404: check that the proposal is still OPEN (not decided)

---

## VIEWING STORE ASSETS (Optional)

If you want to preview the screenshots and listing copy before App Store submission:

**Screenshots:**
- Local path: `/root/DateNight/mobile/store/screenshots/`
  - Two folders: `ios-6.9/` and `ios-6.7/` (required Apple sizes)
  - 6 PNGs per folder (Discover, Events list, Voting, Guest vote, Match, Landing)

**Listing copy:**
- Local path: `/root/DateNight/mobile/store/listing-copy.md`
- Markdown file with: name, subtitle, description, keywords, what's new, URLs

**Reviewer notes:**
- Local path: `/root/DateNight/mobile/store/resubmission-notes.md`
- Contains: demo account credentials, guest-vote feature explainer, v1.0→v1.2.0 rework note

---

## REMEMBER

- **These builds don't expire.** Download once, test as many times as you want.
- **Version 1.2.0 build 3 is final for submission.** No code changes after you approve.
- **Testing should take ~20 min per platform.** Longer if you find bugs (which is the point).
- **All three platforms (iOS, Android, web) should feel the same** — vote flows, guest links, event data are identical across all platforms.

---

## WHEN YOU'RE DONE

Reply to the email with:
1. ✅ **Testing complete** — platforms tested (iOS/Android/web)
2. 🐛 **Any bugs found** (describe what, where, how to reproduce)
3. 💬 **Any UX feedback** (flows you'd change before shipping)
4. 🔑 **Apple rejection reason** (copy from ASC web UI, if available)
5. ✋ **Ready to submit?** (Yes/No, or "after fix X")

---

**Build Date:** 2026-09-24  
**Status:** Ready for testing, not yet submitted to App Store
