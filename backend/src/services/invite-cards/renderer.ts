/**
 * Invite Card Renderer
 *
 * Cards are authored at 360×640 CSS px (.sc-card in sharedCss).
 * Correct render approach (per SHARE_CARD_RENDER_FIX.md):
 *   - Viewport: 360×640, deviceScaleFactor: 3  → 1080×1920 px PNG output
 *   - Capture the .sc-card element directly, not the full page
 *   - Inject render-mode CSS: no border-radius, no box-shadow, no grey background
 *   - Wait for fonts + images before capturing
 *
 * PDF: 8.5×15.11" page (exact 9:16 ratio at 8.5" width) — card fills page edge-to-edge.
 */

import { Storage } from '@google-cloud/storage';
import { renderCardHtml, CardData } from './templates';
import { logger } from '@/services/logger';

const BUCKET = process.env.GCS_BUCKET || 'datemeup-business-assets';
const storage = new Storage();

// Lazy-load puppeteer to avoid startup cost
let _browser: import('puppeteer-core').Browser | null = null;

async function getBrowser() {
  if (_browser) return _browser;
  const puppeteer = await import('puppeteer-core');
  // Use system Chromium installed in the Docker image (PUPPETEER_EXECUTABLE_PATH env var).
  // @sparticuz/chromium ships a musl binary that won't run on Debian/Cloud Run glibc.
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/usr/bin/chromium' ||
    '/usr/bin/chromium-browser';
  _browser = await puppeteer.default.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    headless: true,
  });
  return _browser;
}

async function uploadBuffer(buf: Buffer, gcsPath: string, contentType: string): Promise<string> {
  const file = storage.bucket(BUCKET).file(gcsPath);
  await file.save(buf, {
    contentType,
    resumable: false,
    // Uniform bucket-level access is enabled — makePublic() is not allowed.
    // Public read is granted at the bucket IAM level; just set Cache-Control.
    metadata: { cacheControl: 'public, max-age=31536000' },
  });
  // Do NOT call file.makePublic() — uniform bucket-level access blocks per-object ACLs.
  return `https://storage.googleapis.com/${BUCKET}/${gcsPath}`;
}

/**
 * After Dark card data — page-2 card for intimate/adult date ideas.
 */
export interface AfterDarkCardData {
  senderFirstName: string;
  partnerFirstName: string;
  ideaName: string;
  ideaDescription?: string;
  ideaWhere?: string;      // 'HOME' | 'OUT'
  ideaDuration?: string;  // '2h', '90m', '1 night'
  slotDay?: string;       // 'Fri' or 'Friday'
  slotTime?: string;      // '10:00 PM'
}

/**
 * Build the After Dark page-2 card HTML.
 * Aesthetic: Moonrise — dark background (#0A1018), teal accent, moon emoji.
 * Rendered at 360×640, deviceScaleFactor 3 → 1080×1920 PNG.
 */
