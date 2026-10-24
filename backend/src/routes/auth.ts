import { Router, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { prisma } from '@/services/db';
import { signToken, requireAuth, AuthRequest } from '@/middleware/auth';
import { sendWelcomeEmail, sendPasswordResetEmail, sendAccountDeletedEmail, sendVerifyEmail } from '@/services/email';
import { verifyGoogleToken } from '@/services/oauth';
import { verifyAppleToken } from '@/services/apple';
import { logger } from '@/services/logger';
import { cacheGet, cacheSet } from '@/services/cache';
import { claimGuestVotes } from '@/services/guest-claim';
import { config } from '@/config';

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
  const secret = config.jwt_secret;
  // Include a random jti (JWT ID) so two tokens issued in the same second are
  // never identical — prevents a unique-constraint violation when register and
  // login are called back-to-back within the same clock second.
  return jwt.sign({ userId, type: 'refresh', jti: randomUUID() }, secret, { expiresIn: '30d' });
}

/** Persist a refresh token to the DB and return it */
async function issueRefreshToken(userId: string): Promise<string> {
  const token = makeRefreshToken(userId);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  // Clean up expired/revoked tokens for this user (housekeeping)
  await prisma.refreshToken.deleteMany({
    where: { userId, OR: [{ isRevoked: true }, { expiresAt: { lt: new Date() } }] },
  });
  return token;
}

