# DateNight Backend API — Security & Functional Audit
**Date:** September 20, 2026  
**API:** https://api.togetherplans.app  
**Auditor:** Automated + Code Review  
**Scope:** All 11 route files, live endpoint testing (28 security test cases)

---

## Executive Summary

| Category | Status |
|---|---|
| Authentication & Auth Bypass | ✅ PASS — no bypasses found |
| Authorization (IDOR) | ✅ PASS — group/proposal isolation enforced |
| Input Validation | ⚠️ PARTIAL — missing max-length, unvalidated groupType |
| Rate Limiting | ❌ FAIL — auth limiter not firing in production; forgot-password unthrottled |
| Injection | ✅ PASS — parameterized queries, input sanitized |
| Refresh Token Rotation | ❌ FAIL — old refresh tokens remain valid after use (no revocation) |
| Data Leakage (Share Cards) | ⚠️ WARN — public endpoint exposes ALL proposal data, not just decided |
| XSS / Output Encoding | ✅ PASS — SVG OG image escapes user content |
| CORS | ✅ PASS — strict allowlist, evil origins rejected |
| Security Headers | ✅ PASS — helmet in use, HSTS, CSP, etc. |
| Deleted User Access | ✅ PASS — JWT access token blocked at /me; refresh blocked |
| Internal Route Protection | ✅ PASS — INTERNAL_CRON_KEY required and mounted |
| Business Logic | ✅ PASS — proposal rules, vote membership, owner guards |
| Nudge Abuse | ⚠️ WARN — no per-proposal nudge rate limit |

**Overall risk level: MEDIUM** — 2 real security bugs (refresh token reuse, rate limit bypass) + several lower-severity issues.

---

## Smoke Test Results (15/15 PASS)

All baseline functional tests pass against live production API:

```
Step  1  POST /api/auth/signup           PASS
Step  2  POST /api/auth/login            PASS
Step  3  POST /api/auth/refresh          PASS
Step  4  GET  /api/auth/me               PASS
Step  5  POST /api/groups                PASS
Step  6  GET  /api/groups                PASS
Step  7  POST /api/proposals             PASS
Step  8  GET  /api/proposals/:id         PASS
Step  9  POST /api/proposals/:id/vote    PASS
Step 10  DELETE /api/proposals/:id/votes PASS (409 when DECIDED)
Step 11  POST /api/invitations           PASS
Step 12  GET  /api/invitations/:token    PASS
Step 13  GET  /api/suggestions           PASS (132 results)
Step 14  GET  /api/notifications         PASS
Step 15  DELETE /api/auth/me             PASS (204)
```

---

## Security Findings

### 🔴 HIGH — Refresh Token Reuse Not Prevented (No True Token Rotation)

**Route:** `POST /api/auth/refresh` (`auth.ts:217`)  
**Test:** Used same refresh token twice — both returned new access tokens.

```
First use:  {"accessToken": "eyJ...", "refreshToken": "eyJ..."}
Second use: {"accessToken": "eyJ...", "refreshToken": "eyJ..."}  ← same token accepted again
```

**Root cause:** `makeRefreshToken()` generates a new JWT but never stores or revokes the old one. Refresh tokens are stateless — once issued, any copy is permanently valid for 30 days. If a refresh token is stolen (e.g., from a compromised device), an attacker can silently maintain access without triggering any "new device" signal.

**Impact:** Stolen refresh token = 30-day persistent access with no revocation mechanism.

