import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { businessApi } from '../../api/client';
import type { BusinessProfile } from '../../hooks/useBusinessAuth';

interface Analytics {
  impressions: number;
  clicks: number;
  addedToProposals: number;
  matches: number;
}

interface OutletCtx {
  business: BusinessProfile | null;
}

const DATE_CATEGORY_LABELS: Record<string, string> = {
  'restaurants-dining': 'Restaurants & Dining',
  'live-music-concerts': 'Live Music & Concerts',
  'comedy': 'Comedy',
  'sports-active': 'Sports & Active',
  'hiking-trails': 'Hiking & Trails',
  'movies': 'Movies',
  'streaming-night': 'Streaming Night',
  'wellness-spa': 'Wellness & Spa',
  'volunteering': 'Volunteering',
  'arts-culture': 'Arts & Culture',
  'after-dark': 'After Dark',
  'family-events': 'Family Events',
  'hotel-stays': 'Hotel Stays',
  'experiences': 'Experiences',
  'custom': 'Custom',
};

const s: Record<string, React.CSSProperties> = {
  header: { marginBottom: 32 },
  welcome: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 28, color: '#101820', marginBottom: 4 },
  sub: { color: '#5D6B76', fontSize: 15 },
  // Onboarding banner
  onboardBanner: {
    background: 'linear-gradient(135deg, #0E8C8C 0%, #086B6B 100%)',
    borderRadius: 20, padding: '20px 28px', marginBottom: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap' as const, gap: 16,
  },
  // KPI row
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20, marginBottom: 28 },
  kpi: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 20, padding: '24px',
    boxShadow: '0 8px 24px rgba(16,24,32,.07)',
  },
  kpiVal: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 30, color: '#0E8C8C', lineHeight: 1 },
  kpiLabel: { fontSize: 14, color: '#5D6B76', marginTop: 6 },
  // Subscription card
  subCard: {
    background: '#fff', border: '1.5px solid #DDE3E8', borderRadius: 20, padding: '24px 28px',
    marginBottom: 28, boxShadow: '0 8px 24px rgba(16,24,32,.07)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap' as const, gap: 16,
  },
  // Featured status
  featuredStatus: {
    background: 'linear-gradient(135deg, #D9F1F0 0%, #EAF6D3 100%)',
    border: '1.5px solid #0E8C8C', borderRadius: 20, padding: '20px 28px',
    marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16,
    flexWrap: 'wrap' as const,
  },
  // Actions
  actionsRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  actionCard: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 20, padding: '24px',
    flex: 1, minWidth: 180, boxShadow: '0 8px 24px rgba(16,24,32,.07)',
  },
};

const btnStyle: React.CSSProperties = {
  display: 'inline-block', padding: '11px 24px', borderRadius: '22px 16px 22px 16px',
  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
  textDecoration: 'none', background: '#0E8C8C', color: '#fff', border: '2px solid #0E8C8C',
  cursor: 'pointer',
};

const btnWhiteStyle: React.CSSProperties = {
  display: 'inline-block', padding: '11px 24px', borderRadius: '22px 16px 22px 16px',
  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
  textDecoration: 'none', background: '#fff', color: '#0E8C8C', border: '2px solid rgba(255,255,255,0.5)',
  cursor: 'pointer',
};

