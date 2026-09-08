# EAS Update Preview Setup

## What this gives you

Every branch gets a **QR code and shareable URL** to preview the app on a real device — no App Store submission, no native build wait. Jake opens the link in Expo Go on his phone and sees live changes instantly.

## One-time setup (Jake runs these)

```bash
cd /root/DateNight/mobile

# Install EAS CLI globally if not already
npm install -g eas-cli

# Login to Expo (use the colomtn5280s-team account)
eas login

# Set up EAS Update (run once per project)
eas update:configure
```

When `eas update:configure` finishes it will:
1. Add `expo-updates` channel config to app.json automatically
2. Create `preview` and `production` channels on expo.dev

## Per-branch preview (automatic after setup)

After setup, every push to a branch creates a shareable update:

```bash
# Push a preview update for any branch
eas update --branch=your-branch-name --message="Preview: [describe change]"

# Examples:
eas update --branch=figma-sync --message="Design sync from Figma"
eas update --branch=fix-login-ui --message="Login screen polish"
```

## The URL format

```
https://expo.dev/@colomtn5280s-team/togetherplans?serviceType=eas&distribution=expo-go&appScheme=togetherplans&channel=your-branch-name
```

Replace `your-branch-name` with the actual branch (e.g., `figma-sync`).

Opens in **Expo Go** app on iPhone/Android — no build step needed.

## Tip: Add EAS Update to GitHub Actions

To make every push auto-publish a preview, add this step to `.github/workflows/web-preview.yml`:

```yaml
- name: Publish EAS Update (mobile preview)
  run: eas update --branch=${{ github.ref_name }} --message="Auto preview: ${{ github.sha }}" --non-interactive
  env:
    EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

Then add `EXPO_TOKEN` to GitHub Secrets (get it from expo.dev → Account Settings → Access Tokens).
