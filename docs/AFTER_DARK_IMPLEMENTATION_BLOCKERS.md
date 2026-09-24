# URGENT: Complete After Dark Implementation Before Web UI

**Status:** Backend routes exist but service is stubbed (non-functional)  
**Blocker:** Feature appears to work but returns empty arrays to users  
**Time to fix:** 3–4 hours (do this now, before web UI work)  
**Priority:** CRITICAL

---

## The Problem In 30 Seconds

You built the API routes but **not the actual implementation**:

```typescript
// ❌ What's happening now:
router.get('/api/after-dark/items', async (req, res) => {
  let items = [];
  // TODO: fetch from DB  ← This is commented out
  return res.json(items); // ← Returns EMPTY ARRAY to users
});
```

**Result:** Web app shows "After Dark" category but clicking it shows nothing.

---

## Must-Fix Issues (In Order)

### 1️⃣ ADD DATABASE TABLE (20 min)

**File:** `backend/prisma/schema.prisma`

Add this model:
```prisma
model AfterDarkItem {
  id             String   @id @default(uuid())
  title          String   @db.VarChar(140)
  description    String   @db.Text
  tier           String   // ROMANTIC | SPICY
  icon           String?  // Emoji
  color          String   // Hex color
  createdBy      String?  // null for seed items, userId for custom ideas
  groupId        String?  // null for public seed, groupId for couple ideas
  reportedCount  Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  group          Group?   @relation(fields: [groupId], references: [id], onDelete: Cascade)
  creator        User?    @relation(fields: [createdBy], references: [id], onDelete: SetNull)

  @@index([groupId])
  @@index([createdBy])
  @@index([tier])
}
```

Then run:
```bash
cd /root/DateNight/backend
npx prisma migrate dev --name "add_after_dark_items"
```

---

### 2️⃣ IMPLEMENT SERVICE QUERIES (1 hour)

**File:** `backend/src/services/after-dark.service.ts`

Replace all TODO comments with real Prisma calls:

```typescript
import { db } from '../generated/prisma';

export class AfterDarkService {
  static async getItems(
    groupId?: string,
    tier?: AfterDarkTier
  ): Promise<AfterDarkItem[]> {
    const where: any = {
      OR: [
        { createdBy: null }, // Public seed items
        { groupId }, // Couple's custom ideas (if groupId provided)
      ]
    };

    if (tier) where.tier = tier;

    return db.afterDarkItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
  }

  static async createIdea(
    groupId: string,
    userId: string,
    input: CreateAfterDarkIdeaInput
  ): Promise<AfterDarkItem> {
    return db.afterDarkItem.create({
      data: {
        title: input.title,
        description: input.description,
        tier: input.tier,
        icon: input.icon,
        color: input.color,
        groupId,
        createdBy: userId,
      }
    });
  }

  static async reportIdea(ideaId: string): Promise<void> {
    await db.afterDarkItem.update({
      where: { id: ideaId },
      data: { reportedCount: { increment: 1 } }
    });
  }
}
```

---

### 3️⃣ SEED DATABASE ON STARTUP (15 min)

**File:** `backend/src/app.ts`

Add this after middleware setup:

```typescript
import { seedAfterDarkCatalog } from './seeds/after-dark-catalog';

// After all middleware, before routes
app.use((req, res, next) => {
  // Seed After Dark items once on startup
  seedAfterDarkCatalog().catch(err => logger.error('Seed failed', err));
  next();
});
```

**File:** `backend/src/seeds/after-dark-catalog.ts`

Add this function:

```typescript
import { db } from '../generated/prisma';

export async function seedAfterDarkCatalog() {
  // Check if already seeded
  const count = await db.afterDarkItem.count({
    where: { createdBy: null } // Seed items have no creator
  });

  if (count >= 40) return; // Already seeded

  const items = [
    {
      title: "Cook-off challenge",
      description: "Cook your favorite meal together and judge each other",
      tier: "ROMANTIC",
      icon: "👨‍🍳",
      color: "#B2485E",
    },
    // ... rest of 40 items from AFTER_DARK_MENU.md
  ];

  for (const item of items) {
    await db.afterDarkItem.create({
      data: { ...item, createdBy: null } // null = seed item
    });
  }
}
```

