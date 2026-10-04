# Together Plans (formerly DateNight) — project memory

Read this first in every session. It replaces re-briefing.

## What this project is
Redesign of DateNight: a propose → vote → decide planning app for couples (primary), friend groups, families. Mobile (Expo/React Native, iOS + Android), web (React), backend (Node/Prisma). Brand decision Oct 4 2026: renamed **DateMeUp**, site/app **datemeup.app** (web, iOS, Android live). Replaces "Together Plans"/togetherplans.app. Logo/icon/welcome/dashboard alternatives in `DateMeUp Rebrand.dc.html` (approved: welcome 3a, dashboard 4b; logo 5a FINAL (leaning figures + chevron, teal app-icon tile); assets in `brand/`). "Date night, decided." stays as the couples line. File names still start with "DateNight" (do not rename files).

## Where things live
- `DateNight System.dc.html` — colour, type, components, icons, tab bar, headers
- `DateNight Mobile.dc.html` — all mobile screens, turns 1–6 (newest turn at top)
- `DateNight Web.dc.html` — all web pages, 1440 / 768 / mobile, light + dark
- `DateNight Share Cards.dc.html` — 36 Share Card templates + picker/customise/send + camera-roll flow
- `DateNight After Dark.dc.html` — After Dark feature + 40-item seed catalog
- `DateNight Business.dc.html` — Together Plans for Business (/business): landing, register, dashboard, listing/offers, billing, report, consumer Featured card, admin queue, mobile
- `marketing/` — strategy README + 8 channel boards (Hub is the index)
- `emails/` — 12 approved transactional email templates (send-ready HTML) + README spec; board `Email Templates.dc.html`
- `DateMeUp Rebrand.dc.html` — Oct 2026 rebrand round: logos 1a–1d, app icons 2a–2d, mobile welcome 3a–3d, web dashboard 4a–4b
- `DateNight App Icon.dc.html` — turn 3 = Together Plans marks (3a FINAL; production assets in `brand/`), turns 1–2 = earlier DateNight rounds
- `web/landing.html` — production HTML of landing 1a for togetherplans.app (Hermes implements 1:1)
- `pdf/` — paginated print docs (Marketing Campaign, Design Package Index)
- `design_handoff_datenight_redesign/` — the handoff package; `HANDOFF_README.md` = contents index + full decision log. Keep it in sync after every change (copy changed files in).
- `github.md` — connected repo colomtn5280-lab/claude_upload (Hermes agent implements from it). Files there are flattened to the root.
- Original brief: `uploads/CLAUDE_DESIGN_DATA_PACK.md`

## Visual system (do not drift)
- Teal primary #0E8C8C (deep #086B6B, soft #D9F1F0); lime #7CB518 (soft #EAF6D3); ink #101820; ink-2 #5D6B76; line #DDE3E8; bg #F4F6F8; surface #fff. Success #1E9A55, warning #E39B12, error #D63A3A. After Dark accent wine #B2485E (soft #F7E3E7). Dark-mode vars exist in each file (`.dn-dark`).
- Type: Sora 600–800 display (−0.04em on large), DM Sans text, Caveat only for handwritten card templates.
- Shape: playful blob/sticker language, asymmetric radii (e.g. 22px 30px 20px 26px). Rotate ±3–6° only status badges and celebration stickers; never chips, inputs, list avatars.
- Voice: friendly, decisive, light. Approved lines: "47 MESSAGES LATER", "Hmm, two hearts 💛", "Friday's sorted by Tuesday", "Priya's picks win 7–5".
- Sample data: couple Sam & Priya (Friday night: Noodle Bar Kōji, Jazz at the Blue Room, The Midnight Ride); group Sunday crew (Jo, Maya, Priya, Sam, Lena, Dev; Bouldering at Mission Cliffs, Sun Sep 27 2 PM).

## Product decisions (settled; don't re-ask)
- Voting: single heart; groups of 4+ also get vetoes (no cap, undoable). Consensus = all voted + strict majority (couples: both hearts match). Heart tallies hidden until everyone votes; vetoes visible immediately with vetoer's name; previous-cycle vetoes not shown.
- Counter-proposal: one level only. T-24h reminder push to non-voters; no auto-close.
- Onboarding: 3 cards, third creates the first group; step 3 asks "who are you planning with first?" (couple vs friends & family).
- Share Cards (capitalised product name): 36 templates, 9:16, two modes (vote invite / it's official), mood filter playful/classic/dark, server-rendered 1080×1920 PNG, sent via thread+push, email (.ics), share sheet. Group photo library: photos visible to all group members; iOS limited photo access; Android system picker; Google Photos later.
- After Dark: couples-only, ON by default for 2-person groups with 18+ confirm and per-person off switch; no tiers (Romantic + Spicy together, labels are filters only); partner asked once; Yes/Maybe/Pass, passes private; hidden from History; no Face ID/blur; no photos/third-party APIs; type-only Share Cards; users can add own ideas. Rating accepted: 16+ iOS / Mature 17+ Play.
- Sticker density: current level. Web <768px reuses the native dock. Attribution captions for Yelp/TMDB/Places photos.
- Emails: one message + one button; no tallies in voting emails; After Dark never emails; T-24h reminder once, non-voters, only if push off.
- Business tiers: Free / Featured $49 / Premium $149 (annual 2 months free). After Dark excluded from business tiers. Featured badge + "Sponsored" in ⋯ menu. Data surfaces calmer (14px radius, borders); stickers only on badges.
- Marketing: <$1k/mo founder-run, US+UK/CA/AU, free at launch, no referral reward, faceless video, After Dark as secondary hook only.

## How to work with this user
- Concise and direct. Ask via forms when decisions are structured; recommend a default.
- Small change requests = targeted edits only. New rounds of options go in a new turn section at the top of the relevant file with stable ids (e.g. 7a, 7b).
- After any design change: copy the file into `design_handoff_datenight_redesign/`, add a line to `HANDOFF_README.md`'s decision log if a decision changed, and remind the user to push to GitHub for Hermes.
- Photos: Unsplash with credit overlay (image-slot). Never fabricate metrics; "47 messages" is a positioning claim pending real data.
