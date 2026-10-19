// TODO i18n: instrument this file with useTranslation() hooks
// All strings have translations in /public/locales/{en,es}/translation.json
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessApi } from '../../api/client';

// ── Constants ─────────────────────────────────────────────────────────────────

const BIZ_CATEGORIES = [
  { value: 'dining', label: 'Dining & Restaurants' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'outdoors', label: 'Outdoors & Adventure' },
  { value: 'nightlife', label: 'Nightlife & Bars' },
  { value: 'wellness', label: 'Wellness & Spa' },
  { value: 'arts', label: 'Arts & Culture' },
  { value: 'sports', label: 'Sports & Recreation' },
  { value: 'other', label: 'Other' },
];

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

const RADIUS_OPTIONS = [
  { value: 15, label: 'Local (up to 15 miles) — neighborhood & walk-in' },
  { value: 30, label: 'City-wide (up to 30 miles) — most urban businesses' },
  { value: 50, label: 'Metro area (up to 50 miles) — larger venues & regional draws' },
  { value: 75, label: 'Regional (up to 75 miles) — concert venues & destinations' },
  { value: 100, label: 'Wide regional (up to 100 miles) — major artists & resorts' },
];

const DATE_CATEGORIES = [
  { id: 'restaurants-dining', label: 'Restaurants & Dining', emoji: '🍽️' },
  { id: 'live-music-concerts', label: 'Live Music & Concerts', emoji: '🎵' },
  { id: 'comedy', label: 'Comedy', emoji: '😂' },
  { id: 'sports-active', label: 'Sports & Active', emoji: '⚽' },
  { id: 'hiking-trails', label: 'Hiking & Trails', emoji: '🥾' },
  { id: 'movies', label: 'Movies', emoji: '🎬' },
  { id: 'streaming-night', label: 'Streaming Night', emoji: '🍿' },
  { id: 'wellness-spa', label: 'Wellness & Spa', emoji: '🧘' },
  { id: 'volunteering', label: 'Volunteering', emoji: '🤝' },
  { id: 'arts-culture', label: 'Arts & Culture', emoji: '🎨' },
  { id: 'after-dark', label: 'After Dark', emoji: '🌙' },
  { id: 'family-events', label: 'Family Events', emoji: '👨‍👩‍👧' },
  { id: 'hotel-stays', label: 'Hotel Stays', emoji: '🏨' },
  { id: 'experiences', label: 'Experiences', emoji: '✨' },
  { id: 'custom', label: 'Custom', emoji: '🎯' },
];

