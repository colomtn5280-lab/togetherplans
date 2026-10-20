# Architecture & Quality Audit — TogetherPlans Backend
**Date:** 2026-10-19  
**Auditor:** Agent 6 — Software Architecture & Quality Engineer  
**Scope:** Backend (Node/Express/TypeScript/Prisma v7/PostgreSQL), Web (React/Vite), Mobile (Expo SDK 57)

---

## 1. API Design

### Findings

**Versioning: NONE**  
No URL versioning (`/api/v1/`), no `Accept: application/vnd.api.v1+json`, no versioning strategy at all. Any breaking change is a live migration risk across web + iOS + Android simultaneously.

**Route consistency: MOSTLY GOOD**
- Groups use RESTful CRUD correctly: `GET/POST /groups`, `GET/PATCH/DELETE /groups/:id`
- Proposals pattern is correct but mixes concerns: `POST /proposals/:id/vote`, `POST /proposals/:id/share-link`, `POST /proposals/:id/counter` are appropriately nested
- Duplicate login endpoints: `/api/auth/register` and `/api/auth/signup` both exist and both do the same thing. Code is duplicated verbatim — same validation, same logic, different endpoint. This is tech debt.

**Response shape inconsistency:**
- Auth endpoints return both `token` and `accessToken` for backwards compatibility — annotated as "old shape / new shape" but this will confuse future clients indefinitely
- `GET /proposals/:id` returns `{ ...proposal, options, memberCount, tally }` — a mix of raw Prisma output and computed fields; no consistent envelope (`{ data: ..., meta: ... }`)
- `DELETE /groups/:id` returns 204 (correct), but `DELETE /api/auth/me` returns 204, while `DELETE /proposals/:id/comments/:commentId` returns 200 `{ deleted: true }` — inconsistent semantics for delete

**Error format: CONSISTENT**
All routes consistently return `{ error: "message string" }` — this is good.

**Missing:**
- No `Content-Type: application/problem+json` (RFC 7807 — standard for API errors)
- No error codes (clients have to string-match on error messages for branch logic)

---

## 2. Authentication

### JWT Implementation

- **Access token:** 15-minute or config-driven expiry via `config.jwt_expires_in` — good
- **Refresh token:** 30-day JWT stored in DB, true rotation on every refresh — **excellent** implementation
- **Reuse detection:** Presented revoked token triggers revocation of ALL user tokens — correct, prevents stolen-token attacks
- **Fallback secret:** `'dev-secret'` and `'changeme'` appear as fallback JWT secrets in multiple places (`auth.ts` lines 29, 337, 516, 538). If `JWT_SECRET` env is unset in prod, the app silently uses a known public constant. This is **P0 security issue**.

### Token Storage

| Client | Access Token | Refresh Token | Assessment |
|--------|-------------|---------------|------------|
| Web    | `localStorage` | `localStorage` | **⚠️ XSS-vulnerable** — industry standard is httpOnly cookies |
| Mobile | `SecureStore` (Expo) | Not stored* | ✅ Correct for mobile |

*Mobile's `api.ts` only stores `datenight_token` (access token). The mobile client does not implement refresh token rotation — when the access token expires, there's no auto-refresh. Users get 401s until they re-login.

**Web auth store (`auth.store.ts`):** Tokens duplicated in both Zustand state AND localStorage. Two sources of truth. Token in localStorage is what the axios interceptor reads; Zustand state can drift if localStorage is modified externally.

**Email verification:** `sendVerifyEmail` is called at registration but there is no `emailVerified` field in the User schema and no check that verifies email status before allowing sensitive actions. Email verification is sent but never enforced.

**Password reset token:** Stateless JWT — cannot be invalidated after use without adding a one-time-use check (used tokens should be blacklisted). Currently a reset token is valid for the full 1-hour window even after the password was changed.

---

## 3. Security Assessment

### ✅ Positives
- `helmet()` applied globally
- CORS configured with `config.cors_origin` (not `*`)
- Global rate limiter: 300 req/15min per IP
- Auth-specific rate limiter: 20 req/15min per IP + email-based lockout (10 attempts / 15 min) — defense in depth
- Separate `forgotPasswordLimiter`: 5 req/15min — correct
- Prisma ORM protects against SQL injection on all standard queries
- Raw queries (`$queryRaw`, `$executeRaw`) are templated tag literals — parameterized, safe from injection
- `trust proxy: 1` set for Cloud Run — rate limiting uses real IP

