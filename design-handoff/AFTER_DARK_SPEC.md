# After Dark — implementation spec for Hermes

Together Plans · couples-only category · Sept 2026
Design source: `DateNight After Dark.dc.html` (screens 1a–1i, seed catalog 1g). Tokens: `DateNight System.dc.html`. Decision log: `HANDOFF_README.md`.

## 1. What it is
A private category of romantic and intimate date ideas, visible only to the two people in a 2-person group. It sits alongside the normal categories in Discover and uses the same propose → vote → decide loop, with Yes / Maybe / Pass voting and private passes.

## 2. Rules (settled; do not change without a design decision)
1. **Couples only.** Exists only in groups with exactly 2 members. Never appears in groups of 3+, never in business listings, never in History.
2. **Onboarding routing (1i).** Onboarding step 3 asks "Who are you planning with first?": *Just the two of us* → couple plan with After Dark included; *Friends & family* → group plan, After Dark never shown until the user creates a couple plan. No account-level mode.
3. **On by default for couples (1a).** Creating a couple plan shows the After Dark card once, with an **18+ confirmation** checkbox and a clear "Turn it off" option.
4. **Partner asked once (1b).** On the first After Dark proposal the partner receives, a sheet explains the category and asks: "Yes, include it" / "Not now". Content is hidden until they answer. "Not now" = off for that person; the proposer is told it isn't on yet (no reason given).
5. **Per-person off switch (1e).** Either person can turn it off for themselves in Settings at any time. If either is off, the category is hidden for the couple and open After Dark proposals are archived (not deleted).
6. **One switch, no tiers.** Romantic and Spicy ship together. The labels are **browse filters only** (All / Romantic / Spicy) and a tag on each card.
7. **Voting (1d).** Per option: **Yes / Maybe / Pass**. Match = both Yes. Maybes are shown to both; **Passes are never shown to the partner**. When both have voted and there's no match, show matches + mutual maybes only.
8. **Privacy.** Hidden from History always. Optional "discreet notifications" in Settings (off by default): push text becomes "New plan from Priya" with no title. No Face ID, no blur (neither store requires it).
9. **Content.** First-party seed catalog only (below). No photos in this category. No third-party APIs (Yelp/TMDB/Places) for After Dark items. Suggestive, never explicit.
10. **User ideas (1h).** Either partner can add their own idea (name ≤ 40, description ≤ 140, Romantic/Spicy, Home/Out). Visible only to that couple. Needs a report/block path so user content doesn't affect the rating.
11. **Share Cards (1f).** Type-only templates (no photos, no venue). Share sheet only. **Never email** anything After Dark: no invite, reminder, or result emails.
12. **Business.** Not part of any business tier. No venue or sponsored content inside After Dark.
13. **Rating.** Ships at **16+ (iOS)** / **Mature 17+ (Google Play)** because of "frequent mature or suggestive themes". Nothing explicit, so not 18+. Never show After Dark in iOS screenshots 1–3, the Play feature graphic, or ads that can reach under-18s.

## 3. Screens
| ID | Screen | Notes |
|---|---|---|
| 1i | Onboarding step 3 · "Who are you planning with first?" | Two cards; couple card shows 🌙 AFTER DARK tag "included · 16+ · your partner is asked first". CTA: "Invite my partner" / "Name the group". |
| 1a | Couple setup card | "After Dark is included". Three benefit rows, 18+ checkbox (required to continue), "Turn it off" secondary. Shown once per couple group. |
| 1b | Partner consent sheet | Bottom sheet over the incoming proposal. Explainer on wine-soft background. Buttons: "Yes, include it" (wine) / "Not now". |
| 1c | Discover · After Dark category | Category chip in the couple's context only. Filter pills All / Romantic / Spicy. Type-only cards (emoji, name, description, Home/Out, duration). "+" opens 1h. |
| 1d | After Dark proposal | "Saturday, stay in?" Per-option Yes / Maybe / Pass segmented control. Match state: both-Yes sticker. Footer copy: "Your passes stay private." |
| 1e | Settings · After Dark | Personal on/off, Hidden from History (locked on), Discreet notifications toggle, Share Cards info row, "Remove my custom ideas" destructive action. Copy: "These settings are yours. Priya has her own." |
| 1f | After Dark Share Card | 9:16, background #2A1219, text #F7E3E7, wine accents. Title, day/time, "made with Together Plans". No venue, no photo. |
| 1h | Add your own idea | Form: name, description, Romantic/Spicy, Home/Out. Saved to the couple only. |
| 1g | Seed catalog | 40 items, below. |

