# Backend Security & Performance Audit

**Project:** TogetherPlans / DateNight  
**Audited:** `/root/DateNight/backend/src/`  
**Date:** 2026-09-08  
**Auditor:** Automated audit via Hermes Agent

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| CRITICAL | 1 | ✅ |
| HIGH | 3 | ✅ |
| MEDIUM | 4 | ⚠️ Documented |
| LOW | 3 | ⚠️ Documented |

---

## Security Findings

---

### [CRITICAL] SEC-01 — Weak JWT Secret Fallback in Production

**File:** `src/config/index.ts` line 12

**Issue:**  
The JWT secret falls back to the string `'dev-secret'` when `JWT_SECRET` is not set in the environment:

```ts
jwt_secret: process.env.JWT_SECRET || 'dev-secret',
```

While `validateConfig()` checks for this in production/staging environments, it **returns errors but does not crash the process** — the application will still start with a predictably weak secret if the caller ignores the return value. An attacker could forge valid JWTs for any user ID.

`main.ts` must enforce this check and exit on startup. Currently there is no evidence that `validateConfig()` is called at all before the server starts listening.

**Fix:** Call `validateConfig()` in `main.ts` and exit if errors are returned (applied — see fixes section).

---

### [HIGH] SEC-02 — No Rate Limiting on Auth Endpoints (Brute Force Risk)

**File:** `src/app.ts` lines 23–29

**Issue:**  
The global rate limiter allows **300 requests per 15 minutes** per IP. This is far too permissive for authentication endpoints. An attacker can make 300 login attempts in 15 minutes against a single account without triggering any throttle — effectively a free brute-force window.

The global limiter covers all routes equally; there is no tighter limit applied specifically to `/api/auth/login` and `/api/auth/register`.

**Fix:** Apply a stricter auth-specific rate limiter (20 requests / 15 min) on the auth router (applied — see fixes section).

---

### [HIGH] SEC-03 — CORS Origin Defaults to Local Dev Origins (No Wildcard, but Wrong in Production)

**File:** `src/config/index.ts` lines 14–16

