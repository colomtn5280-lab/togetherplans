import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { prisma } from '@/services/db';
import { signToken, requireAuth, AuthRequest } from '@/middleware/auth';
import { sendWelcomeEmail, sendPasswordResetEmail } from '@/services/email';
import { verifyGoogleToken } from '@/services/oauth';
import { verifyAppleToken } from '@/services/apple';

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

function makeRefreshToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign({ userId, type: 'refresh' }, secret, { expiresIn: '30d' });
}

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
    const refreshToken = makeRefreshToken(user.id);
    // Fire-and-forget — don't block registration on email delivery
    sendWelcomeEmail(user.email, user.displayName).catch(() => {});
    return res.status(201).json({
      token,
      accessToken: token,
      refreshToken,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/signup — alias for /register (used by web client)
authRouter.post('/signup', authLimiter, async (req, res: Response, next) => {
  try {
    const { email, password, displayName, firstName, lastName } = req.body || {};
    // Web client sends firstName/lastName; merge into displayName if needed
    const name = displayName?.trim() ||
      [firstName, lastName].filter(Boolean).map((s: string) => s.trim()).join(' ') ||
      '';
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!name) {
      return res.status(400).json({ error: 'displayName (or firstName) is required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName: name },
    });
    const token = signToken(user.id, user.email);
    const refreshToken = makeRefreshToken(user.id);
    sendWelcomeEmail(user.email, user.displayName).catch(() => {});
    // Return both old shape (token/user) and new shape (accessToken) for compatibility
    return res.status(201).json({
      token,
      accessToken: token,
      refreshToken,
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
    const refreshToken = makeRefreshToken(user.id);
    return res.json({
      token,
      accessToken: token,
      refreshToken,
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
    const refreshToken = makeRefreshToken(user.id);
    return res.json({ token, accessToken: token, refreshToken, user: { id: user.id, email: user.email, displayName: user.displayName } });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/apple
// identityToken  — JWT from Apple (required)
// displayName    — user's full name (only present on first sign-in from device)
// email          — user's email (only present on first sign-in; Apple hides it after)
authRouter.post('/apple', authLimiter, async (req, res: Response, next) => {
  try {
    const { identityToken, displayName, email: bodyEmail } = req.body || {};
    if (!identityToken) return res.status(400).json({ error: 'identityToken is required' });

    const { email: tokenEmail, providerId } = await verifyAppleToken(identityToken);

    // Apple only sends email in token on first sign-in; fall back to body (client sends it first time)
    const email = tokenEmail ?? bodyEmail ?? null;

    // Find by Apple provider first, then by email (to link existing account)
    let user = await prisma.user.findFirst({
      where: { OR: [{ provider: 'apple', providerId }, ...(email ? [{ email }] : [])] },
    });

    if (!user) {
      if (!email) {
        // Apple hides email on subsequent sign-ins for new-to-us users — should not happen
        return res.status(400).json({ error: 'Email is required on first Apple sign-in' });
      }
      const name = displayName?.trim() || email.split('@')[0];
      user = await prisma.user.create({
        data: { email, displayName: name, provider: 'apple', providerId, passwordHash: null },
      });
      sendWelcomeEmail(user.email, user.displayName).catch(() => {});
    } else if (!user.provider) {
      // Link existing email/password account to Apple
      user = await prisma.user.update({
        where: { id: user.id },
        data: { provider: 'apple', providerId },
      });
    }

    const token = signToken(user.id, user.email);
    const refreshToken = makeRefreshToken(user.id);
    return res.json({ token, accessToken: token, refreshToken, user: { id: user.id, email: user.email, displayName: user.displayName } });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/refresh — exchange refresh token for new access token
authRouter.post('/refresh', async (req, res: Response, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
    const secret = process.env.JWT_SECRET || 'dev-secret';
    let payload: { userId?: string; type?: string };
    try {
      payload = jwt.verify(refreshToken, secret) as typeof payload;
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    if (payload.type !== 'refresh' || !payload.userId) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.deletedAt) return res.status(401).json({ error: 'User not found' });
    const accessToken = signToken(user.id, user.email);
    const newRefresh = makeRefreshToken(user.id);
    return res.json({ token: accessToken, accessToken, refreshToken: newRefresh });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/logout — stateless JWT; client clears tokens
authRouter.post('/logout', (_req, res: Response) => {
  return res.json({ message: 'Logged out' });
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

// PATCH /api/auth/me — update own profile
authRouter.patch('/me', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { displayName, latitude, longitude } = req.body || {};
    const update: Record<string, unknown> = {};

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0) {
        return res.status(400).json({ error: 'displayName must be a non-empty string' });
      }
      update.displayName = displayName.trim();
    }

    if (latitude !== undefined) {
      const lat = Number(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({ error: 'latitude must be a number between -90 and 90' });
      }
      update.latitude = lat;
    }

    if (longitude !== undefined) {
      const lng = Number(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'longitude must be a number between -180 and 180' });
      }
      update.longitude = lng;
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: update,
    });
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

// PATCH /api/auth/me/push-token — store Expo push notification token
authRouter.patch('/me/push-token', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { pushToken } = req.body || {};
    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({ error: 'pushToken is required' });
    }
    // Validate Expo push token format
    const isExpoPushToken = pushToken.startsWith('ExponentPushToken[') && pushToken.endsWith(']');
    const isExpoPushTokenShort = /^[a-zA-Z0-9_-]{20,}$/.test(pushToken);
    if (!isExpoPushToken && !isExpoPushTokenShort) {
      return res.status(400).json({ error: 'Invalid push token format. Expected ExponentPushToken[...] or a valid token string.' });
    }
    await prisma.user.update({
      where: { id: req.userId },
      data: { pushToken },
    });
    return res.json({ ok: true });
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
      const secret = process.env.JWT_SECRET ?? 'changeme';
      const resetToken = jwt.sign(
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
    const secret = process.env.JWT_SECRET ?? 'changeme';
    let payload: { sub?: string; purpose?: string };
    try {
      payload = jwt.verify(token, secret) as typeof payload;
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