## 4. Visual tokens
- Accent wine **#B2485E** (`--ad`), soft **#F7E3E7** (`--ad-soft`), deep **#8E3448** (`--ad-deep`), text on wine **#FFFFFF** (`--on-ad`). Dark mode: wine lightens to **#E07A8E**; Share Card base **#2A1219**.
- Everything else follows the main system (teal, Sora/DM Sans, blob radii). Wine is used only inside After Dark so it reads as a different room, not a different app.
- Icon: 🌙 in tags and the category chip.

## 5. Data model (Prisma suggestion)
```prisma
model Suggestion {
  id          String   @id @default(cuid())
  name        String
  description String
  emoji       String?
  category    String   // "AFTER_DARK" for this feature
  adTier      String?  // "ROMANTIC" | "SPICY" (filter/label only)
  where       String?  // "HOME" | "OUT"
  duration    String?
  source      String   // "SEED" | "USER"
  groupId     String?  // set for USER ideas; visible to this couple only
  createdById String?
  reported    Boolean  @default(false)
}

model AfterDarkPref {
  userId     String
  groupId    String
  enabled    Boolean  @default(true)   // per-person switch
  consentAt  DateTime?                 // 18+ confirm (creator) or partner "Yes"
  declinedAt DateTime?                 // partner "Not now"
  discreet   Boolean  @default(false)  // discreet push text
  @@id([userId, groupId])
}

// Vote: add a value enum for After Dark options
enum AdVote { YES MAYBE PASS }
```
- Visibility check (server-side, every Discover/proposal/History query): group.memberCount == 2 AND both members' AfterDarkPref.enabled AND both have consentAt set.
- Votes API must **never return the partner's PASS values**; return only the caller's own votes, the match list, and mutual maybes.
- History endpoint excludes category AFTER_DARK unconditionally.
- Email service rejects any template for an AFTER_DARK proposal.

## 6. Notifications
- Standard push: "Priya sent an After Dark plan 🌙" → deep link to proposal.
- Discreet push (if enabled by the recipient): "New plan from Priya".
- Match: "It's a match 🌙" / discreet: "Your plan is decided".
- No T-24h email for After Dark; push only.

## 7. Seed catalog (1g) · 40 items
All first-party, suggestive not graphic. Fields map to Suggestion: emoji, name, description, where, duration; category = AFTER_DARK; adTier as below; source = SEED.

### Romantic (20)
| # | Name | Description | Where | Duration |
|---|---|---|---|---|
| R01 | 🍝 Cook-off for two | Same ingredients, two dishes, one judge each. Loser does dishes. | home | 2h |
| R02 | 🔭 Blanket and the sky | Drive somewhere dark, bring a thermos, name the constellations wrong. | out | 3h |
| R03 | 💆 Couples massage class | Learn it once, use it forever. Most studios run a 90-minute intro. | out | 90m |
| R04 | 🏨 Staycation | A hotel 10 minutes away. Late checkout, room service breakfast. | out | 1 night |
| R05 | 🌅 Sunrise drive | Alarm at 5, coffee in the car, watch it come up from the hill. | out | 2h |
| R06 | ✉️ Letter swap | Write each other a letter, read them out loud over a drink. | home | 1h |
| R07 | 💃 Kitchen dance lesson | One YouTube tutorial, one song, bare feet on tile. | home | 45m |
| R08 | 🛁 Bath, playlist, no phones | Candles, a shared playlist, a hard stop on screens. | home | 1h |
| R09 | 🧺 Rooftop picnic | Sandwiches and a bottle up on the roof or the fire escape. | out | 2h |
| R10 | 🔁 Recreate the first date | Same place if it still exists, same order, better conversation. | out | 3h |
| R11 | 🥐 Slow breakfast in bed | One of you cooks, the other stays. Swap next week. | home | 1h |
| R12 | 🎨 Wine and paint at home | Two canvases, one bottle, paint each other. No talent required. | home | 2h |
| R13 | 🧖 Spa afternoon | Sauna, steam, plunge. Go on a weekday if you can. | out | 3h |
| R14 | 🚗 Drive-in movie | Blankets, snacks, the back seat down. | out | 3h |
| R15 | 📚 Bookshop swap | Pick a book for each other, read the first chapter together at the cafe. | out | 2h |
| R16 | 🫕 Fondue night | Cheese or chocolate. Long forks, longer conversation. | home | 2h |
| R17 | 🌙 Moonlit walk | The usual route, at midnight, holding hands. | out | 1h |
| R18 | 🍽️ No-phones dinner | Book somewhere nice. Phones stay at home, not in pockets. | out | 2h |
| R19 | ✈️ Plan the dream trip | Open the map, pick a country, build the itinerary you'll take one day. | home | 90m |
| R20 | 🫙 Memory jar night | Write 20 favourite moments on slips, pull them one by one. | home | 1h |