// POST /api/auth/register
authRouter.post('/register', authLimiter, async (req, res: Response, next) => {
  try {
    const { email: rawEmail, password, displayName } = req.body || {};
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : rawEmail;
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
      if (!existing.passwordHash && existing.provider) {
        const providerLabels: Record<string, string> = {
          google: 'Google',
          apple: 'Apple',
          facebook: 'Facebook',
        };
        const label = providerLabels[existing.provider] ?? existing.provider;
        return res.status(409).json({ error: `An account already exists with this email. Please sign in with ${label}.` });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName: displayName.trim() },
    });
    const token = signToken(user.id, user.email);
    const refreshToken = await issueRefreshToken(user.id);
    // Fire-and-forget — don't block registration on email delivery
    // Send welcome email; also send verify email so user has a meaningful email to act on
    const secret = config.jwt_secret;
    const verifyToken = jwt.sign({ sub: user.id, purpose: 'email-verify', jti: randomUUID() }, secret, { expiresIn: '24h' });
    sendWelcomeEmail(user.email, user.email).catch((err) => logger.error('Failed to send welcome email on register', { err }));
    sendVerifyEmail(user.email, user.displayName, user.email, verifyToken).catch((err) => logger.error('Failed to send verify email on register', { err }));
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
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

// POST /api/auth/signup — deprecated alias for /register; 307 preserves POST method + body
authRouter.post('/signup', (req, res) => {
  res.redirect(307, '/api/auth/register');
});

const LOGIN_LOCKOUT_MAX = 10;
const LOGIN_LOCKOUT_TTL = 15 * 60; // 15 minutes in seconds

function loginAttemptsKey(email: string): string {
  return `login_attempts:${email.toLowerCase()}`;
}

// POST /api/auth/login
authRouter.post('/login', authLimiter, async (req, res: Response, next) => {
  try {
    const { email: rawEmail, password } = req.body || {};
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : rawEmail;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Email-based lockout check (effective behind proxies/CDNs where IP is shared)
    const attemptsKey = loginAttemptsKey(email);
    const attemptsRaw = await cacheGet(attemptsKey);
    const attempts = attemptsRaw ? parseInt(attemptsRaw, 10) : 0;
    if (attempts >= LOGIN_LOCKOUT_MAX) {
      return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      // Increment failed attempt counter
      await cacheSet(attemptsKey, String(attempts + 1), LOGIN_LOCKOUT_TTL);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.passwordHash) {
      // OAuth-only account — no password set; surface the correct provider
      const providerMessages: Record<string, string> = {
        google: 'This account uses Google Sign-In. Please use the Google button to sign in.',
        apple: 'This account uses Apple Sign-In. Please use the Apple button to sign in.',
        facebook: 'This account uses Facebook Sign-In. Please use the Facebook button to sign in.',
      };
      const providerMsg = user.provider && providerMessages[user.provider]
        ? providerMessages[user.provider]
        : 'This account was created with a social login. Please use the sign-in method you used originally.';
      return res.status(400).json({ error: providerMsg });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await cacheSet(attemptsKey, String(attempts + 1), LOGIN_LOCKOUT_TTL);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Successful login — clear the lockout counter
    await cacheSet(attemptsKey, '0', LOGIN_LOCKOUT_TTL);
    const token = signToken(user.id, user.email);
    const refreshToken = await issueRefreshToken(user.id);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
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
      sendWelcomeEmail(user.email, user.email).catch(() => {});
    } else if (!user.provider) {
      // Link existing email account to Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: { provider: 'google', providerId, avatarUrl },
      });
    }

    const token = signToken(user.id, user.email);
    const refreshToken = await issueRefreshToken(user.id);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    return res.json({ token, accessToken: token, refreshToken, user: { id: user.id, email: user.email, displayName: user.displayName } });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/facebook
authRouter.post('/facebook', authLimiter, async (req, res: Response, next: NextFunction) => {
  try {
    const { accessToken, email, name, providerId } = req.body || {};
    if (!accessToken || !providerId) return res.status(400).json({ error: 'accessToken and providerId required' });

    // Verify token with Facebook Graph API
    const fbRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
    const fbData = await fbRes.json() as { id?: string; name?: string; email?: string; error?: unknown };
    if (fbData.error || fbData.id !== providerId) return res.status(401).json({ error: 'Invalid Facebook token' });

    const userEmail = fbData.email ?? email;
    if (!userEmail) return res.status(400).json({ error: 'Email required — please grant email permission in Facebook' });

    let user = await prisma.user.findFirst({
      where: { OR: [{ provider: 'facebook', providerId }, { email: userEmail }] },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          displayName: fbData.name ?? name ?? userEmail.split('@')[0],
          provider: 'facebook',
          providerId,
          passwordHash: null,
        },
      });
      sendWelcomeEmail(user.email, user.email).catch(() => {});
    } else if (!user.provider) {
      user = await prisma.user.update({ where: { id: user.id }, data: { provider: 'facebook', providerId } });
    }

    const token = signToken(user.id, user.email);
    const refreshToken = await issueRefreshToken(user.id);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    return res.json({ token, accessToken: token, refreshToken, user: { id: user.id, email: user.email, displayName: user.displayName } });
  } catch (err) { return next(err); }
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
      sendWelcomeEmail(user.email, user.email).catch(() => {});
    } else if (!user.provider) {
      // Link existing email/password account to Apple
      user = await prisma.user.update({
        where: { id: user.id },
        data: { provider: 'apple', providerId },
      });
    }

    const token = signToken(user.id, user.email);
    const refreshToken = await issueRefreshToken(user.id);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    return res.json({ token, accessToken: token, refreshToken, user: { id: user.id, email: user.email, displayName: user.displayName } });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/refresh — exchange refresh token for new access token (true rotation)
authRouter.post('/refresh', async (req, res: Response, next) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    const tokenFromBody = req.body?.refreshToken;
    const refreshToken = tokenFromCookie || tokenFromBody;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

    // 1. Verify JWT signature + expiry
    const secret = config.jwt_secret;
    let payload: { userId?: string; type?: string };
    try {
      payload = jwt.verify(refreshToken, secret) as typeof payload;
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    if (payload.type !== 'refresh' || !payload.userId) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // 2. Check DB — token must exist and not be revoked
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      // If a revoked token is presented, revoke ALL tokens for this user (token reuse attack)
      if (stored?.isRevoked) {
        await prisma.refreshToken.updateMany({
          where: { userId: payload.userId },
          data: { isRevoked: true },
        });
        logger.warn(`Refresh token reuse detected for user ${payload.userId} — all tokens revoked`);
      }
      return res.status(401).json({ error: 'Refresh token is invalid or has been revoked' });
    }

    // 3. Load user
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.deletedAt) return res.status(401).json({ error: 'User not found' });

    // 4. Atomically revoke old token and issue new one
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } });
    const accessToken = signToken(user.id, user.email);
    const newRefresh = await issueRefreshToken(user.id);

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    return res.json({ token: accessToken, accessToken, refreshToken: newRefresh });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/logout — revoke refresh token server-side
authRouter.post('/logout', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = (req.body as { refreshToken?: string }) || {};
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, isRevoked: false },
        data: { isRevoked: true },
      });
    }
    return res.json({ message: 'Logged out' });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/claim-guest-votes — convert guest votes to member votes.
// Body: { guestId } (the browser-local guest id from localStorage 'tp.guestId').
// Guest votes on proposals in groups the user belongs to become real Votes
// (member vote wins if one already exists); votes in other groups stay pending
// and are converted when the user joins that group (invitation accept flow).
authRouter.post('/claim-guest-votes', requireAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { guestId } = req.body || {};
    if (!guestId || typeof guestId !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(guestId)) {
      return res.status(400).json({ error: 'A valid guestId is required' });
    }
    const result = await claimGuestVotes(req.userId as string, guestId);
    return res.json(result);
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
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again later.' },
});

authRouter.post('/forgot-password', forgotPasswordLimiter, async (req, res: Response, next) => {
  try {
    const { email: rawEmail } = req.body || {};
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : rawEmail;
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    // Always respond OK to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.deletedAt) {
      // Stateless JWT reset token — valid 1 hour, signed with JWT_SECRET
      const secret = config.jwt_secret;
      const resetToken = jwt.sign(
        { sub: user.id, purpose: 'password-reset' },
        secret,
        { expiresIn: '1h' },
      );
      sendPasswordResetEmail(user.email, user.email, resetToken).catch(() => {});
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
    const secret = config.jwt_secret;
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
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { deletedAt: new Date() },
    });
    sendAccountDeletedEmail(user.email, user.email).catch(() => {});
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});
