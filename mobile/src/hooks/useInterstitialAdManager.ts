/**
 * useInterstitialAdManager — §ads-interstitial
 *
 * Hook that manages interstitial ad lifecycle with a cooldown guard.
 *
 * - Feature-flagged: does nothing when ads_enabled is false (default).
 * - Cooldown: respects `interstitial_cooldown_seconds` from remote config
 *   to avoid showing ads too frequently.
 * - After Dark exclusion: never shows when screen is 'after-dark'.
 *
 * Usage:
 *   const { showInterstitial } = useInterstitialAdManager('ios');
 *   // Call showInterstitial() at a major context switch.
 *
 * The hook is safe to call in every screen — it no-ops when inactive.
 */

import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAdConfig, useAdsActive } from '@/hooks/useAdConfig';
import { AD_UNIT_IDS } from '@/services/admob';

interface UseInterstitialAdManagerResult {
  /** Show the interstitial if one is loaded and cooldown has elapsed. */
  showInterstitial: () => void;
}

export function useInterstitialAdManager(
  screen: 'ios' | 'android',
): UseInterstitialAdManagerResult {
  const active = useAdsActive(screen);
  const config = useAdConfig();
  const adRef = useRef<any>(null);
  const lastShownRef = useRef<number>(0);

  // Load interstitial once when ads become active
  useEffect(() => {
    if (!active) return;

    let unsubscribe: (() => void) | undefined;

    import('react-native-google-mobile-ads')
      .then(({ InterstitialAd, AdEventType }) => {
        const unitId =
          Platform.OS === 'ios' ? AD_UNIT_IDS.INTERSTITIAL : AD_UNIT_IDS.INTERSTITIAL;
        const ad = InterstitialAd.createForAdRequest(unitId, {
          requestNonPersonalizedAdsOnly: false,
        });

        unsubscribe = ad.addAdEventListener(AdEventType.LOADED, () => {
          adRef.current = ad;
        });

        // Reload after close
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          adRef.current = null;
          ad.load();
        });

        ad.load();
      })
      .catch(() => {
        // Native module absent — silently ignore
      });

    return () => {
      unsubscribe?.();
      adRef.current = null;
    };
  }, [active]);

  const showInterstitial = useCallback(() => {
    if (!active) return;
    if (!adRef.current) return;

    const now = Date.now();
    const cooldownMs = config.interstitial_cooldown_seconds * 1000;
    if (now - lastShownRef.current < cooldownMs) return;

    try {
      adRef.current.show();
      lastShownRef.current = now;
      adRef.current = null; // Will reload on CLOSED event
    } catch (_err) {
      // Ad not ready — ignore
    }
  }, [active, config.interstitial_cooldown_seconds]);

  return { showInterstitial };
}
