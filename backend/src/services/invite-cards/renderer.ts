/**
 * Invite Card Renderer
 * Renders a card template to PNG (via puppeteer/Chromium) and PDF,
 * uploads both to GCS, and returns the public URLs.
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
  await file.save(buf, { contentType, resumable: false });
  await file.makePublic();
  return `https://storage.googleapis.com/${BUCKET}/${gcsPath}`;
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
  const html = renderCardHtml(templateId, data);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 1080x1920 viewport — the native card design dimensions (9:16 story format)
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load', timeout: 15000 });

    // PNG screenshot at native 1080x1920 (@2x = 2160x3840 for crisp displays)
    const pngBuf = await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
    const pngPath = `invite-cards/${proposalId}/${templateId}-${data.mode}.png`;
    const pngUrl = await uploadBuffer(pngBuf, pngPath, 'image/png');

    // PDF — US Letter size (8.5x11"), card scaled to fill the page.
    // The card is 9:16 (tall), letter is 8.5x11 (also tall portrait).
    // At letter DPI: 8.5" = 816px, 11" = 1056px. Card is 1080x1920.
    // Scale to fit width (816/1080 = 0.756x) → card renders at 816x1451px on letter.
    // We render at 1080x1920 and let the PDF engine scale to letter.
    const pdfBuf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      // Scale the 1080px-wide card to fill 8.5" letter width
      scale: 0.756,
    }) as Buffer;
    const pdfPath = `invite-cards/${proposalId}/${templateId}-${data.mode}.pdf`;
    const pdfUrl = await uploadBuffer(pdfBuf, pdfPath, 'application/pdf');

    logger.info(`Invite card rendered: proposalId=${proposalId} template=${templateId} mode=${data.mode}`);
    return { pngUrl, pdfUrl };
  } finally {
    await page.close();
  }
}
