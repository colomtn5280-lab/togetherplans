import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { suggestionsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import { CATEGORIES } from "../constants/categories";
import { usePlanBuilder } from "../contexts/PlanBuilderContext";
import type { Suggestion } from "../types";

// ── Category helpers ─────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "Restaurants & Dining": "#FDEBD0",
  "Live Music & Concerts": "#EBD5FB",
  "Comedy Shows": "#FEF9C3",
  "Movies & Theater": "#D5E8FD",
  "Art & Museums": "#FCE4EC",
  "Outdoor Adventures": "#D4EDDA",
  "Sports & Active": "#FFE0B2",
  "Nightlife & Bars": "#E8D5F5",
  "Wellness & Spa": "#D0F4F1",
  "Cooking & Classes": "#FFF3CD",
  Custom: "#F0F0F0",
};
const CATEGORY_EMOJIS: Record<string, string> = {
  "Restaurants & Dining": "🍽️",
  "Live Music & Concerts": "🎵",
  "Comedy Shows": "😂",
  "Movies & Theater": "🎬",
  "Art & Museums": "🎨",
  "Outdoor Adventures": "🏔️",
  "Sports & Active": "🏃",
  "Nightlife & Bars": "🍸",
  "Wellness & Spa": "💆",
  "Cooking & Classes": "🍳",
};

function getCategoryEmoji(cat: string): string {
  return CATEGORY_EMOJIS[cat] ?? "📍";
}
function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "#F0F0F0";
}

function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
      " · " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return dateStr;
  }
}

