# Together Plans web landing — production HTML

`landing.html` is the reference implementation of design 1a in DateNight Web.dc.html, built as a single static page (no framework). It is the source of truth for togetherplans.app/.

## Deploy options (Cloudflare Pages + Vite/React app)
1. Fastest: serve `landing.html` as the static `/` route (put it in `public/` as index.html and move the React app's entry to `/app`), or
2. Port it into a React `Landing.tsx`: keep the CSS verbatim (module or global), copy the markup 1:1. Do not restyle.

## Rules
- Tokens, radii, rotations and copy are final; change only the store URLs (App Store id placeholder) and route hrefs.
- Logo: the inline two-figures SVG (brand/mark-teal.svg). Never the calendar icon.
- Fonts: Sora 600–800 + DM Sans via Google Fonts; self-host later if desired.
- Dark mode is handled by prefers-color-scheme in :root.
- Breakpoints: 1024 (stack hero), 640 (mobile). Nav links hide under 640; mobile uses the native dock in the app itself.
- og-image.png: export the hero stage (phone + Locked In card) at 1200×630 on teal.
