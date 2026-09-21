import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
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
import { usersRouter } from '@/routes/users';
import { internalRouter } from '@/routes/internal';
import { shareCardsRouter } from '@/routes/share-cards';
import { afterDarkRouter } from '@/routes/after-dark';
import { safetyRouter } from '@/routes/safety';

export function createApp(): express.Express {
  const app = express();

  // Trust Cloud Run / GCP load balancer proxy headers
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: config.cors_origin, credentials: true }));
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
    res.json({ status: 'ok', service: 'datenight-api', uptime: process.uptime() });
  });

  // Temporary: public migrate endpoint — secured by obscurity, remove after first run
  app.post('/api/run-migrations-a7f3k9', async (_req: Request, res: Response) => {
    const { execSync } = require('child_process');
    try {
      const output = execSync('npx prisma migrate deploy', {
        cwd: process.cwd(), env: process.env, timeout: 60000,
      }).toString();
      return res.json({ success: true, output });
    } catch (err: any) {
      return res.status(500).json({ error: err.message, stderr: err.stderr?.toString() });
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/invitations', invitationsRouter);
  app.use('/api/proposals', proposalsRouter);
  app.use('/api/suggestions', suggestionsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/internal', internalRouter);
  app.use('/api/share-cards', shareCardsRouter);
  app.use('/api/after-dark', afterDarkRouter);
  app.use('/api/safety', safetyRouter);
  app.use('/', legalRouter);

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
