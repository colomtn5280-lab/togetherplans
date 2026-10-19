/**
 * After Dark Routes
 * 
 * Endpoints:
 *   GET  /api/categories/after-dark       — Display info for After Dark category
 *   GET  /api/after-dark/items            — Browse 40 seed items + couple's custom ideas
 *   POST /api/after-dark/ideas            — Create custom idea (couple only)
 *   POST /api/after-dark/ideas/:id/report — Report inappropriate idea
 */

import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AfterDarkService } from '../services/after-dark.service';
import { logger } from '@/services/logger';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import { prisma } from '@/services/db';

const router = Router();

// ── Rate limiters ──────────────────────────────────────────────────────────

const createIdeaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many ideas created, please try again later',
  skip: (req) => !((req as AuthRequest).userId),
});

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many reports, please try again later',
  skip: (req) => !((req as AuthRequest).userId),
});

// ────────────────────────────────────────────────────────────────────────────


/**
 * GET /api/after-dark/items
 * Browse After Dark seed catalog + couple-created ideas
 * 
 * Query params:
 *   - page: number (default 1)
 *   - limit: number (default 20, max 100)
 *   - tier: 'ROMANTIC' | 'SPICY' (optional, filters by tier)
 *   - groupId: string (optional, includes couple's custom ideas if provided)
 */
router.get('/items', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const tier = (req.query.tier as string) || undefined;
    const groupId = (req.query.groupId as string) || undefined;

    // Validate pagination bounds
    const validPage = Math.max(1, Math.min(page, 1000));
    const validLimit = Math.max(1, Math.min(limit, 100));

    const result = await AfterDarkService.getItems(groupId, tier as import('../models/AfterDarkModels').AfterDarkTier | undefined, validPage, validLimit);

    res.json({
      items: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    logger.error('Failed to fetch After Dark items', {
      context: 'get-items',
      query: req.query,
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * POST /api/after-dark/ideas
 * Create custom After Dark idea for a couple
 * 
 * Body:
 *   - title: string (max 140 chars, required)
 *   - description: string (required)
 *   - tier: 'ROMANTIC' | 'SPICY' (required)
 *   - icon?: string (emoji, optional)
 *   - groupId: string (required, user must be member)
 */
router.post('/ideas', requireAuth, createIdeaLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, tier, icon, groupId } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!title?.trim() || title.length > 140) {
      return res.status(400).json({ error: 'Title required (1-140 characters)' });
    }
    if (!description?.trim()) {
      return res.status(400).json({ error: 'Description required' });
    }
    if (!['ROMANTIC', 'SPICY'].includes(tier)) {
      return res.status(400).json({ error: 'Tier must be ROMANTIC or SPICY' });
    }
    if (!groupId) {
      return res.status(400).json({ error: 'groupId required' });
    }

    // Verify user is member of group
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: userId! },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const idea = await AfterDarkService.createIdea(groupId, userId!, {
      title,
      description,
      tier,
      icon
    });

    res.status(201).json(idea);
  } catch (error) {
    logger.error('Failed to create After Dark idea', {
      context: 'create-idea',
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({ error: 'Failed to create idea' });
  }
});

/**
 * POST /api/after-dark/ideas/:id/report
 * Report an inappropriate After Dark idea
 * 
 * Params:
 *   - id: string (idea ID)
 */
router.post('/ideas/:id/report', requireAuth, reportLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const ideaId = req.params.id;

    if (!ideaId) {
      return res.status(400).json({ error: 'Idea ID required' });
    }

    await AfterDarkService.reportIdea(ideaId);

    res.json({ message: 'Idea reported successfully' });
  } catch (error) {
    logger.error('Failed to report After Dark idea', {
      context: 'report-idea',
      ideaId: req.params.id,
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({ error: 'Failed to report idea' });
  }
});

export default router;