### ⚠️ Issues

**P0: Weak JWT secret fallback**
```typescript
// auth.ts line 29
const secret = process.env.JWT_SECRET || 'dev-secret';
// auth.ts line 538
const secret = process.env.JWT_SECRET ?? 'changeme';
```
If `JWT_SECRET` is missing at runtime (misconfiguration, env var rename), all tokens are signed with known constants. App starts with no warning. Should throw at startup if secret is absent or too short.

**P1: Tokens in localStorage (web)**
- Access + refresh tokens in `localStorage` are readable by any JavaScript on the page (XSS, third-party scripts)
- Recommended: httpOnly `Secure` cookies for refresh token; keep access token in memory only

**P1: After Dark group membership not verified**
```typescript
// after-dark.ts line 111
// TODO: Verify user is member of group
// const member = await db.groupMember.findUnique(...)
// if (!member) { return res.status(403)... }
```
The membership check is commented out. Any authenticated user can create "After Dark" ideas for any group, not just groups they belong to.

**P2: Rate limit bypassed for guest votes**
```typescript
// share.ts
skip: (req: Request) => typeof req.body?.guestId === 'string',
```
Providing any `guestId` in the body skips IP-based rate limiting on guest votes. An attacker who includes a guestId can spam votes without rate limiting.

**P2: Facebook token verification is weak**
The Facebook auth endpoint accepts `providerId` in the request body and verifies it against the Graph API response — but it trusts the client-supplied `email` as fallback when Facebook's Graph API returns no email. A malicious actor could supply any email.

**P2: No CSRF protection**
Although the app uses JWT (Bearer tokens), the web client stores them in localStorage and sends as headers — no CSRF risk from form-submit attacks. However, if tokens ever move to cookies, CSRF protection will be needed and is not in place.

**P2: Global rate limit is IP-based, not user-based**
300 req/15min per IP. Behind shared NAT/proxies (offices, schools), all users share one bucket. There is no per-authenticated-user rate limiting.

**P3: Sensitive fields not filtered from /auth/me**
`GET /auth/me` does not return `passwordHash`, but it explicitly includes `latitude` and `longitude`. Users expect location to be private — consider whether this should be opt-in.

---

## 4. Error Handling

### ✅ Positives
- Global error handler at bottom of `app.ts` — catches all unhandled errors passed to `next(err)`
- Production mode strips stack trace from error responses (`message: config.node_env === 'production' ? undefined : err.message`)
- 404 handler for unknown routes
- All route handlers use `try/catch` + `return next(err)` pattern — consistent

### ⚠️ Issues

**P2: `void` fire-and-forget swallows errors silently**
Multiple places use `void someAsyncFn(...)` to send emails and push notifications without catching errors. While email failures are individually caught in `email.ts`, push notification failures in the nudge handler are only partially handled:
```typescript
void sendTake2Email(m.user.email, ...);  // No error surface if this fails
```

**P2: Unhandled promise rejection handling at process level**
No `process.on('unhandledRejection', ...)` handler seen in the entry point. In Node.js < 15 this silently swallows errors; in >= 15 it crashes the process. Cloud Run will restart on crash, but no alerting on crash-loop.

**P3: Prisma `P2025` (not found) errors not caught**
If Prisma throws a `PrismaClientKnownRequestError` with code `P2025` (record not found during update/delete), it will surface as a generic 500 instead of a 404. This applies to `prisma.proposal.update()` calls where the record could be deleted concurrently.

---

## 5. Database Schema Analysis

### Normalization: GOOD
- Schema is well-normalized (3NF). No data duplication.
- Enums used correctly for `Role`, `InviteMethod`, `InviteStatus`, `ProposalStatus`
- `AfterDarkItem` correctly uses `@db.VarChar(140)` and `@db.Text` for field constraints

### Indexes Audit

