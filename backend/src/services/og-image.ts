/**
 * OG image rasterization — SVG → PNG for social link previews.
 *
 * WhatsApp / iMessage / Facebook crawlers do not render SVG og:images
 * (they unfurl text-only), so share OG images must be raster PNG.
 *
 * Uses @resvg/resvg-js (prebuilt native binary, no system deps — ships a
 * linux-x64-gnu prebuild that installs cleanly in the node:22-slim Docker
 * build Cloud Run uses).
 *
 * Fonts: resvg is told NOT to load system fonts (the slim container has
 * none), and instead uses bundled Liberation Sans (SIL OFL, metric-compatible
 * with Helvetica/Arial — the family named in our SVG templates). Emoji are
 * STRIPPED before rasterizing: Liberation Sans has no emoji glyphs and tofu
 * boxes look broken; legible text beats decorative emoji in a link preview.
 *
 * Results are cached in a small bounded in-memory map so repeat crawler hits
 * (WhatsApp fetches the image several times per share) don't re-rasterize.
 */

import { Resvg } from '@resvg/resvg-js';
import path from 'path';
import fs from 'fs';
import { logger } from '@/services/logger';

// ─── Font resolution (dist/ in prod, src/ in dev — same pattern as emails) ───

function resolveFontDir(): string | null {
  const candidates = [
    path.join(__dirname, '..', 'assets', 'fonts'), // dist/assets/fonts or src/assets/fonts
    path.join(process.cwd(), 'dist', 'assets', 'fonts'),
    path.join(process.cwd(), 'src', 'assets', 'fonts'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'LiberationSans-Regular.ttf'))) return dir;
  }
  return null;
}

const fontDir = resolveFontDir();
if (!fontDir) {
  logger.warn('og-image: bundled fonts not found — PNG text rendering will fail');
}

const fontFiles = fontDir
  ? [
      path.join(fontDir, 'LiberationSans-Regular.ttf'),
      path.join(fontDir, 'LiberationSans-Bold.ttf'),
    ]
  : [];

// ─── Emoji stripping ─────────────────────────────────────────────────────────

// Covers emoji blocks, misc symbols, flags, plus variation selectors and ZWJ
// (matched as separate alternatives — not inside the class — to satisfy
// eslint no-misleading-character-class).
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}]|\u{FE0F}|\u{200D}/gu;

/** Remove emoji (which would render as tofu boxes) from SVG text content. */
export function stripEmoji(s: string): string {
  return s.replace(EMOJI_RE, '').replace(/  +/g, ' ');
}

// ─── Rasterization ───────────────────────────────────────────────────────────

/** Rasterize an SVG string to a 1200-wide PNG buffer (OG standard 1200x630). */
export function rasterizeOgSvg(svg: string): Buffer {
  const cleaned = stripEmoji(svg);
  const resvg = new Resvg(cleaned, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      loadSystemFonts: false,
      fontFiles,
      defaultFontFamily: 'Liberation Sans',
      sansSerifFamily: 'Liberation Sans',
    },
  });
  return Buffer.from(resvg.render().asPng());
}

// ─── Bounded in-memory PNG cache ─────────────────────────────────────────────

const MAX_CACHE_ENTRIES = 100;
const pngCache = new Map<string, Buffer>();

/**
 * Rasterize with caching. Key should uniquely identify the rendered content
 * (e.g. share token — card content is stable enough for crawler bursts).
 * Simple FIFO-ish eviction: Map preserves insertion order; on overflow the
 * oldest entry is dropped. Re-inserting on hit gives LRU-ish behavior.
 */
export function rasterizeOgSvgCached(key: string, svg: string): Buffer {
  const hit = pngCache.get(key);
  if (hit) {
    // refresh recency
    pngCache.delete(key);
    pngCache.set(key, hit);
    return hit;
  }
  const png = rasterizeOgSvg(svg);
  if (pngCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = pngCache.keys().next().value;
    if (oldest !== undefined) pngCache.delete(oldest);
  }
  pngCache.set(key, png);
  return png;
}

/** Test hook */
export function clearOgImageCache(): void {
  pngCache.clear();
}
