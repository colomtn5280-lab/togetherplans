# TogetherPlans v1.2.0 Testing Review Pack

**Build Date:** September 24, 2026  
**Version:** 1.2.0  
**iOS Build:** 3  
**Android versionCode:** 3  

---

## 🔗 BUILD DOWNLOAD LINKS

### iOS
- **Production IPA** (for App Store submission, requires Appetize)
  - URL: https://expo.dev/artifacts/eas/2Z7WcqcjzmX0Kplz1GDStmQIxrrqizsbDfgaO3Zw6jA.ipa
  - Build ID: f445f7ce-71aa-4ad8-819a-e58024207a23
  - Status: FINISHED
  - **How to test:** Download the IPA and upload to Appetize.io (you don't own an iPhone). Create a free Appetize account, upload this file, and test in the browser simulator.

- **Simulator Build** (faster alternative for quick testing)
  - URL: https://expo.dev/artifacts/eas/rZ9QWQvb8hUdbrOO_t3c2g7oLj3RdyQzK3OjGtxzIFI.tar.gz
  - Build ID: 45e401eb-82b9-4646-a9bc-ab24dc81e0ab
  - Status: FINISHED
  - **How to test:** Extract the .tar.gz on macOS, run with `xcrun simctl install booted <path>`. If you're on Linux, use Appetize instead.

### Android
- **Production AAB** (for Play Store submission)
  - URL: https://expo.dev/artifacts/eas/vwz5j0l7d7dFr0JyR0GujPzQGNpsvANB2H65KYzhz6E.aab
  - Build ID: 276b65e8-4e29-4843-944d-7c8034126a1d
  - Status: FINISHED
  - **How to test:** Download and sideload on an Android device via `adb install <file.aab>`, or upload to Google Play Console's internal testing track. For rapid iteration: use Android Studio's emulator.

### Web
- **Production Site:** https://togetherplans.app
- **Test Account:** demo@togetherplans.app / Demo1234!
- **Status:** Live on Cloudflare Pages (auto-deployed from main branch)

---

## 📋 WHAT TO TEST

### All Platforms (iOS, Android, Web)
1. **Login Flow**
   - Use demo@togetherplans.app / Demo1234!
   - Verify dashboard loads without blank screens
   - Check that groups appear ("Review Crew")

2. **Discover Page**
   - View the 15 event categories (now with Sports & Active replacing Golf)
   - Tap "Tonight near me" banner — should show local events (Denver area)
   - Verify colors and category tiles render correctly
   - Scroll through categories and tap one

3. **Event Listings by Category**
   - Concerts/Comedy: should show real Ticketmaster events with images (e.g., Erykah Badu, Four Tet)
   - Family Events: real NPS park suggestions + stock show events
   - Local Experiences: mix of Ticketmaster + Viator tours (e.g., ghost tours, mountain hikes)
   - Wine & Drinks: Foursquare + Viator (Stranahan's Distillery $22, cocktail tours)
   - Hotel Stays: real hotels via LiteAPI (Hyatt Regency, Element by Marriott, all in Denver with ratings)
   - Verify event cards show: name, image, distance, rating (if available)

4. **Radius Filter**
   - Verify default is 25 miles
   - Change to 150 miles — should show more results, esp. hotels and experiences
   - Verify geolocation works (should default to Denver for this test account)

5. **Voting / Proposal Flow**
   - Go to Plans tab (or Dashboard on web)
   - Open the "Weekend plans" or "Friday date night" proposal (seeded data)
   - Verify 3 event options appear with images and descriptions
   - Tap/click to vote on an option
   - Check that vote tallies update in real-time (e.g., "1/2 votes")

6. **Guest Voting Link**
   - From an open proposal, create/copy the guest voting link (should be togetherplans.app/vote/<token>)
   - Open the link in an incognito/private window (no login needed)
   - Verify you can vote WITHOUT creating an account
   - Confirm the vote is recorded and the tally updates for the original user

7. **After Dark**
   - Tap the "After Dark" nav item (top-right moon icon)
   - Verify it shows a filtered subset of evening/late-night activities
   - Age rating is 17+ — should display responsibly (no explicit content)

8. **Onboarding (First Time Only, or Delete + Reinstall)**
   - If you delete and reinstall, you should see "What are you two into?" personalization
   - Select a few interests (sports, comedy, music, etc.)
   - Verify these preferences show up in Discover (highlighted categories, tailored filters)

### iOS-Specific
- Verify notification prompts appear (iOS will ask for push permission)
- Test back gesture; verify navigation doesn't break
- Check that images load and aren't pixelated
- Verify font sizes are readable on different iPhone sizes (if testing on multiple simulators)

### Android-Specific
- Test back button navigation
- Verify notification permission prompt
- Check color rendering (some brands render differently)
- Test on both phone and tablet aspect ratios (if available)

### Web-Specific
- Test responsive design (resize browser to mobile width, tablet, desktop)
- Verify all images load
- Check that the dashboard doesn't render blank (this was a bug, now fixed)
- Verify vote links work from the browser

---

## 🎯 KEY FEATURES TO VERIFY (v1.2.0 Improvements)

✅ **Guest Voting** — invite friends via shareable link, no account needed  
✅ **Real Hotel Data** — LiteAPI integration for 25+ hotels in Denver  
✅ **Real Experiences** — Viator tours (15 options, affiliate links)  
✅ **Tonight Near Me** — shows events happening in the next 2-4 hours  
✅ **Sports & Active** — replaces Golf with broader active categories  
✅ **Radius Picker** — 10/25/60/150 miles, with zip-code override  
✅ **Rich Previews** — vote links unfurl with OG images on WhatsApp, Slack, etc.  
✅ **Notifications** — push alerts for holdout/guest votes (holdout feature is in beta, behind a flag)  
✅ **Empty-State Sweep** — cleaner UI for new users, clear CTAs  
✅ **Onboarding Personalization** — "What are you two into?" to seed preferences  
✅ **Vote Carryover** — if you solo-start a plan, your votes carry over when your partner joins  
✅ **Dashboard Fix** — blank dashboard for users with multiple groups is now fixed  

---

## 🐛 KNOWN ISSUES (Non-Blockers for Submission)

- Proposal cards don't have horizontal padding on mobile viewports (cards go edge-to-edge) — cosmetic
- Restaurants with Foursquare sometimes lack images (photos aren't fully wired) — does not affect Hotels or Experiences
- Family events occasionally return Jan stock-show events in Sept query (date filter edge case) — minor
- Dashboard onboarding modal backdrop is slightly transparent — polish item

**None of these block this submission.**

---

## 📸 STORE SCREENSHOTS (Included in This Build)

Screenshots were captured at Apple's required sizes:
- **1320x2868** (6.9" iPhone display)
- **1290x2796** (6.7" iPhone display)

6 screens per size, captured from production web app with real Denver data:
1. **Discover grid** — Tonight banner + colored category tiles
2. **Events list** — Real Ticketmaster concerts with artist photos + distance
3. **Voting screen** — Proposal with 3 option cards, vote tallies
4. **Guest-vote page** — /vote/<token> public page (no login)
5. **Match/decided state** — 🏆 winner card + share options
6. **Landing hero** — App intro + platform badges (hidden from App Store to avoid platform-mention trap)

All screenshots are pixel-perfect, no transparency, verified dimensions.

---

## 📝 STORE LISTING

**App Name:** TogetherPlans: Plan Together (28 chars)  
**Subtitle:** Decide date nights together (27 chars)  
**Keywords:** date night,couples,events near me,group vote,things to do,activity,local events,decide,night out (96 chars, no app-name duplication)  
**Description:** ~2030 chars, leads with core loop: browse real events → propose 2-5 → everyone votes → it's a match. Mentions guest voting (no account), Tonight, 15 categories, 150mi radius, After Dark (one mention, tasteful).  
**What's New (v1.2.0):** Honest highlights — guest voting, Tonight, real data, Sports & Active, radius control, plan builder, notifications, solo start, vote carryover.  
**Support URL:** https://togetherplans.app/support (verified 200)  
**Privacy URL:** https://api.togetherplans.app/privacy (verified 200)  
**Age Rating:** 17+  
**Demo Account:** demo@togetherplans.app / Demo1234! (seeded with Review Crew group + Weekend plans proposal, 3 real Denver events)

---

## 🚀 NEXT STEPS (After Your Testing)

1. **Test the builds** (iOS via Appetize, Android on device/emulator, web in browser)
2. **Report back** with any bugs, UX issues, or features you want to tweak
3. **Provide Apple rejection reason** (from ASC web UI) so I can sharpen reviewer notes
4. **Confirm ready to submit** and I'll:
   - Upload screenshots + listing to ASC
   - Attach the iOS binary to the v1.2.0 version
   - Cancel the two stale stuck submissions (v1.0, v1.1)
   - Finalize reviewer notes
   - Submit to Apple for review

---

## 📧 HOW TO REACH ME

Found an issue? Just reply to this email with:
- **Platform** (iOS/Android/web)
- **Screen/flow** (e.g., "Voting screen")
- **What happened** (e.g., "vote tally didn't update")
- **Steps to reproduce** (if not obvious)

I'm standing by. Testing shouldn't take more than 20 min per platform.

---

**Build prepared:** 2026-09-24 18:00 UTC  
**Status:** Ready for your testing and approval before App Store submission
