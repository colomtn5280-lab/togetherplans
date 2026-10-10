import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { prisma } from '@/services/db';
import { config } from '@/config';
import { authenticateBusinessToken, BusinessRequest } from '@/middleware/business-auth';
import { scrapeBusinessProfile } from '@/services/firecrawl';
import { uploadBusinessAsset } from '@/services/gcs-upload';
import { getStripeClient, STRIPE_PRICES, tierFromPriceId, PricePlan } from '@/services/stripe';

export const businessRouter = Router();

// ── Multer: memory storage for image uploads ──────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

// ── Rate limiter: 10 req/min per IP for Firecrawl scrape endpoint ─────────────
const scrapeRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — try again in a minute' },
});

// ── Firecrawl: POST /scrape-website (NO auth — pre-registration use) ──────────

businessRouter.post('/scrape-website', scrapeRateLimit, async (req, res: Response) => {
  const { url } = req.body as { url?: unknown };

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      res.status(400).json({ error: 'url must use http or https' });
      return;
    }
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  const profile = await scrapeBusinessProfile(url);
  res.json({ profile });
});

function signBusinessToken(businessId: string): string {
  return jwt.sign({ businessId, type: 'business' }, config.jwt_secret, {
    expiresIn: '30d',
  } as jwt.SignOptions);
}

// ── Auth: Register ─────────────────────────────────────────────────────────────

