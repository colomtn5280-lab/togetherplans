# TogetherPlans for Business — B2B Portal Implementation Plan

> **For Hermes:** Full-stack feature. Build backend first, then web portal, then app integration. Commit after each phase.

**Goal:** Build a B2B portal where venues, restaurants, and experience providers can register, pay for featured placement, and appear in TogetherPlans suggestions/After Dark for relevant users.

**Architecture:** New Prisma models (Business, FeaturedListing, BusinessImpression) + backend routes (/api/business) + web portal (/business pages) + suggestions ranking update to boost featured businesses.

**Tech Stack:** Same as existing — Prisma/PostgreSQL, Express/TypeScript, React/TypeScript, Stripe for subscriptions.

**Monetization Tiers:**
- Free — listed in suggestions, organic ranking only
- Featured ($49/mo) — boosted rank, "Featured" badge, category priority
- Premium ($149/mo) — top placement, After Dark integration, mood tags, monthly analytics

---

## PHASE 1 — Backend

### Task 1: Prisma schema — Business models

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Add these models:**

```prisma
model Business {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  category     String   // dining|entertainment|outdoors|nightlife|wellness|arts|sports|other
  description  String
  address      String
  city         String
  state        String
  zipCode      String
  lat          Float?
  lng          Float?
  website      String?
  phone        String?
  logoUrl      String?
  photos       String[] // array of URLs
  priceRange   String   @default("$$") // $|$$|$$$|$$$$
  tags         String[] // mood tags: romantic|adventurous|social|chill|spontaneous|cultural
  hours        Json?    // { mon: "11:00-22:00", ... }
  tier         String   @default("free") // free|featured|premium
  stripeCustomerId     String?
  stripeSubscriptionId String?
  active       Boolean  @default(true)
  verified     Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  listings     FeaturedListing[]
  impressions  BusinessImpression[]
}

model FeaturedListing {
  id           String   @id @default(cuid())
  businessId   String
  title        String   // "Friday Night Special" 
  description  String
  imageUrl     String?
  ctaText      String   @default("Learn More")
  ctaUrl       String?
  startDate    DateTime?
  endDate      DateTime?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  business     Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
}

model BusinessImpression {
  id           String   @id @default(cuid())
  businessId   String
  eventType    String   // impression|click|add_to_proposal|match
  userId       String?
  proposalId   String?
  metadata     Json?
  createdAt    DateTime @default(now())
  business     Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
}
```

**After editing schema:**
```bash
cd backend
npx prisma migrate dev --name add_business_portal --skip-seed
npx prisma generate
```

**Commit:** `feat(schema): add Business, FeaturedListing, BusinessImpression models`

---

### Task 2: Business auth routes

**File:** Create `backend/src/routes/business-auth.ts`

**Endpoints:**
- `POST /api/business/auth/register` — create business account, send verification email
- `POST /api/business/auth/login` — returns JWT (separate from user JWT, claim: `{ businessId, type: 'business' }`)
- `POST /api/business/auth/forgot-password`
- `POST /api/business/auth/reset-password`

**Middleware:** Create `backend/src/middleware/business-auth.ts`
```typescript
export function authenticateBusinessToken(req, res, next) {
  // same pattern as authenticateToken but checks type === 'business'
}
```

**Wire in app.ts:**
```typescript
import { businessAuthRouter } from '@/routes/business-auth';
app.use('/api/business/auth', businessAuthRouter);
```

**Commit:** `feat(business): business auth routes + JWT middleware`

---

### Task 3: Business profile routes

**File:** Create `backend/src/routes/business-profile.ts`

**Endpoints (all require authenticateBusinessToken):**
- `GET /api/business/me` — get own business profile
- `PATCH /api/business/me` — update profile (name, description, hours, photos, tags etc.)
- `GET /api/business/me/listings` — get featured listings
- `POST /api/business/me/listings` — create listing
- `PATCH /api/business/me/listings/:id` — update listing
- `DELETE /api/business/me/listings/:id` — delete listing

**Commit:** `feat(business): business profile + listings CRUD routes`

---

### Task 4: Business analytics routes

**File:** Create `backend/src/routes/business-analytics.ts`

**Endpoints (require authenticateBusinessToken):**
- `GET /api/business/me/analytics` — query params: `?period=7d|30d|90d`
  Returns:
  ```json
  {
    "impressions": 1240,
    "clicks": 89,
    "addedToProposals": 34,
    "matches": 12,
    "conversionRate": 0.035,
    "topDays": [...],
    "byCategory": [...]
  }
  ```
- `POST /api/business/impressions` — internal endpoint called by suggestions route to log events (no auth, rate-limited)

**Commit:** `feat(business): business analytics routes`

---

### Task 5: Stripe subscription routes

**Install:** `npm install stripe`

**File:** Create `backend/src/routes/business-billing.ts`

**Endpoints (require authenticateBusinessToken):**
- `GET /api/business/me/billing` — current plan, next billing date, usage
- `POST /api/business/me/billing/subscribe` — body: `{ tier: 'featured'|'premium' }` — creates Stripe checkout session, returns URL
- `POST /api/business/me/billing/cancel` — cancels subscription at period end
- `POST /api/business/webhooks/stripe` — Stripe webhook handler (no auth)
  - On `customer.subscription.updated` → update business.tier
  - On `customer.subscription.deleted` → downgrade to free

