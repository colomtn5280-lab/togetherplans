# Design Collaboration Workflow

How Jake and Jarvis collaborate on UI changes — from idea to live preview to production.

---

## The Full Loop

```
Jake has an idea / Figma design
         ↓
Jake sends Jarvis: screenshot, description, or Figma link
         ↓
Jarvis creates a feature branch + implements the change
         ↓
GitHub Actions builds & deploys web preview (automatic)
         ↓
Jake reviews at preview URL (browser + phone)
         ↓
Jake approves → Jarvis merges to main → production deploy
```

---

## Step-by-Step

### 1. Jake sends a change request

Send Jarvis any of these:
- A Figma frame screenshot ("make the login screen look like this")
- A text description ("the proposal cards need more padding and the status badge should be pill-shaped")
- A Figma link with the file ID ("update screen X to match frame Y")

### 2. Jarvis implements on a branch

Jarvis creates a branch (e.g., `figma-sync`, `fix-proposal-cards`) and pushes the changes. No action needed from Jake.

### 3. Get the preview URL

**If you opened a Pull Request:**  
A bot posts a comment automatically. Look for:
```
🌐 Web Preview Ready
Branch: figma-sync
Preview URL: https://figma-sync.togetherplans-preview.pages.dev
```

**For branch pushes (no PR):**  
Go to `github.com → Actions → Web Preview → latest run → summary` — the URL is printed there.

Or just construct it:
```
https://[branch-name].togetherplans-preview.pages.dev
```

### 4. Jake reviews the preview

Open the URL on:
- **Desktop browser**: full layout check
- **iPhone/Android browser**: mobile responsiveness
- **Expo Go app** (for native features): scan the QR from `eas-update-setup.md`

### 5. Jake gives feedback

Options:
- ✅ **Approve**: "Looks good, merge it" → Jarvis merges to main
- 🔄 **Request changes**: Describe what needs adjusting (screenshot preferred) → Jarvis updates the same branch → preview URL auto-updates
- ❌ **Reject**: "Not what I wanted" + description → Jarvis revises or abandons branch

### 6. Merge to production

Once Jake approves, Jarvis merges the branch to `main`. The existing CI/CD pipeline handles production deployment.

---

## Tips for Better Feedback

| Instead of... | Try... |
|---------------|--------|
| "The colors look off" | "The button should be `#FF4081`, currently it looks purple" |
| "Something's wrong with the layout" | "On iPhone, the card titles are getting cut off — screenshot attached" |
| "Make it look nicer" | "More whitespace between items, rounder corners like Figma frame 'Home v2'" |

**Screenshots are gold.** Circle the thing you're referring to.

---

## Branch Naming Conventions

| Type | Branch Name |
|------|------------|
| Figma design sync | `figma-sync` or `design/screen-name` |
| Bug fix | `fix/issue-description` |
| New feature | `feat/feature-name` |
| Experiment | `exp/what-im-trying` |

---

## Timeline Expectations

| Action | How long |
|--------|----------|
| Jarvis implements change | Minutes to ~1 hour depending on complexity |
| GitHub Actions build | ~3-5 minutes |
| Preview URL live | ~5 minutes after Jarvis pushes |
| Production deploy after approve | ~10 minutes |