businessRouter.post('/auth/register', async (req, res: Response) => {
  try {
    const { name, email, password, category, city, state } = req.body as {
      name: string;
      email: string;
      password: string;
      category: string;
      city: string;
      state: string;
    };

    if (!name || !email || !password || !category || !city || !state) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const existing = await prisma.business.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const business = await prisma.business.create({
      data: { name, email, passwordHash, category, city, state },
    });

    const token = signBusinessToken(business.id);
    res.status(201).json({ token, businessId: business.id });
  } catch (err) {
    console.error('Business register error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Auth: Login ────────────────────────────────────────────────────────────────

businessRouter.post('/auth/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const business = await prisma.business.findUnique({ where: { email } });
    if (!business) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, business.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signBusinessToken(business.id);
    res.json({ token, businessId: business.id });
  } catch (err) {
    console.error('Business login error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Profile: GET /me ──────────────────────────────────────────────────────────

businessRouter.get('/me', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.businessId! },
      select: {
        id: true,
        name: true,
        email: true,
        category: true,
        description: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        lat: true,
        lng: true,
        website: true,
        phone: true,
        logoUrl: true,
        photos: true,
        priceRange: true,
        tags: true,
        tier: true,
        active: true,
        verified: true,
        createdAt: true,
      },
    });

    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    res.json({ business });
  } catch (err) {
    console.error('GET /business/me error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Profile: PATCH /me ────────────────────────────────────────────────────────

businessRouter.patch('/me', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const allowed = [
      'name', 'category', 'description', 'address', 'city', 'state',
      'zipCode', 'lat', 'lng', 'website', 'phone', 'logoUrl', 'photos',
      'priceRange', 'tags',
    ];

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }

    const business = await prisma.business.update({
      where: { id: req.businessId! },
      data,
      select: {
        id: true, name: true, email: true, category: true, description: true,
        address: true, city: true, state: true, zipCode: true, website: true,
        phone: true, priceRange: true, tags: true, tier: true,
      },
    });

    res.json({ business });
  } catch (err) {
    console.error('PATCH /business/me error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Listings: GET /me/listings ─────────────────────────────────────────────────

businessRouter.get('/me/listings', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const listings = await prisma.featuredListing.findMany({
      where: { businessId: req.businessId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ listings });
  } catch (err) {
    console.error('GET /business/me/listings error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Listings: POST /me/listings ────────────────────────────────────────────────

businessRouter.post('/me/listings', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const { title, description, imageUrl, ctaText, ctaUrl, startDate, endDate, active } = req.body as {
      title: string;
      description: string;
      imageUrl?: string;
      ctaText?: string;
      ctaUrl?: string;
      startDate?: string;
      endDate?: string;
      active?: boolean;
    };

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const listing = await prisma.featuredListing.create({
      data: {
        businessId: req.businessId!,
        title,
        description,
        imageUrl,
        ctaText: ctaText || 'Learn More',
        ctaUrl,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        active: active !== undefined ? active : true,
      },
    });

    res.status(201).json({ listing });
  } catch (err) {
    console.error('POST /business/me/listings error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Listings: PATCH /me/listings/:id ──────────────────────────────────────────

businessRouter.patch('/me/listings/:id', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const existing = await prisma.featuredListing.findFirst({
      where: { id: req.params.id, businessId: req.businessId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const allowed = ['title', 'description', 'imageUrl', 'ctaText', 'ctaUrl', 'startDate', 'endDate', 'active'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'startDate' || key === 'endDate') {
          data[key] = req.body[key] ? new Date(req.body[key] as string) : null;
        } else {
          data[key] = req.body[key];
        }
      }
    }

    const listing = await prisma.featuredListing.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ listing });
  } catch (err) {
    console.error('PATCH /business/me/listings/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Listings: DELETE /me/listings/:id ─────────────────────────────────────────

businessRouter.delete('/me/listings/:id', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const existing = await prisma.featuredListing.findFirst({
      where: { id: req.params.id, businessId: req.businessId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    await prisma.featuredListing.delete({ where: { id: req.params.id } });
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('DELETE /business/me/listings/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Analytics: GET /me/analytics ──────────────────────────────────────────────

businessRouter.get('/me/analytics', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || '7d';
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const impressions = await prisma.businessImpression.findMany({
      where: {
        businessId: req.businessId!,
        createdAt: { gte: since },
      },
      select: { eventType: true },
    });

    const counts = { impressions: 0, clicks: 0, addedToProposals: 0, matches: 0 };
    for (const imp of impressions) {
      if (imp.eventType === 'impression') counts.impressions++;
      else if (imp.eventType === 'click') counts.clicks++;
      else if (imp.eventType === 'add_to_proposal') counts.addedToProposals++;
      else if (imp.eventType === 'match') counts.matches++;
    }

    res.json(counts);
  } catch (err) {
    console.error('GET /business/me/analytics error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Public: POST /impressions ─────────────────────────────────────────────────

businessRouter.post('/impressions', async (req, res: Response) => {
  try {
    const { businessId, eventType, userId, proposalId, metadata } = req.body as {
      businessId: string;
      eventType: string;
      userId?: string;
      proposalId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!businessId || !eventType) {
      res.status(400).json({ error: 'businessId and eventType are required' });
      return;
    }

    await prisma.businessImpression.create({
      data: { businessId, eventType, userId, proposalId, metadata: metadata as object | undefined },
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /business/impressions error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Public: GET /public/stats ─────────────────────────────────────────────────

businessRouter.get('/public/stats', async (_req, res: Response) => {
  try {
    const [userCount, cityRows] = await Promise.all([
      prisma.user.count(),
      prisma.business.findMany({
        where: { active: true },
        select: { city: true },
        distinct: ['city'],
      }),
    ]);

    res.json({
      activeUsers: userCount,
      cities: cityRows.length,
      plansLockedThisWeek: Math.floor(userCount * 0.3), // estimated stat
    });
  } catch (err) {
    console.error('GET /business/public/stats error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Image Upload: POST /upload/:type (logo or hero) ───────────────────────────

businessRouter.post('/upload/:type', authenticateBusinessToken, upload.single('image'), async (req: BusinessRequest, res: Response) => {
  try {
    const assetType = req.params.type as 'logo' | 'hero';
    if (!['logo', 'hero'].includes(assetType)) { res.status(400).json({ error: 'type must be logo or hero' }); return; }
    if (!req.file) { res.status(400).json({ error: 'image file required' }); return; }

    const url = await uploadBusinessAsset(req.businessId!, assetType, req.file.buffer, req.file.mimetype);

    const field = assetType === 'logo' ? 'logoUrl' : 'heroImageUrl';
    await prisma.business.update({ where: { id: req.businessId! }, data: { [field]: url } });

    res.json({ url });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ error: String(err) });
  }
});

// ── Stripe: POST /subscribe — create Stripe checkout session ─────────────────

businessRouter.post('/subscribe', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const { plan, successUrl, cancelUrl } = req.body as { plan: PricePlan; successUrl: string; cancelUrl: string };

    if (!STRIPE_PRICES[plan]) { res.status(400).json({ error: 'Invalid plan' }); return; }

    const stripe = getStripeClient();
    const business = await prisma.business.findUnique({ where: { id: req.businessId! } });
    if (!business) { res.status(404).json({ error: 'Business not found' }); return; }

    // Create or retrieve Stripe customer
    let customerId = business.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: business.email, name: business.name, metadata: { businessId: business.id } });
      customerId = customer.id;
      await prisma.business.update({ where: { id: business.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { businessId: business.id, plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Subscribe error', err);
    res.status(500).json({ error: String(err) });
  }
});

// ── Stripe: GET /billing-portal — Stripe customer portal ─────────────────────

businessRouter.get('/billing-portal', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const business = await prisma.business.findUnique({ where: { id: req.businessId! } });
    if (!business?.stripeCustomerId) { res.status(400).json({ error: 'No billing account found' }); return; }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: business.stripeCustomerId,
      return_url: (req.query.returnUrl as string) || 'https://datemeup.app/business/dashboard',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Billing portal error', err);
    res.status(500).json({ error: String(err) });
  }
});

// ── Platform IDs: PATCH /me/platform-ids ─────────────────────────────────────

businessRouter.patch('/me/platform-ids', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const allowed = ['ticketmaster', 'songkick', 'opentable', 'resy', 'eventbrite'];
    const platformIds: Record<string, string> = {};
    for (const key of allowed) {
      if (req.body[key] && typeof req.body[key] === 'string') platformIds[key] = req.body[key].trim();
    }
    await prisma.business.update({ where: { id: req.businessId! }, data: { platformIds: platformIds as any } as any });
    res.json({ platformIds });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Direct Listings: CRUD ─────────────────────────────────────────────────────

businessRouter.get('/me/direct-listings', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const listings = await (prisma as any).businessDirectListing.findMany({
      where: { businessId: req.businessId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ listings });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

businessRouter.post('/me/direct-listings', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const { title, description, category, address, imageUrl, eventDate, price, ticketUrl } = req.body;
    if (!title || !description || !category) { res.status(400).json({ error: 'title, description, category required' }); return; }
    const listing = await (prisma as any).businessDirectListing.create({
      data: { businessId: req.businessId!, title, description, category, address, imageUrl, eventDate: eventDate ? new Date(eventDate) : null, price, ticketUrl, active: true },
    });
    res.status(201).json({ listing });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

businessRouter.patch('/me/direct-listings/:id', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const existing = await (prisma as any).businessDirectListing.findFirst({ where: { id: req.params.id, businessId: req.businessId! } });
    if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
    const allowed = ['title', 'description', 'category', 'address', 'imageUrl', 'eventDate', 'price', 'ticketUrl', 'active'];
    const data: Record<string, unknown> = {};
    for (const k of allowed) if (req.body[k] !== undefined) data[k] = k === 'eventDate' ? (req.body[k] ? new Date(req.body[k]) : null) : req.body[k];
    const listing = await (prisma as any).businessDirectListing.update({ where: { id: req.params.id }, data });
    res.json({ listing });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

businessRouter.delete('/me/direct-listings/:id', authenticateBusinessToken, async (req: BusinessRequest, res: Response) => {
  try {
    const existing = await (prisma as any).businessDirectListing.findFirst({ where: { id: req.params.id, businessId: req.businessId! } });
    if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
    await (prisma as any).businessDirectListing.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});
