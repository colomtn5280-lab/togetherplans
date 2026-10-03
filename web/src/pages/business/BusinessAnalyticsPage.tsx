import { useState, useEffect } from 'react';
import { businessApi } from '../../api/client';

type Period = '7d' | '30d' | '90d';

interface Analytics {
  impressions: number;
  clicks: number;
  addedToProposals: number;
  matches: number;
}

const s: Record<string, React.CSSProperties> = {
  title: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 28, color: '#101820', marginBottom: 4 },
  sub: { color: '#5D6B76', fontSize: 15, marginBottom: 24 },
  periodRow: { display: 'flex', gap: 8, marginBottom: 28 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 32 },
  kpi: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 14, padding: '24px',
    boxShadow: '0 8px 24px rgba(16,24,32,.07)',
  },
  kpiVal: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 30, color: '#0E8C8C', lineHeight: 1 },
  kpiLabel: { fontSize: 14, color: '#5D6B76', marginTop: 6 },
  chartSection: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 14, padding: '28px',
    boxShadow: '0 8px 24px rgba(16,24,32,.07)', marginBottom: 24,
  },
  chartTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: '#101820', marginBottom: 20 },
  funnelSection: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 14, padding: '28px',
    boxShadow: '0 8px 24px rgba(16,24,32,.07)',
  },
  funnelText: { fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#101820', fontWeight: 500 },
};

const periodBtn = (active: boolean): React.CSSProperties => ({
  padding: '8px 20px', borderRadius: '20px 14px 20px 14px',
  background: active ? '#0E8C8C' : '#fff',
  color: active ? '#fff' : '#5D6B76',
  border: active ? '2px solid #0E8C8C' : '2px solid #DDE3E8',
  cursor: 'pointer', fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13,
});

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
      {data.map((d) => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value.toLocaleString()}</div>
          <div
            style={{
              width: '100%', background: d.color, borderRadius: '6px 6px 0 0',
              height: `${Math.max((d.value / max) * 120, 4)}px`, transition: 'height .4s ease',
              opacity: 0.85,
            }}
          />
          <div style={{ fontSize: 11, color: '#5D6B76', textAlign: 'center', fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BusinessAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7d');
  const [data, setData] = useState<Analytics>({ impressions: 0, clicks: 0, addedToProposals: 0, matches: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    businessApi.getAnalytics(period).then((res) => {
      setData(res.data as Analytics);
    }).catch(() => {/* silent */}).finally(() => setLoading(false));
  }, [period]);

  const kpis = [
    { label: 'Impressions', value: data.impressions },
    { label: 'Clicks', value: data.clicks },
    { label: 'Added to Plans', value: data.addedToProposals },
    { label: 'Matches', value: data.matches },
  ];

  const chartData = [
    { label: 'Impressions', value: data.impressions, color: '#0E8C8C' },
    { label: 'Clicks', value: data.clicks, color: '#7CB518' },
    { label: 'Added', value: data.addedToProposals, color: '#086B6B' },
    { label: 'Matches', value: data.matches, color: '#EAF6D3' },
  ].map((d) => ({ ...d, color: d.label === 'Impressions' ? '#0E8C8C' : d.label === 'Clicks' ? '#7CB518' : d.label === 'Added' ? '#086B6B' : '#101820' }));

  const ctr = data.impressions > 0 ? ((data.clicks / data.impressions) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <h1 style={s.title}>Analytics</h1>
      <p style={s.sub}>Track how your venue performs in DateMeUp suggestions.</p>

      {/* Period selector */}
      <div style={s.periodRow}>
        {(['7d', '30d', '90d'] as Period[]).map((p) => (
          <button key={p} style={periodBtn(period === p)} onClick={() => setPeriod(p)}>
            {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'Last 90 days'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#5D6B76', fontSize: 15 }}>Loading analytics…</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={s.kpiRow}>
            {kpis.map((kpi) => (
              <div key={kpi.label} style={s.kpi}>
                <div style={s.kpiVal}>{kpi.value.toLocaleString()}</div>
                <div style={s.kpiLabel}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={s.chartSection}>
            <div style={s.chartTitle}>Performance overview</div>
            <BarChart data={chartData} />
          </div>

          {/* Conversion funnel */}
          <div style={s.funnelSection}>
            <div style={s.chartTitle}>Conversion funnel</div>
            <div style={s.funnelText}>
              <span style={{ color: '#0E8C8C', fontWeight: 700 }}>{data.impressions.toLocaleString()}</span>
              {' impressions → '}
              <span style={{ color: '#7CB518', fontWeight: 700 }}>{data.clicks.toLocaleString()}</span>
              {' clicks → '}
              <span style={{ color: '#086B6B', fontWeight: 700 }}>{data.addedToProposals.toLocaleString()}</span>
              {' added to plans → '}
              <span style={{ color: '#101820', fontWeight: 700 }}>{data.matches.toLocaleString()}</span>
              {' matches'}
            </div>
            <div style={{ marginTop: 12, fontSize: 14, color: '#5D6B76' }}>
              Click-through rate: <strong>{ctr}%</strong>
              {data.impressions === 0 && (
                <span style={{ marginLeft: 12, background: '#F4F6F8', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
                  No data yet — impressions will appear as users discover your venue
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
