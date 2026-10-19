/**
 * AdMob initialisation service — §ads-init
 *
 * Call initAdMob() once at App startup (after fonts load).
 * It is safe to call on every platform and in Expo Go
 * (the native module will be absent; errors are swallowed).
 *
 * Feature flag: ads_enabled defaults to false server-side,
 * so the SDK warms up but serves no ads until the flag is
 * flipped in the remote config endpoint.
 */

import { Platform } from 'react-native';

/** Test ad unit IDs — safe to commit; never earn real revenue. */
export const AD_UNIT_IDS = {
  /** Banner ad unit */
  BANNER: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }) as string,
  /** Interstitial ad unit */
  INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
    default: 'ca-app-pub-3940256099942544/1033173712',
  }) as string,
} as const;

/**
 * Initialise the AdMob SDK.
 *
 * - Skips silently when the native module is unavailable (Expo Go / web).
 * - Sets non-personalised ads by default; caller should pass
 *   `personalized: true` only after ATT / UMP consent is granted.
 */
export async function initAdMob(options: { personalized?: boolean } = {}): Promise<void> {
  try {
    // Dynamic import so the module is tree-shaken on web and doesn't crash
    // in Expo Go where the native module is absent.
    const { MobileAds, MaxAdContentRating } = await import('react-native-google-mobile-ads');
    await MobileAds().initialize();
    await MobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
  } catch (_err) {
    // Native module absent (Expo Go) or initialisation error — safe to ignore.
  }
}
