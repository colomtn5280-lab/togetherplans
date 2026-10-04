# Hermes: start here

DateMeUp (datemeup.app) · design handoff · Oct 4 2026
Read this file first. It tells you what to build next and points to everything else. Full decision history is in `HANDOFF_README.md`.

## 1. Current priorities (this round)
1. **Rebrand to DateMeUp everywhere.** App name, web title, meta and OG description (the live meta description still says "DateNight"), emails, store listings. Domain: datemeup.app. Couples tagline: "Date night, decided."
2. **New logo and app icon (5a, teal tile).** Two people leaning in (teal + lime), "up" chevron above; wordmark "datemeup" in Sora 800. Use the files in `brand/` as-is (see `brand/README.md`). Replace the old calendar-heart icon on iOS and Android.
3. **Mobile welcome screen (3a).** Replaces the plain log-in form as the first screen. Stacked plan cards with a "BOTH ♥" sticker, headline "Date night, decided.", then Continue with Apple, Continue with Google, Sign up with email, Log in. On Android use 3d: Google first, no Apple button. Source: `DateMeUp Rebrand.dc.html` #3a and #3d.
4. **Web dashboard (4b).** One centered container, max 1080px. Main column: greeting, teal "start a plan" card, "Ideas near you" row with photos. Right rail, 300px: "Your groups" card, then an account card with Settings and Sign out buttons. "Get the app" moves to a slim footer with App Store and Google Play badges. No full-width Sign out bar. Under 768px, reuse the native dock layout. Source: `DateMeUp Rebrand.dc.html` #4b.
5. **Discover filters (4b blob tiles).** Replace the browser-default buttons. Spec, data and CSS in `web/DISCOVER_FILTERS.md`, `web/discover-filters.json`, `web/discover-filters.css`. Remove the emoji icons.

## 2. Known bugs to fix alongside
- Web dashboard renders blank.
- Suggestion cards have no restaurant images. Use the Yelp/Places photo plus an attribution caption, or a category placeholder when none is available.
- The proposal card grid clips on mobile.

## 3. Where everything is
| Need | File |
|---|---|
| Colours, type, components, icons | `DateNight System.dc.html` |
| All mobile screens | `DateNight Mobile.dc.html` |
| All web pages (light + dark, 1440 / 768 / mobile) | `DateNight Web.dc.html` |
| Rebrand round: logo, icon, welcome, dashboard | `DateMeUp Rebrand.dc.html` (approved: 5a teal, 3a, 4b) |
| Logo and icon production files | `brand/` + `brand/README.md` |
| Landing page production HTML | `web/landing.html` + `web/README.md` |
| Discover filters | `web/DISCOVER_FILTERS.md`, `.json`, `.css` |
| Share Cards (36 templates, picker, send) | `DateNight Share Cards.dc.html` |
| After Dark | `AFTER_DARK_SPEC.md`, `AFTER_DARK_MENU.md`, `after_dark_menu.json`, `DateNight After Dark.dc.html` |
| Business portal (/business) | `DateNight Business.dc.html` |
| Transactional emails (12, send-ready HTML) | `emails/` + `emails/README.md` |
| Marketing plan and assets | `marketing/` (start with `README.md`) |
| Print docs | `pdf/` |
| Original brief | `CLAUDE_DESIGN_DATA_PACK.md` |
| Project memory (settled decisions) | `PROJECT_MEMORY.md` |

To view a `.dc.html` file, open it in a browser with `support.js` and the `*-frame.jsx` / `browser-window.jsx` files in the same folder.

## 4. Visual rules (don't drift)
- Teal #0E8C8C (deep #086B6B, soft #D9F1F0), lime #7CB518 (soft #EAF6D3), ink #101820, ink-2 #5D6B76, line #DDE3E8, bg #F4F6F8. Dark mode: teal #2FC4C1, lime #A8E04B, bg #0F1519.
- Sora 600–800 for headings and buttons (tracking −0.04em on large sizes); DM Sans for body text.
- Asymmetric "sticker" radii on cards and buttons (for example 22px 30px 20px 26px). Rotate only status badges and stickers (±3–6°), never chips, inputs or avatars.
- Business portal data surfaces are calmer: 14px radius and 1px borders.
- Light and dark mode on web; mobile is light only for now.

## 5. Settled product decisions
See `PROJECT_MEMORY.md` § "Product decisions". Highlights: single-heart voting, vetoes for groups of 4+, strict-majority consensus, heart tallies hidden until everyone votes, a T-24h reminder push, After Dark couples-only (on by default, 16+ / Mature 17+), business tiers Free / $49 / $149 with After Dark excluded.

## 6. Before shipping
- Convert lockup text to outlines (the Sora font isn't embedded in the SVGs).
- Host `brand/mark-68.png` on your CDN and point the email headers at it.
