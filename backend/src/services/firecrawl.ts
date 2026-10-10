import * as crypto from 'crypto';
import { cache } from '@/services/cache';
import { logger } from '@/services/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapedProfile {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  hours?: string;
  cuisine?: string;
  priceRange?: string;
  logoUrl?: string;
  reservationUrl?: string;
  menuHighlights?: string[];
}

export interface VenueDetail {
  description?: string;
  hours?: string;
  phone?: string;
  reservationUrl?: string;
  menuHighlights?: string[];
  parking?: string;
  dresscode?: string;
  cancellationPolicy?: string;
  priceRange?: string;
  rating?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function urlHash(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

async function firecrawlScrape(
  url: string,
  prompt: string,
  schema: object,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    logger.warn('FIRECRAWL_API_KEY not set — skipping scrape');
    return {};
  }

  const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['extract'],
      extract: { prompt, schema },
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!resp.ok) {
    logger.warn(`Firecrawl returned ${resp.status} for ${url}`);
    return {};
  }

  const json = (await resp.json()) as { success?: boolean; data?: { extract?: Record<string, unknown> } };
  if (!json.success || !json.data?.extract) {
    return {};
  }

  return json.data.extract;
}

// ── scrapeBusinessProfile ─────────────────────────────────────────────────────

export async function scrapeBusinessProfile(url: string): Promise<ScrapedProfile> {
  const cacheKey = `firecrawl:biz:${urlHash(url)}`;

  try {
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached) as ScrapedProfile;
  } catch {
    // cache miss — continue
  }

  try {
    const data = await firecrawlScrape(
      url,
      'Extract business name, address, phone number, business hours, cuisine or category type, price range ($ $$ $$$ $$$$), description or tagline, reservation URL if present, logo or main image URL',
      {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          address: { type: 'string' },
          phone: { type: 'string' },
          hours: { type: 'string' },
          cuisine: { type: 'string' },
          priceRange: { type: 'string' },
          reservationUrl: { type: 'string' },
          logoUrl: { type: 'string' },
        },
      },
    );

    const profile: ScrapedProfile = {
      name: typeof data.name === 'string' ? data.name : undefined,
      description: typeof data.description === 'string' ? data.description : undefined,
      address: typeof data.address === 'string' ? data.address : undefined,
      phone: typeof data.phone === 'string' ? data.phone : undefined,
      hours: typeof data.hours === 'string' ? data.hours : undefined,
      cuisine: typeof data.cuisine === 'string' ? data.cuisine : undefined,
      priceRange: typeof data.priceRange === 'string' ? data.priceRange : undefined,
      logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : undefined,
      reservationUrl: typeof data.reservationUrl === 'string' ? data.reservationUrl : undefined,
    };

    await cache.set(cacheKey, JSON.stringify(profile), 604800); // 7 days
    return profile;
  } catch (err) {
    logger.warn(`scrapeBusinessProfile failed for ${url}: ${String(err)}`);
    return {};
  }
}

// ── scrapeVenueDetail ─────────────────────────────────────────────────────────

export async function scrapeVenueDetail(url: string): Promise<VenueDetail> {
  const cacheKey = `firecrawl:venue:${urlHash(url)}`;

  try {
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached) as VenueDetail;
  } catch {
    // cache miss — continue
  }

  try {
    const data = await firecrawlScrape(
      url,
      'Extract venue operational details: hours of operation, phone number, reservation URL, menu highlights (top 3-5 dishes or items), parking information, dress code, cancellation policy, price range, and average rating or review score',
      {
        type: 'object',
        properties: {
          description: { type: 'string' },
          hours: { type: 'string' },
          phone: { type: 'string' },
          reservationUrl: { type: 'string' },
          menuHighlights: { type: 'array', items: { type: 'string' } },
          parking: { type: 'string' },
          dresscode: { type: 'string' },
          cancellationPolicy: { type: 'string' },
          priceRange: { type: 'string' },
          rating: { type: 'string' },
        },
      },
    );

    const detail: VenueDetail = {
      description: typeof data.description === 'string' ? data.description : undefined,
      hours: typeof data.hours === 'string' ? data.hours : undefined,
      phone: typeof data.phone === 'string' ? data.phone : undefined,
      reservationUrl: typeof data.reservationUrl === 'string' ? data.reservationUrl : undefined,
      menuHighlights: Array.isArray(data.menuHighlights)
        ? (data.menuHighlights as unknown[]).filter((x): x is string => typeof x === 'string')
        : undefined,
      parking: typeof data.parking === 'string' ? data.parking : undefined,
      dresscode: typeof data.dresscode === 'string' ? data.dresscode : undefined,
      cancellationPolicy: typeof data.cancellationPolicy === 'string' ? data.cancellationPolicy : undefined,
      priceRange: typeof data.priceRange === 'string' ? data.priceRange : undefined,
      rating: typeof data.rating === 'string' ? data.rating : undefined,
    };

    await cache.set(cacheKey, JSON.stringify(detail), 86400); // 24 hours
    return detail;
  } catch (err) {
    logger.warn(`scrapeVenueDetail failed for ${url}: ${String(err)}`);
    return {};
  }
}