const TOTAL_STEPS = 5;
const API_BASE = import.meta.env.VITE_API_URL ?? 'https://datenight-api-mh74edz3ja-uc.a.run.app/api';

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: '#F4F6F8',
    fontFamily: "'DM Sans', sans-serif", padding: '32px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  container: { width: '100%', maxWidth: 680 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoText: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 18, color: '#101820' },
  badge: {
    background: '#D9F1F0', color: '#086B6B', fontSize: 10,
    fontFamily: "'Sora', sans-serif", fontWeight: 800, padding: '3px 10px',
    borderRadius: '12px 4px 12px 4px', letterSpacing: '.05em', textTransform: 'uppercase' as const,
  },
  // Progress
  progressRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' },
  dot: {
    width: 36, height: 36, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
    transition: 'all .2s',
  },
  dotLine: { flex: 1, height: 2, background: '#DDE3E8', maxWidth: 48, borderRadius: 2 },
  // Card
  card: {
    background: '#fff', borderRadius: 24, padding: '40px',
    boxShadow: '0 8px 40px rgba(16,24,32,.10)', marginBottom: 24,
  },
  stepTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 26, color: '#101820', marginBottom: 6 },
  stepSub: { color: '#5D6B76', fontSize: 15, marginBottom: 28, lineHeight: 1.5 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#101820', marginBottom: 6 },
  helperText: { fontSize: 12, color: '#5D6B76', marginTop: 4 },
  input: {
    width: '100%', height: 46, borderRadius: 22, border: '1.5px solid #DDE3E8',
    padding: '0 16px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#101820',
    outline: 'none', boxSizing: 'border-box' as const, background: '#fff',
  },
  textarea: {
    width: '100%', borderRadius: 22, border: '1.5px solid #DDE3E8',
    padding: '14px 16px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#101820',
    outline: 'none', boxSizing: 'border-box' as const, background: '#fff',
    resize: 'vertical' as const, minHeight: 110,
  },
  select: {
    width: '100%', height: 46, borderRadius: 22, border: '1.5px solid #DDE3E8',
    padding: '0 16px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#101820',
    outline: 'none', boxSizing: 'border-box' as const, background: '#fff',
    appearance: 'auto' as const,
  },
  fieldGroup: { marginBottom: 20 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  // Nav buttons
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  btnPrimary: {
    padding: '13px 28px', borderRadius: '22px 16px 22px 16px',
    background: '#0E8C8C', color: '#fff', border: 'none', cursor: 'pointer',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15,
  },
  btnSecondary: {
    padding: '13px 28px', borderRadius: '22px 16px 22px 16px',
    background: 'transparent', color: '#5D6B76', border: '1.5px solid #DDE3E8', cursor: 'pointer',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15,
  },
  btnOutline: {
    padding: '11px 20px', borderRadius: '22px 16px 22px 16px',
    background: '#fff', color: '#0E8C8C', border: '1.5px solid #0E8C8C', cursor: 'pointer',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13,
    whiteSpace: 'nowrap' as const,
  },
  // Success/error
  success: { background: '#D9F1F0', color: '#086B6B', padding: '10px 14px', borderRadius: 16, fontSize: 14, marginBottom: 16 },
  error: { background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 16, fontSize: 14, marginBottom: 16 },
  // Category tile
  catTile: {
    border: '2px solid #DDE3E8', borderRadius: 16, padding: '14px 10px', cursor: 'pointer',
    textAlign: 'center' as const, transition: 'all .15s',
  },
  catEmoji: { fontSize: 24, marginBottom: 6 },
  catLabel: { fontSize: 12, fontFamily: "'Sora', sans-serif", fontWeight: 600, color: '#101820', lineHeight: 1.3 },
  // Upload zone
  uploadZone: {
    border: '2px dashed #DDE3E8', borderRadius: 22, padding: '32px',
    textAlign: 'center' as const, cursor: 'pointer', transition: 'all .15s',
    background: '#F4F6F8',
  },
  // Plan card
  planCard: {
    border: '2px solid #DDE3E8', borderRadius: 24, padding: '28px 24px',
    flex: 1, minWidth: 180, transition: 'all .15s',
  },
  planTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 18, color: '#101820', marginBottom: 4 },
  planPrice: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 32, color: '#0E8C8C', lineHeight: 1 },
  planPriceUnit: { fontSize: 14, color: '#5D6B76', fontWeight: 400 },
  planFeature: { fontSize: 13, color: '#5D6B76', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 6 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function BusinessOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [autofilling, setAutofilling] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Step 1 data
  const [step1, setStep1] = useState({
    name: '', email: '', website: '', description: '',
    phone: '', address: '', city: '', state: '', zipCode: '',
    category: 'dining', priceRange: '$$',
  });

  // Step 2 data
  const [step2, setStep2] = useState({ radiusMiles: 30, featuredCategory: '' });

  // Step 3 data
  const [logoUrl, setLogoUrl] = useState('');
  const [heroUrl, setHeroUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [heroError, setHeroError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Step 4 data
  const [platformIds, setPlatformIds] = useState({
    ticketmaster: '', songkick: '', opentable: '', resy: '', eventbrite: '',
  });

  const set1 = (k: string, v: string) => setStep1((p) => ({ ...p, [k]: v }));
  const set2 = (k: string, v: unknown) => setStep2((p) => ({ ...p, [k]: v }));
  const setPlatform = (k: string, v: string) => setPlatformIds((p) => ({ ...p, [k]: v }));

  // ── Auto-fill ──────────────────────────────────────────────────────────────

  const handleAutofill = async () => {
    if (!step1.website) return;
    setAutofilling(true);
    setError('');
    try {
      const resp = await fetch(`${API_BASE}/business/scrape-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: step1.website }),
      });
      if (!resp.ok) throw new Error('scrape failed');
      const data = await resp.json() as { profile: Record<string, string> };
      const p = data.profile || {};
      setStep1((prev) => ({
        ...prev,
        name: prev.name || p.name || prev.name,
        description: prev.description || p.description || prev.description,
        phone: prev.phone || p.phone || prev.phone,
        address: prev.address || p.address || prev.address,
        priceRange: prev.priceRange || p.priceRange || prev.priceRange,
      }));
      setSuccessMsg('Auto-filled! Review and continue.');
    } catch {
      setError('Could not extract from that URL. Fill in manually.');
    } finally {
      setAutofilling(false);
    }
  };

  // ── Upload helpers ─────────────────────────────────────────────────────────

  const handleUpload = async (file: File, type: 'logo' | 'hero') => {
    if (file.size > 5 * 1024 * 1024) {
      if (type === 'logo') setLogoError('File too large — max 5 MB');
      else setHeroError('File too large — max 5 MB');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    if (type === 'logo') { setLogoUploading(true); setLogoError(''); }
    else { setHeroUploading(true); setHeroError(''); }
    try {
      const res = await businessApi.uploadFile(type, fd);
      const d = res.data as { url: string };
      if (type === 'logo') setLogoUrl(d.url);
      else setHeroUrl(d.url);
    } catch {
      if (type === 'logo') setLogoError('Upload failed. Please try again.');
      else setHeroError('Upload failed. Please try again.');
    } finally {
      if (type === 'logo') setLogoUploading(false);
      else setHeroUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero') => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, type);
  };

  const onDrop = (e: React.DragEvent, type: 'logo' | 'hero') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file, type);
  };

  // ── Save & advance ─────────────────────────────────────────────────────────

  const saveStep1 = async () => {
    setSaving(true); setError('');
    try {
      await businessApi.updateMe({
        name: step1.name, website: step1.website, description: step1.description,
        phone: step1.phone, address: step1.address, city: step1.city,
        state: step1.state, zipCode: step1.zipCode, category: step1.category,
        priceRange: step1.priceRange,
      });
      setStep(2);
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const saveStep2 = async () => {
    if (!step2.featuredCategory) { setError('Please pick a featured category.'); return; }
    setSaving(true); setError('');
    try {
      await businessApi.updateMe({ radiusMiles: step2.radiusMiles, featuredCategory: step2.featuredCategory });
      setStep(3);
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const saveStep3 = async () => {
    setSaving(true); setError('');
    try {
      const updates: Record<string, string> = {};
      if (logoUrl) updates.logoUrl = logoUrl;
      if (heroUrl) updates.heroImageUrl = heroUrl;
      if (Object.keys(updates).length > 0) await businessApi.updateMe(updates);
      setStep(4);
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const saveStep4 = async () => {
    setSaving(true); setError('');
    try {
      const ids = Object.fromEntries(Object.entries(platformIds).filter(([, v]) => v.trim()));
      await businessApi.updatePlatformIds(ids);
      setStep(5);
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleSubscribe = async (plan: string) => {
    setSaving(true); setError('');
    try {
      const res = await businessApi.subscribe({
        plan,
        successUrl: 'https://togetherplans.app/business/dashboard?subscribed=true',
        cancelUrl: 'https://togetherplans.app/business/onboarding?step=5',
      });
      const d = res.data as { url?: string; sessionUrl?: string };
      const url = d.url || d.sessionUrl;
      if (url) window.location.href = url;
    } catch { setError('Failed to start checkout. Please try again.'); }
    finally { setSaving(false); }
  };

  // ── Progress dots ──────────────────────────────────────────────────────────

  const ProgressDots = () => (
    <div style={s.progressRow}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
        <>
          {n > 1 && (
            <div key={`line-${n}`} style={{ ...s.dotLine, background: step >= n ? '#0E8C8C' : '#DDE3E8' }} />
          )}
          <div
            key={n}
            style={{
              ...s.dot,
              background: step === n ? '#0E8C8C' : step > n ? '#7CB518' : '#F4F6F8',
              color: step >= n ? '#fff' : '#5D6B76',
              border: step < n ? '2px solid #DDE3E8' : 'none',
            }}
          >
            {step > n ? '✓' : n}
          </div>
        </>
      ))}
    </div>
  );

  // ── Step renders ───────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div style={s.card}>
      <h2 style={s.stepTitle}>Tell us about your business</h2>
      <p style={s.stepSub}>This information appears on your listing in TogetherPlans.</p>

      {successMsg && <div style={s.success}>{successMsg}</div>}
      {error && <div style={s.error}>{error}</div>}

      <div style={s.fieldGroup}>
        <label style={s.label}>Business name *</label>
        <input type="text" required style={s.input} value={step1.name}
          onChange={(e) => set1('name', e.target.value)} placeholder="The Sunset Rooftop" />
      </div>

      <div style={s.fieldGroup}>
        <label style={s.label}>Website URL</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="url" style={s.input} value={step1.website}
            onChange={(e) => set1('website', e.target.value)} placeholder="https://yourbusiness.com" />
          <button type="button" onClick={handleAutofill} disabled={autofilling || !step1.website}
            style={{ ...s.btnOutline, opacity: (!step1.website || autofilling) ? 0.6 : 1 }}>
            {autofilling ? 'Loading…' : 'Auto-fill ✨'}
          </button>
        </div>
        <div style={s.helperText}>Enter your website and we'll try to fill in the fields automatically.</div>
      </div>

      <div style={s.fieldGroup}>
        <label style={s.label}>Description</label>
        <textarea style={s.textarea} value={step1.description}
          onChange={(e) => set1('description', e.target.value)}
          placeholder="What makes your venue special? What's the vibe?" />
      </div>

      <div style={s.grid2}>
        <div style={s.fieldGroup}>
          <label style={s.label}>Phone</label>
          <input type="tel" style={s.input} value={step1.phone}
            onChange={(e) => set1('phone', e.target.value)} placeholder="(303) 555-0100" />
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Category</label>
          <select style={s.select} value={step1.category} onChange={(e) => set1('category', e.target.value)}>
            {BIZ_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div style={s.fieldGroup}>
        <label style={s.label}>Street address</label>
        <input type="text" style={s.input} value={step1.address}
          onChange={(e) => set1('address', e.target.value)} placeholder="123 Main St" />
      </div>

      <div style={s.grid3}>
        <div style={s.fieldGroup}>
          <label style={s.label}>City</label>
          <input type="text" style={s.input} value={step1.city}
            onChange={(e) => set1('city', e.target.value)} placeholder="Denver" />
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>State</label>
          <input type="text" style={s.input} value={step1.state}
            onChange={(e) => set1('state', e.target.value)} placeholder="CO" maxLength={2} />
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>ZIP</label>
          <input type="text" style={s.input} value={step1.zipCode}
            onChange={(e) => set1('zipCode', e.target.value)} placeholder="80202" />
        </div>
      </div>

      <div style={s.fieldGroup}>
        <label style={s.label}>Price range</label>
        <div style={{ display: 'flex', gap: 12 }}>
          {PRICE_RANGES.map((pr) => (
            <label key={pr} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="radio" name="priceRange" value={pr} checked={step1.priceRange === pr}
                onChange={() => set1('priceRange', pr)} style={{ accentColor: '#0E8C8C' }} />
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: step1.priceRange === pr ? '#0E8C8C' : '#5D6B76' }}>
                {pr}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div style={s.navRow}>
        <div />
        <button style={s.btnPrimary} onClick={saveStep1} disabled={saving || !step1.name}>
          {saving ? 'Saving…' : 'Next — Service Area →'}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={s.card}>
      <h2 style={s.stepTitle}>Service area & category</h2>
      <p style={s.stepSub}>Tell us where you serve and which TogetherPlans category fits you best.</p>

      {error && <div style={s.error}>{error}</div>}

      {(step1.address || step1.city) && (
        <div style={{ background: '#F4F6F8', borderRadius: 16, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#5D6B76' }}>
          📍 {[step1.address, step1.city, step1.state, step1.zipCode].filter(Boolean).join(', ')}
        </div>
      )}

      <div style={s.fieldGroup}>
        <label style={s.label}>Service radius</label>
        <select style={s.select} value={step2.radiusMiles} onChange={(e) => set2('radiusMiles', Number(e.target.value))}>
          {RADIUS_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <div style={s.helperText}>Your listings will appear in TogetherPlans searches for users within this radius of your address.</div>
      </div>

      <div style={s.fieldGroup}>
        <label style={s.label}>Featured category</label>
        <p style={{ fontSize: 13, color: '#5D6B76', marginBottom: 16 }}>
          Which TogetherPlans category should your business appear in?
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 10,
        }}>
          {DATE_CATEGORIES.map((cat) => {
            const active = step2.featuredCategory === cat.id;
            return (
              <div
                key={cat.id}
                style={{
                  ...s.catTile,
                  borderColor: active ? '#0E8C8C' : '#DDE3E8',
                  background: active ? '#D9F1F0' : '#fff',
                }}
                onClick={() => set2('featuredCategory', cat.id)}
              >
                <div style={s.catEmoji}>{cat.emoji}</div>
                <div style={{ ...s.catLabel, color: active ? '#086B6B' : '#101820' }}>{cat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.navRow}>
        <button style={s.btnSecondary} onClick={() => setStep(1)}>← Back</button>
        <button style={s.btnPrimary} onClick={saveStep2} disabled={saving || !step2.featuredCategory}>
          {saving ? 'Saving…' : 'Next — Photos →'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div style={s.card}>
      <h2 style={s.stepTitle}>Photos & branding</h2>
      <p style={s.stepSub}>Your logo appears on your listing card. Your hero image is shown when users tap your listing.</p>

      {error && <div style={s.error}>{error}</div>}

      {/* Logo upload */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Logo (128×128 circle on listing card)</label>
        <div
          style={{ ...s.uploadZone, borderColor: logoUrl ? '#7CB518' : '#DDE3E8', background: logoUrl ? '#EAF6D3' : '#F4F6F8' }}
          onClick={() => logoInputRef.current?.click()}
          onDrop={(e) => onDrop(e, 'logo')}
          onDragOver={(e) => e.preventDefault()}
        >
          {logoUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <img src={logoUrl} alt="Logo" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #7CB518' }} />
              <span style={{ fontSize: 13, color: '#086B6B', fontWeight: 600 }}>✓ Logo uploaded</span>
            </div>
          ) : logoUploading ? (
            <div style={{ color: '#5D6B76', fontSize: 14 }}>Uploading…</div>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820', marginBottom: 4 }}>
                Drop your logo here or click to browse
              </div>
              <div style={{ fontSize: 12, color: '#5D6B76' }}>JPEG, PNG, or WebP — max 5 MB</div>
            </>
          )}
        </div>
        <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
          onChange={(e) => onFileChange(e, 'logo')} />
        {logoError && <div style={{ ...s.error, marginTop: 8, marginBottom: 0 }}>{logoError}</div>}
      </div>

      {/* Hero upload */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Hero image (full-width banner on your listing detail page)</label>
        <div
          style={{
            border: `2px dashed ${heroUrl ? '#7CB518' : '#DDE3E8'}`,
            borderRadius: 22, overflow: 'hidden', cursor: 'pointer',
            background: heroUrl ? '#000' : '#F4F6F8', minHeight: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => heroInputRef.current?.click()}
          onDrop={(e) => onDrop(e, 'hero')}
          onDragOver={(e) => e.preventDefault()}
        >
          {heroUrl ? (
            <img src={heroUrl} alt="Hero" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
          ) : heroUploading ? (
            <div style={{ color: '#5D6B76', fontSize: 14 }}>Uploading…</div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🌆</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: '#101820', marginBottom: 4 }}>
                Drop your hero image here or click to browse
              </div>
              <div style={{ fontSize: 12, color: '#5D6B76' }}>JPEG, PNG, or WebP — max 5 MB</div>
            </div>
          )}
        </div>
        <input ref={heroInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
          onChange={(e) => onFileChange(e, 'hero')} />
        {heroError && <div style={{ ...s.error, marginTop: 8, marginBottom: 0 }}>{heroError}</div>}
      </div>

      <div style={s.navRow}>
        <button style={s.btnSecondary} onClick={() => setStep(2)}>← Back</button>
        <button style={s.btnPrimary} onClick={saveStep3} disabled={saving}>
          {saving ? 'Saving…' : 'Next — Platform IDs →'}
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div style={s.card}>
      <h2 style={s.stepTitle}>Platform presence</h2>
      <p style={s.stepSub}>Enter your IDs on these platforms and we will always include your events and venue in TogetherPlans searches. All fields are optional.</p>

      {error && <div style={s.error}>{error}</div>}

      {[
        {
          key: 'ticketmaster', label: 'Ticketmaster Attraction/Venue ID',
          helper: 'Find it in your Ticketmaster account or from your Ticketmaster event URL: ticketmaster.com/artist/YOUR-ID-HERE',
        },
        {
          key: 'songkick', label: 'Songkick Artist ID',
          helper: 'Your Songkick artist page URL: songkick.com/artists/YOUR-ID-HERE',
        },
        {
          key: 'opentable', label: 'OpenTable Restaurant ID',
          helper: 'From your OpenTable listing URL',
        },
        {
          key: 'resy', label: 'Resy Venue Slug',
          helper: 'From your Resy venue URL: resy.com/cities/.../YOUR-SLUG',
        },
        {
          key: 'eventbrite', label: 'Eventbrite Organizer ID',
          helper: 'Your Eventbrite organizer page ID',
        },
      ].map(({ key, label, helper }) => (
        <div key={key} style={s.fieldGroup}>
          <label style={s.label}>{label}</label>
          <input
            type="text" style={s.input}
            value={platformIds[key as keyof typeof platformIds]}
            onChange={(e) => setPlatform(key, e.target.value)}
            placeholder="Optional"
          />
          <div style={s.helperText}>{helper}</div>
        </div>
      ))}

      <div style={s.navRow}>
        <button style={s.btnSecondary} onClick={() => setStep(3)}>← Back</button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={s.btnSecondary} onClick={() => setStep(5)}>Skip</button>
          <button style={s.btnPrimary} onClick={saveStep4} disabled={saving}>
            {saving ? 'Saving…' : 'Next — Choose Plan →'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => {
    const featuredPrice = billingCycle === 'monthly' ? '$49' : '$39';
    const premiumPrice = billingCycle === 'monthly' ? '$149' : '$119';
    const featuredAnnual = billingCycle === 'annual' ? ' ($470/yr)' : '';
    const premiumAnnual = billingCycle === 'annual' ? ' ($1,430/yr)' : '';

    return (
      <div style={s.card}>
        <h2 style={s.stepTitle}>Choose your visibility</h2>
        <p style={s.stepSub}>Pick the plan that fits your growth goals. Upgrade or cancel anytime.</p>

        {error && <div style={s.error}>{error}</div>}

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
          <span style={{ fontSize: 14, fontWeight: billingCycle === 'monthly' ? 700 : 400, color: billingCycle === 'monthly' ? '#101820' : '#5D6B76' }}>Monthly</span>
          <button
            type="button"
            onClick={() => setBillingCycle((c) => c === 'monthly' ? 'annual' : 'monthly')}
            style={{
              width: 48, height: 26, borderRadius: 13, background: billingCycle === 'annual' ? '#0E8C8C' : '#DDE3E8',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: billingCycle === 'annual' ? 25 : 3,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left .2s', display: 'block',
            }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: billingCycle === 'annual' ? 700 : 400, color: billingCycle === 'annual' ? '#101820' : '#5D6B76' }}>
            Annual <span style={{ color: '#7CB518', fontWeight: 700 }}>— Save 20%</span>
          </span>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, marginBottom: 24 }}>
          {/* Free */}
          <div style={{ ...s.planCard, flex: 1, minWidth: 160 }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 12, color: '#5D6B76', letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
              Organic
            </div>
            <div style={s.planTitle}>Free</div>
            <div style={{ marginBottom: 20 }}>
              <span style={{ ...s.planPrice, color: '#101820' }}>$0</span>
              <span style={s.planPriceUnit}>/mo</span>
            </div>
            <div style={{ marginBottom: 20 }}>
              {['Standard search ranking (alphabetical)', 'Basic listing'].map((f) => (
                <div key={f} style={s.planFeature}><span style={{ color: '#7CB518', flexShrink: 0 }}>✓</span>{f}</div>
              ))}
            </div>
            <button
              style={{ ...s.btnSecondary, width: '100%', textAlign: 'center' as const }}
              onClick={() => navigate('/business/dashboard')}
            >
              Start Free
            </button>
          </div>

          {/* Featured */}
          <div style={{ ...s.planCard, flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 12, color: '#0E8C8C', letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Featured</span>
              <span style={{ fontSize: 14 }}>⭐</span>
            </div>
            <div style={s.planTitle}>Featured</div>
            <div style={{ marginBottom: 4 }}>
              <span style={s.planPrice}>{featuredPrice}</span>
              <span style={s.planPriceUnit}>/mo{featuredAnnual}</span>
            </div>
            <div style={{ marginBottom: 20 }}>
              {[
                'Slots 2–3 in category results',
                'Featured badge on listing',
                'Logo & hero image displayed',
              ].map((f) => (
                <div key={f} style={s.planFeature}><span style={{ color: '#7CB518', flexShrink: 0 }}>✓</span>{f}</div>
              ))}
            </div>
            <button
              style={{ ...s.btnPrimary, width: '100%', textAlign: 'center' as const, opacity: saving ? 0.7 : 1 }}
              onClick={() => handleSubscribe(billingCycle === 'monthly' ? 'featured_monthly' : 'featured_annual')}
              disabled={saving}
            >
              {saving ? 'Redirecting…' : 'Subscribe — Featured'}
            </button>
          </div>

          {/* Premium */}
          <div style={{ ...s.planCard, flex: 1, minWidth: 160, borderColor: '#0E8C8C', borderWidth: 2.5, background: '#FAFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 12, color: '#086B6B', letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Premium</span>
              <span style={{ fontSize: 14 }}>👑</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: "'Sora', sans-serif", fontWeight: 800, background: '#0E8C8C', color: '#fff', padding: '2px 8px', borderRadius: 10 }}>
                BEST
              </span>
            </div>
            <div style={s.planTitle}>Premium</div>
            <div style={{ marginBottom: 4 }}>
              <span style={s.planPrice}>{premiumPrice}</span>
              <span style={s.planPriceUnit}>/mo{premiumAnnual}</span>
            </div>
            <div style={{ marginBottom: 20 }}>
              {[
                'Slot 1 — top of category results',
                'Premium badge on listing',
                'Priority support',
                'Analytics dashboard',
              ].map((f) => (
                <div key={f} style={s.planFeature}><span style={{ color: '#7CB518', flexShrink: 0 }}>✓</span>{f}</div>
              ))}
            </div>
            <button
              style={{ ...s.btnPrimary, width: '100%', textAlign: 'center' as const, background: '#086B6B', opacity: saving ? 0.7 : 1 }}
              onClick={() => handleSubscribe(billingCycle === 'monthly' ? 'premium_monthly' : 'premium_annual')}
              disabled={saving}
            >
              {saving ? 'Redirecting…' : 'Subscribe — Premium'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#5D6B76', marginBottom: 28 }}>
          You can upgrade, downgrade, or cancel anytime from your dashboard.
        </p>

        <div style={s.navRow}>
          <button style={s.btnSecondary} onClick={() => setStep(4)}>← Back</button>
          <button style={s.btnPrimary} onClick={() => navigate('/business/dashboard')}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={s.container}>
        {/* Logo header */}
        <div style={s.logo}>
          <img src="/mark-teal.svg" alt="TogetherPlans" style={{ width: 28, height: 28 }} />
          <span style={s.logoText}>TogetherPlans</span>
          <span style={s.badge}>Business Setup</span>
        </div>

        <ProgressDots />

        <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 13, color: '#5D6B76', fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
          Step {step} of {TOTAL_STEPS}
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
}
