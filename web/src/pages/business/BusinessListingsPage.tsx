import { useState, useEffect } from 'react';
import { businessApi } from '../../api/client';

interface Listing {
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

const s: Record<string, React.CSSProperties> = {
  title: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 28, color: '#101820', marginBottom: 4 },
  sub: { color: '#5D6B76', fontSize: 15, marginBottom: 24 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 16 },
  addBtn: {
    padding: '11px 24px', borderRadius: '22px 16px 22px 16px',
    background: '#0E8C8C', color: '#fff', border: 'none', cursor: 'pointer',
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
  },
  listingCard: {
    background: '#fff', border: '1px solid #DDE3E8', borderRadius: 14, padding: '20px 24px',
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
    background: '#fff', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 520,
    maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 20px 60px rgba(16,24,32,.2)',
  },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#101820', marginBottom: 6 },
  input: {
    width: '100%', height: 44, borderRadius: 10, border: '1.5px solid #DDE3E8',
    padding: '0 14px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#101820',
    outline: 'none', boxSizing: 'border-box' as const, background: '#fff',
  },
  textarea: {
    width: '100%', borderRadius: 10, border: '1.5px solid #DDE3E8',
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
    padding: '6px 14px', borderRadius: 8, background: '#fee2e2', color: '#991b1b',
    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  editBtn: {
    padding: '6px 14px', borderRadius: 8, background: '#D9F1F0', color: '#086B6B',
    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  empty: {
    background: '#fff', border: '2px dashed #DDE3E8', borderRadius: 14, padding: '48px',
    textAlign: 'center' as const,
  },
};

const emptyForm = {
  title: '', description: '', imageUrl: '', ctaText: 'Learn More',
  ctaUrl: '', startDate: '', endDate: '', active: true,
};

export function BusinessListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    businessApi.getListings().then((res) => {
      const d = res.data as { listings: Listing[] };
      setListings(d.listings);
    }).catch(() => {/* silent */}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (key: string, val: unknown) => setForm((prev) => ({ ...prev, [key]: val }));

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (l: Listing) => {
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
      if (editingId) {
        await businessApi.updateListing(editingId, payload);
      } else {
        await businessApi.createListing(payload);
      }
      setShowModal(false);
      load();
    } catch {/* silent */} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await businessApi.deleteListing(id).catch(() => {/* silent */});
    load();
  };

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Listings</h1>
          <p style={s.sub}>Create featured offers, events, or promotions that appear in suggestions.</p>
        </div>
        <button style={s.addBtn} onClick={openAdd}>+ Add listing</button>
      </div>

      {loading ? (
        <div style={{ color: '#5D6B76', fontSize: 15 }}>Loading…</div>
      ) : listings.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: '#101820', marginBottom: 8 }}>
            No listings yet
          </div>
          <div style={{ color: '#5D6B76', fontSize: 14, marginBottom: 20 }}>
            Create your first featured listing to stand out in suggestions.
          </div>
          <button style={s.addBtn} onClick={openAdd}>Create first listing</button>
        </div>
      ) : (
        listings.map((l) => (
          <div key={l.id} style={s.listingCard}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={s.cardTitle}>{l.title}</div>
                <span style={{
                  ...s.badge,
                  background: l.active ? '#D9F1F0' : '#F4F6F8',
                  color: l.active ? '#086B6B' : '#5D6B76',
                }}>
                  {l.active ? 'Active' : 'Inactive'}
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

      {/* Modal */}
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
    </div>
  );
}
