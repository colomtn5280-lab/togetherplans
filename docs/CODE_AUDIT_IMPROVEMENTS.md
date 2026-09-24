# Code Quality & Implementation Audit

**Date:** 2026-09-24  
**Audit Scope:** After Dark feature + backend quality  
**Finding:** Critical gaps in implementation

---

## 🔴 CRITICAL ISSUES

### 1. **After Dark Service is 100% Stubbed (Not Functional)**

**Location:** `backend/src/services/after-dark.service.ts`

**Problem:**
```typescript
// TODO: fetch from DB or in-memory cache
// const seedItems = await db.query(...)
items.push(...seedItems);
return items; // Returns empty array!
```

**Impact:**
- ❌ No seed items returned to users
- ❌ Custom ideas not saved
- ❌ Reports not tracked
- ❌ After Dark endpoints return empty data

**Root Cause:** No `AfterDarkItem` table in database schema

**Fix Required:** (2–3 hours)
1. Add `AfterDarkItem` model to `schema.prisma`
2. Implement database queries in service
3. Seed catalog on app startup
4. Test browse/filter/create flows

---

### 2. **Seed Catalog Never Loads**

**Location:** `backend/src/seeds/after-dark-catalog.ts` + `backend/src/app.ts`

**Problem:**
```typescript
// Catalog is created but never called
async function seedAfterDarkCatalog() { ... }
// ✋ This function is never invoked at app startup
```

**Impact:**
- ❌ 40 items exist in code but not in database
- ❌ Users see empty "After Dark" category
- ❌ Feature appears broken despite backend wiring

