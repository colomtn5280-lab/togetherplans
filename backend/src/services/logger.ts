import winston from 'winston';
import { config } from '@/config';

export const logger = winston.createLogger({
  level: config.log_level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'datenight-api' },
  transports: [new winston.transports.Console()],
});
