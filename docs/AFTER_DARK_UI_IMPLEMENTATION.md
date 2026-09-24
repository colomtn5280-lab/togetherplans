# After Dark — Web/Mobile UI Implementation

**Status:** Backend wiring complete (commit 265e8ee)  
**Effort:** 3–4 hours for full UI  
**Priority:** Medium (core After Dark feature, shipping in v1.2.0)

---

## Architecture

```
Discover page
  ↓
Category chips: "Wine & Drinks", "Dining", "Live Music", "After Dark" (🌙)
  ↓
User clicks "After Dark"
  ↓
AfterDarkPage.tsx
  ├── Tier filter buttons: All / Romantic / Spicy
  ├── Item grid (20/page, paginated)
  │   └── AfterDarkItemCard.tsx (emoji, name, desc, tier badge, Home/Out)
  └── "+" button → CreateIdeaModal.tsx
         └── Form: name, description, tier, where
         └── POST /api/after-dark/ideas
```

---

## Web UI Components

### 1. Discover Page Integration

**File:** `web/src/pages/DiscoverPage.tsx`

Add After Dark category chip to the category list:

```tsx
const DISCOVER_CATEGORIES = [
  { id: 'wine-drinks', name: 'Wine & Drinks', emoji: '🍷' },
  { id: 'dining', name: 'Dining', emoji: '🍽️' },
  { id: 'live-music', name: 'Live Music', emoji: '🎵' },
  // ... other categories
  {
    id: 'after-dark',
    name: 'After Dark',
    emoji: '🌙',
    color: '#B2485E',  // wine accent
  },
];

// When user selects After Dark:
const handleCategorySelect = (categoryId: string) => {
  if (categoryId === 'after-dark') {
    navigate('/after-dark');
  } else {
    // Handle normal category
  }
};
```

### 2. After Dark Browse Page

**File:** `web/src/pages/AfterDarkPage.tsx`

```tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AfterDarkItemCard from '../components/AfterDarkItemCard';
import CreateIdeaModal from '../components/CreateIdeaModal';

type AfterDarkTier = 'ROMANTIC' | 'SPICY';

export const AfterDarkPage: React.FC = () => {
  const [tier, setTier] = useState<AfterDarkTier | undefined>();
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch items from API
  const { data, isLoading } = useQuery({
    queryKey: ['after-dark-items', tier, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(tier && { tier }),
      });
      const res = await fetch(`/api/after-dark/items?${params}`);
      return res.json();
    },
  });

  return (
    <div style={{ padding: '1rem', background: '#FFF8F5' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>🌙 After Dark</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.5rem 1rem',
            background: '#B2485E',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + Add idea
        </button>
      </div>

      {/* Tier filter pills */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        {['All', 'Romantic', 'Spicy'].map((label) => (
          <button
            key={label}
            onClick={() => {
              setTier(label === 'All' ? undefined : (label.toUpperCase() as AfterDarkTier));
              setPage(1);
            }}
            style={{
              padding: '0.5rem 1rem',
              background:
                (label === 'All' && !tier) ||
                (label === 'Romantic' && tier === 'ROMANTIC') ||
                (label === 'Spicy' && tier === 'SPICY')
                  ? '#B2485E'
                  : '#F7E3E7',
              color:
                (label === 'All' && !tier) ||
                (label === 'Romantic' && tier === 'ROMANTIC') ||
                (label === 'Spicy' && tier === 'SPICY')
                  ? '#FFFFFF'
                  : '#B2485E',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {data?.items?.map((item: any) => (
              <AfterDarkItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {data?.page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!data?.hasMore}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Create idea modal */}
      {showCreateModal && (
        <CreateIdeaModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            // Refetch items
          }}
        />
      )}
    </div>
  );
};
```

### 3. Item Card Component

**File:** `web/src/components/AfterDarkItemCard.tsx`

```tsx
import React from 'react';

interface AfterDarkItemCardProps {
  item: {
    id: string;
    emoji: string;
    name: string;
    description: string;
    tier: 'ROMANTIC' | 'SPICY';
    where: 'HOME' | 'OUT';
    duration: string;
  };
}

export const AfterDarkItemCard: React.FC<AfterDarkItemCardProps> = ({ item }) => {
  return (
    <div
      style={{
        padding: '1rem',
        background: '#FFFFFF',
        border: '1px solid #E8D4D9',
        borderRadius: '8px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(178, 72, 94, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Emoji */}
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {item.emoji}
      </div>

      {/* Name */}
      <h3 style={{ marginBottom: '0.25rem', fontSize: '0.95rem', fontWeight: 600 }}>
        {item.name}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '0.8rem',
          color: '#666',
          marginBottom: '0.5rem',
          lineHeight: '1.3',
        }}
      >
        {item.description}
      </p>

      {/* Tier badge + metadata */}
      <div style={{ display: 'flex', gap: '0.25rem', fontSize: '0.75rem', justifyContent: 'center' }}>
        <span
          style={{
            background: item.tier === 'ROMANTIC' ? '#FFB3C6' : '#FF9D60',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            color: '#FFFFFF',
            fontWeight: 500,
          }}
        >
          {item.tier === 'ROMANTIC' ? '💕 Romantic' : '🔥 Spicy'}
        </span>
        <span style={{ color: '#999' }}>
          {item.where === 'HOME' ? '🏠' : '🚗'} {item.duration}
        </span>
      </div>

      {/* Add to proposal button */}
      <button
        onClick={() => {
          // TODO: Add to proposal flow
          console.log('Add to proposal:', item.id);
        }}
        style={{
          marginTop: '0.75rem',
          width: '100%',
          padding: '0.5rem',
          background: '#B2485E',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 500,
        }}
      >
        + Propose
      </button>
    </div>
  );
};
```

