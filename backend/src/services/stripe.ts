import Stripe from 'stripe';

export const STRIPE_PRICES = {
  featured_monthly: 'price_1UP2ulIwy9Lu0MXXYSNGpAp4',
  featured_annual:  'price_1UP2uxIwy9Lu0MXXNXbiZM71',
  premium_monthly:  'price_1UP2umIwy9Lu0MXX8PRaTYUz',
  premium_annual:   'price_1UP2uxIwy9Lu0MXXHu9auRKq',
} as const;

export type PricePlan = keyof typeof STRIPE_PRICES;

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(key, { apiVersion: '2026-09-30.endive' });
}

export function tierFromPriceId(priceId: string): 'featured' | 'premium' | 'free' {
  if (priceId === STRIPE_PRICES.premium_monthly || priceId === STRIPE_PRICES.premium_annual) return 'premium';
  if (priceId === STRIPE_PRICES.featured_monthly || priceId === STRIPE_PRICES.featured_annual) return 'featured';
  return 'free';
}

export function slotFromTier(tier: string): number | null {
  if (tier === 'premium') return 1;
  if (tier === 'featured') return 2; // 2 or 3 assigned at injection time based on how many premiums exist
  return null;
}
