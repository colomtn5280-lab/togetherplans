/**
 * Favorite categories — localStorage-only personalization (key: tp.favCategories).
 * Picked during onboarding ("What are you two into?") and editable from Settings.
 * Discover orders the category grid favorites-first (in picked order).
 *
 * NOTE: no backend persistence yet — cross-device sync is a follow-up.
 */
import { CATEGORIES, type Category } from "../constants/categories";

export const FAV_CATEGORIES_KEY = "tp.favCategories";
export const MAX_FAVORITES = 5;

export function loadFavCategories(): string[] {
  try {
    const raw = localStorage.getItem(FAV_CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function saveFavCategories(ids: string[]) {
  try {
    localStorage.setItem(FAV_CATEGORIES_KEY, JSON.stringify(ids.slice(0, MAX_FAVORITES)));
  } catch {
    // storage unavailable — personalization silently off
  }
}

/** Favorites first (in picked order), then the rest in constant order. */
export function orderCategoriesByFavorites(favIds: string[]): Category[] {
  if (favIds.length === 0) return CATEGORIES;
  const favs = favIds
    .map((id) => CATEGORIES.find((c) => c.id === id))
    .filter((c): c is Category => !!c);
  const rest = CATEGORIES.filter((c) => !favIds.includes(c.id));
  return [...favs, ...rest];
}

/**
 * The 15 category chips (emoji + name), teal selected state, pick up to 5.
 * Fully controlled; minimum 0 — skipping is always fine.
 */
export function FavCategoryChips({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < MAX_FAVORITES) {
      onChange([...selected, id]);
    }
  };

  const full = selected.length >= MAX_FAVORITES;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat.id);
          const disabled = !isSelected && full;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              disabled={disabled}
              aria-pressed={isSelected}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 13px",
                borderRadius: 999,
                border: `1.5px solid ${isSelected ? "var(--primary, #0E8C8C)" : "var(--line, #ddd)"}`,
                background: isSelected ? "var(--primary, #0E8C8C)" : "var(--surface, #fff)",
                color: isSelected ? "var(--on-primary, #fff)" : "var(--ink, #222)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 13,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.45 : 1,
                transition: "all 0.15s ease",
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: "var(--ink2)", textAlign: "center", marginTop: 12, marginBottom: 0 }}>
        {selected.length === 0
          ? `Pick up to ${MAX_FAVORITES} — or skip, no pressure`
          : `${selected.length} of ${MAX_FAVORITES} picked${full ? " — that's the max!" : ""}`}
      </p>
    </div>
  );
}
