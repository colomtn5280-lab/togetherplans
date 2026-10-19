/**
 * AdBanner — §ads-banner
 *
 * A feature-flagged banner ad component. Renders nothing when:
 *   - ads_enabled is false (default)
 *   - the current screen is excluded (e.g. after-dark)
 *   - the native module is unavailable (Expo Go / web)
 *
 * Usage:
 *   <AdBanner screen="ios" />   // or "android"
 *
 * NEVER render on After Dark, voting, match/celebrate, or auth screens.
 */

import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { useAdsActive } from '@/hooks/useAdConfig';
import { AD_UNIT_IDS } from '@/services/admob';

interface AdBannerProps {
  /** Which platform context this banner appears in. 'after-dark' always suppressed. */
  screen: 'ios' | 'android';
}

export default function AdBanner({ screen }: AdBannerProps): React.ReactElement | null {
  const active = useAdsActive(screen);
  const [BannerAdComponent, setBannerAdComponent] = useState<React.ComponentType<any> | null>(null);
  const [BannerAdSize, setBannerAdSize] = useState<any>(null);

  useEffect(() => {
    if (!active) return;
    // Dynamic import — safe when native module is absent
    import('react-native-google-mobile-ads')
      .then((mod) => {
        setBannerAdComponent(() => mod.BannerAd);
        setBannerAdSize(mod.BannerAdSize);
      })
      .catch(() => {
        // Native module absent — banner stays hidden
      });
  }, [active]);

  if (!active) return null;
  if (!BannerAdComponent || !BannerAdSize) return null;

  const unitId = Platform.OS === 'ios' ? AD_UNIT_IDS.BANNER : AD_UNIT_IDS.BANNER;

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <BannerAdComponent
        unitId={unitId}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}
