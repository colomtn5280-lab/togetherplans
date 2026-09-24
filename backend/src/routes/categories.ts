import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '@/middleware/auth';
import { ALL_CATEGORIES } from '@/constants/categories';
import { AfterDarkService } from '@/services/after-dark.service';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

// GET /api/categories — the unified 15-category list (+ Custom, always last)
categoriesRouter.get('/', async (_req: AuthRequest, res: Response) => {
  res.json({ categories: ALL_CATEGORIES });
});

// GET /api/categories/after-dark — After Dark category display info
categoriesRouter.get('/after-dark', async (_req: AuthRequest, res: Response) => {
  try {
    res.json(AfterDarkService.getCategoryInfo());
  } catch {
    res.status(500).json({ error: 'Failed to fetch After Dark category info' });
  }
});
