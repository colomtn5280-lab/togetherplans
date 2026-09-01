# DateNight App — Screenshot Capture Guide

> **Who this is for:** Jake (non-developer). You're doing this manually on your Mac.
> **Goal:** Produce 6 polished screenshots for each iPhone size + Android, plus a Google Play Feature Graphic.

---

## Quick Reference Checklist

- [ ] iPhone 6.7" screenshots × 6 (1290 × 2796 px)
- [ ] iPhone 6.5" screenshots × 6 (1284 × 2778 px)
- [ ] Android phone screenshots × 6 (minimum 1080 × 1920 px, 9:16 ratio)
- [ ] Google Play Feature Graphic × 1 (1024 × 500 px)

---

## Part 1 — Required Screenshot Sizes

### iOS App Store Connect

| Device | Resolution | Status |
|---|---|---|
| iPhone 6.7" (iPhone 15 Pro Max) | **1290 × 2796 px** | ✅ REQUIRED |
| iPhone 6.5" (iPhone 14 Plus / 13 Pro Max) | **1284 × 2778 px** | ✅ REQUIRED — also covers 6.3" |
| iPad 12.9" | 2048 × 2732 px | ⛔ SKIP — our app has `supportsTablet=false` |

- **Recommended:** 6 screenshots per size
- **Maximum allowed:** 10 screenshots per size
- **Format:** PNG (no alpha/transparency issues)

### Google Play Store

| Asset | Spec | Status |
|---|---|---|
| Phone screenshots | Min 1080 × 1920 px · Max 3840 px on longest side · 9:16 ratio | ✅ REQUIRED (min 2, up to 8) |
| Feature Graphic | **1024 × 500 px** JPEG or PNG | ✅ REQUIRED for store listing |

---

## Part 2 — The 6 Screens to Capture (in order)

Capture these screens **in this exact order** — they tell a story and should flow left to right on the store listing.

---

### Screen 1 — Welcome / Landing

| Field | Detail |
|---|---|
| **Screen name in app** | Auth screen (login/signup) |
| **UI state to show** | The app launch / login screen — logo visible, clean, before the user has typed anything |
| **Caption overlay text** | `Stop asking "what do you want to do?"` |

**What to do:** Launch the app fresh. Make sure no text is pre-filled in any input field. The logo and tagline should be fully visible.

---

### Screen 2 — Create Group

| Field | Detail |
|---|---|
| **Screen name in app** | Groups list or Create Group screen |
| **UI state to show** | Either the empty groups list with the "Create Group" button prominent, or the Create Group form with a sample group name filled in |
| **Caption overlay text** | `Create a group in 30 seconds` |

**What to do:** If showing the form, pre-fill a group name like "Weekend Crew" so it looks real. Avoid showing test data or blank fields.

---

### Screen 3 — Propose Activity

| Field | Detail |
|---|---|
| **Screen name in app** | Proposal creation / activity options screen |
| **UI state to show** | The proposal screen with 3–5 activity options already added (e.g., "Bowling", "Sushi dinner", "Mini golf") |
| **Caption overlay text** | `Propose up to 5 activities` |

**What to do:** Add real-looking activities before capturing. The screen should look populated and lively, not empty.

---

### Screen 4 — Vote

| Field | Detail |
|---|---|
| **Screen name in app** | Voting screen |
| **UI state to show** | The voting screen mid-vote — some options with votes already shown, one highlighted as the user's current pick |
| **Caption overlay text** | `Everyone votes — no debates` |

**What to do:** Cast at least one vote before capturing so the screen shows active engagement, not a blank slate.

---

### Screen 5 — Suggestions

| Field | Detail |
|---|---|
| **Screen name in app** | Suggestions / discovery screen |
| **UI state to show** | The local activity suggestions screen with several suggestions populated (ideally with location-based results or sample data) |
| **Caption overlay text** | `Discover nearby activities` |

**What to do:** Make sure location permission is granted (or the app shows sample suggestions). Capture when the list is populated.

---

### Screen 6 — Consensus

| Field | Detail |
|---|---|
| **Screen name in app** | Consensus / locked-in screen |
| **UI state to show** | The final agreed-upon activity — the "you're going!" confirmation screen showing the winning choice |
| **Caption overlay text** | `Done. Now just go.` |

**What to do:** Navigate all the way through a proposal to the winning result screen. This should show the activity name and ideally some celebration/confirmation UI.

---

## Part 3 — Capturing on iOS Simulator (Step by Step)

