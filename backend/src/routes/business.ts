import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/services/db';
import { config } from '@/config';
import { authenticateBusinessToken, BusinessRequest } from '@/middleware/business-auth';

export const businessRouter = Router();

// ── Helper ────────────────────────────────────────────────────────────────────

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
