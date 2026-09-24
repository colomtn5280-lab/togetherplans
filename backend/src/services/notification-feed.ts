/**
 * In-app notification feed — cache-backed, no schema change.
 *
 * The web bell (AppNav) polls GET /api/notifications every 60s and the
 * NotificationsPage renders { id, title, message, read, created_at } records
 * with PATCH /api/notifications/:id/read to mark read. This service stores a
 * capped per-user JSON list in the cache service (Redis in prod), which those
 * routes read — so every push trigger that also calls addFeedNotification()
 * shows up in the web bell automatically.
 */

import crypto from 'crypto';
import { cache } from '@/services/cache';
import { logger } from '@/services/logger';

export interface FeedNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string; // snake_case — matches the web NotificationRecord shape
  proposalId?: string;
}

const FEED_TTL_SECONDS = 30 * 24 * 3600; // 30 days
const FEED_MAX_ENTRIES = 30;

function feedKey(userId: string): string {
  return `feed:${userId}`;
}

export async function getFeed(userId: string): Promise<FeedNotification[]> {
  try {
    const raw = await cache.get(feedKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FeedNotification[]) : [];
  } catch (err) {
    logger.error('Failed to read notification feed', { userId, err });
    return [];
  }
}

async function saveFeed(userId: string, feed: FeedNotification[]): Promise<void> {
  await cache.set(feedKey(userId), JSON.stringify(feed.slice(0, FEED_MAX_ENTRIES)), FEED_TTL_SECONDS);
}

export async function addFeedNotification(
  userId: string,
  title: string,
  message: string,
  proposalId?: string,
): Promise<void> {
  try {
    const feed = await getFeed(userId);
    feed.unshift({
      id: crypto.randomUUID(),
      title,
      message,
      read: false,
      created_at: new Date().toISOString(),
      ...(proposalId ? { proposalId } : {}),
    });
    await saveFeed(userId, feed);
  } catch (err) {
    logger.error('Failed to add feed notification', { userId, err });
  }
}

export async function markFeedNotificationRead(userId: string, notificationId: string): Promise<boolean> {
  const feed = await getFeed(userId);
  const entry = feed.find((n) => n.id === notificationId);
  if (!entry) return false;
  entry.read = true;
  await saveFeed(userId, feed);
  return true;
}