// ── Geolocation + reverse geocode ────────────────────────────────────────────
function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const request = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setGeoLoading(false);
        setGeoError(null);
        // Reverse geocode via Nominatim (free, no key)
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await resp.json();
          const city =
            data?.address?.city ??
            data?.address?.town ??
            data?.address?.village ??
            data?.address?.county ??
            null;
          if (city) setCityName(city);
        } catch {
          // ignore geocode failure — just don't show city
        }
      },
      (err) => {
        setGeoError(err.message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  };

  useEffect(() => { request(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { coords, cityName, geoError, geoLoading, retryGeo: request };
}

// ── SuggestionImage — real image or category emoji fallback ───────────────────
function SuggestionImage({ src, category, height = 140, style = {} }: { src?: string; category: string; height?: number; style?: React.CSSProperties }) {
  const [err, setErr] = useState(false);
  const emoji = getCategoryEmoji(category);
  const bg = getCategoryColor(category);

  if (src && !err) {
    return (
      <img
        src={src}
        alt=""
        style={{ width: "100%", height, objectFit: "cover", borderRadius: 16, display: "block", ...style }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      style={{
        height,
        borderRadius: 16,
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 48,
        ...style,
      }}
    >
      {emoji}
    </div>
  );
}

// ── Event Detail Modal ────────────────────────────────────────────────────────
function EventDetailModal({
  suggestion,
  onClose,
  onAdd,
  alreadyAdded,
}: {
  suggestion: Suggestion;
  onClose: () => void;
  onAdd: () => void;
  alreadyAdded: boolean;
}) {
  const priceStr = suggestion.priceLevel ? "$".repeat(suggestion.priceLevel) : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: 16,
      }}
    >
      <div
        className="dn-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 24,
          padding: 0,
        }}
      >
        {/* Image */}
        <div style={{ borderRadius: "24px 24px 0 0", overflow: "hidden", position: "relative" }}>
          <SuggestionImage src={suggestion.imageUrl} category={suggestion.category} height={240} style={{ borderRadius: 0 }} />
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(0,0,0,0.45)",
              border: "none",
              borderRadius: "50%",
              width: 34,
              height: 34,
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Category sticker */}
          <span className="dn-sticker" style={{ marginBottom: 12, display: "inline-block" }}>
            {suggestion.category}
          </span>

          <h2 style={{ fontSize: 22, marginBottom: 12, marginTop: 8 }}>{suggestion.name}</h2>

          {suggestion.address && (
            <p style={{ color: "var(--ink2)", fontSize: 14, marginBottom: 8 }}>
              📍 {suggestion.address}
            </p>
          )}

          {suggestion.date && (
            <p style={{ color: "var(--ink2)", fontSize: 14, marginBottom: 8 }}>
              📅 {formatEventDate(suggestion.date)}
            </p>
          )}

          {(suggestion.rating != null || priceStr || suggestion.distanceMiles != null) && (
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              {suggestion.rating != null && (
                <span className="dn-sticker dn-sticker--lime" style={{ fontSize: 13 }}>
                  ★ {suggestion.rating.toFixed(1)}
                </span>
              )}
              {priceStr && (
                <span className="dn-sticker" style={{ fontSize: 13 }}>{priceStr}</span>
              )}
              {suggestion.distanceMiles != null && (
                <span style={{ fontSize: 13, color: "var(--ink2)" }}>
                  {suggestion.distanceMiles.toFixed(1)} mi
                </span>
              )}
            </div>
          )}

          {suggestion.description && (
            <p style={{ color: "var(--ink2)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              {suggestion.description}
            </p>
          )}

          {suggestion.sourceUrl && (
            <a
              href={suggestion.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--primary)", fontSize: 14, display: "block", marginBottom: 16 }}
            >
              View on {suggestion.sourceName ?? "Source"} →
            </a>
          )}

          {alreadyAdded ? (
            <div
              style={{
                background: "var(--lime-soft)",
                borderRadius: 20,
                padding: "12px",
                textAlign: "center",
                color: "var(--lime)",
                fontWeight: 700,
              }}
            >
              ✓ Added to plan
            </div>
          ) : (
            <button
              className="dn-btn dn-btn--primary"
              style={{ width: "100%" }}
              onClick={() => { onAdd(); onClose(); }}
            >
              Add to Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function SuggestionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get("category") ?? "";
  const radiusKm = parseInt(searchParams.get("radius") ?? "25", 10);

  const { coords, cityName, geoError, geoLoading, retryGeo } = useGeolocation();
  const { options: planOptions, addOption } = usePlanBuilder();
  const [detailSuggestion, setDetailSuggestion] = useState<Suggestion | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["suggestions", { categoryId, radiusKm, lat: coords?.lat, lng: coords?.lng }],
    queryFn: () =>
      suggestionsApi.list({
        category: categoryId || undefined,
        radiusKm,
        lat: coords?.lat,
        lng: coords?.lng,
      }),
    enabled: true,
  });

  const all: Suggestion[] = Array.isArray(data?.data) ? data.data : (data?.data as any)?.results ?? [];

  const displayed = !categoryId
    ? all
    : all.filter((s: Suggestion) => {
        const cat = CATEGORIES.find((c) => c.id === categoryId);
        if (!cat) return true;
        return s.category === cat.name || (cat as any).matches?.includes(s.category);
      });

  // Added key set
  const addedKeys = new Set(planOptions.map((o) => o.name + (o.address ?? "")));

  const locationLabel = geoLoading
    ? "📍 Getting location…"
    : cityName
    ? `📍 Near ${cityName}`
    : geoError
    ? "📍 Location unavailable"
    : null;

  return (
    <>
      <AppNav />
      <main style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, marginBottom: 6 }}>
            Discover
          </h1>
          {locationLabel && (
            <p style={{ color: "var(--ink2)", fontSize: 14, margin: 0 }}>{locationLabel}</p>
          )}
        </div>

        {/* Category grid */}
        <div
          className="category-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}
        >
          <button
            className={`dn-btn dn-btn--sm ${!categoryId ? "dn-btn--primary" : "dn-btn--tonal"}`}
            onClick={() => setSearchParams((p) => { p.delete("category"); return p; })}
          >
            All categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`dn-btn dn-btn--sm ${categoryId === cat.id ? "dn-btn--primary" : "dn-btn--tonal"}`}
              onClick={() =>
                setSearchParams((p) => { p.set("category", cat.id); return p; })
              }
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {geoError && (
            <button className="dn-btn dn-btn--sm dn-btn--tonal" onClick={retryGeo}>
              Retry location
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <span style={{ fontSize: 12, color: "var(--ink2)" }}>Radius</span>
            <input
              type="range"
              min={5}
              max={80}
              value={radiusKm}
              onChange={(e) =>
                setSearchParams((p) => { p.set("radius", e.target.value); return p; })
              }
              style={{ width: 80 }}
            />
            <span style={{ fontSize: 12, color: "var(--ink2)", minWidth: 40 }}>{radiusKm} km</span>
          </div>
        </div>

        {/* Loading / error states */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink2)" }}>
            Loading…
          </div>
        )}
        {isError && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--error)" }}>
            Failed to load suggestions.
          </div>
        )}
        {!isLoading && !isError && displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink2)" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🧭</div>
            <h2 style={{ marginBottom: 8 }}>Nothing here yet</h2>
            <p style={{ color: "var(--ink2)" }}>Try a different category or wider radius.</p>
          </div>
        )}

        {/* Suggestions 4-up grid */}
        {displayed.length > 0 && (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}
            data-testid="suggestions-list"
            className="suggestions-grid"
          >
            {displayed.map((s: Suggestion, i: number) => {
              const key = s.name + (s.address ?? "");
              const added = addedKeys.has(key);
              const priceStr = s.priceLevel ? "$".repeat(s.priceLevel) : null;
              const hasDate = !!s.date;

              return (
                <div
                  key={s.id}
                  className={`dn-card${i % 2 === 1 ? " dn-card--alt1" : ""}`}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  {/* Image slot */}
                  <div style={{ marginBottom: 14 }}>
                    <SuggestionImage src={s.imageUrl} category={s.category} height={140} />
                  </div>

                  {/* Category sticker */}
                  <span className="dn-sticker dn-sticker--lime" style={{ marginBottom: 10, alignSelf: "flex-start" }}>
                    {s.category ?? "Activity"}
                  </span>

                  <h3 style={{ fontSize: 15, marginBottom: 4 }}>{s.name}</h3>

                  {hasDate ? (
                    <p style={{ color: "var(--ink2)", fontSize: 12, marginBottom: 6 }}>
                      📅 {formatEventDate(s.date!)}
                    </p>
                  ) : s.address ? (
                    <p style={{ color: "var(--ink2)", fontSize: 12, marginBottom: 6 }}>📍 {s.address}</p>
                  ) : null}

                  {(s.rating != null || priceStr || s.distanceMiles != null) && (
                    <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      {s.rating != null && (
                        <span style={{ fontSize: 12, color: "var(--ink2)" }}>
                          ★ {s.rating.toFixed(1)}
                        </span>
                      )}
                      {priceStr && (
                        <span style={{ fontSize: 12, color: "var(--ink2)" }}>{priceStr}</span>
                      )}
                      {s.distanceMiles != null && (
                        <span style={{ fontSize: 12, color: "var(--ink2)" }}>
                          {s.distanceMiles.toFixed(1)} mi
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    className={`dn-btn dn-btn--sm ${added ? "dn-btn--tonal" : "dn-btn--primary"}`}
                    style={{ marginTop: "auto", width: "100%" }}
                    onClick={() => { setDetailSuggestion(s); }}
                  >
                    {added ? "✓ In Plan" : "+ Add to Plan"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .suggestions-grid { grid-template-columns: 1fr !important; }
            .category-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 1024px) and (min-width: 769px) {
            .suggestions-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .category-grid { grid-template-columns: repeat(3, 1fr) !important; }
          }
        `}</style>
      </main>

      {/* Event detail modal */}
      {detailSuggestion && (
        <EventDetailModal
          suggestion={detailSuggestion}
          onClose={() => setDetailSuggestion(null)}
          alreadyAdded={addedKeys.has(detailSuggestion.name + (detailSuggestion.address ?? ""))}
          onAdd={() => {
            addOption({
              name: detailSuggestion.name,
              category: detailSuggestion.category,
              address: detailSuggestion.address,
              description: detailSuggestion.description,
              imageUrl: detailSuggestion.imageUrl,
              sourceUrl: detailSuggestion.sourceUrl,
              eventDate: detailSuggestion.date,
              rating: detailSuggestion.rating,
              priceLevel: detailSuggestion.priceLevel,
              sourceName: detailSuggestion.sourceName,
            });
            setDetailSuggestion(null);
          }}
        />
      )}
    </>
  );
}
