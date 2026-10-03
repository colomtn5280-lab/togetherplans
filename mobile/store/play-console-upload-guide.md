# Google Play Console Upload Guide
### DateNight: Plan Together — Android Production Release

**For:** Jake  
**Build:** EAS build ID `b4cfd99e`  
**Bundle ID:** `app.datemeup.datenight`

---

## 1. BEFORE YOU START — Checklist

Complete every item before opening Play Console:

- [ ] Google Play Developer account active — [play.google.com/console](https://play.google.com/console)
- [ ] Production AAB downloaded from EAS — [expo.dev/accounts/colomtn5280s-team/projects/datemeup/builds](https://expo.dev/accounts/colomtn5280s-team/projects/datemeup/builds) (build ID: **b4cfd99e**)
- [ ] Store listing copy ready — see `listing-copy.md` in this folder
- [ ] At least 2 phone screenshots ready
- [ ] Feature graphic ready (1024 × 500 px, JPG or PNG)
- [ ] App icon ready — **512 × 512 PNG, no alpha channel** — file is at `~/DateNight/mobile/assets/icons/icon-512.png`

---

## 2. CREATE THE APP (skip if already created)

1. Go to [play.google.com/console](https://play.google.com/console)
2. Click **All apps** > **Create app**
3. Fill in:
   - **App name:** `DateNight: Plan Together`
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Check both policy agreement boxes
5. Click **Create app**

---

## 3. UPLOAD THE AAB

1. In the left sidebar go to **Testing > Internal testing**
2. Click **Create new release**
3. Under **App bundles**, click **Upload**
4. Select your `.aab` file (downloaded from EAS build `b4cfd99e`)
5. **Release name:** `1.0.0` _(auto-filled from versionName in app.json)_
6. **Release notes:** `First release of DateNight: Plan Together`
7. Click **Save**, then **Review release**, then **Start rollout to Internal testing**

> **Tip:** Internal testing lets you install the app on your own devices immediately, without waiting for review. Do this first to smoke-test the production build before submitting to production.

---

## 4. COMPLETE STORE LISTING

Sidebar: **Store presence > Main store listing**

| Field | Value |
|---|---|
| App name | `DateNight: Plan Together` |
| Short description (max 80 chars) | `Plan dates and group activities. Vote, decide, go.` |
| Full description | Paste from `listing-copy.md` |

**Graphics to upload:**

- **App icon** — 512 × 512 PNG, no alpha → use `icon-512.png` from `assets/icons/`
- **Feature graphic** — 1024 × 500 JPG or PNG
- **Phone screenshots** — at least 2 (see `screenshot-guide.md` for dimensions and tips)

Click **Save** when done.

---

## 5. COMPLETE DATA SAFETY FORM

Sidebar: **Policy > Data safety**

Click **Start** and answer each question as follows:

**Does your app collect or share any of the required user data types?**
→ **YES**

**Data types collected:**

| Category | Data type | Collected | Required? | Purpose | Shared? |
|---|---|---|---|---|---|
| Personal info | Email address | ✅ Yes | Required | Account management | Not shared |
| Personal info | Name (Display Name) | ✅ Yes | Required | App functionality | Shared with other users in groups |
| Location | Approximate location | ✅ Yes | Optional | App functionality (nearby suggestions) | Not shared |

**Additional questions:**

- Is all user data encrypted in transit? → **YES**
- Do you provide a way for users to request deletion? → **YES**
- **Privacy policy URL:** `https://api.datemeup.app/privacy`

Click **Save**.

---

## 6. COMPLETE CONTENT RATING

Sidebar: **Policy > App content > Content rating**

1. Click **Start questionnaire**
2. **Category:** Productivity _(or Lifestyle if Productivity isn't listed)_
3. Answer every question:
   - Violence → **NO**
   - Sexual content → **NO**
   - Profanity → **NO**
   - Controlled substances → **NO**
   - Gambling → **NO**
4. Click **Submit**

**Expected rating: Everyone (E)** ✅

---

## 7. SET CONTACT DETAILS

Sidebar: **Store presence > Store settings**

| Field | Value |
|---|---|
| Email address | `hello@datemeup.app` |
| Privacy policy URL | `https://api.datemeup.app/privacy` |

Click **Save**.

---

## 8. SUBMIT FOR REVIEW

Before submitting, confirm the Play Console dashboard shows **no outstanding tasks** (the setup checklist on the left sidebar should show all items complete with green checkmarks).

1. Sidebar: **Publishing > Production**
2. Click **Review release** and confirm everything looks correct
3. Click **Start rollout to Production** (or submit for review if prompted)

> **Note:** First-time submissions typically take **3–7 business days** to review. You'll receive an email when the decision is made.

---

## 9. MOVE TO FULL PRODUCTION (after initial rollout)

Start with a staged rollout to catch any production issues early:

1. Sidebar: **Production > Create new release** (or promote from internal testing)
2. Set rollout to **20%** initially
3. Monitor crash rates and ANRs in **Android Vitals** for 24–48 hours
4. If stable, increase rollout: 20% → 50% → 100%

---

*Last updated for build `b4cfd99e` / version 1.0.0*
