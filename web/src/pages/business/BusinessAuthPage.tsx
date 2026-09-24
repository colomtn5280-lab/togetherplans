import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { businessApi } from '../../api/client';

interface Props {
  mode: 'login' | 'register';
}

const CATEGORIES = [
  { value: 'dining', label: 'Dining & Restaurants' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'outdoors', label: 'Outdoors & Adventure' },
  { value: 'nightlife', label: 'Nightlife & Bars' },
  { value: 'wellness', label: 'Wellness & Spa' },
  { value: 'arts', label: 'Arts & Culture' },
  { value: 'sports', label: 'Sports & Recreation' },
  { value: 'other', label: 'Other' },
];

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #F4F6F8 0%, #D9F1F0 100%)',
    fontFamily: "'DM Sans', sans-serif", padding: '40px 20px',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '40px 40px',
    width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(16,24,32,.12)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  logoText: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 18, color: '#101820' },
  badge: {
    background: '#D9F1F0', color: '#086B6B', fontSize: 10,
    fontFamily: "'Sora', sans-serif", fontWeight: 800, padding: '3px 10px',
    borderRadius: '12px 4px 12px 4px', letterSpacing: '.05em', textTransform: 'uppercase' as const,
  },
  title: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 24, color: '#101820', marginBottom: 6, marginTop: 16 },
  sub: { color: '#5D6B76', fontSize: 14, marginBottom: 28 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#101820', marginBottom: 6 },
  input: {
    width: '100%', height: 44, borderRadius: 20, border: '1.5px solid #DDE3E8',
    padding: '0 14px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#101820',
    outline: 'none', boxSizing: 'border-box' as const, background: '#fff',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  fieldGroup: { marginBottom: 18 },
  btn: {
    width: '100%', height: 48, borderRadius: '22px 16px 22px 16px',
    background: '#0E8C8C', color: '#fff', border: 'none', cursor: 'pointer',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, marginTop: 8,
  },
  error: { background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 16, fontSize: 14, marginBottom: 16 },
  toggle: { textAlign: 'center' as const, marginTop: 20, fontSize: 14, color: '#5D6B76' },
};

export function BusinessAuthPage({ mode }: Props) {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>(mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [category, setCategory] = useState('dining');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await businessApi.login({ email: loginEmail, password: loginPass });
      const { token } = res.data as { token: string };
      localStorage.setItem('business_token', token);
      navigate('/business/dashboard');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      setError(e2?.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await businessApi.register({ name, email: regEmail, password: regPass, category, city, state });
      const { token } = res.data as { token: string };
      localStorage.setItem('business_token', token);
      navigate('/business/dashboard');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } };
      setError(e2?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={styles.card}>
        <div style={styles.logo}>
          <img src="/mark-teal.svg" alt="TogetherPlans" style={{ width: 28, height: 28 }} />
          <span style={styles.logoText}>TogetherPlans</span>
          <span style={styles.badge}>Business</span>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {activeMode === 'login' ? (
          <>
            <h1 style={styles.title}>Welcome back</h1>
            <p style={styles.sub}>Sign in to your business account</p>
            <form onSubmit={handleLogin}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email address</label>
                <input
                  type="email" required style={styles.input}
                  value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@yourbusiness.com"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password" required style={styles.input}
                  value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" style={styles.btn} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 style={styles.title}>List your business</h1>
            <p style={styles.sub}>Create your free business account</p>
            <form onSubmit={handleRegister}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Business name</label>
                <input type="text" required style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="The Sunset Rooftop" />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Category</label>
                <select required style={{ ...styles.input, height: 44 }} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email address</label>
                <input type="email" required style={styles.input} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@yourbusiness.com" />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <input type="password" required minLength={8} style={styles.input} value={regPass} onChange={(e) => setRegPass(e.target.value)} placeholder="8+ characters" />
              </div>
              <div style={styles.row}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>City</label>
                  <input type="text" required style={styles.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Denver" />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>State</label>
                  <input type="text" required style={styles.input} value={state} onChange={(e) => setState(e.target.value)} placeholder="CO" maxLength={2} />
                </div>
              </div>
              <button type="submit" style={styles.btn} disabled={loading}>
                {loading ? 'Creating account…' : 'Create free account →'}
              </button>
            </form>
          </>
        )}

        <div style={styles.toggle}>
          {activeMode === 'login' ? (
            <>New business?{' '}
              <button onClick={() => { setActiveMode('register'); setError(''); }} style={{ background: 'none', border: 'none', color: '#0E8C8C', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Create an account
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setActiveMode('login'); setError(''); }} style={{ background: 'none', border: 'none', color: '#0E8C8C', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Sign in
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/business" style={{ color: '#5D6B76', fontSize: 13, textDecoration: 'none' }}>← Back to business overview</Link>
        </div>
      </div>
    </div>
  );
}