| Table | Indexed Fields | Missing Indexes |
|-------|----------------|-----------------|
| `GroupMember` | `userId` ✅ | None obvious |
| `Proposal` | `groupId` ✅ | `creatorId` — missing if querying "proposals I created" |
| `Option` | None | `proposalId` — **missing** (critical: every proposal fetch joins options by proposalId) |
| `Vote` | `optionId` ✅ | None |
| `GuestVote` | `optionId` ✅ | `guestId` — missing (used in claim-guest-votes lookups) |
| `ProposalComment` | `proposalId` ✅ | None |
| `RefreshToken` | `userId` ✅, `token` ✅ | None |
| `Invitation` | None | `token` — **missing** (used in every invitation lookup by token) |
| `AfterDarkItem` | `groupId`, `createdBy`, `tier`, `createdAt` ✅ | None |

**P1: `Option` table missing `@@index([proposalId])`**
Every proposal fetch triggers an Option query by `proposalId`. At scale this becomes a full table scan.

**P1: `Invitation` table missing `@@index([token])`**
Every invitation accept/view looks up by `token`. Unindexed on a `String @unique` which PostgreSQL auto-indexes for unique — actually fine. The `@unique` constraint implies an index.

**N+1 Risk Assessment:**
- `GET /groups/:id/proposals` includes `options: { include: { votes: true } }` — for a group with 20 proposals and 5 options each, this is 1 query for proposals + 20 queries for options' votes = potential N+1
- `checkProposalConsensus` makes 4 sequential DB calls: `findUnique(proposal)`, `count(members)`, `findMany(options+votes)`, `groupBy(votes)` — could be 2 if proposal is passed in
- Nudge handler: fetches `proposal.group.members.user` — this is eagerly loaded in one query (correct), but then iterates sending push/email per member (acceptable)
- `getFeaturedBusinesses` and `getDirectListings` called in parallel via `Promise.all` — good

### Soft Deletes
- User: `deletedAt` field, checked manually in every handler — **inconsistent** (some routes check, some don't, e.g. `PATCH /auth/me` doesn't verify `deletedAt` before update)
- No soft deletes on other entities (Proposals, Options, Votes) — hard deletes via cascade

---

## 6. Test Coverage Analysis

### Test Suites (5 files in `src/__tests__/`)

| File | Tests | What's Covered |
|------|-------|----------------|
| `app.test.ts` | 5 | Health endpoint, auth middleware (missing token, invalid token), JWT signing, 404 handler |
| `share.test.ts` | ~15 | Public share GET (sanitization, no email leak), guest voting (create/upsert), DECIDED rejection, share-link lazy generation, OG image/preview HTML, solo-start flow |
| `guest-claim.test.ts` | 6 | Claim guest votes (happy path, member-vote conflict, non-member groups, consensus trigger), invitation accept with guestId |
| `notification-triggers.test.ts` | 11 | Holdout detection (all 7 edge cases), tomorrow reminders (window, dedup), guest vote creator notification (rate limit) |
| `suggestions.test.ts` | 8 | Seed fallback, category filter, field validation, zip input, All category — **calls real external APIs** (tests are slow/flaky) |

### Test Execution Results
```
Test Suites: 4 passed, 4 total (excluding suggestions.test.ts which calls live APIs)
Tests:       45 passed, 45 total
Time:        21.017 s

Warnings:
- Duplicate manual mocks: expo-server-sdk (dist + src)
- Duplicate manual mocks: jose (dist + src)
- Worker process did not exit gracefully (open handles — likely DB connections or timers)
```

### Critical Paths WITHOUT Tests

| Path | Risk |
|------|------|
| POST /api/auth/register | P1 — No test for duplicate email, OAuth-only account conflict |
| POST /api/auth/login | P1 — No test for lockout, brute force, OAuth-only account |
| POST /api/auth/refresh | P1 — No test for token rotation, reuse detection (revoke all) |
| POST /api/groups | P2 — No test for group creation, membership |
| POST /api/proposals | P2 — No test for proposal creation, validation |
| POST /api/proposals/:id/vote | **P1** — No test for voting, sentiment toggle, consensus trigger |
| POST /api/proposals/:id/counter | P2 — No test |
| POST /api/invitations | P2 — No test for invitation creation |
| PATCH /api/proposals/:id/cancel | P2 — No test |
| DELETE /api/auth/me (soft delete) | P2 — No test |
| All business portal routes | P3 — No tests |
| Stripe webhooks | P1 — Payment flow entirely untested |

---

## 7. Technical Debt Inventory

