// TODO i18n: instrument this file with useTranslation() hooks
// All strings have translations in /public/locales/{en,es}/translation.json
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { businessApi } from '../../api/client';

interface PublicStats {
  activeUsers: number;
  cities: number;
  plansLockedThisWeek: number;
}

const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'DM Sans', sans-serif", background: '#fff', minHeight: '100vh' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 40px', borderBottom: '1px solid #DDE3E8', position: 'sticky', top: 0,
    background: '#fff', zIndex: 100,
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoText: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 18, color: '#101820' },
  badge: {
    background: '#D9F1F0', color: '#086B6B', fontSize: 10,
    fontFamily: "'Sora', sans-serif", fontWeight: 800, padding: '3px 10px',
    borderRadius: '12px 4px 12px 4px', letterSpacing: '.05em', textTransform: 'uppercase' as const,
  },
  navActions: { display: 'flex', alignItems: 'center', gap: 12 },
  hero: {
    textAlign: 'center' as const, padding: '80px 40px 60px',
    background: 'linear-gradient(135deg, #F4F6F8 0%, #D9F1F0 100%)',
  },
  heroHeadline: {
    fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 52,
    color: '#101820', marginBottom: 16, lineHeight: 1.1,
  },
  heroSub: { fontSize: 20, color: '#5D6B76', marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' },
  statsRow: { display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' as const, padding: '16px 0' },
  statBox: {
    background: '#fff', borderRadius: 14, padding: '20px 32px',
    border: '1px solid #DDE3E8', textAlign: 'center' as const,
    boxShadow: '0 8px 24px rgba(16,24,32,.07)',
  },
  statVal: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 30, color: '#0E8C8C' },
  statLabel: { fontSize: 14, color: '#5D6B76', marginTop: 4 },
  section: { padding: '64px 40px', maxWidth: 1080, margin: '0 auto' },
  sectionTitle: {
    fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 32,
    color: '#101820', textAlign: 'center' as const, marginBottom: 48,
  },
  stepsRow: { display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' as const },
  step: { textAlign: 'center' as const, maxWidth: 240 },
  stepNum: {
    width: 48, height: 48, borderRadius: '50%', background: '#0E8C8C', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 20, margin: '0 auto 16px',
  },
  stepTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: '#101820', marginBottom: 8 },
  stepDesc: { fontSize: 14, color: '#5D6B76', lineHeight: 1.5 },
  pricingRow: { display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' as const, alignItems: 'flex-start' },
  pricingCard: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 16,
    padding: '32px 28px', width: 280, boxShadow: '0 8px 24px rgba(16,24,32,.07)',
  },
  pricingCardFeatured: {
    background: '#0E8C8C', border: '1px solid #0E8C8C', borderRadius: 16,
    padding: '32px 28px', width: 280, boxShadow: '0 16px 40px rgba(14,140,140,.25)',
    transform: 'scale(1.04)',
  },
  tierName: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase' as const },
  tierPrice: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 38, marginTop: 8, marginBottom: 4 },
  tierSub: { fontSize: 13, marginBottom: 24 },
  featureList: { listStyle: 'none', padding: 0, margin: 0, fontSize: 14, display: 'flex', flexDirection: 'column' as const, gap: 10 },
  ctaSection: { background: '#D9F1F0', padding: '64px 40px', textAlign: 'center' as const },
  footer: { padding: '32px 40px', borderTop: '1px solid #DDE3E8', textAlign: 'center' as const, color: '#5D6B76', fontSize: 13 },
};

const btnStyle: React.CSSProperties = {
  display: 'inline-block', padding: '13px 28px', borderRadius: '22px 16px 22px 16px',
  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15,
  textDecoration: 'none', background: '#0E8C8C', color: '#fff',
  border: '2px solid #0E8C8C', cursor: 'pointer',
};

const ghostBtnStyle: React.CSSProperties = {
  ...btnStyle, background: 'transparent', color: '#0E8C8C',
};

const tiers = [
  {
    name: 'Free',
    price: '$0',
    sub: 'Forever free',
    featured: false,
    features: [
      { yes: true, label: 'Listed in suggestions' },
      { yes: true, label: 'Organic ranking' },
      { yes: false, label: 'Featured badge' },
      { yes: false, label: 'Priority placement' },
      { yes: false, label: 'After Dark integration' },
      { yes: false, label: 'Mood tag targeting' },
      { yes: true, label: 'Basic analytics' },
      { yes: false, label: 'Monthly report' },
    ],
    cta: 'Get started free',
    ctaLink: '/business/register',
  },
  {
    name: 'Featured',
    price: '$49',
    sub: '/mo',
    featured: true,
    features: [
      { yes: true, label: 'Listed in suggestions' },
      { yes: true, label: 'Organic ranking' },
      { yes: true, label: 'Featured badge' },
      { yes: true, label: 'Priority placement' },
      { yes: false, label: 'After Dark integration' },
      { yes: false, label: 'Mood tag targeting' },
      { yes: true, label: 'Full analytics' },
      { yes: false, label: 'Monthly report' },
    ],
    cta: 'Start Featured',
    ctaLink: '/business/register',
  },
  {
    name: 'Premium',
    price: '$149',
    sub: '/mo',
    featured: false,
    features: [
      { yes: true, label: 'Listed in suggestions' },
      { yes: true, label: 'Organic ranking' },
      { yes: true, label: 'Featured badge' },
      { yes: true, label: 'Top placement' },
      { yes: true, label: 'After Dark integration' },
      { yes: true, label: 'Mood tag targeting' },
      { yes: true, label: 'Full analytics + export' },
      { yes: true, label: 'Monthly report' },
    ],
    cta: 'Go Premium',
    ctaLink: '/business/register',
  },
];

