/**
 * ATT (App Tracking Transparency) prompt service — §ads-att
 *
 * requestATT() fires the iOS system prompt and returns whether
 * personalized ads are permitted.
 *
 * Timing rule (from AdMob skill): fire AFTER first meaningful user
 * action (post-value), not on cold launch. 2-3× higher opt-in.
 *
 * On Android and web this always resolves to `true` (AAID is
 * addressable without a permission prompt).
 */

import { Platform } from 'react-native';

/**
 * Request Apple App Tracking Transparency permission.
 *
 * @returns `true` if personalized ads are permitted, `false` otherwise.
 */
export async function requestATT(): Promise<boolean> {
  // Only needed on iOS
  if (Platform.OS !== 'ios') return true;

  try {
    const TrackingTransparency = await import('expo-tracking-transparency');
    // Check existing status first — don't re-prompt if already decided.
    const existing = await TrackingTransparency.getTrackingPermissionsAsync();
    if (existing.status === 'granted') return true;
    if (existing.status === 'denied') return false;

    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    return status === 'granted';
  } catch (_err) {
    // Module absent (Expo Go) — treat as non-personalized
    return false;
  }
}