### Code Duplication
- `/api/auth/register` and `/api/auth/signup` are **identical endpoints** with copied logic (different field name handling). Should be extracted to a shared `registerUser()` helper.
- `auth.ts` response shape includes both `token` and `accessToken` as a backward-compatibility shim — has been there long enough to become permanent.

### TypeScript `any` Usage (in non-generated files)

```
suggestions.ts:        5 uses of `as any`
business.ts:           7 uses of `as any`
webhooks.ts:           4 uses of `as any`
venue-refresh.ts:      4 uses of `as any`
static.source.ts:      2 uses of `as any`
```

Total in production code: ~22 `as any` casts. Most cluster in `suggestions.ts` `getFeaturedBusinesses()` which explicitly disables ESLint with `/* eslint-disable @typescript-eslint/no-explicit-any */`.

### TODO/FIXME Comments
```
after-dark.ts:111 — TODO: Verify user is member of group
```
This is the only TODO in production code — but it is a **security gap** (see Section 3).

### Commented-Out Code
```typescript
// after-dark.ts:113-118 — membership check is commented out with intent to add
```

### Duplicate Mock Files
```
dist/__mocks__/expo-server-sdk.js  ← stale compiled output
src/__mocks__/expo-server-sdk.ts   ← source
dist/__mocks__/jose.js             ← stale compiled output
src/__mocks__/jose.ts              ← source
```
Should add `dist/` to `.gitignore` or clean dist mocks on build.

---

## 8. Bundle Size Analysis

### Web Bundle
```
dist/index.html                    2.58 kB │ gzip:  0.93 kB
dist/assets/index-axSWomjp.css   52.56 kB │ gzip: 10.73 kB
dist/assets/guestClaim-CtbfqO3b.js 1.01 kB │ gzip: 0.68 kB
dist/assets/index-BMqR-GEu.js   765.69 kB │ gzip: 201.45 kB ⚠️
```

**Single JS bundle: 766 kB uncompressed (201 kB gzipped)**

Vite is not doing any code splitting. Everything lands in one giant chunk. This triggers the "chunks larger than 500 kB" warning.

**Likely culprits in the 766 kB bundle:**
- `axios` (~50 kB) — could use native `fetch` or smaller alternative
- `@tanstack/react-query` (~30 kB) — justified
- `react-router-dom` (~25 kB) — justified
- `date-fns` (~75 kB) — only specific functions should be imported; check for `import * as dateFns`
- `zod` (~15 kB) — justified
- `@react-oauth/google` — includes Google Identity SDK bundled in

**No code splitting** — all routes render on initial load. React Router routes should use `React.lazy()` + `Suspense` to split by page.

---

## 9. Caching Architecture

### Current State
- **Redis in production** via `ioredis` (when `REDIS_URL` is set and not localhost)
- **In-memory `Map`** in dev/test — no Redis required locally
- **Cache key strategy:** `suggestions:v19:ll:{lat}:{lng}:{category}:{radius}:{date}` — includes version prefix (bumped when schema changes), location quantized to 1 decimal degree (~7 mi), TTL 1h for events / 6h for places
- **Nudge rate limiting:** `nudge:{proposalId}` cached for 3600s
- **Login lockout:** `login_attempts:{email}` cached for 900s
- **Zip geocoding:** `zipgeo:us:{zip}` cached for 30 days

### Issues
- **P3: No cache invalidation on vote changes.** The suggestion cache persists stale data regardless of proposal outcomes. This is by design (suggestions are venue data, not real-time state), so this is acceptable.
- **P3: No cache warming.** Cold start (after deployment or Redis flush) causes all first requests to be slow as external APIs are hit simultaneously. No warming strategy.
- **P3: Single Redis instance** — no replication. If Redis goes down, the in-memory fallback is not automatically engaged (Redis connection errors would surface as 500s in handlers that depend on cache for rate limiting).

---

## 10. Real-Time Architecture

### Current Approach
- **Web:** `refetchInterval: 8000` on `GET /api/proposals/:id` when `status === 'OPEN'` (React Query polling)
- **Mobile:** `setInterval(fetchProposal, 8000)` in `ProposalDetailScreen`
- **Notifications:** Web polls `GET /notifications` every 60 seconds

