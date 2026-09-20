import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { suggestionsApi, categoriesApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import type { Suggestion } from "../types";

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

export function SuggestionsPage() {
  const [categoryId, setCategoryId] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const { coords, geoError, geoLoading, retry: retryGeo } = useGeolocation();
  const [searchParams] = useSearchParams();
  const proposalContext = searchParams.get("proposalId");
  const proposalName = searchParams.get("proposalName");
  const addedCount = parseInt(searchParams.get("added") ?? "0", 10);
  const maxCount = parseInt(searchParams.get("max") ?? "5", 10);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoriesApi.list();
      return res.data;
    },
  });

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

  const filterCategories = [
    { id: "", name: "All" },
    ...(categories ?? []),
  ];

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

        {/* Filter chips row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
          {filterCategories.map((c) => (
            <button
              key={c.id}
              className={`dn-chip${categoryId === c.id ? " selected" : ""}`}
              onClick={() => {
                setCategoryId(c.id);
              }}
            >
              {c.name}
            </button>
          ))}

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

        {!isLoading && suggestions && suggestions.length === 0 && (
          <div data-testid="no-suggestions" style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🧭</div>
            <h2 style={{ marginBottom: 8 }}>Nothing here yet</h2>
            <p style={{ color: "var(--ink2)" }}>Try a different category or wider radius.</p>
          </div>
        )}

        {/* Suggestions 4-up grid */}
        {suggestions && suggestions.length > 0 && (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}
            data-testid="suggestions-list"
            className="suggestions-grid"
          >
            {suggestions.map((s: Suggestion, i: number) => (
              <div key={s.id} className={`dn-card${i % 2 === 1 ? " dn-card--alt1" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
                {/* Image slot */}
                <div
                  style={{
                    height: 140,
                    borderRadius: 16,
                    marginBottom: 14,
                    background: `repeating-linear-gradient(
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
                  }}
                >
                  🍽️
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
          }
          @media (max-width: 1024px) and (min-width: 769px) {
            .suggestions-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
