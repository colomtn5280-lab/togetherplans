/**
 * Fun Ideas Routes
 *
 * GET /api/fun-ideas              — all ideas (optional ?audience=Couples|Friends|Family)
 * GET /api/fun-ideas/:id          — single idea by id
 */

import { Router, Request, Response } from 'express';
import { FUN_IDEAS, getFunIdeas, FunAudience } from '@/seeds/fun-ideas-catalog';

const router = Router();

const VALID_AUDIENCES: FunAudience[] = ['Couples', 'Friends', 'Family'];

// GET /api/fun-ideas
router.get('/', (req: Request, res: Response) => {
  const audience = typeof req.query.audience === 'string'
    ? req.query.audience as FunAudience
    : undefined;

  if (audience && !VALID_AUDIENCES.includes(audience)) {
    return res.status(400).json({ error: `audience must be one of: ${VALID_AUDIENCES.join(', ')}` });
  }

  const ideas = getFunIdeas(audience);

  // Map to Suggestion-compatible shape so the frontend Add-to-Date flow works unchanged
  const results = ideas.map((idea) => ({
    id: idea.id,
    name: idea.title,
    category: 'Fun Ideas',
    shortDescription: idea.description,
    description: idea.description,
    emoji: idea.emoji,
    tags: idea.tags,
    audience: idea.audience,
    costTier: idea.costTier,
    durationMinutes: idea.durationMinutes,
    dateFriendly: true,
    groupFriendly: true,
    source: 'fun-ideas',
    // No imageUrl — FunIdeasPage uses emoji + gradient tiles
  }));

  return res.json(results);
});

// GET /api/fun-ideas/:id
router.get('/:id', (req: Request, res: Response) => {
  const idea = FUN_IDEAS.find((i) => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: 'Idea not found' });
  return res.json(idea);
});

export default router;