### Cost at Scale — 1000 Concurrent OPEN Polling Clients
- 1000 clients × 1 request/8s = **125 requests/second** to `GET /api/proposals/:id`
- Each request: 1 DB query (proposal) + 1 DB query (membership) + 1 DB count (memberCount) = **3 DB queries**
- **Total: 375 DB queries/second** just from polling on proposals

This is survivable at small scale but will become expensive at 1000+ active users. The 300 req/15min global rate limiter would bucket the entire user base — at 1000 users polling every 8s, the rate limiter fills within seconds.

### SSE vs WebSocket Assessment
**Server-Sent Events (SSE) is the correct upgrade path:**
- Proposals are read-heavy, write-infrequent (votes are rare events)
- SSE is one-directional (server → client) — perfect for state updates
- SSE works over HTTP/1.1, has automatic reconnect, compatible with Cloud Run (supports long-lived connections)
- Would reduce DB load by ~98% for the proposal detail poll (1 connection vs. 125 req/s)
- Cost: Connection management per Cloud Run instance; horizontal scaling requires Redis pub/sub to broadcast across instances

**WebSocket is overkill** — true bidirectional messaging is not needed here.

---

## 11. Scalability Concerns

### Hot Path: `getSuggestions()`
- **618-line function** orchestrating 10+ external API calls in parallel
- Uses `Promise.allSettled()` — correct, tolerates partial failures
- Multiple reverse geocode calls within a single request (zippopotam.us × 2 — once for coords, once for city name)
- AI Ideas (Gemini) + Tavily called sequentially after main sources — adds latency
- Caching is the primary protection; cold cache path is **slow by design**

### Hot Path: `checkProposalConsensus()`
- 4 sequential DB calls; called synchronously in the vote handler (blocks the response)
- If Prisma is slow (cold connection, high load), vote responses degrade linearly
- No timeout; consensus check could block for >1s

### Bottlenecks
1. **Suggestion cold cache:** First user in a location/category hits 8+ external APIs in parallel — response time 3-10s
2. **Photo enrichment:** `enrichPhotos()` called after suggestions assembled — can add another 1-3s for Foursquare lookups
3. **No connection pooling config visible** — Prisma uses default pool size; Cloud Run spins up new instances, each with own pool, potentially exhausting PostgreSQL connections
4. **`seedAfterDarkCatalog()` on every app startup** — runs at `createApp()` time; if startup is frequent (Cloud Run cold starts), this hits the DB on every cold start

---

## 12. Missing Features (Architecture Perspective)

| Feature | Current State | Gap |
|---------|--------------|-----|
| **API versioning** | None | Breaking changes require coordinated deploys across 3 clients |
| **Cursor pagination** | Only after-dark has page/limit offset pagination | `GET /groups/:id/proposals` returns ALL proposals — no limit |
| **Soft deletes (non-User)** | Only User has `deletedAt` | Proposals/Groups/Votes are hard-deleted; no recovery |
| **Audit log** | None | No record of who changed what, when |
| **Email verification enforced** | Sent but not checked | Users can act without verified email |
| **Per-user rate limiting** | IP-only | Shared IP (mobile carriers, offices) one user can lock others |
| **GDPR data export** | Web client returns "Export not available" stub | No data portability |
| **Hard delete job** | Mentioned in schema comments | No scheduled job to hard-delete soft-deleted users after 30 days |
| **Password strength** | Only min 8 chars | No complexity requirements |
| **Password history** | None | Password reset does not prevent reuse |
| **Search** | `/api/users/search` exists | No search on proposals, groups, suggestions |
| **Mobile refresh token** | Not implemented | Mobile users re-login on every access token expiry (~15 min) |
| **WebSocket/SSE** | Polling only | 375 DB queries/sec at 1000 concurrent users |

---

## 13. Top 20 Technical Improvements (Prioritized)