**Issue:**  
When `CORS_ORIGIN` is not set, the app defaults to `['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8081']`. In a production Cloud Run deployment where `CORS_ORIGIN` is not explicitly set, these localhost origins will be accepted — but the production web client at `https://togetherplans.app` will be **blocked by CORS**, and the mobile app (which doesn't send `Origin`) will still work.

More critically, if someone sets `CORS_ORIGIN=*` in a Cloud Run env var (a common shortcut), all origins are accepted.

**Fix:** Add a production-environment check to `validateConfig()` that requires `CORS_ORIGIN` to be explicitly set and rejects wildcard values (applied — see fixes section).

---

### [HIGH] SEC-04 — `validateConfig()` Not Called at Startup

**File:** `src/main.ts` (presumed entry point)

**Issue:**  
`validateConfig()` exists in `config/index.ts` and checks for missing `JWT_SECRET` and `DATABASE_URL` in production, but the function is never called. The application starts without enforcing any configuration invariants, meaning a misconfigured production deployment (e.g., missing `JWT_SECRET`) will serve traffic with a fallback `'dev-secret'` without any warning in startup logs.

**Fix:** Call `validateConfig()` in `main.ts` before `app.listen()`, log all errors, and exit with code 1 if any are found (applied — see fixes section).

---

### [MEDIUM] SEC-05 — Input Validation Is Inline and Incomplete

**File:** All route files

**Issue:**  
Input validation is done manually with `if (!field)` guards and a regex for email. There is no schema-level validation (zod, joi, or express-validator). This leads to:

1. No type coercion — `options` could be any truthy value and bypass `validateOptions()` with edge cases
2. No maximum length constraints on `name`, `title`, `displayName` — a 10MB string in `title` would pass validation and hit the database
3. No sanitization — HTML/script injection risk in `displayName`, group `name`, etc. (mitigated by Helmet but not fully)

**Recommended Fix:**
- Install `zod` and define schemas for all request bodies
- Add `max()` constraints on string fields (e.g., `displayName` max 100 chars, `title` max 200 chars)
- Add `z.string().trim()` to auto-strip whitespace

**Example (register endpoint):**
```ts
import { z } from 'zod';
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(100).trim(),
});
```

---

### [MEDIUM] SEC-06 — Error Handler Conditionally Leaks Stack Traces

**File:** `src/app.ts` lines 50–56

**Issue:**  
The error handler conditionally includes `err.message` in non-production environments:

```ts
res.status(500).json({
  error: 'Internal Server Error',
  message: config.node_env === 'production' ? undefined : err.message,
});
```

This is acceptable but the logger on line 51 logs `err.stack` which is correct server-side. The risk is `node_env` being misconfigured (e.g., `'staging'` or `'dev'`) in a production deployment, leaking internal error messages to clients. The `validateConfig()` fix (SEC-04) mitigates this by enforcing `node_env` awareness.

**Recommended Fix:** Change condition to check for production explicitly:
```ts
message: ['production', 'staging'].includes(config.node_env) ? undefined : err.message,
```

---

### [MEDIUM] SEC-07 — No `deletedAt` Check on Token After Account Deletion

**File:** `src/middleware/auth.ts`

**Issue:**  
When a user account is soft-deleted (`DELETE /api/auth/me`), their JWT remains valid for up to 7 days. The `requireAuth` middleware only validates the JWT signature and expiry — it does not check if the user's account has been soft-deleted (`deletedAt != null`). A deleted user can continue making API calls with their existing token.

**Recommended Fix:** In `requireAuth`, after verifying the JWT, do a lightweight DB lookup to confirm the user is not soft-deleted:
```ts
const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { deletedAt: true } });
if (!user || user.deletedAt) {
  res.status(401).json({ error: 'Account no longer exists' });
  return;
}
```

Note: this adds one DB query per request. For performance, use a short-lived Redis cache of deleted user IDs.

---

### [LOW] SEC-08 — bcrypt Rounds at 12 (Acceptable, Monitor Over Time)

**File:** `src/routes/auth.ts` line 29

**Issue:**  
bcrypt cost factor is **12**, which is the lower end of the recommended range for 2026 (12–14). At cost factor 12, hashing takes ~250ms on modern hardware, which is acceptable. Consider increasing to 13 or 14 as compute costs decrease.

**Recommendation:** Re-evaluate bcrypt rounds annually. No immediate action required.

---

### [LOW] SEC-09 — Google OAuth Token Verification Relies on External Library

**File:** `src/services/oauth.ts`

**Issue:**  
The `verifyGoogleToken()` function is imported but its implementation was not audited (not in scope of provided files). Ensure it uses `google-auth-library`'s `OAuth2Client.verifyIdToken()` with the correct `audience` (client ID) parameter, not a manual JWT decode. An incorrect implementation could allow token forgery.

**Recommendation:** Confirm `verifyGoogleToken` validates the `aud` claim against the configured Google Client ID.

---

### [LOW] SEC-10 — No Logging of Failed Auth Attempts

**File:** `src/routes/auth.ts`

**Issue:**  
Failed login attempts return `401` but are not logged with the email or IP address. This makes it impossible to detect credential-stuffing attacks from server logs.

**Recommended Fix:**
```ts
logger.warn('Failed login attempt', { email, ip: req.ip });
```

---

## Performance Findings

---

### [HIGH] PERF-01 — Missing Database Indexes on Foreign Keys

**File:** `prisma/schema.prisma`

**Issue:**  
The Prisma schema has no `@@index` directives. PostgreSQL does not automatically index foreign key columns (unlike MySQL). The following high-frequency query patterns will result in sequential scans on large tables:

| Query | Missing Index |
|-------|--------------|
| `GroupMember.findFirst(where: { groupId, userId })` | `@@index([groupId, userId])` — covered by `@@unique` ✅ |
| `GroupMember.findMany(where: { userId })` | `@@index([userId])` — **missing** |
| `Proposal.findMany(where: { groupId })` | `@@index([groupId])` — **missing** |
| `Invitation.findUnique(where: { token })` | `@unique` covers this ✅ |
| `Vote.count(where: { optionId })` | `@@index([optionId])` — **missing** |
| `User.findFirst(where: { provider, providerId })` | covered by `@@unique([provider, providerId])` ✅ |

**Fix:** Added missing indexes to `schema.prisma` (applied — see fixes section).

---

### [MEDIUM] PERF-02 — N+1 Risk in Invitation Email Lookup

**File:** `src/routes/invitations.ts` lines 42–46

**Issue:**  
When `method === 'EMAIL'`, the code makes two separate sequential queries after creating the invitation:

```ts
const inviter = await prisma.user.findUnique({ where: { id: req.userId } });
const group = await prisma.group.findUnique({ where: { id: groupId } });
```

These could be parallelized with `Promise.all()`. Additionally, the `inviter` data (the authenticated user's display name) is already available via the membership check query. Reusing it would eliminate one query.

**Recommended Fix:**
```ts
const [inviter, group] = await Promise.all([
  prisma.user.findUnique({ where: { id: req.userId as string } }),
  prisma.group.findUnique({ where: { id: groupId } }),
]);
```

---

### [MEDIUM] PERF-03 — No Pagination on `GET /api/groups` List

**File:** `src/routes/groups.ts` lines 31–39

**Issue:**  
`GET /api/groups` returns all groups a user belongs to in a single query with no pagination. While most users will have a small number of groups, a power user or bot account could accumulate thousands of groups, making this endpoint increasingly slow and memory-intensive. The response includes full member lists (with user details), compounding the data volume.

**Recommended Fix:** Add cursor-based pagination:
```ts
const { cursor, limit = 20 } = req.query;
const groups = await prisma.group.findMany({
  where: { members: { some: { userId: req.userId } } },
  take: parseInt(limit as string),
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor as string } : undefined,
  orderBy: { createdAt: 'desc' },
  include: { members: { include: { user: { select: { id: true, displayName: true } } } } },
});
```

---

### [LOW] PERF-04 — Suggestions Cache Key Uses Exact Float Coordinates

**File:** `src/services/suggestions.ts` line 56

**Issue:**  
The cache key includes raw `lat` and `lng` values:
```ts
const cacheKey = `suggestions:${query.category || 'all'}:${query.lat ?? 'x'}:${query.lng ?? 'x'}`;
```

Two requests 0.0001 degrees apart (about 10 meters) will generate different cache keys and miss the cache entirely. For a city-level suggestion engine, coordinates should be rounded to ~2 decimal places (~1km resolution) to increase cache hit rates dramatically.

**Recommended Fix:**
```ts
const lat = query.lat !== undefined ? Math.round(query.lat * 100) / 100 : 'x';
const lng = query.lng !== undefined ? Math.round(query.lng * 100) / 100 : 'x';
const cacheKey = `suggestions:${query.category || 'all'}:${lat}:${lng}`;
```

---

## Fixes Applied

### Fix 1 — Auth Rate Limiting (SEC-02)

Added a stricter rate limiter (20 requests/15 min) to `src/routes/auth.ts`:

```ts
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

authRouter.post('/register', authLimiter, async (req, res, next) => { ... });
authRouter.post('/login', authLimiter, async (req, res, next) => { ... });
authRouter.post('/google', authLimiter, async (req, res, next) => { ... });
```

### Fix 2 — Config Validation at Startup (SEC-01, SEC-04)

Added `validateConfig()` call to `src/main.ts` with process exit on errors.

### Fix 3 — CORS Production Guard (SEC-03)

Added wildcard CORS check to `validateConfig()` in `src/config/index.ts`.

### Fix 4 — Database Indexes (PERF-01)

Added `@@index` directives for `GroupMember.userId`, `Proposal.groupId`, and `Vote.optionId` in `prisma/schema.prisma`.

### Fix 5 — Parallel Invitation Queries (PERF-02)

Parallelized the inviter/group lookups in `src/routes/invitations.ts` using `Promise.all()`.

### Fix 6 — Suggestions Cache Key Rounding (PERF-04)

Applied coordinate rounding to the cache key in `src/services/suggestions.ts`.

---

*Report generated 2026-09-08. Re-run after applying MEDIUM findings.*
