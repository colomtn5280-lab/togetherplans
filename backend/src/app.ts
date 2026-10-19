import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from '@/services/logger';
import { config } from '@/config';
import { authRouter } from '@/routes/auth';
import { groupsRouter } from '@/routes/groups';
import { invitationsRouter } from '@/routes/invitations';
import { proposalsRouter } from '@/routes/proposals';
import { legalRouter } from '@/routes/legal';
import { suggestionsRouter } from '@/routes/suggestions';
import { notificationsRouter } from '@/routes/notifications';
import { categoriesRouter } from '@/routes/categories';
import { usersRouter } from '@/routes/users';
import { internalRouter } from '@/routes/internal';
import afterDarkRouter from '@/routes/after-dark';
import { shareCardsRouter } from '@/routes/share-cards';
import { shareRouter } from '@/routes/share';
import { safetyRouter } from '@/routes/safety';
import { businessRouter } from '@/routes/business';
import { webhooksRouter } from '@/routes/webhooks';
import { inviteCardsRouter } from '@/services/invite-cards/routes';
import { seedAfterDarkCatalog } from '@/seeds/after-dark-catalog';

export function createApp(): express.Express {
  const app = express();

  // Trust Cloud Run / GCP load balancer proxy headers
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cookieParser());
  app.use(cors({ origin: config.cors_origin, credentials: true }));

  // Raw body for Stripe webhooks — must come BEFORE express.json()
  app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

  app.use(express.json({ limit: '1mb' }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, { ip: req.ip });
    next();
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'togetherplans-api', uptime: process.uptime() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/invitations', invitationsRouter);
  app.use('/api/proposals', proposalsRouter);
  app.use('/api/suggestions', suggestionsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/internal', internalRouter);
  app.use('/api/share-cards', shareCardsRouter);
  app.use('/api/invite-cards', inviteCardsRouter);
  app.use('/api/share', shareRouter);
  app.use('/api/after-dark', afterDarkRouter);
  app.use('/api/safety', safetyRouter);
  app.use('/api/business', businessRouter);
  app.use('/', legalRouter);

  // Seed After Dark catalog on startup
  seedAfterDarkCatalog().catch(err => {
    logger.error('Failed to seed After Dark catalog', { error: err });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err.message, { stack: err.stack });
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.node_env === 'production' ? undefined : err.message,
    });
  });

  return app;
}