### 4. Create Idea Modal

**File:** `web/src/components/CreateIdeaModal.tsx`

```tsx
import React, { useState } from 'react';

interface CreateIdeaModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const CreateIdeaModal: React.FC<CreateIdeaModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState<'ROMANTIC' | 'SPICY'>('ROMANTIC');
  const [where, setWhere] = useState<'HOME' | 'OUT'>('HOME');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/after-dark/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: 'TODO: get from context', // Get from GroupContext
          name,
          description,
          tier,
          where,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create idea');
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Add Your Idea</h2>

        {error && (
          <div style={{ color: '#C33C54', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Activity name (max 40 chars)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="e.g., Moonlit hike"
              maxLength={40}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #DDD',
                borderRadius: '4px',
              }}
            />
            <small style={{ color: '#999' }}>
              {name.length}/40
            </small>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Description (max 140 chars)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 140))}
              placeholder="What makes it special?"
              maxLength={140}
              required
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #DDD',
                borderRadius: '4px',
                fontFamily: 'inherit',
              }}
            />
            <small style={{ color: '#999' }}>
              {description.length}/140
            </small>
          </div>

          {/* Tier */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Mood
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ROMANTIC', 'SPICY'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t as 'ROMANTIC' | 'SPICY')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: tier === t ? '#B2485E' : '#F7E3E7',
                    color: tier === t ? '#FFFFFF' : '#B2485E',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {t === 'ROMANTIC' ? '💕 Romantic' : '🔥 Spicy'}
                </button>
              ))}
            </div>
          </div>

          {/* Where */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Location
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['HOME', 'OUT'].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWhere(w as 'HOME' | 'OUT')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: where === w ? '#B2485E' : '#F7E3E7',
                    color: where === w ? '#FFFFFF' : '#B2485E',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {w === 'HOME' ? '🏠 Home' : '🚗 Out'}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: '#EEE',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name || !description}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: loading ? '#CCC' : '#B2485E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              {loading ? 'Creating...' : 'Add Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## Styling Notes

- **Background:** Soft beige `#F7E3E7` for After Dark section
- **Accent:** Wine `#B2485E` for buttons, borders, active states
- **Deep:** `#8E3448` for dark mode accents
- **Text on accent:** `#FFFFFF` for contrast
- **Card borders:** Soft `#E8D4D9`
- **Hover effect:** Slight lift + wine shadow

---

## Mobile (React Native) Integration

**Components to create:**
1. `AfterDarkNavigator` — Stack navigator for After Dark flow
2. `AfterDarkListScreen` — Browse + filter (FlatList pagination)
3. `AfterDarkItemCard` — Touch-optimized card with "Propose" CTA
4. `CreateIdeaScreen` — Form with text inputs + segmented controls

Platform-specific:
- Wine color: Both platforms
- Bottom sheet modals (create idea) on mobile
- Keyboard-aware layout on mobile

---

## Remaining Integration Points

### 1. Discover Category List
- Add After Dark chip to category tabs
- Show wine color accent

### 2. Proposal Creation
- When After Dark item is tapped, add to proposal items array
- Mix with normal categories (no special handling)

### 3. Routing
- Add route: `/after-dark` (web)
- Add route: `AfterDarkNavigator` (mobile)

### 4. Context/State
- Get `groupId` from GroupContext
- Use for creating custom ideas + filtering

---

## Effort Breakdown

| Component | Time | Priority |
|-----------|------|----------|
| Discover integration | 30 min | High |
| AfterDarkPage | 60 min | High |
| AfterDarkItemCard | 30 min | High |
| CreateIdeaModal | 60 min | High |
| Mobile screens | 90 min | Medium (can defer to v1.2.1) |
| Styling + polish | 30 min | Low |
| **Total** | **4–5 hours** | — |

---

## Shipping Recommendation

✅ **Ship web UI in v1.2.0**  
⏳ **Defer mobile UI to v1.2.1** (web covers ~70% of user base for web app)

This unblocks web app users while iOS/Android review progresses.
