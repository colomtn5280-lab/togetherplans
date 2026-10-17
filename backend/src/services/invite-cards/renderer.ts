/**
 * Invite Card Renderer
 * Renders a card template to PNG (via puppeteer/Chromium) and PDF,
 * uploads both to GCS, and returns the public URLs.
 */

import path from 'path';
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
  // Try system chromium first, fall back to @sparticuz/chromium for Cloud Run
  let executablePath: string;
  try {
    const chromium = await import('@sparticuz/chromium');
    executablePath = await chromium.default.executablePath();
  } catch {
    executablePath = '/usr/bin/chromium-browser';
  }
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
    // 1080x1920 viewport (9:16 story format)
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load', timeout: 15000 });

    // PNG screenshot
    const pngBuf = await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
    const pngPath = `invite-cards/${proposalId}/${templateId}-${data.mode}.png`;
    const pngUrl = await uploadBuffer(pngBuf, pngPath, 'image/png');

    // PDF (A4 but cropped to 9:16 equivalent)
    const pdfBuf = await page.pdf({
      width: '1080px',
      height: '1920px',
      printBackground: true,
    }) as Buffer;
    const pdfPath = `invite-cards/${proposalId}/${templateId}-${data.mode}.pdf`;
    const pdfUrl = await uploadBuffer(pdfBuf, pdfPath, 'application/pdf');

    logger.info(`Invite card rendered: proposalId=${proposalId} template=${templateId} mode=${data.mode}`);
    return { pngUrl, pdfUrl };
  } finally {
    await page.close();
  }
}
