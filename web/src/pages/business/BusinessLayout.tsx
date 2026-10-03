import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useBusinessAuth } from '../../hooks/useBusinessAuth';

const bz: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg, #F4F6F8)', fontFamily: "'DM Sans', sans-serif" },
  side: {
    width: 240, background: '#fff', borderRight: '1px solid var(--line, #DDE3E8)',
    display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, padding: '24px 20px 20px', borderBottom: '1px solid var(--line, #DDE3E8)' },
  logoText: { fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--ink, #101820)' },
  badge: {
    display: 'inline-block', background: '#D9F1F0', color: '#086B6B', fontSize: 9,
    fontFamily: "'Sora', sans-serif", fontWeight: 800, padding: '2px 7px',
    borderRadius: '12px 4px 12px 4px', letterSpacing: '.04em', textTransform: 'uppercase',
  },
  nav: { padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  main: { flex: 1, padding: '32px 40px', overflowY: 'auto' },
};

const navItems = [
  { to: '/business/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/business/profile', label: 'Profile', icon: '🏢' },
  { to: '/business/listings', label: 'Listings', icon: '📋' },
  { to: '/business/analytics', label: 'Analytics', icon: '📈' },
];

export function BusinessLayout() {
  const { business, loading, signOut } = useBusinessAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontFamily: "'Sora', sans-serif", color: '#0E8C8C', fontSize: 18 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={bz.shell}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={bz.side}>
        <div style={bz.logo}>
          <img src="/mark-teal.svg" alt="DateMeUp" style={{ width: 28, height: 28 }} />
          <div>
            <div style={bz.logoText}>DateMeUp</div>
            <span style={bz.badge}>Business</span>
          </div>
        </div>

        {business && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #DDE3E8' }}>
            <div style={{ fontSize: 13, color: '#5D6B76' }}>Signed in as</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#101820', fontFamily: "'Sora', sans-serif" }}>
              {business.name}
            </div>
            <div style={{
              display: 'inline-block', marginTop: 4, padding: '2px 10px', borderRadius: 20,
              background: business.tier === 'free' ? '#F4F6F8' : '#D9F1F0',
              color: business.tier === 'free' ? '#5D6B76' : '#086B6B',
              fontSize: 11, fontWeight: 700, fontFamily: "'Sora', sans-serif",
            }}>
              {business.tier.toUpperCase()}
            </div>
          </div>
        )}

        <nav style={bz.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 20, textDecoration: 'none', fontSize: 14,
                fontFamily: "'Sora', sans-serif", fontWeight: 600,
                background: isActive ? '#D9F1F0' : 'transparent',
                color: isActive ? '#086B6B' : '#5D6B76',
                transition: 'all .15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 20, fontSize: 14, fontFamily: "'Sora', sans-serif", fontWeight: 600,
            color: '#5D6B76', cursor: 'default', marginTop: 4,
          }}>
            <span style={{ fontSize: 16 }}>💳</span>
            Billing <span style={{ fontSize: 10, marginLeft: 4, color: '#aaa' }}>(soon)</span>
          </div>
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #DDE3E8' }}>
          <button
            onClick={signOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 20, fontSize: 14, fontFamily: "'Sora', sans-serif", fontWeight: 600,
              color: '#5D6B76', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%',
            }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={bz.main}>
        <Outlet context={{ business, navigate }} />
      </main>
    </div>
  );
}