**Env vars needed:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_FEATURED_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID`

**Commit:** `feat(business): Stripe billing integration`

---

### Task 6: Update suggestions ranking to boost featured businesses

**File:** Modify `backend/src/routes/suggestions.ts` or `backend/src/services/suggestions.ts`

**Logic:** When building the suggestions list:
1. Fetch featured/premium businesses within radius that match category
2. Inject them at the top of relevant category results
3. Premium businesses get position 1-3, Featured get 4-8, organic fill the rest
4. Log `impression` event for each business shown
5. Add `featured: true`, `tier: 'featured'|'premium'`, `businessId` to suggestion payload

**New suggestion shape:**
```typescript
type Suggestion = {
  // existing fields...
  featured?: boolean
  tier?: 'featured' | 'premium'
  businessId?: string
  badge?: string // "Featured" | "Top Pick" | null
  moodTags?: string[] // After Dark mood compatibility
}
```

**Commit:** `feat(suggestions): boost featured businesses in ranking + log impressions`

---

### Task 7: After Dark integration for Premium businesses

**File:** Modify `backend/src/routes/after-dark.ts`

**Logic:** When mood is set, query Premium businesses that have matching mood tags. Inject at top of After Dark suggestions.

**Commit:** `feat(after-dark): inject premium businesses based on mood tags`

---

## PHASE 2 — Web Portal

### Task 8: Business portal pages structure

**Files to create:**
- `web/src/pages/business/BusinessLandingPage.tsx` — public marketing page at `/business`
- `web/src/pages/business/BusinessRegisterPage.tsx` — signup at `/business/register`
- `web/src/pages/business/BusinessLoginPage.tsx` — login at `/business/login`
- `web/src/pages/business/BusinessDashboardPage.tsx` — dashboard at `/business/dashboard`
- `web/src/pages/business/BusinessProfilePage.tsx` — edit profile at `/business/profile`
- `web/src/pages/business/BusinessListingsPage.tsx` — manage listings at `/business/listings`
- `web/src/pages/business/BusinessAnalyticsPage.tsx` — analytics at `/business/analytics`
- `web/src/pages/business/BusinessBillingPage.tsx` — billing/upgrade at `/business/billing`

**Wire routes in `web/src/App.tsx`:**
```tsx
<Route path="/business" element={<BusinessLandingPage />} />
<Route path="/business/register" element={<BusinessRegisterPage />} />
<Route path="/business/login" element={<BusinessLoginPage />} />
// Protected business routes (require business JWT)
<Route path="/business/dashboard" element={<BusinessDashboardPage />} />
<Route path="/business/profile" element={<BusinessProfilePage />} />
<Route path="/business/listings" element={<BusinessListingsPage />} />
<Route path="/business/analytics" element={<BusinessAnalyticsPage />} />
<Route path="/business/billing" element={<BusinessBillingPage />} />
```

**Add business API to `web/src/api/client.ts`:**
```typescript
export const businessApi = {
  register: (data) => apiClient.post('/business/auth/register', data),
  login: (data) => apiClient.post('/business/auth/login', data),
  getMe: () => businessClient.get('/business/me'),
  updateMe: (data) => businessClient.patch('/business/me', data),
  getAnalytics: (period) => businessClient.get(`/business/me/analytics?period=${period}`),
  getListings: () => businessClient.get('/business/me/listings'),
  createListing: (data) => businessClient.post('/business/me/listings', data),
  subscribe: (tier) => businessClient.post('/business/me/billing/subscribe', { tier }),
};
```

**Note:** `businessClient` is a separate axios instance that sends `x-business-token` header from localStorage key `business_token`.

**Commit:** `feat(business-portal): route structure + API client`

---

### Task 9: BusinessLandingPage.tsx

**Design:** Match TogetherPlans brand. Teal/lime. Clean B2B marketing page.

**Sections:**
1. Hero: "Get discovered by couples planning their next date night" — CTA: Get Listed Free
2. How it works (3 steps): Create profile → Get discovered → Track results
3. Pricing cards (Free / Featured $49/mo / Premium $149/mo)
4. Stats: "X active users searching for plans in your city" (pull from /api/business/stats public endpoint)
5. CTA: Start for free

**Pricing table columns:**
| Feature | Free | Featured | Premium |
|---|---|---|---|
| Listed in suggestions | ✅ | ✅ | ✅ |
| Organic ranking | ✅ | ✅ | ✅ |
| Featured badge | | ✅ | ✅ |
| Priority placement | | ✅ | ✅ |
| After Dark integration | | | ✅ |
| Mood tag targeting | | | ✅ |
| Analytics dashboard | Basic | Full | Full + Export |
| Monthly report | | | ✅ |
| Price | Free | $49/mo | $149/mo |

**Commit:** `feat(business-portal): BusinessLandingPage with pricing`

---

### Task 10: BusinessRegisterPage + BusinessLoginPage

**Register form fields:**
- Business name, category (dropdown), email, password, confirm password
- Address, city, state, zip
- Phone, website (optional)
- Description (textarea, 500 char max)
- "I agree to Partner Terms" checkbox

**Login:** Email + password. Store JWT as `business_token` in localStorage.

**After register:** Redirect to dashboard with "Check your email to verify your account" banner.

**Commit:** `feat(business-portal): register + login pages`

---

### Task 11: BusinessDashboardPage

**Layout:** Sidebar nav (Dashboard, Profile, Listings, Analytics, Billing, Sign out)

**Dashboard content:**
- Stats row: Impressions (7d), Clicks (7d), Added to Proposals (7d), Matches (7d)
- Tier badge + "Upgrade" CTA if free
- Recent activity feed (last 10 impression events)
- Quick links: Edit profile, Add listing, View analytics

**Commit:** `feat(business-portal): dashboard + sidebar nav`

---

### Task 12: BusinessProfilePage

**Form sections:**
- Basic info (name, category, description, price range)
- Location (address, city, state, zip — shows map pin)
- Contact (phone, website)
- Photos (upload up to 10, drag-to-reorder)
- Mood tags (multi-select chips: Romantic, Adventurous, Social, Chill, Spontaneous, Cultural)
- Hours (day-by-day time range pickers)

**Commit:** `feat(business-portal): profile editor`

---

### Task 13: BusinessListingsPage

**List of active featured listings with:**
- Title, description, date range, active toggle
- "Add listing" button (opens modal)
- Edit/Delete per listing

**Modal fields:** Title, description, image URL, CTA text, CTA URL, start/end date, active toggle

**Commit:** `feat(business-portal): listings manager`

---

### Task 14: BusinessAnalyticsPage

**Charts (use recharts — already in web deps or add it):**
- Line chart: daily impressions + clicks over 30d
- Bar chart: events by type (impression/click/add/match)
- Conversion funnel: impression → click → add → match
- Table: top performing listings

**Period selector:** 7d / 30d / 90d

**Commit:** `feat(business-portal): analytics page with charts`

---

### Task 15: BusinessBillingPage

**Shows:**
- Current plan (tier badge)
- Next billing date, amount
- Upgrade/downgrade buttons → Stripe checkout redirect
- Cancel subscription link
- Invoice history (from Stripe)

**Commit:** `feat(business-portal): billing page + Stripe checkout`

---

## PHASE 3 — Mobile App Integration

### Task 16: Featured badge on suggestion cards (mobile)

**File:** Modify `mobile/src/screens/SuggestionsScreen.tsx` (or equivalent)

- Add "Featured" or "Top Pick" badge on suggestion cards when `featured: true`
- Badge: lime background, dark text, small pill in top-right of card
- Log `click` event to `/api/business/impressions` when user taps a featured card

**Commit:** `feat(mobile): featured business badges on suggestions`

---

### Task 17: Featured badge on suggestion cards (web)

**File:** Modify `web/src/pages/SuggestionsPage.tsx`

- Same badge treatment as mobile
- Log click events

**Commit:** `feat(web): featured business badges on suggestions`

---

## PHASE 4 — Admin (future)

Not building now. Post-launch add:
- `/admin/businesses` — review and verify new business registrations
- Manual tier override
- Bulk impression reports

---

## Environment Variables Needed

Add to Cloud Run (and local .env):
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_FEATURED_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
```

