# Figma Setup Guide for Jake

Get Figma set up in ~10 minutes so you and Jarvis can collaborate on designs visually.

---

## Step 1: Create a Figma Account

1. Go to [figma.com](https://figma.com)
2. Click **Get started for free**
3. Sign up with **Google** (1 click — no password needed)
4. Choose the **Starter** plan (free, always)

---

## Step 2: Create a New File

1. In Figma dashboard → **New design file**
2. Name it: `TogetherPlans Design System`
3. You'll land in the editor

---

## Step 3: Set Up Initial Frames (App Screens)

Create one frame per screen at **390×844** (iPhone 14/15 standard size).

Press **F** to activate the Frame tool, then draw or use the preset: `iPhone 14 & 15 Pro Max`.

Create frames named exactly:
| Frame Name | What It Is |
|------------|-----------|
| `Home / Dashboard` | Main feed / landing after login |
| `Groups` | List of user's groups |
| `Group Detail` | Single group view with members + proposals |
| `Proposal Detail` | Single proposal/plan view |
| `New Proposal` | Create proposal flow |
| `Suggestions` | AI-generated activity suggestions |
| `Profile / Settings` | User profile and account settings |
| `Login` | Sign-in screen |
| `Signup` | Registration screen |
| `Invite Members` | Invite flow for adding people to a group |

---

## Step 4: Set Up Color Styles

These match what's currently in the app. Add them as **Color Styles** (right panel → Fill → 4-dot icon → +).

| Style Name | Hex | Use |
|------------|-----|-----|
| `brand/primary` | `#FF4081` | Buttons, active states, highlights |
| `brand/primaryDark` | `#C60055` | Pressed state, dark variant |
| `brand/accent` | `#7c3aed` | Splash, secondary brand color |
| `surface/background` | `#FFFFFF` | Screen backgrounds |
| `surface/card` | `#F8F8F8` | Card backgrounds |
| `text/primary` | `#1A1A1A` | Body text, headings |
| `text/secondary` | `#666666` | Captions, muted text, placeholders |
| `ui/border` | `#E0E0E0` | Dividers, input borders |
| `status/success` | `#4CAF50` | Confirmed, approved states |
| `status/error` | `#F44336` | Errors, delete actions |
| `status/warning` | `#FF9800` | Warnings, pending states |

---

## Step 5: Set Up Text Styles

Add **Text Styles** (right panel → Text → 4-dot icon → +):

| Style Name | Font | Weight | Size |
|------------|------|--------|------|
| `heading/h1` | Inter or SF Pro | Bold (700) | 32 |
| `heading/h2` | Inter or SF Pro | Bold (700) | 24 |
| `heading/h3` | Inter or SF Pro | SemiBold (600) | 20 |
| `body/large` | Inter or SF Pro | Regular (400) | 16 |
| `body/medium` | Inter or SF Pro | Regular (400) | 15 |
| `body/small` | Inter or SF Pro | Regular (400) | 13 |
| `caption` | Inter or SF Pro | Regular (400) | 12 |
| `label/bold` | Inter or SF Pro | SemiBold (600) | 14 |
| `label/small` | Inter or SF Pro | SemiBold (600) | 11 |

> **Tip:** Install the **Inter** font from Google Fonts or use Figma's built-in Inter.

---

## Step 6: Share the File with Jarvis

1. In Figma → **Share** button (top right)
2. Change from "Only people invited" to **"Anyone with the link"** → **Can view**
3. Click **Copy link**
4. Send Jarvis the link

---

## Step 7: Generate a Personal Access Token

Jarvis needs this to read your Figma files programmatically.

1. Figma → click your avatar (top left) → **Settings**
2. Scroll to **Security** → **Personal access tokens**
3. Click **Generate new token**
4. Name it: `Jarvis Access`
5. Set expiration: `No expiration` (or 1 year)
6. **Copy the token** — it only shows once!

---

## Step 8: Get the File ID

From the Figma URL:
```
https://www.figma.com/design/FILE_ID/filename-here
```

The `FILE_ID` is the random string between `/design/` and the next `/`.

Example:
```
https://www.figma.com/design/AbCd1234EfGh/TogetherPlans-Design-System
                              ^^^^^^^^^^^^^^^^
                              This is the File ID: AbCd1234EfGh
```

---

## Step 9: Send Jarvis These Details

Once you have everything, send this message to Jarvis:

```
Figma token: [paste your personal access token]
File ID: [paste the file ID from the URL]
```

Jarvis will be able to read your designs, extract colors/assets, and implement changes from Figma frames directly.

---

## You're Done! 🎉

After this setup, the collaboration workflow is:
1. You design or annotate frames in Figma
2. You tell Jarvis "implement the Login frame from Figma" (or send a screenshot)
3. Jarvis implements it and pushes to a branch
4. You review the live preview URL that appears in GitHub
5. Approve → it goes to production
