import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
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

const s: Record<string, React.CSSProperties> = {
  header: { marginBottom: 32 },
  welcome: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 28, color: '#101820', marginBottom: 4 },
  sub: { color: '#5D6B76', fontSize: 15 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 32 },
  kpi: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 14, padding: '24px 24px',
    boxShadow: '0 8px 24px rgba(16,24,32,.07)',
  },
  kpiVal: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 30, color: '#0E8C8C', lineHeight: 1 },
  kpiLabel: { fontSize: 14, color: '#5D6B76', marginTop: 6 },
  upgradeBanner: {
    background: 'linear-gradient(135deg, #D9F1F0 0%, #EAF6D3 100%)',
    border: '1.5px solid #0E8C8C', borderRadius: 14, padding: '20px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 32, flexWrap: 'wrap' as const, gap: 16,
  },
  actionsRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  actionCard: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 14, padding: '24px',
    flex: 1, minWidth: 200, boxShadow: '0 8px 24px rgba(16,24,32,.07)',
  },
};

const btnStyle: React.CSSProperties = {
  display: 'inline-block', padding: '11px 24px', borderRadius: '22px 16px 22px 16px',
  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
  textDecoration: 'none', background: '#0E8C8C', color: '#fff', border: '2px solid #0E8C8C',
};

export function BusinessDashboardPage() {
  const { business } = useOutletContext<OutletCtx>();
  const [analytics, setAnalytics] = useState<Analytics>({ impressions: 0, clicks: 0, addedToProposals: 0, matches: 0 });

  useEffect(() => {
    businessApi.getAnalytics('7d').then((res) => {
      setAnalytics(res.data as Analytics);
    }).catch(() => {/* silent */});
  }, []);

  const kpis = [
    { label: 'Impressions (7d)', value: analytics.impressions },
    { label: 'Clicks (7d)', value: analytics.clicks },
    { label: 'Added to Plans (7d)', value: analytics.addedToProposals },
    { label: 'Matches (7d)', value: analytics.matches },
  ];

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.welcome}>
          {business ? `Welcome back, ${business.name}` : 'Dashboard'}
        </h1>
        <p style={s.sub}>Here's how your venue is performing this week.</p>
      </div>

      {/* KPIs */}
      <div style={s.kpiRow}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={s.kpi}>
            <div style={s.kpiVal}>{kpi.value.toLocaleString()}</div>
            <div style={s.kpiLabel}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Upgrade banner (free tier) */}
      {business?.tier === 'free' && (
        <div style={s.upgradeBanner}>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: '#101820', marginBottom: 4 }}>
              You're on the Free plan
            </div>
            <div style={{ fontSize: 14, color: '#5D6B76' }}>
              Upgrade to Featured ($49/mo) for priority placement and a Featured badge.
            </div>
          </div>
          <span style={{ ...btnStyle, cursor: 'default', opacity: .7 }}>
            Upgrade (coming soon)
          </span>
        </div>
      )}

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
