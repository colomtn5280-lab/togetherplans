import { createApp } from '@/app';
import { logger } from '@/services/logger';
import { config, validateConfig } from '@/config';

const errors = validateConfig();
if (errors.length > 0) {
  logger.error('Config validation failed', { errors });
  process.exit(1);
}

const app = createApp();

const server = app.listen(config.port, config.host, () => {
  logger.info(`DateNight API running on http://${config.host}:${config.port}`);
});

// Graceful shutdown for Cloud Run / container environments
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
