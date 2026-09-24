# Apple App Review Response — TogetherPlans v1.2.0

## App Store Connect Notes Field + Review Reply

---

**1. Screen Recording**

A screen recording demonstrating the app's full functionality is attached/linked below. The recording begins with app launch and covers:

- Account registration (email + Google OAuth)
- Login flow
- Account deletion (available in Settings → Delete Account)
- Creating a group and inviting a partner via share link
- Browsing Discover (local activity suggestions with location)
- Building a plan by selecting activities
- Proposing a plan to a group
- Voting on a proposal as both the proposer and the partner
- Proposal reaching consensus and locking in
- User-generated content reporting (tap any suggestion → report)

Demo account for review:
- Email: demo@togetherplans.app
- Password: Demo1234!
- Pre-seeded with an active proposal and group ("Sam & Alex")

---

**2. App Purpose and Target Audience**

**TogetherPlans** solves the universal problem of decision paralysis in group planning — the endless back-and-forth of "Where do you want to go?" with no resolution.

**How it works:**
1. One person proposes 3–5 activity options for a date or outing
2. Everyone in the group votes on their favorite
3. The app locks in the winner automatically when consensus is reached

**Target audience:** Couples and small groups (2–6 people) planning date nights, friend outings, and family activities. The app is free with no paid tiers.

**Problem solved:** According to internal user research, the average couple exchanges 47+ messages trying to agree on a single plan. TogetherPlans replaces that thread with a structured proposal-and-vote flow that reaches a decision in minutes.

**Value delivered:** A locked plan, added to calendar, with all details — venue, time, activity — agreed upon by everyone involved.

---

**3. Setup Instructions and Main Features**

**Getting started:**
1. Download and launch the app
2. Create a free account (email/password or Google sign-in)
3. Create a group and invite your partner or friends via share link, QR code, or username
4. Tap "New Plan" to start proposing activities

**Main features:**

- **Discover:** Browse real local events and venues (concerts, restaurants, comedy shows, hiking trails, hotels, wellness centers, etc.) filtered by category and distance. Tap any card to add it to your plan.
- **Propose:** Select a date/time, add 1–5 activities, and send the proposal to your group.
- **Vote:** Partners vote on each option. The app notifies everyone when a winner is locked in.
- **Counter-propose:** If nobody's happy, any member can send a counter-proposal.
- **Guest voting:** Partners can vote via a shared link without needing an account.
- **After Dark:** A category of intimate, playful activity ideas for couples (recipes, massage, games) — no explicit content.
- **Share card:** Share a locked plan to social media.

**Demo credentials:**
- Email: demo@togetherplans.app
- Password: Demo1234!

The demo account is pre-seeded with a group ("Sam & Alex"), an active proposal, and sample voting history. All features are accessible from the demo account.

---

**4. External Services and Platforms**

| Service | Purpose |
|---------|---------|
| **Ticketmaster API** | Live events — concerts, comedy shows, theater |
| **PredictHQ API** | Local events — festivals, sports, community events |
| **OpenStreetMap (Overpass API)** | Venue data — restaurants, parks, museums, bars |
| **LiteAPI** | Hotel and accommodation listings |
| **Viator API** | Bookable local experiences and tours |
| **TMDB (The Movie Database)** | Now-playing movies and streaming show catalog |
| **Mobilize API** | Volunteering opportunities |
| **Google Places API** | Venue photos |
| **Google Gemini AI** | AI-generated local activity ideas (suggestions only, not user-facing AI chat) |
| **Google OAuth** | Social sign-in (optional) |
| **Facebook OAuth** | Social sign-in (optional) |
| **Apple Sign In** | Social sign-in (optional) |
| **Expo / EAS** | Mobile build and push notifications |
| **Google Cloud Run** | Backend API hosting |
| **PostgreSQL (Supabase)** | User data storage |
| **Cloudflare Pages** | Web app hosting |

All data sources are used solely to surface activity suggestions to users. No user data is sold or shared with any of these services beyond what is required for API authentication.

---

**5. Regional Differences**

The app functions consistently across all regions with one contextual difference:

- **Activity suggestions** are location-based — users in dense urban areas (NYC, LA, Chicago) will see more live event listings than users in rural areas. This is expected behavior based on what events and venues actually exist nearby.
- The core proposal, voting, and group features function identically regardless of location or region.
- The app is currently optimized for the United States. International users can use all core features; local suggestion coverage may be limited outside the US.
- All content is in English. No regional content restrictions exist.
- The app complies with GDPR (EU users can delete their account and all associated data from Settings → Delete Account) and CCPA.

---

**6. Industry/Protected Material**

TogetherPlans does not operate in a regulated industry and does not include protected third-party material beyond API integrations listed above, each of which is used under the respective provider's standard developer terms of service:

- Ticketmaster: Standard Partner API agreement
- Viator: Affiliate Partner Program (Partner ID: P00321754)
- TMDB: Standard API Terms (non-commercial attribution)
- OpenStreetMap: Open Database License (ODbL) — free to use with attribution
- Google APIs: Google Maps Platform Terms of Service

No medical, financial, legal, or otherwise regulated content is included. The "After Dark" category contains activity ideas for couples (cooking together, massage, games) and contains no explicit sexual content.

---

**Additional Notes for Reviewer**

- Account deletion is available at: Settings → Delete Account → Confirm. This permanently deletes the user's account, group memberships, and all proposals within 30 days per GDPR requirements.
- User-generated content: Users can create custom group names and proposal titles. Content reporting is available by long-pressing any suggestion or tapping the ⋯ menu on any user-generated idea.
- The app requires location permission to show nearby suggestions but works without it (users can enter a zip code instead).
- Push notifications are used only for: "Your partner voted on your proposal" and "A plan has been locked in." No marketing notifications.
- The app is free with no in-app purchases, subscriptions, or paid tiers of any kind.

---

**Contact**
Jacob Raymond
Developer / Founder
jake@togetherplans.app
+1 (970) 640-7601
