import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/services/db';
import { signToken, requireAuth, AuthRequest } from '@/middleware/auth';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
authRouter.post('/register', async (req, res: Response, next) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!displayName || displayName.trim().length === 0) {
      return res.status(400).json({ error: 'displayName is required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName: displayName.trim() },
    });
    const token = signToken(user.id, user.email);
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res: Response, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user.id, user.email);
    return res.json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.deletedAt) return res.status(404).json({ error: 'User not found' });
    return res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      latitude: user.latitude,
      longitude: user.longitude,
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/auth/me — GDPR: soft delete now; hard delete within 30 days by job
authRouter.delete('/me', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { deletedAt: new Date() },
    });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});
