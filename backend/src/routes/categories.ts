import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '@/middleware/auth';
import { ALL_CATEGORIES } from '@/constants/categories';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

// GET /api/categories — the unified 15-category list (+ Custom, always last)
categoriesRouter.get('/', async (_req: AuthRequest, res: Response) => {
  res.json({ categories: ALL_CATEGORIES });
});