Jake must create these products in Stripe dashboard before billing goes live.

---

## Build Order

1. Phase 1 (backend) — full feature, deployable independently
2. Phase 2 (web portal) — B2B self-serve
3. Phase 3 (mobile badges) — user-facing featured treatment
4. Phase 4 (admin) — post-launch

Estimated sessions: 3–4 focused sessions.

---

## Files Changed Summary

**Backend (new):**
- `backend/prisma/schema.prisma` (modified)
- `backend/prisma/migrations/YYYYMMDD_add_business_portal/`
- `backend/src/routes/business-auth.ts`
- `backend/src/routes/business-profile.ts`
- `backend/src/routes/business-analytics.ts`
- `backend/src/routes/business-billing.ts`
- `backend/src/middleware/business-auth.ts`
- `backend/src/routes/suggestions.ts` (modified)
- `backend/src/routes/after-dark.ts` (modified)

**Web (new):**
- `web/src/pages/business/BusinessLandingPage.tsx`
- `web/src/pages/business/BusinessRegisterPage.tsx`
- `web/src/pages/business/BusinessLoginPage.tsx`
- `web/src/pages/business/BusinessDashboardPage.tsx`
- `web/src/pages/business/BusinessProfilePage.tsx`
- `web/src/pages/business/BusinessListingsPage.tsx`
- `web/src/pages/business/BusinessAnalyticsPage.tsx`
- `web/src/pages/business/BusinessBillingPage.tsx`
- `web/src/api/client.ts` (modified)
- `web/src/App.tsx` (modified)

**Mobile:**
- `mobile/src/screens/SuggestionsScreen.tsx` (modified)
