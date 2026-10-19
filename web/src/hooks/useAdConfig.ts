import { useQuery } from '@tanstack/react-query';

export interface AdConfig {
  ads_enabled: boolean;
  ads_enabled_web: boolean;
  ads_enabled_after_dark: false;
  personalized_ads: boolean;
  interstitial_cooldown_seconds: number;
  rewarded_ad_feature: 'filters' | 'venue_count' | 'none';
  ad_density: 'off' | 'low' | 'medium' | 'high';
}

const DEFAULT_CONFIG: AdConfig = {
  ads_enabled: false,
  ads_enabled_web: false,
  ads_enabled_after_dark: false,
  personalized_ads: false,
  interstitial_cooldown_seconds: 300,
  rewarded_ad_feature: 'none',
  ad_density: 'off',
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://datenight-api-mh74edz3ja-uc.a.run.app';

async function fetchAdConfig(): Promise<AdConfig> {
  const res = await fetch(`${API_BASE}/api/v1/config`);
  if (!res.ok) return DEFAULT_CONFIG;
  return res.json();
}

export function useAdConfig(): AdConfig {
  const { data } = useQuery({
    queryKey: ['ad-config'],
    queryFn: fetchAdConfig,
    staleTime: 30 * 60 * 1000,   // 30 min — matches server Cache-Control
    gcTime: 60 * 60 * 1000,
    retry: false,
  });
  return data ?? DEFAULT_CONFIG;
}

/** Returns true only when ads should actually render on the current screen. */
export function useAdsActive(screen: 'web' | 'after-dark'): boolean {
  const cfg = useAdConfig();
  if (!cfg.ads_enabled) return false;
  if (screen === 'after-dark') return false;  // hard-coded — never
  if (screen === 'web') return cfg.ads_enabled_web;
  return false;
}