---

### 4️⃣ ADD INPUT VALIDATION (20 min)

**File:** `backend/src/routes/after-dark.ts`

Replace POST /ideas route:

```typescript
router.post('/ideas', requireAuth, async (req: AuthRequest, res: Response) => {
  const { title, description, tier, groupId } = req.body;

  // Validate input
  if (!title?.trim() || title.length > 140) {
    return res.status(400).json({ error: "Title required (1-140 chars)" });
  }
  if (!description?.trim()) {
    return res.status(400).json({ error: "Description required" });
  }
  if (!['ROMANTIC', 'SPICY'].includes(tier)) {
    return res.status(400).json({ error: "Tier must be ROMANTIC or SPICY" });
  }
  if (!groupId) {
    return res.status(400).json({ error: "groupId required" });
  }

  // Verify user is member of group
  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: req.user.id } }
  });
  if (!member) {
    return res.status(403).json({ error: "Not a member of this group" });
  }

  // Create idea
  const idea = await AfterDarkService.createIdea(groupId, req.user.id, {
    title,
    description,
    tier,
    icon: req.body.icon || "💡",
    color: tier === 'ROMANTIC' ? '#B2485E' : '#8E3448',
  });

  res.json(idea);
});
```

---

### 5️⃣ ADD RATE LIMITING (10 min)

**File:** `backend/src/routes/after-dark.ts`

```typescript
import rateLimit from 'express-rate-limit';

const ideaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5, // 5 ideas per minute
  message: "Too many ideas created, please try again later",
  keyGenerator: (req) => (req as AuthRequest).user.id,
});

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 reports per minute
  keyGenerator: (req) => (req as AuthRequest).user.id,
});

router.post('/ideas', requireAuth, ideaLimiter, async (req, res) => { ... });
router.post('/ideas/:id/report', requireAuth, reportLimiter, async (req, res) => { ... });
```

---

### 6️⃣ USE LOGGER, NOT console.error (10 min)

**File:** `backend/src/routes/after-dark.ts`

Replace all:
```typescript
// ❌ Before
console.error("Error:", err);

// ✅ After
import { logger } from '../utils/logger';
logger.error('After Dark error', { error: err, context: 'browse-items' });
```

---

## Validation Checklist

After each change, test:

```bash
# 1. TypeScript compiles
cd /root/DateNight/backend && npx tsc --noEmit

# 2. Prisma migrated successfully
npx prisma migrate dev

# 3. Service returns data (not empty)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.togetherplans.app/api/after-dark/items?page=1

# 4. Response includes seed items
# Expected: { items: [40 items], pagination: { ... } }
```

---

## Timeline

| Task | Time | Status |
|------|------|--------|
| Add DB schema | 20m | ⏳ NOT STARTED |
| Implement queries | 1h | ⏳ NOT STARTED |
| Seed on startup | 15m | ⏳ NOT STARTED |
| Add validation | 20m | ⏳ NOT STARTED |
| Add rate limiting | 10m | ⏳ NOT STARTED |
| Use logger | 10m | ⏳ NOT STARTED |
| **TOTAL** | **2h 15m** | ⏳ CRITICAL |

---

## Why This Matters

**Right now:**
```
User: "Show me After Dark items"
API: "Sure! Here are... 0 items" ❌
User: "This feature is broken"
```

**After fix:**
```
User: "Show me After Dark items"
API: "Here are 40 romantic/spicy activities" ✅
User: "I can browse, create custom ideas, and propose them"
```

---

## Decision

**Ship v1.2.0 with:**
- ✅ Backend routes (done)
- ⏳ Database implementation (2h work)
- ⏳ Web UI (4h work)

**Or:**

- ✅ Ship v1.2.0 WITHOUT After Dark
- ⏳ After Dark v1.2.1 (next week)

Which path do you want?