export default function BusinessLandingPage() {
  const [stats, setStats] = useState<PublicStats>({ activeUsers: 0, cities: 0, plansLockedThisWeek: 0 });

  useEffect(() => {
    businessApi.getPublicStats().then((res) => {
      const d = res.data as PublicStats;
      setStats(d);
    }).catch(() => {/* silent */});
  }, []);

  return (
    <div style={s.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <img src="/mark-teal.svg" alt="TogetherPlans" style={{ width: 32, height: 32 }} />
          <span style={s.logoText}>TogetherPlans</span>
          <span style={s.badge}>For Business</span>
        </div>
        <div style={s.navActions}>
          <Link to="/business/login" style={ghostBtnStyle}>Business log in</Link>
          <Link to="/business/register" style={btnStyle}>List your business</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <h1 style={s.heroHeadline}>Be the plan<br />they agree on.</h1>
        <p style={s.heroSub}>
          Get your venue into the options when couples and groups are deciding where to go.
        </p>
        <Link to="/business/register" style={{ ...btnStyle, fontSize: 17, padding: '16px 36px' }}>
          List your business free →
        </Link>

        {/* Stats */}
        <div style={s.statsRow}>
          <div style={s.statBox}>
            <div style={s.statVal}>{stats.activeUsers.toLocaleString() || '—'}</div>
            <div style={s.statLabel}>Active users</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statVal}>{stats.cities || '—'}</div>
            <div style={s.statLabel}>Cities covered</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statVal}>{stats.plansLockedThisWeek?.toLocaleString() || '—'}</div>
            <div style={s.statLabel}>Plans locked this week</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>How it works</h2>
        <div style={s.stepsRow}>
          {[
            { n: 1, title: 'Create your profile', desc: 'Set up your venue, photos, price range, and mood tags in minutes.' },
            { n: 2, title: 'Appear in searches', desc: 'Show up when users are planning their next date night or group outing.' },
            { n: 3, title: 'Track your results', desc: 'See impressions, clicks, and how many plans included your venue.' },
          ].map((step) => (
            <div key={step.n} style={s.step}>
              <div style={s.stepNum}>{step.n}</div>
              <div style={s.stepTitle}>{step.title}</div>
              <div style={s.stepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ ...s.section, background: '#F4F6F8', maxWidth: '100%', padding: '64px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={s.sectionTitle}>Simple, transparent pricing</h2>
          <div style={s.pricingRow}>
            {tiers.map((tier) => (
              <div key={tier.name} style={tier.featured ? s.pricingCardFeatured : s.pricingCard}>
                {tier.featured && (
                  <div style={{
                    display: 'inline-block', background: '#EAF6D3', color: '#101820',
                    fontSize: 10, fontFamily: "'Sora', sans-serif", fontWeight: 800,
                    padding: '3px 10px', borderRadius: '8px 4px 8px 4px', marginBottom: 12,
                    letterSpacing: '.06em', textTransform: 'uppercase',
                  }}>
                    Most Popular
                  </div>
                )}
                <div style={{ ...s.tierName, color: tier.featured ? '#fff' : '#5D6B76' }}>{tier.name}</div>
                <div style={{ ...s.tierPrice, color: tier.featured ? '#fff' : '#101820' }}>
                  {tier.price}<span style={{ fontSize: 16, fontWeight: 400 }}>{tier.sub}</span>
                </div>
                <ul style={s.featureList}>
                  {tier.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: tier.featured ? (f.yes ? '#fff' : 'rgba(255,255,255,.5)') : (f.yes ? '#101820' : '#aaa') }}>
                      <span style={{ fontSize: 15 }}>{f.yes ? '✓' : '–'}</span>
                      {f.label}
                    </li>
                  ))}
                </ul>
                <Link
                  to={tier.ctaLink}
                  style={{
                    ...btnStyle, display: 'block', textAlign: 'center', marginTop: 28,
                    background: tier.featured ? '#fff' : '#0E8C8C',
                    color: tier.featured ? '#0E8C8C' : '#fff',
                    borderColor: tier.featured ? '#fff' : '#0E8C8C',
                  }}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={s.ctaSection}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 32, color: '#101820', marginBottom: 16 }}>
          Ready to get discovered?
        </h2>
        <p style={{ color: '#5D6B76', fontSize: 18, marginBottom: 32 }}>
          Join venues already showing up in TogetherPlans suggestions.
        </p>
        <Link to="/business/register" style={{ ...btnStyle, fontSize: 17, padding: '16px 36px' }}>
          List your business free →
        </Link>
      </section>

      <footer style={s.footer}>
        <Link to="/" style={{ color: '#0E8C8C', textDecoration: 'none', marginRight: 16 }}>← Back to TogetherPlans</Link>
        <Link to="/privacy" style={{ color: '#5D6B76', textDecoration: 'none', marginRight: 12 }}>Privacy</Link>
        <Link to="/terms" style={{ color: '#5D6B76', textDecoration: 'none' }}>Terms</Link>
      </footer>
    </div>
  );
}
