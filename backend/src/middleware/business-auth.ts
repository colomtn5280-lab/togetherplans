import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';

export interface BusinessRequest extends Request {
  businessId?: string;
}

export function authenticateBusinessToken(
  req: BusinessRequest,
  res: Response,
  next: NextFunction
): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt_secret) as { businessId: string; type: string };
    if (payload.type !== 'business') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }
    req.businessId = payload.businessId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