**Fix:** Store issued refresh tokens in the database (`RefreshToken` table) with `isRevoked` flag. On `/refresh`, verify the token exists and is not revoked, then atomically revoke the old token and issue a new one. Also add a `POST /api/auth/logout` handler that revokes the provided refresh token (currently it's a no-op).

```typescript
// Pseudocode fix in auth.ts
const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
if (!stored || stored.isRevoked) return res.status(401)...;
await prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } });
const newRefresh = await prisma.refreshToken.create({ data: { userId, token: newToken } });
```

---

### 🔴 HIGH — Rate Limiter Not Effective in Production (Cloud Run IP Proxy Issue)

**Routes:** `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/register` (all use `authLimiter`)  
**Test:** 25 rapid login attempts — 0 got HTTP 429.

**Expected:** 20 req/15min per IP should trigger 429.  
**Observed:** All 25 requests return 401 (wrong password) with no rate limiting.

**Root cause:** `app.set('trust proxy', 1)` tells Express to trust `X-Forwarded-For`. In Cloud Run, all requests arrive from the load balancer / Cloudflare with the same forwarded IP, but the rate limiter may be keying on `req.ip` which resolves to the load balancer IP, not the real client IP — meaning ALL users share one rate limit bucket and it never triggers per individual user.

Additionally, rate limit headers (`RateLimit-*`) are absent from responses, confirming the limiter isn't seeing distinct IPs.

**Impact:** Brute-force login attacks are unthrottled. An attacker can attempt unlimited password guesses.

**Fix options:**
1. Verify Cloud Run preserves `X-Forwarded-For` and adjust `trust proxy` depth: `app.set('trust proxy', true)` to use the rightmost IP.
2. Add account-lockout at the application level (e.g., track failed attempts by `email` in Redis, not by IP).
3. Use Cloudflare rate limiting rules at the edge (already behind CF based on response headers).

---

### 🔴 MEDIUM — `POST /api/auth/forgot-password` Has No Rate Limit

**Route:** `auth.ts:332`  
**Test:** 25 rapid requests — all returned `HTTP 200`.

The `authLimiter` is only applied to `/register`, `/signup`, `/login`, `/google`, `/apple`. The forgot-password endpoint (and `/reset-password`) are unprotected.

**Impact:** Attacker can send thousands of password-reset emails to a victim's address, causing email flooding / harassment. Even though responses are identical (no enumeration), the Resend API will accept and deliver them.

**Fix:** Apply `authLimiter` to `/forgot-password` and `/reset-password`.

```typescript
authRouter.post('/forgot-password', authLimiter, async ...)
authRouter.post('/reset-password', authLimiter, async ...)
```

---

### 🟡 MEDIUM — Share Cards Expose All Proposal Data Without Auth (Not Just Decided)

**Route:** `GET /api/share-cards/:proposalId` (`share-cards.ts:162`)  
**Test:** Fetched share card for an `OPEN` proposal without any auth token — HTTP 200 returned full card.

**Observed response includes:**
- `status: "OPEN"` (reveals proposal is still being voted on)
- `allOptions` (all 3 option names, categories, vote counts)
- `creatorName`, `groupName`, `groupType`
- `winningOption` with `latitude`, `longitude`, `address`, `ticketUrl`
- `title`, `dateTime`

**Designed intent** (per code comments): "Public — share links are meant to be opened by anyone."  
**Problem:** The endpoint accepts any `proposalId` (UUID), not only a share token. There's no requirement that the proposal be `DECIDED`. Any authenticated user who learns a proposalId (e.g., from a group they were briefly in) can pass that to `/api/share-cards/:id` unauthenticated and get all proposal data.

**Impact:** Information disclosure — proposal contents, participant names, dates, venues exposed to unauthenticated users who guess or obtain a UUID.

**Fix options (pick one):**
1. **Token-gate the direct `/api/share-cards/:proposalId` route** — require auth or only serve `DECIDED` proposals.
2. **Only serve via `/api/share-cards/by-token/:shareToken`** and remove the direct proposalId lookup (the by-token route correctly limits to `DECIDED` proposals).
3. Add `if (card.status !== 'DECIDED') return res.status(403)...` to the public GET route.

---

### 🟡 MEDIUM — `groupType` Field Has No Allowlist Validation

**Route:** `POST /api/groups` (`groups.ts:10`)  
**Test:** Created a group with `groupType: "INVALID_TYPE_XSS<script>"` — returned HTTP 201, data stored.

```json
{"groupType": "INVALID_TYPE_XSS<script>", ...}
```

**Impact:** Arbitrary strings (including script tags, SQL fragments, very long values) persist in the `groupType` column. While Prisma/PostgreSQL prevents SQL injection, the raw value is echoed back in API responses including share cards and invitation previews. Any downstream consumer that renders `groupType` in HTML without escaping would be vulnerable to stored XSS.

**Fix:** Validate against an enum allowlist:

```typescript
const VALID_GROUP_TYPES = ['COUPLE', 'FRIENDS', 'FAMILY', 'OTHER'] as const;
if (groupType && !VALID_GROUP_TYPES.includes(groupType)) {
  return res.status(400).json({ error: 'Invalid groupType' });
}
```

---

### 🟡 LOW — No Maximum Length Validation on User-Supplied Text Fields

**Routes:** `POST /api/proposals` (title), `POST /api/groups` (name, description), option names/descriptions  
**Test:** Created a proposal with a 5,000-character title — HTTP 201.

No `maxLength` constraints are enforced at the API layer. The 1MB body limit (`express.json({ limit: '1mb' })`) provides some protection, but individual fields like `title`, `name`, `description`, `address` are unbounded.

**Impact:** Low — not exploitable for injection, but could cause UI rendering issues and wastes database storage. Extremely long option names/addresses would break the OG image SVG (though it truncates at 30/50 chars).

**Fix:** Add max-length checks in validators:

```typescript
if (title.length > 200) return res.status(400).json({ error: 'title must be ≤ 200 characters' });
if (name.length > 100) return res.status(400).json({ error: 'name must be ≤ 100 characters' });
```

---

### 🟡 LOW — Nudge Endpoint Has No Per-Proposal Rate Limit

**Route:** `POST /api/proposals/:id/nudge` (`proposals.ts:250`)  
**Test:** Hit nudge 5 times rapidly — all returned HTTP 200, each would trigger push + email to unvoted members.

Any group member can spam unvoted members with push notifications and emails by calling nudge repeatedly.

**Fix:** Add a `nudgedAt` timestamp to proposals (similar to `remindedAt`) and enforce a cooldown:

```typescript
if (proposal.nudgedAt && Date.now() - proposal.nudgedAt.getTime() < 60 * 60 * 1000) {
  return res.status(429).json({ error: 'Nudge already sent recently. Wait 1 hour.' });
}
```

---

### 🟡 LOW — `utcOffset` Parameter in After Dark Not Validated

**Route:** `GET /api/after-dark/status?utcOffset=...` (`after-dark.ts:122`)  
**Test:** Passed `utcOffset=999999999` — server computed a nonsensical "local hour" and returned `active: true`.

The offset is passed to `Number()` but not range-clamped. Valid UTC offsets are −840 to +840 minutes (−14h to +14h).

**Fix:**
```typescript
const offset = Number(req.query.utcOffset);
if (isNaN(offset) || offset < -840 || offset > 840) {
  return res.status(400).json({ error: 'utcOffset must be between -840 and 840 minutes' });
}
```

---

## Security Tests — Full Results Matrix

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | User B reads User A's group | 403/404 | ✅ 404 PASS |
| 2 | User B reads User A's proposal | 403 | ✅ 403 PASS |
| 3 | User B votes on User A's proposal | 403 | ✅ 403 PASS |
| 4 | Internal route — no x-internal-key | 401 | ✅ 401 PASS |
| 5 | Internal route — wrong x-internal-key | 401 | ✅ 401 PASS |
| 6 | Rate limit login (22 attempts) | 429 | ❌ No 429 — limiter not firing |
| 7 | Share cards unauthenticated — OPEN proposal | 403 | ⚠️ 200 — data exposed |
| 8a | Proposal — no title | 400 | ✅ 400 PASS |
| 8b | Proposal — no options | 400 | ✅ 400 PASS |
| 8c | Proposal — 2 options (< min 3) | 400 | ✅ 400 PASS |
| 8d | Proposal — 6 options (> max 5) | 400 | ✅ 400 PASS |
| 8e | Proposal — empty title string | 400 | ✅ 400 PASS |
| 8f | Proposal — option missing name | 400 | ✅ 400 PASS |
| 9a | Suggestions lat injection `1 OR 1=1` | 400 | ✅ 400 PASS |
| 9b | Suggestions lat = `NaN` | 400 | ✅ 400 PASS |
| 9c | Suggestions lat overflow `999999` | 400 | ✅ 400 PASS |
| 9d | Suggestions zip SQL injection | 400 | ✅ 400 PASS |
| 9e | Suggestions zip XSS `<script>` | 400 | ✅ 400 (rejected by infra) |
| 9f | Suggestions invalid category | 400 | ✅ 400 PASS |
| 10a | Refresh with access token (wrong type) | 401 | ✅ 401 PASS |
| 10b | Refresh same token twice | 401 on 2nd | ❌ BOTH succeed — no revocation |
| 10c | Refresh garbage token | 401 | ✅ 401 PASS |
| 11 | CORS evil origin | No ACAO header | ✅ PASS |
| 12a | Deleted user — GET /me with old JWT | 404 | ✅ 404 PASS |
| 12b | Deleted user — refresh token | 401 | ✅ 401 PASS |
| 12c | Deleted user — login | 401 | ✅ 401 PASS |
| 13 | Protected routes without auth | 401 | ✅ 401 all routes |
| 14 | 100KB password field | handled | ✅ 401 (processed safely) |
| 15 | Nudge 5x rapid | rate limited | ⚠️ All 200 — no limit |
| 16 | groupType arbitrary string | 400 | ❌ 201 — stored as-is |
| 17a | Forgot-password — valid vs invalid email | same response | ✅ PASS (no enumeration) |
| 17b | Reset with invalid token | 400 | ✅ PASS |
| 18 | After Dark utcOffset injection | safe | ⚠️ No validation, huge offset accepted |
| 19 | OG image SVG — XSS via user data | escaped | ✅ PASS — all content XML-escaped |
| 20 | /proposals/suggestions/list route order | 200 | ✅ PASS (route registered before /:id) |
| 21 | Suggestions endpoint — no auth required | — | ℹ️ Intentional (public API) |
| 22 | Invitation lookup by non-member | — | ℹ️ Intentional (needed to accept invite) |
| 23 | Counter-proposal — missing options | 400 | ✅ PASS |
| 24 | After Dark impulse — option count | 3 opts | ✅ PASS (hardcoded fillers) |
| 25 | JWT_SECRET — is it 'dev-secret'? | rejected | ✅ PASS — real secret in use |
| 26 | Rate limit — 25 attempts same email | 429 | ❌ No 429 triggered |
| 27 | Proposal title — 5000 chars | 400 | ⚠️ 201 — no max length |
| 28 | Forgot-password — 25 rapid | 429 | ❌ No 429 — unprotected |

---

## Code Review Findings

### auth.ts
- **Good:** bcrypt rounds=12 (strong), email regex validation, `deletedAt` check on login/refresh/me, password-reset uses purpose-scoped JWT, forgot-password has enum-safe same-response.
- **Issue:** `forgot-password` and `reset-password` have no `authLimiter` applied.
- **Issue:** `makeRefreshToken` and `signToken` use the same `JWT_SECRET`, which means an access token can be trivially crafted to look like a refresh token (type field separates them, but same signing key reduces key compromise blast radius).
- **Issue:** `logout` is a no-op — just returns `{ message: 'Logged out' }`. Clients clear tokens locally but the refresh token remains valid server-side for 30 days.
- **Minor:** `reset-password` doesn't check if the user's `deletedAt` is set before updating the password hash.

### groups.ts
- **Good:** All routes behind `requireAuth` router-level middleware, membership checked before every operation, OWNER-only guards on rename/delete/role-change.
- **Issue:** `PATCH /:id` allows renaming but no max length on `name`.
- **Issue:** `groupType` on POST not validated against enum — any string accepted.

### proposals.ts
- **Good:** `validateOptions` (3–5 options, name+category required) centralized and applied to both `POST /` and `POST /:id/counter`. Membership verified before voting. Status guard prevents voting on closed proposals. Vote uniqueness enforced at DB level.
- **Issue:** `title` has no max-length validation — 5,000-char titles accepted.
- **Issue:** `POST /api/proposals` and `PATCH /api/proposals/:id/cancel` check membership but `GET /api/proposals/:id` fetches the proposal first then checks membership — this creates a timing window (tiny) but more importantly means a 403 response body contains `{ error: 'Not a member of this group' }` which confirms the proposal exists. Consider returning 404 for non-members for full opacity.
- **Issue:** No rate limit on `POST /:id/nudge` — any member can spam push + email to group.
- **Note:** `/suggestions/list` route is registered before `/:id` — correct ordering prevents "suggestions" being treated as a proposalId.

### share-cards.ts
- **Critical design issue:** `GET /:proposalId` is public and serves any proposal by UUID regardless of status. The intent is sharing, but the implementation allows anyone to enumerate proposal data without authentication.
- **Good:** OG image SVG properly XML-escapes all user-supplied content (`esc()` function handles `&`, `<`, `>`, `"`).
- **Good:** Share token is derived deterministically so shareable URLs are stable without DB writes.
- **Issue (scalability):** `GET /by-token/:shareToken` scans up to 1,000 DECIDED proposals linearly for each request. Add a `shareToken` column to Proposal table for O(1) lookup at scale.

### internal.ts
- **Good:** `requireInternalKey` middleware applied router-wide. Returns 503 if key not configured (prevents silent no-key operation), 401 on mismatch.
- **Good:** INTERNAL_CRON_KEY is confirmed present in Cloud Run env (`gcloud` verified).
- **Good:** The 401 response (not 503) confirms the key is mounted and working.
- **Issue:** No logging on unauthorized access attempts — failed `x-internal-key` requests should be logged with source IP for security monitoring.

### after-dark.ts
- **Good:** All routes require auth. Mood validation against `VALID_MOODS` allowlist.
- **Issue:** `utcOffset` query param not range-validated — accepts arbitrarily large numbers.
- **Design concern:** Mood is stored by corrupting the `pushToken` field (`afterdark:mood:X|<token>`). This is explicitly called "no migration needed for MVP" in comments but creates risk: storing mood in the push token field means `Expo.isExpoPushToken()` checks will fail on the encoded value, breaking push delivery for users who have set a mood (the `internalRouter` push code calls `Expo.isExpoPushToken(user.pushToken)` directly — mood-encoded tokens will fail that check). **Vote reminder notifications will NOT fire for users who have set an After Dark mood.**

### invitations.ts
- **Good:** TTL enforced (72h), expiry check on both GET and accept. Duplicate membership check before accepting. Token is UUID v4 (random, unguessable).
- **Minor:** `inviteUrl` in response uses a relative path `/api/invitations/accept/...` — should be a full URL for client usability.

### suggestions.ts
- **Good:** All query params validated — lat/lng range-checked, zip regex'd, category and dateFilter against allowlists, radius clamped.
- **Note:** No auth required. This appears intentional (public-facing web discovery feature) but was not documented as such.

### users.ts
- Thin alias router for `/api/users/me`. Both `GET` and `DELETE` properly require auth and check `deletedAt`.

### notifications.ts
- Stub returning empty array. Properly auth-gated. No functional issues.

### app.ts
- **Good:** `helmet()` applies full security header suite (confirmed in CORS tests), CORS uses strict allowlist, body size capped at 1MB, global 300 req/15min limiter.
- **Issue:** Rate limiter uses `req.ip` with `trust proxy 1`. In Cloud Run + Cloudflare topology, the actual client IP may not be correctly extracted — confirmed by auth limiter not triggering in live tests.

---

## Infrastructure

### CORS
- ✅ Production origin `https://togetherplans.app` → `access-control-allow-origin: https://togetherplans.app`
- ✅ Evil origin `https://evil.example.com` → no ACAO header (blocked)
- ✅ `access-control-allow-credentials: true`
- ✅ `access-control-allow-headers: Content-Type,Authorization`

### Security Headers (via helmet)
All present in production responses:
- `strict-transport-security: max-age=31536000; includeSubDomains`
- `content-security-policy: default-src 'self'; ...`
- `x-content-type-options: nosniff`
- `x-frame-options: SAMEORIGIN`
- `referrer-policy: no-referrer`
- `cross-origin-opener-policy: same-origin`
- `x-xss-protection: 0` (correct — disabling legacy XSS filter)

### INTERNAL_CRON_KEY
- ✅ Secret exists in GCP Secret Manager (created 2026-09-20T03:53:01, version 1 enabled)
- ✅ Mounted in Cloud Run service env as `INTERNAL_CRON_KEY`
- ✅ Endpoint returns 401 (not 503) confirming key is present and working

---

## Prioritized Remediation Plan

### P0 — Fix Immediately

1. **Refresh token revocation** — Add `RefreshToken` table, revoke on use, make logout actually revoke. Without this, stolen tokens can't be invalidated.

2. **Fix rate limiter IP extraction** — Validate that `req.ip` resolves to real client IP in Cloud Run. Add Cloudflare edge rate limiting rules as belt-and-suspenders.

### P1 — Fix This Sprint

3. **Add `authLimiter` to `/forgot-password` and `/reset-password`** — 3-line change.

4. **Share cards — restrict public GET to DECIDED proposals only** — Add status check or gate behind share token only.

5. **After Dark mood storage** — The `pushToken` corruption means push reminders don't fire for mood-set users. Add a `currentMood` column to the User table (Prisma migration required).

### P2 — Fix Soon

6. **groupType enum validation** on group create/update.
7. **Max-length constraints** on title (200), name (100), description (1000), address (500).
8. **Nudge rate limit** — add `nudgedAt` field and 1-hour cooldown.
9. **utcOffset validation** — clamp to ±840 minutes.
10. **Log unauthorized internal key attempts** for security monitoring.

### P3 — Technical Debt

11. **Share token DB column** — add `shareToken` to Proposal to make `/by-token/` O(1).
12. **Logout endpoint** — currently no-op; implement refresh token revocation.
13. **`reset-password` deletedAt check** — verify user is not deleted before allowing password reset.

---

*Report generated: 2026-09-20 | Tests run against live production API*