export function renderAfterDarkCardHtml(data: AfterDarkCardData): string {
  const slotParts = [data.slotDay, data.slotTime, data.ideaWhere, data.ideaDuration]
    .filter(Boolean) as string[];
  const slotLine = slotParts.join(' · ');
  const senderName = data.senderFirstName.toUpperCase();
  const ideaDescription = data.ideaDescription || '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;width:360px;height:640px;overflow:hidden;background:#0A1018}
.sc-card{
  width:360px;height:640px;position:fixed;inset:0;
  background:#0A1018;color:#fff;
  font-family:Sora,sans-serif;
  display:flex;flex-direction:column;
  justify-content:center;align-items:center;
  padding:48px;text-align:center;
}
</style>
</head>
<body>
<div class="sc-card">
  <div style="font-size:80px;margin-bottom:24px">🌙</div>
  <div style="font-size:14px;letter-spacing:3px;color:#0E8C8C;text-transform:uppercase;margin-bottom:16px">After Dark · datemeup</div>
  <div style="font-size:48px;font-weight:800;line-height:1.1;margin-bottom:24px;max-width:280px">${data.ideaName}</div>
  ${ideaDescription ? `<div style="font-size:20px;color:rgba(255,255,255,0.7);margin-bottom:32px;max-width:260px">${ideaDescription}</div>` : ''}
  ${slotLine ? `<div style="font-size:16px;color:#0E8C8C;letter-spacing:1px">${slotLine}</div>` : ''}
  <div style="position:absolute;bottom:48px;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:2px">FROM ${senderName}</div>
</div>
</body>
</html>`;
}

/**
 * Render a card to PNG + PDF and upload to GCS.
 * Returns { pngUrl, pdfUrl }.
 */
export async function renderAndUploadCard(
  proposalId: string,
  templateId: string,
  data: CardData,
): Promise<{ pngUrl: string; pdfUrl: string }> {
  // Build HTML with a ?render=1 body class injected for clean capture
  let html = renderCardHtml(templateId, data);

  // Inject render-mode overrides into the <body> and card styles:
  // - No rounded corners or drop shadows on the card
  // - No grey page background behind the card
  // - Card is position:fixed inset:0 so it truly fills 360×640
  const renderCss = `
<style id="render-mode">
  html, body {
    margin: 0; padding: 0;
    width: 360px; height: 640px;
    overflow: hidden;
    /* background matches card — avoids grey bleed at edges */
    background: transparent;
  }
  .sc-card {
    width: 360px !important;
    height: 640px !important;
    position: fixed !important;
    inset: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    outline: none !important;
    margin: 0 !important;
  }
</style>`;

  // Insert render CSS just before </head>
  html = html.replace('</head>', `${renderCss}\n</head>`);
  // Override body/html dimensions in the existing inline styles
  html = html.replace(/width:1080px;height:1920px/g, 'width:360px;height:640px');

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 360×640 at 3× device pixel ratio → 1080×1920 px PNG output
    // This is the correct approach: render at card's native CSS size, upscale via DPR.
    await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
    await page.setContent(html, { waitUntil: 'load', timeout: 20000 });

    // Wait 800ms for web fonts (Sora, DM Sans, Caveat) and images after load
    await new Promise<void>((resolve) => setTimeout(resolve, 800));

    // Capture the card element, not the full page — ensures exact 1080×1920 output
    const cardEl = await page.$('.sc-card');
    const pngBuf = cardEl
      ? await cardEl.screenshot({ type: 'png' }) as Buffer
      : await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 360, height: 640 } }) as Buffer;

    const pngPath = `invite-cards/${proposalId}/${templateId}-${data.mode}.png`;
    const pngUrl = await uploadBuffer(pngBuf, pngPath, 'image/png');

    // PDF — page sized to exact 9:16 ratio at 8.5" width:
    // 8.5" x 15.11" (9:16 ratio) — card fills page edge-to-edge
    // Card fills the page edge-to-edge, no margins.
    const pdfBuf = await page.pdf({
      width: '8.5in',
      height: '15.11in',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    }) as Buffer;
    const pdfPath = `invite-cards/${proposalId}/${templateId}-${data.mode}.pdf`;
    const pdfUrl = await uploadBuffer(pdfBuf, pdfPath, 'application/pdf');

    logger.info(`Invite card rendered: proposalId=${proposalId} template=${templateId} mode=${data.mode}`);
    return { pngUrl, pdfUrl };
  } finally {
    await page.close();
  }
}

/**
 * Render the After Dark page-2 card to PNG and upload to GCS.
 */
async function renderAfterDarkCard(proposalId: string, afterDarkData: AfterDarkCardData): Promise<string> {
  const html = renderAfterDarkCardHtml(afterDarkData);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
    await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    const cardEl = await page.$('.sc-card');
    const pngBuf = cardEl
      ? await cardEl.screenshot({ type: 'png' }) as Buffer
      : await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 360, height: 640 } }) as Buffer;
    const pngPath = `invite-cards/${proposalId}/after-dark.png`;
    return await uploadBuffer(pngBuf, pngPath, 'image/png');
  } finally {
    await page.close();
  }
}

/**
 * Render main card + optional After Dark page-2 card, upload both, return URLs.
 */
export async function renderAfterDarkAndUpload(
  proposalId: string,
  templateId: string,
  data: CardData,
  afterDarkData?: AfterDarkCardData,
): Promise<{ pngUrl: string; pdfUrl: string; afterDarkPngUrl?: string }> {
  const [mainResult, afterDarkPngUrl] = await Promise.all([
    renderAndUploadCard(proposalId, templateId, data),
    afterDarkData ? renderAfterDarkCard(proposalId, afterDarkData) : Promise.resolve(undefined),
  ]);
  return { ...mainResult, afterDarkPngUrl };
}
