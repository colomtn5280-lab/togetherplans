# TogetherPlans — "Next Level" Report: 14 Ways to Make It Better
**Date:** September 24, 2026 (written after the overnight fix batch — reflects the NEW baseline)
**Baseline it builds on:** 13/15 categories serving real local data (Denver test: family 100, sports 158, wellness 92, couples 68); guest voting via share links live; solo-start live; honest Ideas sections; Sports & Active replacing Golf.

Ranked by (user impact ÷ effort). Each item: what, why, and what "done" looks like.

---

## TIER 1 — Do next (high impact, days each)

### 1. Mobile parity for guest voting + solo-start  *(functionality / flow)*
The viral loop shipped on web only. Mobile users — the majority of real-world usage — can't yet generate a share link from a proposal or auto-create a personal space. Done = ProposalDetailScreen gets "Invite someone to vote" (native share sheet → WhatsApp/SMS), CreateProposalScreen supports the zero-group auto-create path identical to web.

### 2. Rich link previews for /vote/ links  *(capability / growth)*
When a guest-vote link lands in iMessage/WhatsApp, it currently unfurls as a generic SPA card. The share-card OG image route already exists for decided proposals — extend it to open proposals: OG image showing "Sarah proposed: Friday night 🎉 — 3 options, tap to vote." The link IS the acquisition channel; the preview is its first impression. Done = pasting a /vote/ link in iMessage shows a branded, proposal-specific card.

### 3. Guest→member vote carryover  *(flow)*
A guest votes, loves it, signs up… and their vote vanishes (guest votes are advisory and unlinked). Carry the localStorage guestId through signup and convert their GuestVote into a real Vote in the group they were invited to (when they join it). Done = vote survives account creation; the "create your account" CTA stops costing the guest their input.

### 4. "Tonight near me" instant answer  *(UX / capability)*
The single most common real-world query is "what should we do TONIGHT?" The data now supports it (dateFilter=tonight works and is cache-safe). Surface it: a hero shortcut on Discover ("🌙 Tonight in Denver") and on the landing page for guests. One tap → tonight's events sorted by distance. Done = zero-typing path from app open to tonight's options in under 3 seconds.

### 5. Hotel Stays + Volunteering — the last two fake tiles  *(deliverable)*
The grid is 13/15 honest. Finish it: LiteAPI/Nuitee is self-serve and bookable for hotels (fastest path per the API matrix); Mobilize API is free/no-key for volunteering and already validated in the matrix work. Done = 15/15 categories return real results; the "Ideas" fallback becomes rare instead of structural.

---

## TIER 2 — Product depth (high impact, ~a week each)

### 6. The plan's "memory" — post-date follow-through  *(capability / retention)*
The app currently ends at "It's a Match 🎉". Real relationships accumulate history. Day-after prompt ("How was Comedy Works? ⭐"), a Memories timeline per group (past plans + ratings + an optional photo), and "you loved X, here's what's similar this weekend." This is the moat: Yelp knows restaurants, but nothing else knows what YOU TWO did together. Done = a couple 3 months in can scroll their shared history; recommendations visibly use it.

### 7. Availability overlap — kill the date-picker guess  *(functionality)*
Proposals currently pin one dateTime the proposer guessed. The #1 real-world planning failure is "actually I can't do Friday." Let a proposal carry 2-3 candidate time slots, votes include time preference, and the match picks the winning slot. (Schema: small; UX: large.) Done = "Fri 7pm / Sat 2pm / Sun brunch?" is one proposal, not three texts.

### 8. Smart ranking v1 — context-aware ordering  *(capability)*
All ranking is currently distance/date. Cheap, big-feeling wins: boost indoor categories when NWS (already free/integrated) forecasts rain; suppress brunch spots at 8pm and comedy shows on weekday mornings; boost date-friendly seeds on Fri/Sat. Pure re-ranking — no new sources. Done = a rainy Saturday morning shows escape rooms and museums above hiking trails, and users never learn why — it just feels right.

### 9. Notifications that drive the loop  *(flow / retention)*
The bell exists; the pushes that matter don't all fire yet: "2 of 3 have voted — you're the holdout" (guilt works), "Your plan is tomorrow 🎉" (day-before excitement), "New guest vote on your proposal" (reward the sharer instantly). Done = the three highest-leverage pushes live on both platforms, each deep-linking to the exact screen.

---

## TIER 3 — Look, feel, and polish (medium impact, days each)

### 10. Category tiles with photographic identity  *(UI / look-and-feel)*
The emoji-on-pastel grid is clean but flat — every tile has identical visual weight, and it reads "template" next to Airbnb-class discovery UIs. Give each category a curated duotone-teal photo treatment (one art-directed image per category, shipped as static assets — no API cost). Done = the Discover grid is the screenshot you WANT on the App Store page.

### 11. Motion and micro-delight pass  *(look-and-feel)*
The confetti match moment is right; extend that energy to the small moments: card press-down spring, vote tally bars animating to width, Add-to-Plan flying into the dock strip, skeleton shimmer instead of spinners. Mobile: Reanimated; web: CSS transitions. Done = the app *feels* fun in a 10-second hands-on, not just functional.

### 12. Empty states that sell, everywhere  *(UX / copy)*
Dashboard empty state was fixed tonight; sweep the rest: Notifications ("Quiet for now — share a plan to change that"), Groups, After Dark off-hours, decided proposals with no share yet. Every dead-end should point at the next fun action. Done = zero screens that end in "nothing here."

### 13. Onboarding personalization (3 taps, big payoff)  *(UX)*
The 3-step modal explains; it doesn't ask. Add one step: "Pick 3 things you're into" (category chips). Store per-user, use to order the Discover grid and pre-filter "Tonight near me." Done = two different users open Discover and see two different grids — theirs.

### 14. Accessibility + perceived-speed baseline  *(UI / craft)*
Before store submission: color-contrast audit of teal-on-white chips and lime badges (several likely fail WCAG AA), focus states on web, VoiceOver labels on mobile vote/add buttons, and image lazy-loading + LCP check on Discover (89-result categories now ship a lot of images). Done = Lighthouse a11y ≥ 95 web, VoiceOver can complete a full vote flow, Discover LCP < 2.5s on 4G.

---

## Sequencing suggestion
Week 1: #1, #2, #3 (complete the viral loop end-to-end) + #5 (finish the grid).
Week 2: #4, #9, #12, #13 (the "it gets me" layer) → **then cut the iOS binary: this is the build to resubmit.**
Week 3-4: #6, #7, #8 (the moat), #10, #11, #14 (the shine).

## What I need from Jake
- NPS_API_KEY in Cloud Run (2 min, free — unlocks real hiking-trail depth beyond Foursquare)
- A decision on #7 (multi-slot proposals change the voting mental model — worth 10 minutes of your gut-check before I build)
- Eventually: LiteAPI signup for hotels (#5) — self-serve, no business docs needed
