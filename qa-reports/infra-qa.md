# DateNight / TogetherPlans — Infrastructure & CI/CD QA Report
**Date:** 2026-09-20  
**Auditor:** Hermes subagent  
**Commit at time of audit:** 56494f9 → 4291e20 (post-fix)

---

## 1. CI/CD Pipeline Status

### 1.1 Workflow Files

| Workflow | File | Trigger |
|---|---|---|
| Test & Deploy | `.github/workflows/deploy.yml` | push/PR to `main` |
| Web Deploy | `.github/workflows/web-deploy.yml` | push to `main` (web/** paths) |
| Web Preview | `.github/workflows/web-preview.yml` | push non-main + PR to main |

### 1.2 Latest CI Run Results (commit 56494f9)

**Run ID: 35514091372 — `Test & Deploy` — ✅ SUCCESS**

| Step | Result |
|---|---|
| npm ci | ✅ |
| Audit (block on high/critical) | ✅ |
| npm run typecheck | ✅ |
| npm run lint | ✅ |
| npm test | ✅ |
| google-github-actions/auth@v2 | ✅ |
| Deploy to Cloud Run | ✅ |

All 5 prior failures (commits deb7648 through 2f3d109) were systematically fixed in the same session:
- `deb7648`: lint errors + web-deploy dist path wrong
- `87d4e62`: ESM mock for expo-server-sdk failing
- `2f3d109`: Cloud SQL Proxy migration step failing in CI (removed — migrations run manually)
- `56494f9`: ✅ full green

### 1.3 Workflow History — Recent Runs

| SHA | Workflow | Result | Notes |
|---|---|---|---|
| 56494f9 | Test & Deploy | ✅ success | Current HEAD before this audit |
| 2f3d109 | Test & Deploy | ❌ failure | DB migration step in CI (now removed) |
| 87d4e62 | Test & Deploy | ❌ failure | expo-server-sdk ESM mock |
| eb3d421 | Web Deploy | ✅ success | |
| eb3d421 | Test & Deploy | ❌ failure | lint errors |

---

## 2. GitHub Secrets Audit

**Secrets found in repo (`colomtn5280-lab/togetherplans`):**

| Secret | Set | Updated |
|---|---|---|
| `WIF_PROVIDER` | ✅ | 2026-08-30 |
| `WIF_SERVICE_ACCOUNT` | ✅ | 2026-08-30 |
| `CLOUDFLARE_API_TOKEN` | ✅ | 2026-09-20 |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | 2026-09-20 |
| `DATABASE_URL` | ✅ | 2026-08-30 |
| `DATABASE_URL_DIRECT` | ✅ | 2026-08-30 |
| `CLOUD_SQL_INSTANCE` | ✅ | 2026-08-30 |
| `CORS_ORIGIN` | ✅ | 2026-08-30 |
| `DB_PASS` | ✅ | 2026-08-30 |
| `JWT_SECRET` | ✅ | 2026-08-30 |

**Assessment:**
- `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` are set — Workload Identity Federation auth works (confirmed by successful deploy step in run 35514091372).
- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set — web-deploy workflow has the credentials it needs.
- `DATABASE_URL`, `DATABASE_URL_DIRECT`, `CLOUD_SQL_INSTANCE`, `CORS_ORIGIN`, `DB_PASS`, `JWT_SECRET` are legacy secrets (were used by older Cloud SQL Proxy migration approach, now removed from CI). They're harmless to keep.

**No missing secrets that block CI.**

---

## 3. Cloud Run Environment Variables

**Service:** `datenight-api`  
**Region:** `us-central1`  
**Project:** `project-1af074d7-228e-4a43-bc9`  
**Latest Ready Revision:** `datenight-api-00046-sqz`  
**Status:** ✅ Ready

### 3.1 Environment Variables (direct values)

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://togetherplans.app,https://www.togetherplans.app,https://api.togetherplans.app` |
| `APPLE_KEY_ID` | `UTXS68NYSJ` |
| `APPLE_TEAM_ID` | `234UWRXT57` |
| `APPLE_SERVICES_ID` | `com.togetherplans.datenight.web` |

### 3.2 Secrets Mounted from GCP Secret Manager

| Variable | Secret | Status |
|---|---|---|
| `JWT_SECRET` | `JWT_SECRET` | ✅ |
| `RESEND_API_KEY` | `RESEND_API_KEY` | ✅ |
| `TMDB_API_KEY` | `TMDB_API_KEY` | ✅ |
| `YELP_API_KEY` | `YELP_API_KEY` | ✅ |
| `DATABASE_URL` | `DATABASE_URL` | ✅ |
| `GOOGLE_MAPS_API_KEY` | `GOOGLE_MAPS_API_KEY` | ✅ |
| `TICKETMASTER_API_KEY` | `TICKETMASTER_API_KEY` | ✅ |
| `TICKETMASTER_SECRET` | `TICKETMASTER_SECRET` | ✅ |
| `FOURSQUARE_API_KEY` | `FOURSQUARE_API_KEY` | ✅ (mounted, unused — see §3.3) |
| `FOURSQUARE_CLIENT_ID` | `FOURSQUARE_CLIENT_ID` | ✅ |
| `FOURSQUARE_CLIENT_SECRET` | `FOURSQUARE_CLIENT_SECRET` | ✅ |
| `EVENTBRITE_PRIVATE_TOKEN` | `EVENTBRITE_PRIVATE_TOKEN` | ✅ |
| `PREDICTHQ_API_TOKEN` | `PREDICTHQ_API_TOKEN` | ✅ |
| `INTERNAL_CRON_KEY` | `INTERNAL_CRON_KEY` | ✅ |

### 3.3 Env Var Gaps & Notes

| Variable | Status | Notes |
|---|---|---|
| `RESEND_API_KEY` | ✅ set | Confirmed in Cloud Run secrets mount |
| `APP_URL` | ⚠️ not set | Code falls back to `'https://togetherplans.app'` — acceptable default |
| `REDIS_URL` | ⚠️ not set | Code uses in-memory cache fallback when absent — acceptable |
| `NPS_API_KEY` | ⚠️ not set | NPS source skips gracefully when absent |
| `FOURSQUARE_API_KEY` | ⚠️ mounted but unused | Code uses `FOURSQUARE_CLIENT_ID`/`FOURSQUARE_CLIENT_SECRET`. The `FOURSQUARE_API_KEY` secret is mounted unnecessarily — low priority cleanup |
| `APPLE_PRIVATE_KEY` | ℹ️ not set | Sign in with Apple backend flow not yet implemented in code |
| `HOST`, `PORT`, `JWT_EXPIRES_IN`, `LOG_LEVEL` | ℹ️ not set | All have acceptable defaults in Cloud Run (PORT auto-set, others fall back) |

**All critical runtime vars are present. No blocking gaps.**

---

## 4. GCP Secret Manager

14 secrets total in project:

```
DATABASE_URL              EVENTBRITE_PRIVATE_TOKEN  FOURSQUARE_API_KEY
FOURSQUARE_CLIENT_ID      FOURSQUARE_CLIENT_SECRET  GOOGLE_MAPS_API_KEY
INTERNAL_CRON_KEY         JWT_SECRET                PREDICTHQ_API_TOKEN
RESEND_API_KEY            TICKETMASTER_API_KEY      TICKETMASTER_SECRET
TMDB_API_KEY              YELP_API_KEY
```

All are mounted in the Cloud Run service. ✅

---

## 5. Cloudflare Pages

| Project | Subdomain | Status |
|---|---|---|
| `togetherplans` | `togetherplans.pages.dev` | ✅ exists (created 2026-09-07) |
| `togetherplans-preview` | — | ❌ does not exist |

**Issue found:** `web-preview.yml` was deploying to project `togetherplans-preview` which doesn't exist in the CF account. This would cause the workflow to fail on first run.

**Fix applied (commit 4291e20):** Changed to deploy preview branches to the existing `togetherplans` project. CF Pages natively creates preview URLs per branch: `https://<branch>.togetherplans.pages.dev`. The PR comment URL was updated to match.

---

## 6. Workflow Audit — Issues Found & Fixed

### 6.1 `web-preview.yml` — `togetherplans-preview` project missing (FIXED)

**Before:**
```yaml
command: pages deploy mobile/dist --project-name=togetherplans-preview --branch=...
const url = `https://${branch}.togetherplans-preview.pages.dev`;
```

**After (commit 4291e20):**
```yaml
command: pages deploy mobile/dist --project-name=togetherplans --branch=...
const url = `https://${branch}.togetherplans.pages.dev`;
```

### 6.2 `deploy.yml` — Missing `--project` flag (FIXED)

`gcloud run deploy` didn't pass `--project` explicitly. WIF auth sets project context implicitly (and CI was passing), but explicit is safer and avoids ambiguity if gcloud default project changes.

**Fix:** Added `--project project-1af074d7-228e-4a43-bc9` to the gcloud command.

### 6.3 `web-preview.yml` — Remaining known issue (NOT a blocker)

The `defaults.run.working-directory: mobile` only applies to `run:` steps, not `uses:` actions. The wrangler-action runs from repo root and uses `mobile/dist` as the path — this is **correct behaviour** and not a bug.

### 6.4 `web-preview.yml` — Trigger scope

Fires on ALL non-main branch pushes (backend, mobile, web, etc.), not just `web/**` or `mobile/**` paths. This causes unnecessary CI runs. Not critical but wastes minutes.

**Recommendation:** Add `paths:` filter:
```yaml
paths:
  - 'mobile/**'
  - '.github/workflows/web-preview.yml'
```

---

## 7. Live Service Health

| Service | URL | Status |
|---|---|---|
| Backend API | https://api.togetherplans.app | ✅ active (rev 00046, health endpoint responding) |
| Web | https://togetherplans.app | ✅ CF Pages |
| Cloud SQL | `datenight-db` (us-central1) | ✅ connected via Cloud SQL connector |

Cloud Run logs show active traffic (POST /api/proposals, GET /health) with no errors. WARNING-level log entries have empty textPayload — these are Cloud Run container lifecycle events, not application errors.

---

## 8. Summary — Action Items

| Priority | Item | Status |
|---|---|---|
| 🔴 Critical | All secrets for CI are set | ✅ done |
| 🔴 Critical | WIF auth working | ✅ confirmed |
| 🔴 Critical | CI pipeline green | ✅ (56494f9 + 4291e20) |
| 🟡 High | `togetherplans-preview` CF project missing | ✅ fixed (4291e20) |
| 🟡 High | `--project` explicit in gcloud deploy | ✅ fixed (4291e20) |
| 🟢 Low | `FOURSQUARE_API_KEY` mounted but unused in code | leave for now |
| 🟢 Low | `APP_URL` not in CR env | default is correct, skip |
| 🟢 Low | web-preview.yml fires on all branch pushes | add `paths:` filter (Jake's call) |
| 🟢 Low | `APPLE_PRIVATE_KEY` not yet in secrets | needed when Sign-in-with-Apple backend is built |
| ℹ️ Jake | Resend DNS verification at resend.com/domains | pending |
| ℹ️ Jake | Play Console — upload versionCode 2 AAB | pending |
| ℹ️ Jake | App Store Connect — review status + listing | pending |

---

## 9. Commits Made This Audit

| SHA | Message |
|---|---|
| 4291e20 | `fix(ci): explicit --project in Cloud Run deploy + fix web-preview CF Pages project name` |
