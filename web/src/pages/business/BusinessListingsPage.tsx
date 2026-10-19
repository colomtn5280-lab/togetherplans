import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { businessApi } from '../../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeaturedListing {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  ctaUrl?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
}

interface DirectListing {
  id: string;
  title: string;
  description: string;
  category: string;
  address?: string;
  imageUrl?: string;
  eventDate?: string;
  price?: string;
  ticketUrl?: string;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DATE_CATEGORIES = [
  { id: 'restaurants-dining', label: '🍽️ Restaurants & Dining' },
  { id: 'live-music-concerts', label: '🎵 Live Music & Concerts' },
  { id: 'comedy', label: '😂 Comedy' },
  { id: 'sports-active', label: '⚽ Sports & Active' },
  { id: 'hiking-trails', label: '🥾 Hiking & Trails' },
  { id: 'movies', label: '🎬 Movies' },
  { id: 'streaming-night', label: '🍿 Streaming Night' },
  { id: 'wellness-spa', label: '🧘 Wellness & Spa' },
  { id: 'volunteering', label: '🤝 Volunteering' },
  { id: 'arts-culture', label: '🎨 Arts & Culture' },
  { id: 'after-dark', label: '🌙 After Dark' },
  { id: 'family-events', label: '👨‍👩‍👧 Family Events' },
  { id: 'hotel-stays', label: '🏨 Hotel Stays' },
  { id: 'experiences', label: '✨ Experiences' },
  { id: 'custom', label: '🎯 Custom' },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  title: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 28, color: '#101820', marginBottom: 4 },
  sub: { color: '#5D6B76', fontSize: 15, marginBottom: 24 },
  tabRow: { display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid #DDE3E8', paddingBottom: 0 },
  tab: {
    padding: '10px 24px', borderRadius: '16px 16px 0 0', border: 'none', cursor: 'pointer',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14, transition: 'all .15s',
    background: 'transparent', color: '#5D6B76',
  },
  tabActive: {
    background: '#fff', color: '#0E8C8C', borderBottom: '2px solid #0E8C8C',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 16 },
  addBtn: {
    padding: '11px 24px', borderRadius: '22px 16px 22px 16px',
    background: '#0E8C8C', color: '#fff', border: 'none', cursor: 'pointer',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
  },
  listingCard: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 20, padding: '20px 24px',
    marginBottom: 16, boxShadow: '0 8px 24px rgba(16,24,32,.07)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
  },
  cardTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: '#101820', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#5D6B76', marginBottom: 8, lineHeight: 1.5 },
  badge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11,
    fontFamily: "'Sora', sans-serif", fontWeight: 700,
  },
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(16,24,32,.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
  },
  modal: {
    background: '#fff', borderRadius: 24, padding: '32px', width: '100%', maxWidth: 560,
    maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 20px 60px rgba(16,24,32,.2)',
  },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#101820', marginBottom: 6 },
  input: {
    width: '100%', height: 44, borderRadius: 20, border: '1.5px solid #DDE3E8',
    padding: '0 14px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#101820',
    outline: 'none', boxSizing: 'border-box' as const, background: '#fff',
  },
  select: {
    width: '100%', height: 44, borderRadius: 20, border: '1.5px solid #DDE3E8',
    padding: '0 14px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#101820',
    outline: 'none', boxSizing: 'border-box' as const, background: '#fff',
  },
  textarea: {
    width: '100%', borderRadius: 20, border: '1.5px solid #DDE3E8',
    padding: '12px 14px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#101820',
    outline: 'none', boxSizing: 'border-box' as const, background: '#fff', resize: 'vertical' as const, minHeight: 80,
  },
  fieldGroup: { marginBottom: 16 },
  modalFooter: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 },
  saveBtn: {
    padding: '11px 24px', borderRadius: '22px 16px 22px 16px',
    background: '#0E8C8C', color: '#fff', border: 'none', cursor: 'pointer',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
  },
  cancelBtn: {
    padding: '11px 24px', borderRadius: '22px 16px 22px 16px',
    background: 'transparent', color: '#5D6B76', border: '1.5px solid #DDE3E8', cursor: 'pointer',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
  },
  deleteBtn: {
    padding: '6px 14px', borderRadius: 16, background: '#fee2e2', color: '#991b1b',
    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  editBtn: {
    padding: '6px 14px', borderRadius: 16, background: '#D9F1F0', color: '#086B6B',
    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  empty: {
    background: '#fff', border: '2px dashed #DDE3E8', borderRadius: 20, padding: '48px',
    textAlign: 'center' as const,
  },
};

// ── Featured Listings Tab ─────────────────────────────────────────────────────

const emptyFeaturedForm = {
  title: '', description: '', imageUrl: '', ctaText: 'Learn More',
  ctaUrl: '', startDate: '', endDate: '', active: true,
};

function FeaturedListingsTab() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyFeaturedForm });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    businessApi.getListings().then((res) => {
      const d = res.data as { listings: FeaturedListing[] };
      setListings(d.listings);
    }).catch(() => {/* silent */}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (key: string, val: unknown) => setForm((prev) => ({ ...prev, [key]: val }));

  const openAdd = () => { setForm({ ...emptyFeaturedForm }); setEditingId(null); setShowModal(true); };
  const openEdit = (l: FeaturedListing) => {
    setForm({
      title: l.title, description: l.description, imageUrl: l.imageUrl || '',
      ctaText: l.ctaText, ctaUrl: l.ctaUrl || '',
      startDate: l.startDate ? l.startDate.slice(0, 10) : '',
      endDate: l.endDate ? l.endDate.slice(0, 10) : '',
      active: l.active,
    });
    setEditingId(l.id);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        imageUrl: form.imageUrl || null,
        ctaUrl: form.ctaUrl || null,
      };
      if (editingId) await businessApi.updateListing(editingId, payload);
      else await businessApi.createListing(payload);
      setShowModal(false);
      load();
    } catch {/* silent */} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await businessApi.deleteListing(id).catch(() => {/* silent */});
    load();
  };

  return (
    <>
      <div style={s.header}>
        <div style={{ fontSize: 14, color: '#5D6B76' }}>{t('business.featuredListingsDesc')}</div>
        <button style={s.addBtn} onClick={openAdd}>{t('business.addListing')}</button>
      </div>

      {loading ? (
        <div style={{ color: '#5D6B76', fontSize: 15 }}>Loading…</div>
      ) : listings.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: '#101820', marginBottom: 8 }}>{t('business.noListings')}</div>
          <div style={{ color: '#5D6B76', fontSize: 14, marginBottom: 20 }}>{t('business.noListingsDesc')}</div>
          <button style={s.addBtn} onClick={openAdd}>{t('business.createFirstListing')}</button>
        </div>
      ) : (
        listings.map((l) => (
          <div key={l.id} style={s.listingCard}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={s.cardTitle}>{l.title}</div>
                <span style={{ ...s.badge, background: l.active ? '#D9F1F0' : '#F4F6F8', color: l.active ? '#086B6B' : '#5D6B76' }}>
                  {l.active ? t('business.active') : t('business.inactive')}
                </span>
              </div>
              <div style={s.cardDesc}>{l.description}</div>
              {l.ctaText && (
                <div style={{ fontSize: 12, color: '#0E8C8C', fontWeight: 600 }}>
                  CTA: {l.ctaText} {l.ctaUrl && `→ ${l.ctaUrl}`}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button style={s.editBtn} onClick={() => openEdit(l)}>Edit</button>
              <button style={s.deleteBtn} onClick={() => handleDelete(l.id)}>Delete</button>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modal}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 20, color: '#101820', marginBottom: 24 }}>
              {editingId ? 'Edit listing' : 'New listing'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Title *</label>
                <input type="text" required style={s.input} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Friday Night Special" />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Description *</label>
                <textarea required style={s.textarea} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What's the offer?" />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Image URL (optional)</label>
                <input type="url" style={s.input} value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>CTA text</label>
                  <input type="text" style={s.input} value={form.ctaText} onChange={(e) => set('ctaText', e.target.value)} />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>CTA URL</label>
                  <input type="url" style={s.input} value={form.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Start date</label>
                  <input type="date" style={s.input} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>End date</label>
                  <input type="date" style={s.input} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
                </div>
              </div>
              <div style={s.fieldGroup}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#101820' }}>
                  <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} style={{ accentColor: '#0E8C8C', width: 16, height: 16 }} />
                  Active (visible in suggestions)
                </label>
              </div>
              <div style={s.modalFooter}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={s.saveBtn} disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update listing' : 'Create listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Direct Listings Tab ───────────────────────────────────────────────────────

const emptyDirectForm = {
  title: '', description: '', category: 'experiences', address: '',
  imageUrl: '', eventDate: '', price: '', ticketUrl: '',
};

function DirectListingsTab() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<DirectListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyDirectForm });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    businessApi.getDirectListings().then((res) => {
      const d = res.data as { listings?: DirectListing[] } | DirectListing[];
      setListings(Array.isArray(d) ? d : (d.listings || []));
    }).catch(() => setListings([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const openAdd = () => { setForm({ ...emptyDirectForm }); setEditingId(null); setShowModal(true); };
  const openEdit = (l: DirectListing) => {
    setForm({
      title: l.title, description: l.description, category: l.category,
      address: l.address || '', imageUrl: l.imageUrl || '',
      eventDate: l.eventDate ? l.eventDate.slice(0, 16) : '',
      price: l.price || '', ticketUrl: l.ticketUrl || '',
    });
    setEditingId(l.id);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        eventDate: form.eventDate || null,
        imageUrl: form.imageUrl || null,
        address: form.address || null,
        price: form.price || null,
        ticketUrl: form.ticketUrl || null,
      };
      if (editingId) await businessApi.updateDirectListing(editingId, payload);
      else await businessApi.createDirectListing(payload);
      setShowModal(false);
      load();
    } catch {/* silent */} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await businessApi.deleteDirectListing(id).catch(() => {/* silent */});
    load();
  };

  const catLabel = (id: string) => DATE_CATEGORIES.find((c) => c.id === id)?.label || id;

  return (
    <>
      <div style={s.header}>
        <div style={{ fontSize: 14, color: '#5D6B76' }}>{t('business.directListingsDesc')}</div>
        <button style={s.addBtn} onClick={openAdd}>{t('business.addEvent')}</button>
      </div>

      {loading ? (
        <div style={{ color: '#5D6B76', fontSize: 15 }}>Loading…</div>
      ) : listings.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎟️</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: '#101820', marginBottom: 8 }}>{t('business.noDirectListings')}</div>
          <div style={{ color: '#5D6B76', fontSize: 14, marginBottom: 20 }}>{t('business.noDirectListingsDesc')}</div>
          <button style={s.addBtn} onClick={openAdd}>{t('business.addFirstEvent')}</button>
        </div>
      ) : (
        listings.map((l) => (
          <div key={l.id} style={s.listingCard}>
            {l.imageUrl && (
              <img src={l.imageUrl} alt={l.title} style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' as const }}>
                <div style={s.cardTitle}>{l.title}</div>
                <span style={{ ...s.badge, background: '#D9F1F0', color: '#086B6B' }}>{catLabel(l.category)}</span>
                {l.price && <span style={{ ...s.badge, background: '#EAF6D3', color: '#3A6B00' }}>{l.price}</span>}
              </div>
              <div style={s.cardDesc}>{l.description}</div>
              {l.eventDate && (
                <div style={{ fontSize: 12, color: '#0E8C8C', fontWeight: 600 }}>
                  📅 {new Date(l.eventDate).toLocaleString()}
                </div>
              )}
              {l.address && <div style={{ fontSize: 12, color: '#5D6B76', marginTop: 2 }}>📍 {l.address}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button style={s.editBtn} onClick={() => openEdit(l)}>Edit</button>
              <button style={s.deleteBtn} onClick={() => handleDelete(l.id)}>Delete</button>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modal}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 20, color: '#101820', marginBottom: 24 }}>
              {editingId ? 'Edit event / offering' : 'New event / offering'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Title *</label>
                <input type="text" required style={s.input} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Jazz Night at The Rooftop" />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Description *</label>
                <textarea required style={s.textarea} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is this event?" />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Category *</label>
                <select required style={s.select} value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {DATE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Address</label>
                <input type="text" style={s.input} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St, Denver, CO" />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Image URL</label>
                <input type="url" style={s.input} value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Event date & time</label>
                  <input type="datetime-local" style={s.input} value={form.eventDate} onChange={(e) => set('eventDate', e.target.value)} />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Price</label>
                  <input type="text" style={s.input} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="$25 or Free" />
                </div>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Ticket / Booking URL</label>
                <input type="url" style={s.input} value={form.ticketUrl} onChange={(e) => set('ticketUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div style={s.modalFooter}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={s.saveBtn} disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function BusinessListingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'featured' | 'direct'>('featured');

  return (
    <div>
      <h1 style={s.title}>{t('business.listingsTitle')}</h1>
      <p style={s.sub}>{t('business.listingsDesc')}</p>

      {/* Tabs */}
      <div style={s.tabRow}>
        <button
          style={{ ...s.tab, ...(activeTab === 'featured' ? s.tabActive : {}) }}
          onClick={() => setActiveTab('featured')}
        >
          {t('business.featuredListingsTab')}
        </button>
        <button
          style={{ ...s.tab, ...(activeTab === 'direct' ? s.tabActive : {}) }}
          onClick={() => setActiveTab('direct')}
        >
          {t('business.directListingsTab')}
        </button>
      </div>

      {activeTab === 'featured' ? <FeaturedListingsTab /> : <DirectListingsTab />}
    </div>
  );
}
