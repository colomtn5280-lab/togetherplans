import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { suggestionsApi, categoriesApi } from "../api/client";
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

  // Request on mount
  useEffect(() => { request(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { coords, geoError, geoLoading, retry: request };
}

export function SuggestionsPage() {
  const [categoryId, setCategoryId] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const { coords, geoError, geoLoading, retry: retryGeo } = useGeolocation();
  const [randomized, setRandomized] = useState<Suggestion | null>(null);

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
        limit: 5,
      });
      return res.data;
    },
  });

  const handleRandomize = () => {
    if (!suggestions || suggestions.length === 0) return;
    const idx = Math.floor(Math.random() * suggestions.length);
    setRandomized(suggestions[idx]);
  };

  const handleRefresh = () => {
    setRandomized(null);
    refetch();
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <nav style={{ marginBottom: 24 }}>
        <Link to="/dashboard">← Dashboard</Link>
      </nav>

      <h1>Browse activities</h1>

      {/* Geolocation status */}
      <div style={{ marginBottom: 12, fontSize: "0.9em", color: "#666" }}>
        {geoLoading && <span>📍 Getting your location…</span>}
        {coords && (
          <span>
            📍 Location: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
          </span>
        )}
        {geoError && (
          <span>
            📍 Location unavailable ({geoError}){" "}
            <button onClick={retryGeo} style={{ fontSize: "0.85em" }}>
              Retry
            </button>
          </span>
        )}
      </div>

      {/* Filters */}
      <section
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div>
          <label htmlFor="cat-filter">Category</label>
          <br />
          <select
            id="cat-filter"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setRandomized(null);
            }}
          >
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="radius-filter">Radius (km)</label>
          <br />
          <input
            id="radius-filter"
            type="number"
            min={1}
            max={100}
            value={radiusKm}
            onChange={(e) => {
              setRadiusKm(parseInt(e.target.value, 10) || 10);
              setRandomized(null);
            }}
            style={{ width: 80 }}
          />
        </div>

        <button onClick={handleRefresh}>Refresh</button>

        <button
          onClick={handleRandomize}
          disabled={!suggestions || suggestions.length === 0}
          style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 6, padding: "8px 16px" }}
        >
          🎲 Randomize
        </button>
      </section>

      {/* Randomized pick */}
      {randomized && (
        <section
          data-testid="random-pick"
          style={{
            border: "2px solid #7c3aed",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            background: "#faf5ff",
          }}
        >
          <h2>🎲 Tonight&apos;s pick</h2>
          <h3>{randomized.name}</h3>
          {randomized.description && <p>{randomized.description}</p>}
          {randomized.address && (
            <p style={{ color: "#666" }}>{randomized.address}</p>
          )}
          {randomized.rating && (
            <p>
              ★ {randomized.rating}{" "}
              {randomized.priceLevel &&
                "•  " + "$".repeat(randomized.priceLevel)}
            </p>
          )}
        </section>
      )}

      {/* Suggestions list — spec: 3-5 */}
      {isLoading && <p>Loading suggestions…</p>}
      {isError && <p role="alert">Failed to load suggestions.</p>}

      {!isLoading && suggestions && suggestions.length === 0 && (
        <p data-testid="no-suggestions">
          No suggestions found. Try a different category or wider radius.
        </p>
      )}

      {suggestions && suggestions.length > 0 && (
        <ul
          data-testid="suggestions-list"
          style={{ listStyle: "none", padding: 0 }}
        >
          {suggestions.map((s) => (
            <li
              key={s.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                background:
                  randomized?.id === s.id ? "#faf5ff" : "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <strong style={{ fontSize: "1.1em" }}>{s.name}</strong>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: "0.8em",
                      background: "#eee",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {s.category}
                  </span>
                  {s.description && (
                    <p style={{ margin: "4px 0", color: "#555" }}>
                      {s.description}
                    </p>
                  )}
                  {s.address && (
                    <p style={{ margin: "4px 0", color: "#888", fontSize: "0.9em" }}>
                      📍 {s.address}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  {s.rating && <div>★ {s.rating}</div>}
                  {s.priceLevel && <div>{"$".repeat(s.priceLevel)}</div>}
                  {s.distance && (
                    <div style={{ color: "#888", fontSize: "0.85em" }}>
                      {s.distance.toFixed(1)} km
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