> **You need:** A Mac with Xcode installed.

### Step 1 — Open the iOS Simulator

1. Open **Xcode** on your Mac.
2. In the menu bar, go to **Xcode → Open Developer Tool → Simulator**.
3. The Simulator app will open (may take a minute).

### Step 2 — Launch iPhone 15 Pro Max (6.7" screenshots)

1. In the Simulator menu bar, go to **File → Open Simulator**.
2. Select **iOS 17 (or latest) → iPhone 15 Pro Max**.
3. Wait for it to fully boot (you'll see the home screen).

### Step 3 — Build and run the app on the simulator

1. Go back to your project folder in Terminal.
2. Run: `npx expo start`
3. Press **`i`** to open in iOS Simulator — the DateNight app will install and launch.

### Step 4 — Navigate to each screen and capture

For **each of the 6 screens** (following the order in Part 2):

1. Navigate to that screen in the app.
2. Set up the UI state as described in Part 2.
3. Press **`Cmd + S`** on your keyboard — OR go to **File → Save Screen** in the Simulator menu.
4. The screenshot saves automatically to your **Desktop** as a `.png` file.

### Step 5 — Rename your files

After capturing all 6, rename them clearly:

```
screen1-welcome-67inch.png
screen2-creategroup-67inch.png
screen3-propose-67inch.png
screen4-vote-67inch.png
screen5-suggestions-67inch.png
screen6-consensus-67inch.png
```

### Step 6 — Verify the resolution

1. Right-click any PNG on your Desktop.
2. Select **Get Info**.
3. Look for **"More Info"** section — it shows pixel dimensions.
4. ✅ Must read: **1290 × 2796** pixels for iPhone 15 Pro Max.

### Step 7 — Repeat for iPhone 14 Plus (6.5" screenshots)

1. In Simulator, go to **File → Open Simulator → iPhone 14 Plus** (or iPhone 13 Pro Max).
2. Repeat Steps 3–5 above.
3. Rename files with `65inch` suffix:

```
screen1-welcome-65inch.png
screen2-creategroup-65inch.png
screen3-propose-65inch.png
screen4-vote-65inch.png
screen5-suggestions-65inch.png
screen6-consensus-65inch.png
```

4. Verify resolution: must read **1284 × 2778** pixels.

---

## Part 4 — Capturing on Android Emulator (Step by Step)

> **You need:** Android Studio installed on your Mac or PC. Or a physical Android phone.

### Option A — Android Emulator (Android Studio)

#### Step 1 — Open Android Studio and launch an emulator

1. Open **Android Studio**.
2. Click **Device Manager** (icon in the top-right toolbar, looks like a phone).
3. Find **Pixel 6 Pro** in the list (or any Pixel device).
4. Click the ▶ Play button to launch the emulator.
5. Wait for it to fully boot.

#### Step 2 — Run the app on the emulator

1. In your terminal, from the project folder: `npx expo start`
2. Press **`a`** to open in the Android emulator.
3. The DateNight app installs and launches.

#### Step 3 — Navigate and capture

For each of the 6 screens:

1. Navigate to the screen and set up the UI state (see Part 2).
2. In the **emulator toolbar** on the right side, click the **📷 camera icon** (Screenshot button).
3. The screenshot saves to your Desktop or `~/Android/Screenshots/` folder.

#### Step 4 — Rename files

```
screen1-welcome-android.png
screen2-creategroup-android.png
screen3-propose-android.png
screen4-vote-android.png
screen5-suggestions-android.png
screen6-consensus-android.png
```

#### Step 5 — Verify resolution

- Right-click → Get Info (Mac) or Properties (Windows).
- ✅ Must be at least **1080 × 1920 px**.
- ✅ Must be **9:16 ratio** (height is 1.777× the width).

---

### Option B — Physical Android Device

1. Navigate to the screen you want to capture.
2. Press **Volume Down + Power button** simultaneously.
3. Screenshot saves to your **Photos / Gallery app**.
4. Transfer to your computer via USB cable or AirDrop (if using a Mac).
5. Verify resolution (see Step 5 above).

---

## Part 5 — Adding Caption Overlays in Canva (Step by Step)

> **You need:** A free Canva account at [canva.com](https://canva.com).

### Step 1 — Create a new design for iPhone 6.7"

1. Go to [canva.com](https://canva.com) and log in.
2. Click **"Create a design"** (top right).
3. Click **"Custom size"**.
4. Enter: **Width: 1290** · **Height: 2796** · Unit: **px**.
5. Click **"Create new design"**.

### Step 2 — Upload your screenshot as the background

1. In the left panel, click **"Uploads"**.
2. Click **"Upload files"** and select `screen1-welcome-67inch.png`.
3. Once uploaded, click it — it appears on the canvas.
4. Click and drag the corners to make it fill the entire canvas (or right-click → **"Set image as background"**).

### Step 3 — Add a dark overlay behind the caption (optional but recommended)

> This makes white text readable over any background color.

1. In the left panel, click **"Elements"**.
2. Search for **"rectangle"** and add one.
3. Resize it to cover the area where your caption will go (top or bottom ~20% of the canvas).
4. Click the rectangle, click the color swatch, and set color to **black (#000000)**.
5. In the toolbar, reduce **Transparency** to about **40–50%**.

### Step 4 — Add the caption text

1. In the left panel, click **"Text"**.
2. Click **"Add a heading"**.
3. Type the caption for Screen 1: `Stop asking "what do you want to do?"`
4. In the text toolbar at the top:
   - **Font:** Search for and select `Montserrat` → choose **Bold**
   - **Color:** White (`#FFFFFF`)
   - **Size:** Start around 80–100 px and adjust so it fits on 2–3 lines comfortably
5. Position the text box over the dark overlay (top or bottom of screen).
6. Center-align the text (use the alignment buttons in the toolbar).

### Step 5 — Download as PNG

1. Click **"Share"** (top right) → **"Download"**.
2. File type: **PNG**.
3. Click **"Download"**.
4. Save as: `screen1-welcome-67inch-FINAL.png`.

### Step 6 — Repeat for all 6 screens

For each screen, either:
- **Duplicate the design** (right-click the page thumbnail → Duplicate) and swap the background image + caption text, OR
- Create a new design and repeat Steps 1–5.

**Caption text for each screen:**

| Screen | Caption |
|---|---|
| 1 — Welcome | `Stop asking "what do you want to do?"` |
| 2 — Create Group | `Create a group in 30 seconds` |
| 3 — Propose Activity | `Propose up to 5 activities` |
| 4 — Vote | `Everyone votes — no debates` |
| 5 — Suggestions | `Discover nearby activities` |
| 6 — Consensus | `Done. Now just go.` |

### Step 7 — Repeat for iPhone 6.5" and Android sizes

- **iPhone 6.5":** Create designs at **1284 × 2778 px** — upload the `65inch` screenshots.
- **Android:** Create designs at **1080 × 1920 px** — upload the `android` screenshots.

> 💡 **Canva tip:** You can use the **"Resize"** feature (paid plan) to quickly resize one design to another canvas size. If you're on free, just create a new design at the new size.

---

## Part 6 — Feature Graphic for Google Play (1024 × 500 px)

This is the **banner image** shown at the top of your Play Store listing. It's required.

### Step 1 — Create the design in Canva

1. Go to [canva.com](https://canva.com) → **"Create a design"** → **"Custom size"**.
2. Enter: **Width: 1024** · **Height: 500** · Unit: **px**.
3. Click **"Create new design"**.

### Step 2 — Set the background gradient

1. Click on the blank canvas (not an element).
2. In the left panel, click **"Background"** (or right-click canvas → "Background color").
3. Click **"+"** to add a gradient:
   - Start color: **`#7c3aed`** (deep purple)
   - End color: **`#aa3bff`** (bright purple)
   - Direction: Left to Right.

### Step 3 — Add the app name

1. Click **"Text"** → **"Add a heading"**.
2. Type: `DateNight`
3. Font: **Montserrat ExtraBold** (or any bold sans-serif).
4. Color: **White (`#FFFFFF`)**.
5. Size: ~150–180 px.
6. Position: **Center of the canvas**, slightly left of center if you're adding a phone mockup on the right.

### Step 4 — Add the tagline

1. Click **"Text"** → **"Add a subheading"**.
2. Type: `Plan Together. Go Together.`
3. Font: **Montserrat Regular** or **Light**.
4. Color: **White (`#FFFFFF`)** at ~80% opacity (for a softer look).
5. Size: ~50–60 px.
6. Position: Directly below the app name, centered.

### Step 5 — (Optional) Add a phone mockup

1. In the left panel, click **"Elements"** → search **"phone mockup"** or **"smartphone frame"**.
2. Choose a clean frame and place it on the right side of the canvas.
3. Inside the frame, place a screenshot of the app (from your captured screens).

### Step 6 — Download as JPEG

1. Click **"Share"** → **"Download"**.
2. File type: **JPEG**.
3. Quality: **High**.
4. Click **"Download"**.
5. Save as: `feature-graphic-play-store.jpg`.

---

## Part 7 — Uploading to App Stores

### iOS — App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. Click **"My Apps"** → select **DateNight: Plan Together**.
3. Click the **"App Store"** tab at the top.
4. Under the iOS App section, scroll down to **"Screenshots"**.
5. You'll see two sections: **6.7" Display** and **6.5" Display**.

**Upload 6.7" screenshots first (required):**

1. Click on the **6.7" Display** section.
2. Drag and drop your 6 `screen*-67inch-FINAL.png` files into the upload area — OR click **"+"** and select them.
3. **Order matters** — drag to reorder so Screen 1 (Welcome) is first and Screen 6 (Consensus) is last.

**Then upload 6.5" screenshots:**

1. Click on the **6.5" Display** section.
2. Upload your 6 `screen*-65inch-FINAL.png` files in the same order.

**Save and submit:**

1. Click **"Save"** in the top right.
2. Screenshots will be reviewed as part of your next app submission.

> ⚠️ **Note:** You cannot replace screenshots while a version is "In Review." Only edit them when no submission is pending.

---

### Android — Google Play Console

1. Go to [play.google.com/console](https://play.google.com/console).
2. Select your app: **DateNight**.
3. In the left sidebar, go to **"Store presence"** → **"Main store listing"**.
4. Scroll down to the **"Graphics"** section.

**Upload phone screenshots:**

1. Under **"Phone screenshots"**, click the upload box or drag your Android screenshots in.
2. Upload at least **2**, up to **8** screenshots.
3. Accepted formats: JPEG or PNG · Min size: 1080 × 1920 px · Max 3840 px on longest side.
4. Reorder by dragging so Screen 1 is first.

**Upload the Feature Graphic:**

1. Scroll up slightly to find the **"Feature graphic"** field (it's above the screenshots).
2. Click to upload `feature-graphic-play-store.jpg`.
3. Must be exactly **1024 × 500 px** JPEG or PNG.

**Save:**

1. Scroll to the bottom and click **"Save"**.
2. Changes go live after your next store listing review (usually within a few hours for graphics only).

---

## Final File Naming Reference

```
store/
├── screenshots/
│   ├── raw/                         ← unedited captures straight from simulator
│   │   ├── screen1-welcome-67inch.png
│   │   ├── screen2-creategroup-67inch.png
│   │   ├── screen3-propose-67inch.png
│   │   ├── screen4-vote-67inch.png
│   │   ├── screen5-suggestions-67inch.png
│   │   ├── screen6-consensus-67inch.png
│   │   ├── screen1-welcome-65inch.png
│   │   ├── ... (repeat for 65inch)
│   │   └── ... (repeat for android)
│   └── final/                       ← Canva exports with caption overlays
│       ├── screen1-welcome-67inch-FINAL.png
│       ├── screen2-creategroup-67inch-FINAL.png
│       ├── screen3-propose-67inch-FINAL.png
│       ├── screen4-vote-67inch-FINAL.png
│       ├── screen5-suggestions-67inch-FINAL.png
│       ├── screen6-consensus-67inch-FINAL.png
│       ├── screen1-welcome-65inch-FINAL.png
│       ├── ... (repeat for 65inch)
│       ├── screen1-welcome-android-FINAL.png
│       ├── ... (repeat for android)
│       └── feature-graphic-play-store.jpg
└── screenshot-guide.md              ← this file
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Simulator screenshot is wrong size | Make sure you selected the **exact** device model. iPhone 15 Pro Max = 6.7". Check Get Info after saving. |
| App crashes on simulator | Run `npx expo start --clear` to reset the cache, then relaunch. |
| Canva design looks blurry | Zoom in on the canvas — Canva may just be previewing at lower res. Always download at full quality. |
| App Store Connect rejects screenshot | Check pixel dimensions exactly. Must be 1290×2796 or 1284×2778. Even 1px off may fail. |
| Play Store says "wrong aspect ratio" | Image must be 9:16. Use 1080×1920 or 1242×2208. Do not crop to a square. |
| Feature Graphic upload fails | Make sure it is exactly 1024×500 px. Download from Canva as JPEG, not PNG, if JPEG is required. |

---

*Last updated: September 2026 · App: DateNight (app.togetherplans.datenight) · Platform: Expo React Native*