export function BusinessDashboardPage() {
  const { t } = useTranslation();
  const { business } = useOutletContext<OutletCtx>();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics>({ impressions: 0, clicks: 0, addedToProposals: 0, matches: 0 });
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    businessApi.getAnalytics('7d').then((res) => {
      setAnalytics(res.data as Analytics);
    }).catch(() => {/* silent */});
  }, []);

  const isIncomplete = !business?.featuredCategory;
  const tier = business?.subscriptionTier || business?.tier || 'free';
  const tierLabel = tier === 'premium' ? '👑 Premium' : tier === 'featured' ? '⭐ Featured' : 'Free';
  const tierBg = tier === 'premium' ? '#101820' : tier === 'featured' ? '#0E8C8C' : '#F4F6F8';
  const tierColor = tier !== 'free' ? '#fff' : '#5D6B76';

  const kpis = [
    { label: t('business.impressions') + ' (7d)', value: analytics.impressions, icon: '👁️' },
    { label: t('business.clicks') + ' (7d)', value: analytics.clicks, icon: '🖱️' },
    { label: t('business.addedToPlans') + ' (7d)', value: analytics.addedToProposals, icon: '📋' },
    { label: t('business.matches') + ' (7d)', value: analytics.matches, icon: '💑' },
  ];

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await businessApi.getBillingPortal();
      const d = res.data as { url?: string };
      if (d.url) window.location.href = d.url;
    } catch {
      // silent — portal may not exist yet
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.welcome}>
          {business ? `${t('business.welcomeBack')}, ${business.name}` : t('business.dashboardTitle')}
        </h1>
        <p style={s.sub}>{t('business.dashboardDesc')}</p>
      </div>

      {/* Onboarding completion banner */}
      {isIncomplete && (
        <div style={s.onboardBanner}>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 4 }}>
              {t('business.completeSetup')}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
              {t('business.completeSetupDesc')}
            </div>
          </div>
          <button style={btnWhiteStyle} onClick={() => navigate('/business/onboarding')}>
            {t('business.continueSetup')}
          </button>
        </div>
      )}

      {/* Subscription status card */}
      <div style={s.subCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            padding: '6px 16px', borderRadius: 20, background: tierBg, color: tierColor,
            fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14,
          }}>
            {tierLabel}
          </div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820' }}>
              {tier === 'free' ? t('business.freePlan') : tier === 'featured' ? t('business.featuredPlan') : t('business.premiumPlan')}
            </div>
            {business?.subscriptionRenewsAt && (
              <div style={{ fontSize: 13, color: '#5D6B76', marginTop: 2 }}>
                {t('business.renewsAt')} {new Date(business.subscriptionRenewsAt).toLocaleDateString()}
              </div>
            )}
            {tier === 'free' && (
              <div style={{ fontSize: 13, color: '#5D6B76', marginTop: 2 }}>
                {t('business.upgradeForPriority')}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {tier !== 'free' && (
            <button style={{ ...btnStyle, opacity: billingLoading ? 0.7 : 1 }} onClick={handleManageBilling} disabled={billingLoading}>
              {billingLoading ? t('business.loadingBilling') : t('business.manageBilling')}
            </button>
          )}
          {tier === 'free' && (
            <button style={btnStyle} onClick={() => navigate('/business/onboarding')}>
              {t('business.upgradePlan')}
            </button>
          )}
        </div>
      </div>

      {/* Featured status */}
      {business?.featuredCategory && (
        <div style={s.featuredStatus}>
          <div style={{ fontSize: 28 }}>{tier !== 'free' ? '⭐' : '📍'}</div>
          <div style={{ flex: 1 }}>
            {tier !== 'free' ? (
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820' }}>
                You are appearing in{' '}
                <strong style={{ color: '#0E8C8C' }}>{DATE_CATEGORY_LABELS[business.featuredCategory] || business.featuredCategory}</strong>{' '}
                searches within{' '}
                <strong style={{ color: '#0E8C8C' }}>{business.radiusMiles || 30} miles</strong>{' '}
                as <strong style={{ color: '#0E8C8C' }}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</strong>
              </div>
            ) : (
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820' }}>
                You're set up in{' '}
                <strong style={{ color: '#0E8C8C' }}>{DATE_CATEGORY_LABELS[business.featuredCategory] || business.featuredCategory}</strong>{' '}
                — <span style={{ color: '#5D6B76', fontWeight: 400 }}>Upgrade to get featured placement at the top of searches</span>
              </div>
            )}
          </div>
          {tier === 'free' && (
            <button style={btnStyle} onClick={() => navigate('/business/onboarding')}>
              Upgrade →
            </button>
          )}
        </div>
      )}

      {/* KPIs */}
      <div style={s.kpiRow}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={s.kpi}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={s.kpiVal}>{kpi.value.toLocaleString()}</div>
            <div style={s.kpiLabel}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: '#101820', marginBottom: 16 }}>
        {t('business.quickActions')}
      </div>
      <div style={s.actionsRow}>
        <div style={s.actionCard}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🏢</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820', marginBottom: 6 }}>
            {t('business.editProfile')}
          </div>
          <div style={{ fontSize: 13, color: '#5D6B76', marginBottom: 16 }}>
            {t('business.editProfileDesc')}
          </div>
          <Link to="/business/profile" style={btnStyle}>{t('business.editProfile')}</Link>
        </div>

        <div style={s.actionCard}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820', marginBottom: 6 }}>
            {t('business.manageListings')}
          </div>
          <div style={{ fontSize: 13, color: '#5D6B76', marginBottom: 16 }}>
            {t('business.manageListingsDesc')}
          </div>
          <Link to="/business/listings" style={btnStyle}>{t('business.manageListings')}</Link>
        </div>

        <div style={s.actionCard}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📈</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820', marginBottom: 6 }}>
            {t('business.viewAnalytics')}
          </div>
          <div style={{ fontSize: 13, color: '#5D6B76', marginBottom: 16 }}>
            {t('business.viewAnalyticsDesc')}
          </div>
          <Link to="/business/analytics" style={btnStyle}>{t('business.viewAnalytics')}</Link>
        </div>
      </div>
    </div>
  );
}
