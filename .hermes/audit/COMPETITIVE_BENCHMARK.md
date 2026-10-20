# TogetherPlans — Competitive Benchmark
**October 2026**

---

## Comparable Applications Selected

| App | Why Comparable | Key Strength |
|---|---|---|
| **Hinge** | Couples-adjacent, social coordination, voting/matching patterns | Conversation-first UX, "Designed to be deleted" |
| **Airbnb** | Multi-step booking flow, social features, activity discovery | Polished onboarding, trust signals, activity cards |
| **Doodle/When2meet** | Group coordination, mutual availability/preference | Simplicity, no-friction voting |
| **Letterboxd** | Social + activity logs, shared lists, couple use | Rich cards, community, history |
| **Notion** | Multi-step workflows, collaboration, structured data | Flexible, powerful, clean |

---

## Pattern Analysis

### 1. Hinge — Relevant Patterns

**What they do well:**
- **Progressive onboarding** — 3-screen max before first value. TogetherPlans has 4-step signup + verify email + onboarding modal = 6+ steps before first use.
- **Inline reactions** — like/comment without leaving the card. Our APPROVE/MAYBE/REJECT requires navigating to the proposal first.
- **Match celebration** — full-screen animation with clear next steps (message now, keep looking). Our celebration has no "message your partner" CTA.
- **Conversation threading** — every decision leads to a conversation. Our app has proposal comments but they're buried.
- **"Your Turn" indicator** — prominent badge when action is required. We have nudge emails but no persistent in-app indicator.

**Applicable adaptations for TogetherPlans:**
- Add prominent "Your turn to vote" badge on Plans tab when partner has voted and user hasn't
- Add "Message Riley" CTA in match celebration (could link to native SMS/iMessage)
- Surface vote notes more prominently — they're currently invisible

### 2. Airbnb — Relevant Patterns

**What they do well:**
- **Activity cards with rich data** — photo, title, rating, price, distance, reviews count visible without tapping. Our suggestion cards show name + category but no photo in the voting flow.
- **Date/time selection inline** — date picker within the booking flow, not a separate screen. Our date/time for proposals is a separate picker step.
- **Trust signals on detail screens** — host photo, reviews, verified badge. Our venue cards lack trust signals (rating displayed but small).
- **Wishlists** — save activities for later. We have no "save this for later" concept.
- **Split booking** — "Checkout" CTA is always visible, fixed at bottom. Our "Finalize Plan" strip is there but sometimes obscured.

**Applicable adaptations:**
- Add photos to proposal option cards during voting (the imageUrl field exists in DB but often empty)
- Add a "Save for later" / favorites on Discover items
- Make the "Finalize" action more prominent and always visible

### 3. Doodle — Relevant Patterns

**What they do well:**
- **Zero-friction participation** — partner can vote without creating an account (guest voting). We have this but it's not prominently advertised.
- **Visual vote summary** — grid of names × options with color-coded votes visible at a glance. Our tally is text-based (+2 ~0 -0).
- **Simple share** — one tap to copy invite link. Our invite flow is 3+ steps.

**Applicable adaptations:**
- Visual vote matrix on the proposal screen — show who voted what in a grid
- Single-tap "Copy invite link" from the proposal screen itself (not buried in group settings)

### 4. Letterboxd — Relevant Patterns

**What they do well:**
- **Activity history** — every logged film is permanent, searchable, filterable. We have no plan history.
- **"Diary" view** — chronological log of past activities. No equivalent in TogetherPlans.
- **Lists** — curated collections of activities. No "bucket list" concept in our app.
- **Partner views** — see what your partner has logged. No equivalent.

**Applicable adaptations:**
- Plans history screen (DECIDED proposals → "Our Story" or "Past Plans")
- Bucket list / wish list from Discover items
- Partner activity view (see what your partner voted on)

### 5. Notion — Relevant Patterns

**What they do well:**
- **Persistent context** — opening any page feels like you never left. Our app loses state on back navigation (form resets, scroll position lost).
- **Keyboard shortcuts** — power users can do everything via keyboard on web. Our web app has minimal keyboard support.
- **Inline editing** — edit anything in place. Our proposal title, options are fixed after creation.

**Applicable adaptations:**
- Proposal editing after creation (change the date, swap an option)
- Better browser back-navigation state preservation (React Query cache helps but scroll position lost)

---

## Key UX Patterns Missing vs. Competitors

| Pattern | Present in Competitors | TogetherPlans Status | Priority |
|---|---|---|---|
| "Your turn" action indicator | Hinge, Doodle | ❌ Missing | P1 |
| Activity photo in voting cards | Airbnb | ⚠️ Inconsistent | P1 |
| Visual vote summary grid | Doodle | ❌ Missing | P1 |
| Past plans / history | Letterboxd | ❌ Missing | P2 |
| Save for later / wishlist | Airbnb, Letterboxd | ❌ Missing | P2 |
| Guest voting promoted | Doodle | ⚠️ Exists but buried | P1 |
| Post-match messaging CTA | Hinge | ❌ Missing | P1 |
| Proposal editing | Notion, Airbnb | ❌ Missing | P2 |
| Keyboard shortcuts (web) | Notion | ❌ Missing | P3 |
| Activity reviews/social proof | Airbnb, Letterboxd | ❌ Missing | P2 |
| Onboarding <3 steps | Hinge | ❌ 6+ steps currently | P0 |
| Single-tap invite share | Doodle | ❌ 3+ steps | P1 |
