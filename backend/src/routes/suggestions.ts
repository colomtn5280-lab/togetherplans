import { Router, Request, Response, NextFunction } from 'express';
import { getSuggestions } from '@/services/suggestions';

export const suggestionsRouter = Router();

// GET /api/suggestions?lat=39.7&lng=-104.9&category=restaurant
suggestionsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;

    if (lat !== undefined && (isNaN(lat) || lat < -90 || lat > 90)) {
      return res.status(400).json({ error: 'lat must be a valid latitude (-90 to 90)' });
    }
    if (lng !== undefined && (isNaN(lng) || lng < -180 || lng > 180)) {
      return res.status(400).json({ error: 'lng must be a valid longitude (-180 to 180)' });
    }

    const suggestions = await getSuggestions({ lat, lng, category });
    return res.json(suggestions);
  } catch (err) {
    return next(err);
  }
});
