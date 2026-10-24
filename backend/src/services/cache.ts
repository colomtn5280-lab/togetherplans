import Redis from 'ioredis';
import { logger } from '@/services/logger';

/**
 * Cache abstraction: Redis > Postgres > in-memory (dev/test).
 *
 * Priority:
 *   REDIS_URL set + not localhost → RedisCache
 *   DATABASE_URL set (prod without Redis) → PgCache (Postgres table)
 *   Otherwise → MemoryCache (dev/test)
 *
 * Stale-while-revalidate: get() returns { value, stale } where stale=true
 * means the entry is expired but present. Callers can return stale immediately
 * and revalidate in the background.
 *
 * Switch to Redis at ~5k DAU when the DB is upgraded and a VPC connector exists.
 */

export interface CacheGetResult {
  value: string;
  stale: boolean;
}

interface CacheBackend {
  get(key: string): Promise<CacheGetResult | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// In-memory (dev / test)
// ---------------------------------------------------------------------------
class MemoryCache implements CacheBackend {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<CacheGetResult | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    return { value: entry.value, stale: Date.now() > entry.expiresAt };
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Postgres (production without Redis) — E1
// Uses raw pg via DATABASE_URL to avoid circular Prisma import at module init.
// Table: "SuggestionCache" (key PK, value TEXT, expiresAt TIMESTAMPTZ)
// ---------------------------------------------------------------------------
class PgCache implements CacheBackend {
  // Lazy import pool so this module can load before pg is confirmed available
  private pool: import('pg').Pool | null = null;

  private async getPool(): Promise<import('pg').Pool> {
    if (this.pool) return this.pool;
    const { Pool } = await import('pg');
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3, // small pool — cache ops are low-frequency
    });
    return this.pool;
  }

  async get(key: string): Promise<CacheGetResult | null> {
    try {
      const pool = await this.getPool();
      const { rows } = await pool.query<{ value: string; expires_at: Date }>(
        `SELECT value, "expiresAt" AS expires_at
           FROM "SuggestionCache"
          WHERE key = $1
          LIMIT 1`,
        [key],
      );
      if (!rows.length) return null;
      const stale = new Date() > rows[0].expires_at;
      return { value: rows[0].value, stale };
    } catch (err) {
      logger.warn(`PgCache.get error: ${String(err)}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      const pool = await this.getPool();
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      await pool.query(
        `INSERT INTO "SuggestionCache" (key, value, "expiresAt", "createdAt")
         VALUES ($1, $2, $3, now())
         ON CONFLICT (key) DO UPDATE
           SET value      = EXCLUDED.value,
               "expiresAt" = EXCLUDED."expiresAt",
               "createdAt" = now()`,
        [key, value, expiresAt],
      );
    } catch (err) {
      logger.warn(`PgCache.set error: ${String(err)}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const pool = await this.getPool();
      await pool.query(`DELETE FROM "SuggestionCache" WHERE key = $1`, [key]);
    } catch (err) {
      logger.warn(`PgCache.del error: ${String(err)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Redis (future — activate by setting REDIS_URL to a non-localhost instance)
// ---------------------------------------------------------------------------
class RedisCache implements CacheBackend {
  constructor(private client: Redis) {}

  async get(key: string): Promise<CacheGetResult | null> {
    const value = await this.client.get(key);
    if (value === null) return null;
    // Redis handles expiry natively — if it returned a value it's not stale.
    return { value, stale: false };
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
function createCache(): CacheBackend {
  const redisUrl = process.env.REDIS_URL;
  const isLocalRedis = !redisUrl || redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1');
  const isTest = process.env.NODE_ENV === 'test';

  if (!isTest && redisUrl && !isLocalRedis) {
    logger.info('Cache backend: redis');
    return new RedisCache(new Redis(redisUrl, { maxRetriesPerRequest: 3 }));
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!isTest && dbUrl) {
    logger.info('Cache backend: postgres');
    return new PgCache();
  }

  logger.info('Cache backend: in-memory');
  return new MemoryCache();
}

export const cache = createCache();

// ---------------------------------------------------------------------------
// Helpers consumed by suggestions.ts
// ---------------------------------------------------------------------------

/**
 * Standard get — returns value if fresh, null if missing or expired.
 * Use getWithStale() if you want stale-while-revalidate behaviour.
 */
export async function cacheGet(key: string): Promise<string | null> {
  const result = await cache.get(key);
  if (!result || result.stale) return null;
  return result.value;
}

/**
 * Stale-while-revalidate get — returns the cached string even if expired,
 * plus a `stale` flag the caller can use to kick a background refresh.
 */
export async function cacheGetWithStale(key: string): Promise<{ value: string; stale: boolean } | null> {
  return cache.get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  return cache.set(key, value, ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  return cache.del(key);
}
