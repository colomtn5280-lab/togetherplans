import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
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
    { label: 'Impressions (7d)', value: analytics.impressions, icon: '👁️' },
    { label: 'Clicks (7d)', value: analytics.clicks, icon: '🖱️' },
    { label: 'Added to Plans (7d)', value: analytics.addedToProposals, icon: '📋' },
    { label: 'Matches (7d)', value: analytics.matches, icon: '💑' },
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
          {business ? `Welcome back, ${business.name}` : 'Dashboard'}
        </h1>
        <p style={s.sub}>Here's how your venue is performing this week.</p>
      </div>

      {/* Onboarding completion banner */}
      {isIncomplete && (
        <div style={s.onboardBanner}>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 4 }}>
              🚀 Complete your setup to start appearing in searches
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
              Add your service area, photos, and choose a category — takes 3 minutes.
            </div>
          </div>
          <button style={btnWhiteStyle} onClick={() => navigate('/business/onboarding')}>
            Continue Setup →
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
              {tier === 'free' ? 'Free Plan' : tier === 'featured' ? 'Featured Plan — $49/mo' : 'Premium Plan — $149/mo'}
            </div>
            {business?.subscriptionRenewsAt && (
              <div style={{ fontSize: 13, color: '#5D6B76', marginTop: 2 }}>
                Renews {new Date(business.subscriptionRenewsAt).toLocaleDateString()}
              </div>
            )}
            {tier === 'free' && (
              <div style={{ fontSize: 13, color: '#5D6B76', marginTop: 2 }}>
                Upgrade for priority placement and a Featured badge
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {tier !== 'free' && (
            <button style={{ ...btnStyle, opacity: billingLoading ? 0.7 : 1 }} onClick={handleManageBilling} disabled={billingLoading}>
              {billingLoading ? 'Loading…' : 'Manage Billing'}
            </button>
          )}
          {tier === 'free' && (
            <button style={btnStyle} onClick={() => navigate('/business/onboarding')}>
              Upgrade Plan
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
        Quick actions
      </div>
      <div style={s.actionsRow}>
        <div style={s.actionCard}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🏢</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820', marginBottom: 6 }}>
            Edit Profile
          </div>
          <div style={{ fontSize: 13, color: '#5D6B76', marginBottom: 16 }}>
            Update your business details, hours, and mood tags.
          </div>
          <Link to="/business/profile" style={btnStyle}>Edit Profile</Link>
        </div>

        <div style={s.actionCard}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820', marginBottom: 6 }}>
            Manage Listings
          </div>
          <div style={{ fontSize: 13, color: '#5D6B76', marginBottom: 16 }}>
            Create featured listings with special offers or events.
          </div>
          <Link to="/business/listings" style={btnStyle}>Manage Listings</Link>
        </div>

        <div style={s.actionCard}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📈</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820', marginBottom: 6 }}>
            View Analytics
          </div>
          <div style={{ fontSize: 13, color: '#5D6B76', marginBottom: 16 }}>
            See detailed performance over 7, 30, or 90 days.
          </div>
          <Link to="/business/analytics" style={btnStyle}>View Analytics</Link>
        </div>
      </div>
    </div>
  );
}
