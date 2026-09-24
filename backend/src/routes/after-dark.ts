/**
 * After Dark Routes
 * 
 * GET  /api/categories/after-dark          — Get category info
 * GET  /api/after-dark/items               — Browse seed + couple ideas (paginated)
 * POST /api/after-dark/ideas               — Create custom idea
 * POST /api/after-dark/ideas/:id/report    — Report user-generated idea
 */

import { Router, Response } from 'express';
import { AfterDarkService } from '../services/after-dark.service';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/categories/after-dark
 * Display info for After Dark category card in Discover
 */
router.get('/categories/after-dark', async (_req: AuthRequest, res: Response) => {
  try {
    const info = AfterDarkService.getCategoryInfo();
    const colors = AfterDarkService.getColorTokens();
    
    res.json({
      ...info,
      colors,
      itemCount: 40, // TODO: count from DB
    });
  } catch (error) {
    console.error('Error fetching After Dark category info:', error);
    res.status(500).json({ error: 'Failed to fetch category info' });
  }
});

/**
 * GET /api/after-dark/items
 * Browse After Dark seed catalog + couple-created ideas
 * 
 * Query params:
 *   - page: number (default 1)
 *   - limit: number (default 20)
 *   - tier: 'ROMANTIC' | 'SPICY' | undefined for all
 *   - groupId: string (optional, to include couple's custom ideas)
 */
router.get('/after-dark/items', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const tier = (req.query.tier as 'ROMANTIC' | 'SPICY') || undefined;
    const groupId = req.query.groupId as string;

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const result = await AfterDarkService.getItemsPaginated(
      page,
      limit,
      tier,
      groupId
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching After Dark items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * POST /api/after-dark/ideas
 * Create a custom After Dark idea (couple-created)
 * 
 * Body:
 *   - groupId: string
 *   - name: string (≤40 chars)
 *   - description: string (≤140 chars)
 *   - tier: 'ROMANTIC' | 'SPICY'
 *   - where: 'HOME' | 'OUT'
 */
router.post('/after-dark/ideas', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId; // from auth middleware
    const { groupId, name, description, tier, where } = req.body;

    // Validate input
    if (!groupId || !name || !description || !tier || !where) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (name.length > 40) {
      return res.status(400).json({ error: 'Name must be ≤ 40 characters' });
    }

    if (description.length > 140) {
      return res.status(400).json({ error: 'Description must be ≤ 140 characters' });
    }

    if (!['ROMANTIC', 'SPICY'].includes(tier)) {
      return res.status(400).json({ error: 'Tier must be ROMANTIC or SPICY' });
    }

    if (!['HOME', 'OUT'].includes(where)) {
      return res.status(400).json({ error: 'Where must be HOME or OUT' });
    }

    // TODO: Verify user is member of group
    // const group = await db.getGroup(groupId);
    // if (!group || !group.members.includes(userId)) {
    //   return res.status(403).json({ error: 'Not a member of this group' });
    // }

    const idea = await AfterDarkService.createUserIdea(groupId, userId!, {
      groupId,
      name,
      description,
      tier,
      where,
    });

    res.status(201).json(idea);
  } catch (error) {
    console.error('Error creating After Dark idea:', error);
    res.status(500).json({ error: 'Failed to create idea' });
  }
});

/**
 * POST /api/after-dark/ideas/:id/report
 * Report a user-generated idea for moderation
 * 
 * Body:
 *   - reason: string (report reason)
 */
router.post('/after-dark/ideas/:id/report', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    await AfterDarkService.reportIdea(id, reason);

    res.json({ message: 'Idea reported successfully' });
  } catch (error) {
    console.error('Error reporting After Dark idea:', error);
    res.status(500).json({ error: 'Failed to report idea' });
  }
});

export default router;
