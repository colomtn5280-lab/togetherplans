/**
 * Expo push helper — shared send path for notification triggers.
 *
 * Mirrors the existing chunked send pattern used by the nudge endpoint and
 * the T-24h vote reminder job (expo.chunkPushNotifications +
 * sendPushNotificationsAsync, errors non-fatal). No receipt polling exists
 * anywhere in the codebase yet, so none is added here.
 */

import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { logger } from '@/services/logger';

const expo = new Expo();

export interface PushTarget {
  pushToken?: string | null;
}

export function buildPushMessage(
  target: PushTarget,
  title: string,
  body: string,
  data: Record<string, unknown>,
): ExpoPushMessage | null {
  if (!target.pushToken || !Expo.isExpoPushToken(target.pushToken)) return null;
  return { to: target.pushToken, sound: 'default', title, body, data };
}

/** Send push messages in chunks. Errors are logged, never thrown. */
export async function sendPushMessages(messages: ExpoPushMessage[], context: string): Promise<number> {
  if (messages.length === 0) return 0;
  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    logger.info('Push notifications sent', { context, count: messages.length });
    return messages.length;
  } catch (pushErr) {
    logger.error('Failed to send push notifications', { context, pushErr });
    return 0;
  }
}