**Fix Required:** (15 minutes)
- Call seed function on app startup (only if items don't exist)
- Check for duplicates before seeding

---

### 3. **No Database Schema for After Dark**

**Location:** `backend/prisma/schema.prisma`

**Problem:**
```prisma
// ❌ Missing:
model AfterDarkItem {
  id        String   @id @default(uuid())
  title     String
  description String
  tier      String   // ROMANTIC | SPICY
  icon      String
  color     String
  createdBy String?  // null for seed items, userId for custom ideas
  groupId   String?  // null for public seed, groupId for custom
  reportedCount Int  @default(0)
  createdAt DateTime @default(now())
}
```

**Fix Required:** (20 minutes)
1. Add model to schema
2. Run `npx prisma migrate dev`
3. Regenerate Prisma client

---

## 🟡 CODE QUALITY ISSUES

### 4. **Inconsistent Response Shapes**

**Location:** `backend/src/routes/after-dark.ts`

**Problem:**
```typescript
// Line 25: Returns object with wrapper
res.json({
  name: "After Dark",
  emoji: "🌙",
  itemCount: 40
});

// Line 47: Returns direct array (no wrapper)
res.json([...items]);

// Inconsistent with other endpoints which use:
res.json({ data: [...] })
```

**Impact:** Web client needs different parsers per endpoint

**Fix:** Standardize to consistent wrapper:
```typescript
res.json({ items, pagination: { page, limit, total } })
```

---

### 5. **Using console.error Instead of Logger**

**Location:** `backend/src/routes/after-dark.ts` (4 instances)

**Problem:**
```typescript
console.error("Failed to fetch items:", error); // ❌ Not captured in logs
```

**Fix:** (10 minutes)
```typescript
import { logger } from '../utils/logger';
logger.error("Failed to fetch items", { error, context: "after-dark" });
```

---

### 6. **Missing Input Validation**

**Location:** `backend/src/routes/after-dark.ts` (POST /ideas)

**Problem:**
```typescript
router.post('/ideas', requireAuth, async (req: AuthRequest, res: Response) => {
  // ❌ No validation on:
  // - req.body.title (empty? too long? XSS?)
  // - req.body.description (empty? malicious content?)
  // - req.body.tier (ROMANTIC | SPICY only?)
  // - req.body.groupId (user member of group?)
```

**Fix:** (20 minutes)
```typescript
const { title, description, tier } = req.body;

if (!title?.trim() || title.length > 140) {
  return res.status(400).json({ error: "Title required, max 140 chars" });
}
if (!description?.trim()) {
  return res.status(400).json({ error: "Description required" });
}
if (!['ROMANTIC', 'SPICY'].includes(tier)) {
  return res.status(400).json({ error: "Invalid tier" });
}

// Verify user is member of groupId
const isMember = await db.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: req.user.id } } });
if (!isMember) {
  return res.status(403).json({ error: "Not a member of this group" });
}
```

---

### 7. **No Rate Limiting on Mutations**

**Location:** `backend/src/routes/after-dark.ts`

**Problem:**
```typescript
// ❌ Users can POST unlimited custom ideas
// ❌ Users can POST unlimited reports
// No throttling = potential spam/abuse
```

**Fix:** (10 minutes)
```typescript
const createIdeaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 ideas per minute
  keyGenerator: (req) => (req.user as AuthRequest['user']).id,
});

router.post('/ideas', requireAuth, createIdeaLimiter, async (req, res) => { ... });
```

---

### 8. **Missing Group Membership Validation**

**Location:** `backend/src/routes/after-dark.ts` (lines 45, 74)

**Problem:**
```typescript
// TODO: Verify user is member of group
// Currently allows any user to:
// - View other groups' custom ideas
// - Create ideas in groups they're not in
// - Report ideas from other groups
```

**Fix:** (15 minutes)
Add middleware:
```typescript
async function verifyGroupMember(req: AuthRequest, res: Response, next: NextFunction) {
  const { groupId } = req.body || req.query;
  if (!groupId) return res.status(400).json({ error: "groupId required" });
  
  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: req.user.id } }
  });
  
  if (!member) return res.status(403).json({ error: "Not a group member" });
  next();
}

router.post('/ideas', requireAuth, verifyGroupMember, async (req, res) => { ... });
```

---

### 9. **Pagination Could Validate Bounds**

**Location:** `backend/src/routes/after-dark.ts` (line 50)

**Problem:**
```typescript
let page = parseInt(req.query.page as string) || 1;
let limit = parseInt(req.query.limit as string) || 20;
// ❌ User can request limit: 10000 → performance issue
// ❌ User can request page: -1 → offset bug
```

**Fix:** (10 minutes)
```typescript
page = Math.max(1, Math.min(parseInt(req.query.page as string) || 1, 1000));
limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 20, 100));
```

---

### 10. **Hardcoded Magic Numbers**

**Location:** Multiple files

**Issue:**
```typescript
itemCount: 40,    // ❌ Magic number
limit: 20,        // ❌ Magic number
offset = (page - 1) * limit;  // ❌ If limit changes, breaks pagination
```

**Fix:** Extract to constants:
```typescript
const AFTER_DARK_SEED_COUNT = 40;
const PAGINATION_DEFAULT_LIMIT = 20;
const PAGINATION_MAX_LIMIT = 100;
```

---

## 📋 PRIORITY FIX ORDER

### Phase 1: Make Feature Functional (2–3 hours)
1. ✅ Add `AfterDarkItem` to schema.prisma
2. ✅ Implement database queries in service
3. ✅ Call seed function on startup
4. ✅ Test: Browse → should return 40 items

**Before:** After Dark returns empty arrays  
**After:** After Dark returns seed catalog

---

### Phase 2: Security & Validation (1 hour)
5. ✅ Add input validation (title, description, tier)
6. ✅ Add group membership verification
7. ✅ Add rate limiting to POST endpoints
8. ✅ Test: Can't spam ideas, can't access others' groups

---

### Phase 3: Code Quality (1 hour)
9. ✅ Replace console.error with logger
10. ✅ Standardize response shapes
11. ✅ Add bounds checking to pagination
12. ✅ Extract magic numbers to constants

---

### Phase 4: Documentation (30 minutes)
13. ✅ Update JSDoc for all endpoints
14. ✅ Document required headers/auth
15. ✅ Add error code reference

---

## 📊 IMPROVEMENT IMPACT

| Issue | Severity | Impact | Time |
|-------|----------|--------|------|
| Service is stubbed | CRITICAL | Feature completely broken | 2h |
| No DB schema | CRITICAL | Data never persists | 20m |
| Seed never loads | CRITICAL | Users see empty category | 15m |
| No input validation | HIGH | XSS, spam, abuse vectors | 20m |
| No group validation | HIGH | Privacy/security leak | 15m |
| No rate limiting | MEDIUM | Spam possible | 10m |
| Wrong logger | MEDIUM | Ops can't debug | 10m |
| Inconsistent responses | MEDIUM | Harder to integrate on web | 15m |

---

## ✅ RECOMMENDED ACTION

**Do this NOW before web UI work:**

1. Create database schema for AfterDarkItem
2. Implement real database queries
3. Add input validation + rate limiting
4. Verify seed loads on startup
5. Test full flow: browse → create idea → report

**Time estimate:** 3–4 hours (prevents shipping broken feature)

**Without this:** After Dark feature ships incomplete, users see empty category, no custom ideas work.

---

## Code References

**Files needing changes:**
- `backend/prisma/schema.prisma` — Add model
- `backend/src/services/after-dark.service.ts` — Implement queries
- `backend/src/routes/after-dark.ts` — Add validation + rate limiting
- `backend/src/app.ts` — Call seed on startup
- `backend/src/middleware/validation.ts` — Reusable validators

