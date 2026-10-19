import dotenv from 'dotenv';

dotenv.config();

const JWT_PLACEHOLDER = 'your-super-secret-jwt-key-change-in-production';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}

export const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  log_level: process.env.LOG_LEVEL || 'info',
  jwt_secret: jwtSecret,
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '30d',
  cors_origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8081'],
  redis_url: process.env.REDIS_URL,
  resend_api_key: process.env.RESEND_API_KEY,
  app_url: process.env.APP_URL || 'https://datemeup.app',
};

export const validateConfig = (): string[] => {
  const errors: string[] = [];
  const isProd = config.node_env === 'production' || config.node_env === 'staging';
  if (isProd) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === JWT_PLACEHOLDER) {
      errors.push('JWT_SECRET must be set to a real secret in production (openssl rand -hex 64)');
    }
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL must be set in production');
    }
    if (!process.env.CORS_ORIGIN) {
      errors.push('CORS_ORIGIN must be explicitly set in production (e.g., https://datemeup.app)');
    } else if (process.env.CORS_ORIGIN.trim() === '*') {
      errors.push('CORS_ORIGIN must not be wildcard (*) in production');
    }
  }
  return errors;
};