| # | Priority | Improvement | Impact |
|---|----------|-------------|--------|
| 1 | **P0** | Add startup validation: throw if `JWT_SECRET` is absent or `< 32 chars`. Never fall back to `'dev-secret'` in production. | Security critical |
| 2 | **P0** | Fix After Dark membership check (un-comment the `groupMember.findUnique` guard in `after-dark.ts:111`). Any user can currently add ideas to any group. | Security critical |
| 3 | **P1** | Move web refresh token to httpOnly `Secure` cookie. Keep access token in memory (Zustand state only, not localStorage). Eliminates XSS token theft. | Security high |
| 4 | **P1** | Implement mobile refresh token flow. Store refresh token in SecureStore, implement 401 interceptor that calls `/auth/refresh` before erroring. | UX — users getting logged out |
| 5 | **P1** | Add `@@index([proposalId])` to the `Option` model. Every proposal detail fetch does an unindexed scan on options. | Performance |
| 6 | **P1** | Add tests for the auth flow: register, login, lockout, refresh rotation, reuse detection. These are the highest-risk code paths with zero test coverage. | Reliability |
| 7 | **P1** | Add tests for the vote flow: cast, toggle, sentiment change, consensus trigger. Core business logic with no tests. | Reliability |
| 8 | **P1** | Merge `/api/auth/register` and `/api/auth/signup` into a single handler extracted as `registerUser()`. Eliminate code duplication. | Maintainability |
| 9 | **P1** | Fix `GET /groups/:id/proposals` — add `take` limit (default 20) and cursor-based pagination. Unlimited DB queries on large groups. | Scalability |
| 10 | **P1** | Fix rate limit bypass: remove the `skip: (req) => typeof req.body?.guestId === 'string'` exception on guest vote endpoint. Add guestId-keyed rate limiting instead. | Security |
| 11 | **P1** | Replace password reset with one-time-use tokens (store token hash in DB, mark used after first redemption). Current stateless JWT allows a stolen reset link to be used multiple times within the 1-hour window. | Security |
| 12 | **P2** | Add process-level unhandled rejection handler: `process.on('unhandledRejection', (reason) => { logger.error(...); process.exit(1); })`. | Reliability |
| 13 | **P2** | Enforce email verification: add `emailVerified: Boolean @default(false)` to User, block sensitive actions until verified. | Security / UX |
| 14 | **P2** | Add code splitting to the web bundle. Use `React.lazy()` + dynamic imports per route. Target: reduce initial bundle from 766 kB to <200 kB. | Performance |
| 15 | **P2** | Upgrade real-time to SSE on the proposal detail endpoint. Replace 8-second polling with `GET /api/proposals/:id/stream` EventSource. Estimated reduction: 375 req/s → ~5 req/s at 1000 users. | Scalability |
| 16 | **P2** | Catch Prisma `P2025` (RecordNotFound) errors in the global error handler and return 404 instead of 500. | API correctness |
| 17 | **P2** | Add `deletedAt` checks to `PATCH /auth/me` and any other routes that mutate user data to prevent soft-deleted users from modifying data before hard-deletion. | Correctness |
| 18 | **P2** | Remove `as any` casts in `suggestions.ts` `getFeaturedBusinesses()` — model the `Business` type properly to match the schema. | Code quality |
| 19 | **P3** | Add API versioning strategy: adopt URL prefix `/api/v1/` now, before the API surface grows further. | Future-proofing |
| 20 | **P3** | Implement GDPR data export: add `GET /api/auth/me/export` that assembles and emails the user their data (proposals, votes, comments, groups). Currently returns stub "Export not available". | GDPR compliance |

---

## Summary

**Strengths:**
- Auth implementation is sophisticated: true refresh token rotation, reuse detection, brute-force lockout, OAuth multi-provider — well above average for a startup
- Error handling is consistent (all routes use `next(err)`, global error handler present)
- Cache abstraction (Redis/in-memory) is clean and environment-aware
- Test coverage for the tricky parts (share, guest claim, notifications) is thorough and uses proper in-memory mocks
- Schema is well-designed with correct cascade deletions, GDPR soft-delete, and appropriate indexes

**Critical Gaps:**
1. `JWT_SECRET` fallback to `'dev-secret'` — if env is misconfigured, production tokens are forgeable
2. After Dark group membership check is disabled (commented out) — authorization bypass
3. Web tokens in localStorage — XSS-vulnerable
4. Mobile has no refresh token flow — users get logged out on every access token expiry
5. Core vote/proposal/auth flows have zero test coverage
6. Single 766 kB JS bundle on web — no code splitting
7. Polling every 8s will not scale past ~500 concurrent active proposal users

**Overall Grade:** B-  
Solid foundations, good auth design, meaningful tests on the right paths. Primary risk is the JWT secret fallback (P0), the auth bypass in After Dark (P0), and the mobile refresh token gap (P1) causing user experience regression in production today.
