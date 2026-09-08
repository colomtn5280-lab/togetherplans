# Preview Deployment Setup

## Overview

Every push to a non-`main` branch automatically builds the Expo web app and deploys it to **Cloudflare Pages**. Jake gets a unique preview URL per branch, visible in GitHub PR comments.

**Preview URL format:** `https://branch-name.togetherplans-preview.pages.dev`

---

## Option A: Cloudflare Pages (Recommended — Free Tier)

Cloudflare Pages free tier includes:
- ✅ Unlimited preview deployments
- ✅ Custom `*.pages.dev` subdomain per project
- ✅ Branch-specific preview URLs
- ✅ Global CDN

### Step 1: Create a Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com) → **Sign Up** (free)
2. Verify your email address

### Step 2: Create the Pages Project

1. In the Cloudflare dashboard → **Pages** → **Create a project**
2. Choose **Direct Upload** (we're deploying via GitHub Actions, not Cloudflare's git integration)
3. Project name: `togetherplans-preview`
4. Click **Create project**

### Step 3: Get Your Cloudflare API Token

1. Cloudflare dashboard → click your profile (top right) → **My Profile**
2. → **API Tokens** → **Create Token**
3. Use the **Edit Cloudflare Workers** template (or Custom token with Pages:Edit permission)
4. Under **Account Resources**: select your account
5. Under **Zone Resources**: All zones (or None if Pages-only)
6. Click **Continue to summary** → **Create Token**
7. **Copy the token** — it only shows once

### Step 4: Get Your Account ID

1. Cloudflare dashboard → right sidebar shows **Account ID**
2. Copy it

### Step 5: Add Secrets to GitHub

1. Go to your GitHub repo: `github.com/YOUR_USERNAME/DateNight`
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. Add these two secrets:
   - `CLOUDFLARE_API_TOKEN` → paste the token from Step 3
   - `CLOUDFLARE_ACCOUNT_ID` → paste the Account ID from Step 4

That's it! Now every push to a non-main branch triggers a build and deploy.

---

## Option B: Vercel (Slightly Easier Setup)

Vercel also has a free tier with branch previews.

### Step 1: Install Vercel CLI and link project

```bash
npm install -g vercel
cd /root/DateNight/mobile
vercel link
```

### Step 2: Get Vercel credentials

```bash
vercel whoami  # confirm you're logged in
```

From [vercel.com/account/tokens](https://vercel.com/account/tokens) → **Create** → copy token.

### Step 3: Replace the deploy step in web-preview.yml

Replace the **Deploy to Cloudflare Pages** step with:

```yaml
- name: Deploy to Vercel
  run: |
    npm install -g vercel
    vercel deploy --prod=false --token=${{ secrets.VERCEL_TOKEN }} \
      --scope=${{ secrets.VERCEL_ORG_ID }} \
      --yes \
      mobile/dist
  env:
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
```

Required GitHub Secrets: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`

---

## How Preview URLs Work

| Branch | Preview URL |
|--------|------------|
| `figma-sync` | `https://figma-sync.togetherplans-preview.pages.dev` |
| `fix-login` | `https://fix-login.togetherplans-preview.pages.dev` |
| `feature/new-ui` | `https://feature-new-ui.togetherplans-preview.pages.dev` |

**In Pull Requests:** A bot comment is posted automatically with the preview URL when the build completes.

**For direct branch pushes:** Check the GitHub Actions run for the URL, or construct it from the branch name (lowercase, dashes instead of slashes/underscores).

---

## Verification Checklist

After setup, push any branch and verify:

- [ ] GitHub Actions → **Web Preview** workflow runs green
- [ ] Preview URL loads in browser
- [ ] PR comment appears with the URL (if pushing via PR)
- [ ] Mobile preview via EAS Update works (see `mobile/eas-update-setup.md`)
