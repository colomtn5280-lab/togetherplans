import Redis from 'ioredis';
import { logger } from '@/services/logger';

/**
 * Cache abstraction: Redis in production, in-memory Map in dev/test.
 * REDIS_URL pointing at localhost (or unset, or NODE_ENV=test) => in-memory.
 */
interface CacheBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}

class MemoryCache implements CacheBackend {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

class RedisCache implements CacheBackend {
  constructor(private client: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }
}

function createCache(): CacheBackend {
  const url = process.env.REDIS_URL;
  if (
    !url ||
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    process.env.NODE_ENV === 'test'
  ) {
    logger.info('Cache backend: in-memory');
    return new MemoryCache();
  }
  logger.info('Cache backend: redis');
  return new RedisCache(new Redis(url, { maxRetriesPerRequest: 3 }));
}

export const cache = createCache();
