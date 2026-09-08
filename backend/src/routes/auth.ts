import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '@/services/db';
import { signToken, requireAuth, AuthRequest } from '@/middleware/auth';
import { sendWelcomeEmail, sendPasswordResetEmail } from '@/services/email';
import { verifyGoogleToken } from '@/services/oauth';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Stricter rate limit for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

// POST /api/auth/register
authRouter.post('/register', authLimiter, async (req, res: Response, next) => {
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
    // Fire-and-forget — don't block registration on email delivery
    sendWelcomeEmail(user.email, user.displayName).catch(() => {});
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/login
authRouter.post('/login', authLimiter, async (req, res: Response, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.passwordHash) {
      // OAuth-only account — no password set
      return res.status(401).json({ error: 'This account uses social sign-in. Please sign in with Google.' });
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

// POST /api/auth/google
authRouter.post('/google', authLimiter, async (req, res: Response, next) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    const { email, name, providerId, avatarUrl } = await verifyGoogleToken(idToken);

    // Find existing user by provider or email
    let user = await prisma.user.findFirst({
      where: { OR: [{ provider: 'google', providerId }, { email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email, displayName: name, provider: 'google', providerId, avatarUrl, passwordHash: null },
      });
      sendWelcomeEmail(user.email, user.displayName).catch(() => {});
    } else if (!user.provider) {
      // Link existing email account to Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: { provider: 'google', providerId, avatarUrl },
      });
    }

    const token = signToken(user.id, user.email);
    return res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
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

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (req, res: Response, next) => {
  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    // Always respond OK to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.deletedAt) {
      // Stateless JWT reset token — valid 1 hour, signed with JWT_SECRET
      const jwt = await import('jsonwebtoken');
      const secret = process.env.JWT_SECRET ?? 'changeme';
      const resetToken = jwt.default.sign(
        { sub: user.id, purpose: 'password-reset' },
        secret,
        { expiresIn: '1h' },
      );
      sendPasswordResetEmail(user.email, resetToken).catch(() => {});
    }
    return res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req, res: Response, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token is required' });
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET ?? 'changeme';
    let payload: { sub?: string; purpose?: string };
    try {
      payload = jwt.default.verify(token, secret) as typeof payload;
    } catch {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    if (payload.purpose !== 'password-reset' || !payload.sub) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: payload.sub }, data: { passwordHash } });
    return res.json({ message: 'Password updated successfully' });
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
