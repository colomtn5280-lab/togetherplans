import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { businessApi } from '../../api/client';
import type { BusinessProfile } from '../../hooks/useBusinessAuth';

interface OutletCtx {
  business: BusinessProfile | null;
  setBusiness?: (b: BusinessProfile) => void;
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

const MOOD_TAGS = ['Romantic', 'Adventurous', 'Social', 'Chill', 'Spontaneous', 'Cultural'];
const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

const s: Record<string, React.CSSProperties> = {
  title: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 28, color: '#101820', marginBottom: 4 },
  sub: { color: '#5D6B76', fontSize: 15, marginBottom: 32 },
  section: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 14, padding: '28px 28px',
    marginBottom: 24, boxShadow: '0 8px 24px rgba(16,24,32,.07)',
  },
  sectionTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: '#101820', marginBottom: 20 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#101820', marginBottom: 6 },
  input: {
    width: '100%', height: 44, borderRadius: 20, border: '1.5px solid #DDE3E8',
    padding: '0 14px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#101820',
    outline: 'none', boxSizing: 'border-box' as const, background: '#fff',
  },
  textarea: {
    width: '100%', borderRadius: 20, border: '1.5px solid #DDE3E8',
    padding: '12px 14px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#101820',
    outline: 'none', boxSizing: 'border-box' as const, background: '#fff', resize: 'vertical' as const,
    minHeight: 100,
  },
  fieldGroup: { marginBottom: 16 },
  tag: {
    display: 'inline-flex', alignItems: 'center', padding: '6px 14px',
    borderRadius: 20, border: '1.5px solid #DDE3E8', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', marginRight: 8, marginBottom: 8, fontFamily: "'Sora', sans-serif",
  },
  saveBtn: {
    padding: '13px 32px', borderRadius: '22px 16px 22px 16px',
    background: '#0E8C8C', color: '#fff', border: 'none', cursor: 'pointer',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15,
  },
  success: { background: '#D9F1F0', color: '#086B6B', padding: '10px 14px', borderRadius: 16, fontSize: 14, marginBottom: 16 },
  error: { background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 16, fontSize: 14, marginBottom: 16 },
};

export function BusinessProfilePage() {
  const { business } = useOutletContext<OutletCtx>();

  const [form, setForm] = useState({
    name: '', category: 'dining', description: '',
    address: '', city: '', state: '', zipCode: '',
    phone: '', website: '', priceRange: '$$', tags: [] as string[],
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || '',
        category: business.category || 'dining',
        description: business.description || '',
        address: business.address || '',
        city: business.city || '',
        state: business.state || '',
        zipCode: business.zipCode || '',
        phone: business.phone || '',
        website: business.website || '',
        priceRange: business.priceRange || '$$',
        tags: business.tags || [],
      });
    }
  }, [business]);

  const set = (key: string, val: unknown) => setForm((prev) => ({ ...prev, [key]: val }));

  const toggleTag = (tag: string) => {
    const lower = tag.toLowerCase();
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(lower)
        ? prev.tags.filter((t) => t !== lower)
        : [...prev.tags, lower],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await businessApi.updateMe(form);
      setSuccess('Profile saved successfully!');
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 style={s.title}>Business Profile</h1>
      <p style={s.sub}>Update your listing details — changes appear in TogetherPlans suggestions.</p>

      {success && <div style={s.success}>{success}</div>}
      {error && <div style={s.error}>{error}</div>}

      <form onSubmit={handleSave}>
        {/* Basic Info */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Basic Information</div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Business name</label>
            <input type="text" required style={s.input} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Category</label>
            <select style={{ ...s.input, height: 44 }} value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Description</label>
            <textarea style={s.textarea} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What makes your venue special?" />
          </div>
        </div>

        {/* Location */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Location</div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Street address</label>
            <input type="text" style={s.input} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div style={s.grid2}>
            <div style={s.fieldGroup}>
              <label style={s.label}>City</label>
              <input type="text" style={s.input} value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>State</label>
              <input type="text" style={s.input} value={form.state} onChange={(e) => set('state', e.target.value)} maxLength={2} />
            </div>
          </div>
          <div style={{ maxWidth: 200 }}>
            <label style={s.label}>ZIP code</label>
            <input type="text" style={s.input} value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} />
          </div>
        </div>

        {/* Contact */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Contact</div>
          <div style={s.grid2}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Phone</label>
              <input type="tel" style={s.input} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Website</label>
              <input type="url" style={s.input} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Price Range</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {PRICE_RANGES.map((pr) => (
              <label key={pr} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio" name="priceRange" value={pr}
                  checked={form.priceRange === pr}
                  onChange={() => set('priceRange', pr)}
                  style={{ accentColor: '#0E8C8C' }}
                />
                <span style={{
                  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18,
                  color: form.priceRange === pr ? '#0E8C8C' : '#5D6B76',
                }}>
                  {pr}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Mood Tags */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Mood Tags</div>
          <p style={{ fontSize: 13, color: '#5D6B76', marginBottom: 16 }}>
            Select moods that describe your venue. This helps match you to the right couples.
          </p>
          <div>
            {MOOD_TAGS.map((tag) => {
              const lower = tag.toLowerCase();
              const active = form.tags.includes(lower);
              return (
                <span
                  key={tag}
                  style={{
                    ...s.tag,
                    background: active ? '#D9F1F0' : '#fff',
                    color: active ? '#086B6B' : '#5D6B76',
                    borderColor: active ? '#0E8C8C' : '#DDE3E8',
                  }}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>

        <button type="submit" style={s.saveBtn} disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