### Spicy (20)
| # | Name | Description | Where | Duration |
|---|---|---|---|---|
| S01 | 📝 Yes / No / Maybe list | Each fill one in privately, then compare only the overlaps. | home | 1h |
| S02 | 👗 Outfit surprise | One of you picks what the other wears tonight. Sealed envelope. | home | evening |
| S03 | 🫒 Massage, oils, lights low | Warm oil, one long playlist, no clock. | home | 90m |
| S04 | ❓ 20 questions, adults only | Take turns; honest answers only. Pass is always allowed. | home | 1h |
| S05 | 🙈 Blindfold taste test | Five small bites, one blindfold, guess wrong and owe a favour. | home | 45m |
| S06 | 🎲 The dare jar | Write ten dares each, keep it playful, draw three. | home | 1h |
| S07 | 💿 One song, slow dance | Lights off, one song on repeat, see where it goes. | home | 20m |
| S08 | 🗝️ Hotel, no plans | Check in at 6. Do not leave the room. | out | 1 night |
| S09 | 🗺️ Love-note scavenger hunt | Notes hidden around the flat, each one a clue. Last one is in the bedroom. | home | 1h |
| S10 | 🚿 Shower together | Simple. Hot water, no rush. | home | 30m |
| S11 | 🍸 Strangers at the bar | Arrive separately. Meet like it's the first time. Pick each other up. | out | 2h |
| S12 | 🛍️ Browse the toy shop | Together, online or in person. Nothing has to come home. | out | 1h |
| S13 | 🃏 Adults-only game night | A couples card game, a bottle, a rule that you finish the deck. | home | 2h |
| S14 | 🕯️ Bath for two | Candles, a glass each, a hard stop on talking about work. | home | 1h |
| S15 | 🥂 Dress code: robe | Dinner in, ordered or cooked, robes only. | home | evening |
| S16 | 🥞 Morning after breakfast | Order in, stay in bed until it arrives, and after. | home | 2h |
| S17 | 💭 One fantasy each | Share one, listen to one. No commentary until both are out. | home | 45m |
| S18 | 📸 Photo booth for two | Your phones, your rules. Stays on your devices. | home | 30m |
| S19 | 🌜 Midnight snack in bed | Something you can eat with your fingers. Crumbs are fine. | home | 30m |
| S20 | 👃 Five-senses night | One thing to taste, touch, smell, hear and see. Take turns leading. | home | 2h |

## 8. QA checklist
- [ ] Group of 3+ never sees After Dark anywhere (Discover, proposals, search, Share Cards, emails).
- [ ] "Friends & family" onboarding path never shows After Dark.
- [ ] 18+ checkbox is required before After Dark content appears for the creator.
- [ ] Partner sees the consent sheet exactly once; "Not now" hides the category for both.
- [ ] Either person turning it off hides it for the couple immediately; open proposals archived.
- [ ] Partner's Pass never shows up in API responses or the UI.
- [ ] After Dark proposals never appear in History.
- [ ] No email sent for any After Dark proposal, reminder or result.
- [ ] Discreet push text used when the recipient enabled it.
- [ ] No photos or third-party data in After Dark cards; Share Cards are type-only.
- [ ] User ideas visible only to their couple; report path works.
- [ ] Store listings: rating 16+ / Mature 17+; no After Dark in iOS screenshots 1–3 or the Play feature graphic.
