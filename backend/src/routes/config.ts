import { Router, Request, Response } from 'express';

const configRouter = Router();

// Remote ad configuration — all flags default to false until accounts are
// approved and Privacy Policy / ATT changes are live in production builds.
// Flip via GCP Secret Manager or Cloud Run env vars without a rebuild.

const parseBool = (val: string | undefined, fallback: boolean): boolean => {
  if (val === undefined) return fallback;
  return val.toLowerCase() === 'true';
};

const parseInt = (val: string | undefined, fallback: number): number => {
  const n = parseInt(val ?? '', 10);
  return isNaN(n) ? fallback : n;
};

export interface AdConfig {
  ads_enabled: boolean;
  ads_enabled_web: boolean;
  ads_enabled_ios: boolean;
  ads_enabled_android: boolean;
  // After Dark is ALWAYS false — content policy safety hard-coded here,
  // not relying on env var to keep it safe.
  ads_enabled_after_dark: false;
  personalized_ads: boolean;
  interstitial_cooldown_seconds: number;
  rewarded_ad_feature: 'filters' | 'venue_count' | 'none';
  ad_density: 'off' | 'low' | 'medium' | 'high';
}

configRouter.get('/v1/config', (_req: Request, res: Response) => {
  const cfg: AdConfig = {
    ads_enabled:             parseBool(process.env.ADS_ENABLED,          false),
    ads_enabled_web:         parseBool(process.env.ADS_ENABLED_WEB,      false),
    ads_enabled_ios:         parseBool(process.env.ADS_ENABLED_IOS,      false),
    ads_enabled_android:     parseBool(process.env.ADS_ENABLED_ANDROID,  false),
    ads_enabled_after_dark:  false,  // hard-coded — never served regardless of env
    personalized_ads:        parseBool(process.env.ADS_PERSONALIZED,     false),
    interstitial_cooldown_seconds: parseInt(process.env.ADS_INTERSTITIAL_COOLDOWN, 300),
    rewarded_ad_feature:     (process.env.ADS_REWARDED_FEATURE ?? 'none') as AdConfig['rewarded_ad_feature'],
    ad_density:              (process.env.ADS_DENSITY ?? 'off') as AdConfig['ad_density'],
  };

  // Cache 30 minutes — clients poll staleTime=30min via TanStack Query
  res.set('Cache-Control', 'public, max-age=1800');
  res.json(cfg);
});

export { configRouter };
