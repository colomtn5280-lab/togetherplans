import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { suggestionsApi, groupsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import { CATEGORIES } from "../constants/categories";
import type { Suggestion, Group } from "../types";

function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const request = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  };

  useEffect(() => { request(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { coords, geoError, geoLoading, retry: request };
}

// ── Add-to-Group Modal ────────────────────────────────────────────────────────

function AddToGroupModal({
  suggestion,
  onClose,
}: {
  suggestion: Suggestion;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    groupsApi.list()
      .then((res) => setGroups(res.data))
      .catch(() => setError("Failed to load groups"))
      .finally(() => setLoading(false));
  }, []);

  const handleGroupSelect = (group: Group) => {
    navigate(`/groups/${group.id}/proposals/new`, {
      state: { suggestion },
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        className="dn-card"
        style={{
          width: "100%", maxWidth: 520,
          borderRadius: "32px 32px 0 0",
          padding: "36px 28px 48px",
          boxShadow: "var(--shadow-dock)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 6, fontSize: 20 }}>Add to group</h2>
        <p style={{ color: "var(--ink2)", marginBottom: 24, fontSize: 14 }}>
          Adding: <strong style={{ color: "var(--primary)" }}>{suggestion.name}</strong>
        </p>

        {loading && (
          <p style={{ color: "var(--ink2)", textAlign: "center", padding: "24px 0" }}>Loading groups…</p>
        )}
        {error && (
          <p role="alert" style={{ color: "var(--error)", textAlign: "center" }}>{error}</p>
        )}
        {!loading && !error && groups.length === 0 && (
          <p style={{ color: "var(--ink2)", textAlign: "center", padding: "24px 0" }}>
            No groups yet. <Link to="/groups" onClick={onClose}>Create one first.</Link>
          </p>
        )}
        {!loading && groups.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groups.map((g) => (
              <button
                key={g.id}
                className="dn-btn dn-btn--secondary"
                style={{ textAlign: "left", justifyContent: "flex-start", padding: "12px 18px" }}
                onClick={() => handleGroupSelect(g)}
              >
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{g.name}</span>
              </button>
            ))}
          </div>
        )}

        <button
          className="dn-btn dn-btn--secondary"
          style={{ marginTop: 20, width: "100%" }}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function SuggestionsPage() {
  const [categoryId, setCategoryId] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const { coords, geoError, geoLoading, retry: retryGeo } = useGeolocation();
  const [searchParams] = useSearchParams();
  const proposalContext = searchParams.get("proposalId");
  const proposalName = searchParams.get("proposalName");
  const addedCount = parseInt(searchParams.get("added") ?? "0", 10);
  const maxCount = parseInt(searchParams.get("max") ?? "5", 10);

  const [addingSuggestion, setAddingSuggestion] = useState<Suggestion | null>(null);

  const activeCategory = CATEGORIES.find((c) => c.id === categoryId);

  const {
    data: suggestions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["suggestions", { categoryId, radiusKm, lat: coords?.lat, lng: coords?.lng }],
    queryFn: async () => {
      const res = await suggestionsApi.list({
        categoryId: categoryId || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm,
        limit: 12,
      });
      return res.data;
    },
  });

  // Client-side guard: match new display names AND legacy internal categories
  const displayed = !activeCategory
    ? suggestions
    : suggestions?.filter(
        (s) =>
          !s.category ||
          s.category === activeCategory.name ||
          activeCategory.matches.includes(s.category),
      );

  return (
    <>
      <AppNav />
      <main style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "32px var(--gutter)" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 8 }}>Discover</h1>
          <p style={{ color: "var(--ink2)" }}>Find the perfect activity for your next date night.</p>
        </div>

        {/* Context pill */}
        {proposalContext && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "var(--primary-soft)",
              borderRadius: 20,
              padding: "8px 14px",
              marginBottom: 20,
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--primary)" }}>
              Adding to: {proposalName ?? "proposal"} · {addedCount}/{maxCount}
            </span>
            <Link to="/suggestions" style={{ color: "var(--ink2)", fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Change
            </Link>
          </div>
        )}

        {/* Category grid */}
        <div className="category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
          {CATEGORIES.map((c) => {
            const selected = categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryId(selected ? "" : c.id)}
                aria-pressed={selected}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "14px 8px",
                  borderRadius: 16,
                  cursor: "pointer",
                  border: `1.5px solid ${selected ? "var(--primary)" : "var(--line)"}`,
                  background: selected ? "var(--primary)" : "var(--surface)",
                  color: selected ? "#fff" : "var(--ink)",
                  transition: "all .15s ease",
                }}
              >
                <span style={{ fontSize: 24 }}>{c.emoji}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, lineHeight: 1.2, textAlign: "center" }}>
                  {c.name}
                </span>
                <span style={{ fontSize: 10, color: selected ? "rgba(255,255,255,.85)" : "var(--ink2)", textAlign: "center" }}>
                  {c.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {/* Location + radius row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
          <button
            className={`dn-chip${categoryId === "" ? " selected" : ""}`}
            onClick={() => setCategoryId("")}
          >
            All categories
          </button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--ink2)" }}>
              {geoLoading && "📍 Getting location…"}
              {coords && `📍 ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`}
              {geoError && "📍 Location unavailable"}
            </span>
            {geoError && (
              <button className="dn-btn dn-btn--sm dn-btn--tonal" onClick={retryGeo}>
                Retry
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--ink2)" }}>Radius</span>
              <input
                type="number"
                min={1}
                max={100}
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value, 10) || 10)}
                className="dn-input"
                style={{ width: 72, height: 38, fontSize: 13 }}
              />
              <span style={{ fontSize: 12, color: "var(--ink2)" }}>km</span>
            </div>
            <button className="dn-btn dn-btn--sm dn-btn--tonal" onClick={() => refetch()}>
              Refresh
            </button>
          </div>
        </div>

        {/* Loading / error states */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "var(--ink2)" }}>Finding activities near you…</p>
          </div>
        )}

        {isError && (
          <p role="alert" style={{ color: "var(--error)", marginBottom: 20 }}>Failed to load suggestions.</p>
        )}

        {!isLoading && displayed && displayed.length === 0 && (
          <div data-testid="no-suggestions" style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🧭</div>
            <h2 style={{ marginBottom: 8 }}>Nothing here yet</h2>
            <p style={{ color: "var(--ink2)" }}>Try a different category or wider radius.</p>
          </div>
        )}

        {/* Suggestions 4-up grid */}
        {displayed && displayed.length > 0 && (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}
            data-testid="suggestions-list"
            className="suggestions-grid"
          >
            {displayed.map((s: Suggestion, i: number) => (
              <div key={s.id} className={`dn-card${i % 2 === 1 ? " dn-card--alt1" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
                {/* Image slot */}
                <div
                  style={{
                    height: 140,
                    borderRadius: 16,
                    marginBottom: 14,
                    background: s.imageUrl ? "var(--bg)" : `repeating-linear-gradient(
                      45deg,
                      var(--bg),
                      var(--bg) 8px,
                      var(--line) 8px,
                      var(--line) 16px
                    )`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ink2)",
                    fontSize: 32,
                    overflow: "hidden",
                  }}
                >
                  {s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      alt={s.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.style.background = `repeating-linear-gradient(
                            45deg,
                            var(--bg),
                            var(--bg) 8px,
                            var(--line) 8px,
                            var(--line) 16px
                          )`;
                          parent.textContent = "🍽️";
                        }
                      }}
                    />
                  ) : (
                    "🍽️"
                  )}
                </div>

                {/* Category sticker */}
                <span className="dn-sticker dn-sticker--lime" style={{ marginBottom: 10, alignSelf: "flex-start" }}>
                  {s.category ?? "Activity"}
                </span>

                <h3 style={{ fontSize: 15, marginBottom: 4 }}>{s.name}</h3>

                {s.address && (
                  <p style={{ color: "var(--ink2)", fontSize: 12, marginBottom: 8 }}>📍 {s.address}</p>
                )}

                {(s.rating || s.priceLevel) && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    {s.rating && <span style={{ fontSize: 12, color: "var(--ink2)" }}>★ {s.rating}</span>}
                    {s.priceLevel && <span style={{ fontSize: 12, color: "var(--ink2)" }}>{"$".repeat(s.priceLevel)}</span>}
                    {s.distance && <span style={{ fontSize: 12, color: "var(--ink2)" }}>{s.distance.toFixed(1)} km</span>}
                  </div>
                )}

                <button
                  className="dn-btn dn-btn--sm dn-btn--tonal"
                  style={{ marginTop: "auto", width: "100%" }}
                  onClick={() => setAddingSuggestion(s)}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .suggestions-grid {
              grid-template-columns: 1fr !important;
            }
            .category-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 1024px) and (min-width: 769px) {
            .suggestions-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .category-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
        `}</style>
      </main>

      {/* Add to group modal */}
      {addingSuggestion && (
        <AddToGroupModal
          suggestion={addingSuggestion}
          onClose={() => setAddingSuggestion(null)}
        />
      )}
    </>
  );
}
