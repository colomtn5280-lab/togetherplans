import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { suggestionsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import { CATEGORIES, findCategory } from "../constants/categories";
import { loadFavCategories, orderCategoriesByFavorites } from "../components/FavCategories";
import { usePlanBuilder } from "../contexts/PlanBuilderContext";
import { useAuthStore } from "../store/auth.store";
import type { Suggestion } from "../types";

// ── Category helpers ─────────────────────────────────────────────────────────
// Colors & emojis come from the shared category constants (keyed by id, with
// fallback matching on display name / legacy internal names).
function getCategoryEmoji(cat: string): string {
  return findCategory(cat)?.emoji ?? "📍";
}
function getCategoryColor(cat: string): string {
  return findCategory(cat)?.color ?? "#F0F0F0";
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
const GEO_STORAGE_KEY = "dn_last_location";

interface StoredLocation {
  lat: number;
  lng: number;
  city: string | null;
  source: "gps" | "ip";
  savedAt: number;
}

function loadStoredLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem(GEO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLocation;
    if (typeof parsed?.lat !== "number" || typeof parsed?.lng !== "number") return null;
    // Expire stored location after 30 days
    if (Date.now() - (parsed.savedAt ?? 0) > 30 * 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredLocation(loc: Omit<StoredLocation, "savedAt">) {
  try {
    localStorage.setItem(GEO_STORAGE_KEY, JSON.stringify({ ...loc, savedAt: Date.now() }));
  } catch {
    // storage unavailable — ignore
  }
}

function useGeolocation() {
  // Start from last known location so real listings load instantly
  const stored = loadStoredLocation();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    stored ? { lat: stored.lat, lng: stored.lng } : null,
  );
  const [cityName, setCityName] = useState<string | null>(stored?.city ?? null);
  const [geoSource, setGeoSource] = useState<"gps" | "ip" | null>(stored?.source ?? null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // IP-based fallback: approximate city-level location, no permission needed.
  // Ensures real API listings (Ticketmaster/Foursquare/etc.) ALWAYS load,
  // even when browser geolocation is denied or unavailable.
  const ipFallback = async () => {
    try {
      const resp = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(6000) });
      const data = await resp.json();
      const lat = Number(data?.latitude);
      const lng = Number(data?.longitude);
      if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
        const city = data?.city ?? null;
        setCoords({ lat, lng });
        setCityName(city);
        setGeoSource("ip");
        setGeoError(null);
        saveStoredLocation({ lat, lng, city, source: "ip" });
        return true;
      }
    } catch {
      // ipapi failed — try secondary provider
    }
    try {
      const resp = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(6000) });
      const data = await resp.json();
      const lat = Number(data?.latitude);
      const lng = Number(data?.longitude);
      if (data?.success !== false && !isNaN(lat) && !isNaN(lng)) {
        const city = data?.city ?? null;
        setCoords({ lat, lng });
        setCityName(city);
        setGeoSource("ip");
        setGeoError(null);
        saveStoredLocation({ lat, lng, city, source: "ip" });
        return true;
      }
    } catch {
      // both IP providers failed
    }
    return false;
  };

  const request = () => {
    if (!navigator.geolocation) {
      // No geolocation API at all — go straight to IP fallback
      setGeoLoading(true);
      ipFallback().finally(() => setGeoLoading(false));
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setGeoSource("gps");
        setGeoLoading(false);
        setGeoError(null);
        // Reverse geocode via Nominatim (free, no key)
        let city: string | null = null;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await resp.json();
          city =
            data?.address?.city ??
            data?.address?.town ??
            data?.address?.village ??
            data?.address?.county ??
            null;
          if (city) setCityName(city);
        } catch {
          // ignore geocode failure — just don't show city
        }
        saveStoredLocation({ lat, lng, city, source: "gps" });
      },
      async (err) => {
        // GPS denied/failed → IP fallback so real listings still load
        const ok = await ipFallback();
        if (!ok) setGeoError(err.message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  };

  useEffect(() => { request(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { coords, cityName, geoSource, geoError, geoLoading, retryGeo: request };
}

// ── Per-category curated Unsplash fallback photos ────────────────────────────
// Used when an API result has no imageUrl. Each URL is a specific high-quality
// photo that fits the category. Format: ?auto=format&fit=crop&w=600&h=400&q=80
const CATEGORY_FALLBACK_PHOTOS: Record<string, string[]> = {
  "Dining": [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Restaurants & Dining": [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Live Music": [
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Concerts": [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Comedy": [
    "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1595266753008-2e87e7f7c3b5?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1612539465862-0c0b1d1bcca5?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Movies": [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Theater & Plays": [
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Performing Arts": [
    "https://images.unsplash.com/photo-1574271143515-5cddf8da19be?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Wine & Drinks": [
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Outdoors": [
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Hiking Trails": [
    "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Hotel Stays": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Sports & Active": [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Local Experiences": [
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Local Experience": [
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Arts & Culture": [
    "https://images.unsplash.com/photo-1561839561-b13bcfe95249?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Wellness & Spa": [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Streaming Night": [
    "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Netflix Shows": [
    "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Volunteering": [
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Couples Events": [
    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Family Events": [
    "https://images.unsplash.com/photo-1516627145497-ae6968895b40?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1511895426328-dc8714191011?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Family": [
    "https://images.unsplash.com/photo-1516627145497-ae6968895b40?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1511895426328-dc8714191011?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Active": [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Sports": [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Couples": [
    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Day Trip": [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Hotels": [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Wellness": [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?auto=format&fit=crop&w=600&h=400&q=80",
  ],
  "Unique & Quirky": [
    "https://images.unsplash.com/photo-1533461502717-83546f485d24?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&h=400&q=80",
    "https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=600&h=400&q=80",
  ],
};

// Pick a fallback photo deterministically by name so the same venue always
// shows the same photo (no flicker on re-render).
function categoryFallbackPhoto(category: string, name: string): string | undefined {
  const pool = CATEGORY_FALLBACK_PHOTOS[category];
  if (!pool?.length) return undefined;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

// ── SuggestionImage — real image, curated fallback, or category emoji ─────────
function SuggestionImage({ src, category, name = "", height = 140, style = {} }: { src?: string; category: string; name?: string; height?: number; style?: React.CSSProperties }) {
  const [err, setErr] = useState(false);
  const [fallbackErr, setFallbackErr] = useState(false);
  const emoji = getCategoryEmoji(category);
  const bg = getCategoryColor(category);

  const fallback = categoryFallbackPhoto(category, name);

  // 1. Real API image
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

  // 2. Curated Unsplash fallback for this category
  if (fallback && !fallbackErr) {
    return (
      <img
        src={fallback}
        alt={category}
        style={{ width: "100%", height, objectFit: "cover", borderRadius: 16, display: "block", ...style }}
        onError={() => setFallbackErr(true)}
      />
    );
  }

  // 3. Last resort: emoji on category color
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
          <SuggestionImage src={suggestion.imageUrl} category={suggestion.category} name={suggestion.name} height={240} style={{ borderRadius: 0 }} />
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
  const radius = parseInt(searchParams.get("radius") ?? "25", 10) || 25;
  const dateFilter = (searchParams.get("dateFilter") ?? "anytime") as
    | "tonight"
    | "this-weekend"
    | "this-week"
    | "anytime";
  const zip = searchParams.get("zip") ?? "";
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { coords, cityName, geoError, geoLoading, retryGeo } = useGeolocation();
  const { options: planOptions, addOption } = usePlanBuilder();

  // Favorite categories (localStorage) — grid shows favourites first
  const [favIds] = useState<string[]>(() => loadFavCategories());
  const orderedCategories = useMemo(() => orderCategoriesByFavorites(favIds), [favIds]);

  const [detailSuggestion, setDetailSuggestion] = useState<Suggestion | null>(null);
  const [zipDraft, setZipDraft] = useState("");
  const [zipInputOpen, setZipInputOpen] = useState(false);
  const [overrideZipDraft, setOverrideZipDraft] = useState("");

  // zip= present in the URL means "search that area" — it wins over geolocation
  const zipActive = zip.length === 5;

  const setRadius = (r: number) => {
    setSearchParams((p) => {
      if (r === 25) p.delete("radius");
      else p.set("radius", String(r));
      return p;
    });
  };

  const applyZipOverride = () => {
    if (overrideZipDraft.length !== 5) return;
    setSearchParams((p) => { p.set("zip", overrideZipDraft); return p; });
    setZipInputOpen(false);
    setOverrideZipDraft("");
  };

  const clearZipOverride = () => {
    setSearchParams((p) => { p.delete("zip"); return p; });
    setZipInputOpen(false);
  };

  const setDateFilter = (df: string) => {
    setSearchParams((p) => {
      if (df === "anytime") p.delete("dateFilter");
      else p.set("dateFilter", df);
      return p;
    });
  };

  const activateTonight = () => {
    setSearchParams((p) => {
      p.set("dateFilter", "tonight");
      p.delete("category"); // Tonight starts from All categories
      return p;
    });
    if (!coords && !zip) retryGeo(); // (re)request geolocation
    // Scroll to results once the state settles
    setTimeout(() => {
      document.getElementById("discover-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const clearTonight = () => setDateFilter("anytime");

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "suggestions",
      {
        categoryId,
        radius,
        lat: zipActive ? undefined : coords?.lat,
        lng: zipActive ? undefined : coords?.lng,
        dateFilter,
        zip: zipActive ? zip : undefined,
      },
    ],
    queryFn: () =>
      suggestionsApi.list({
        category: categoryId || undefined,
        radius,
        lat: zipActive ? undefined : coords?.lat,
        lng: zipActive ? undefined : coords?.lng,
        zip: zipActive ? zip : undefined,
        dateFilter: dateFilter !== "anytime" ? dateFilter : undefined,
      }),
    enabled: true,
  });

  const raw = data?.data as unknown;
  // Accept both response shapes: a bare array, or { results, ideas }.
  const all: Suggestion[] = Array.isArray(raw)
    ? raw
    : [
        ...(((raw as any)?.results ?? []) as Suggestion[]),
        ...((((raw as any)?.ideas ?? []) as Suggestion[]).map((s) => ({ ...s, isIdea: true }))),
      ];

  const displayed = !categoryId
    ? all
    : all.filter((s: Suggestion) => {
        const cat = CATEGORIES.find((c) => c.id === categoryId);
        if (!cat) return true;
        return s.category === cat.name || (cat as any).matches?.includes(s.category);
      });

  // Split honest real listings from seed-catalog idea prompts.
  // isIdea may be absent on old cached responses — treat absent as a real result.
  const realResults = displayed.filter((s: Suggestion) => s.isIdea !== true);
  const ideas = displayed.filter((s: Suggestion) => s.isIdea === true);

  // ── Empty-tonight fallback: quietly fetch this weekend instead ──────────────
  const tonightIsEmpty =
    dateFilter === "tonight" && !isLoading && !isError && realResults.length === 0;

  const { data: weekendData, isLoading: weekendLoading } = useQuery({
    queryKey: [
      "suggestions",
      {
        categoryId,
        radius,
        lat: zipActive ? undefined : coords?.lat,
        lng: zipActive ? undefined : coords?.lng,
        dateFilter: "this-weekend",
        zip: zipActive ? zip : undefined,
      },
    ],
    queryFn: () =>
      suggestionsApi.list({
        category: categoryId || undefined,
        radius,
        lat: zipActive ? undefined : coords?.lat,
        lng: zipActive ? undefined : coords?.lng,
        zip: zipActive ? zip : undefined,
        dateFilter: "this-weekend",
      }),
    enabled: tonightIsEmpty,
  });

  const weekendRaw = weekendData?.data as unknown;
  const weekendAll: Suggestion[] = Array.isArray(weekendRaw)
    ? weekendRaw
    : [
        ...(((weekendRaw as any)?.results ?? []) as Suggestion[]),
        ...((((weekendRaw as any)?.ideas ?? []) as Suggestion[]).map((s) => ({ ...s, isIdea: true }))),
      ];
  const weekendResults = weekendAll.filter((s) => s.isIdea !== true);

  const tonightActive = dateFilter === "tonight";
  const showWeekendFallback = tonightIsEmpty && weekendResults.length > 0;
  // What actually renders in the main grid
  const gridResults = showWeekendFallback ? weekendResults : realResults;

  // Added key set
  const addedKeys = new Set(planOptions.map((o) => o.name + (o.address ?? "")));

  const locationLabel = zipActive
    ? `📍 Showing ${zip}`
    : geoLoading
    ? "📍 Getting location…"
    : cityName
    ? `📍 Near ${cityName}`
    : coords
    ? "📍 Near you"
    : geoError
    ? "📍 Location unavailable — enter a zip below for local results"
    : null;

  return (
    <>
      <AppNav />
      <main style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Guest banner */}
        {!isAuthenticated && (
          <div style={{
            background: "var(--primary-soft)",
            borderRadius: 20,
            padding: "12px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}>
            <span style={{ fontSize: 14, color: "var(--primary)", fontWeight: 500 }}>
              You're browsing as a guest · Sign up free to save plans and vote with your partner
            </span>
            <a href="/signup" style={{
              background: "var(--primary)",
              color: "var(--on-primary)",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}>
              Sign up free →
            </a>
          </div>
        )}
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, marginBottom: 6 }}>
            Discover
          </h1>
          {(locationLabel || zipActive) && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} data-testid="location-row">
              {locationLabel && (
                <p style={{ color: "var(--ink2)", fontSize: 14, margin: 0 }}>{locationLabel}</p>
              )}
              {zipActive ? (
                <button
                  onClick={clearZipOverride}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  back to my location ×
                </button>
              ) : !zipInputOpen ? (
                <button
                  onClick={() => setZipInputOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  Change location
                </button>
              ) : null}
            </div>
          )}
          {zipInputOpen && !zipActive && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }} data-testid="zip-override">
              <span style={{ fontSize: 13, color: "var(--ink2)" }}>
                Planning a getaway? Search another area:
              </span>
              <input
                value={overrideZipDraft}
                onChange={(e) => setOverrideZipDraft(e.target.value.replace(/\D/g, "").slice(0, 5))}
                onKeyDown={(e) => { if (e.key === "Enter") applyZipOverride(); }}
                placeholder="5-digit zip"
                inputMode="numeric"
                autoFocus
                style={{
                  width: 90,
                  padding: "6px 10px",
                  borderRadius: 20,
                  border: "1.5px solid var(--line)",
                  fontSize: 14,
                }}
              />
              <button
                className="dn-btn dn-btn--sm dn-btn--primary"
                disabled={overrideZipDraft.length !== 5}
                onClick={applyZipOverride}
              >
                Go
              </button>
              <button
                className="dn-btn dn-btn--sm dn-btn--tonal"
                onClick={() => { setZipInputOpen(false); setOverrideZipDraft(""); }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* 🌙 Tonight near me — hero shortcut */}
        {!tonightActive ? (
          <button
            onClick={activateTonight}
            style={{
              width: "100%",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(100deg, #0E8C8C 0%, #0A6B72 55%, #123A4A 100%)",
              color: "#fff",
              borderRadius: 20,
              padding: "18px 22px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              textAlign: "left",
              boxShadow: "0 6px 18px rgba(14,140,140,0.25)",
            }}
            data-testid="tonight-banner"
          >
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>🌙</span>
              <span>
                <span style={{ display: "block", fontFamily: "'Sora', system-ui, sans-serif", fontWeight: 800, fontSize: 18 }}>
                  Tonight near me
                </span>
                <span style={{ display: "block", fontSize: 13, opacity: 0.85 }}>
                  Events happening today, close by
                </span>
              </span>
            </span>
            <span style={{ fontSize: 20, opacity: 0.9 }}>→</span>
          </button>
        ) : (
          <div
            style={{
              width: "100%",
              background: "linear-gradient(100deg, #0E8C8C 0%, #0A6B72 55%, #123A4A 100%)",
              color: "#fff",
              borderRadius: 20,
              padding: "14px 22px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              boxShadow: "0 6px 18px rgba(14,140,140,0.25)",
            }}
            data-testid="tonight-banner-active"
          >
            <span style={{ fontFamily: "'Sora', system-ui, sans-serif", fontWeight: 700, fontSize: 15 }}>
              🌙 {zipActive ? `Showing tonight in ${zip}` : cityName ? `Showing tonight in ${cityName}` : "Showing tonight near you"}
            </span>
            <button
              onClick={clearTonight}
              style={{
                background: "rgba(255,255,255,0.16)",
                border: "none",
                color: "#fff",
                borderRadius: 16,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              clear ×
            </button>
          </div>
        )}

        {/* Zip fallback when geolocation is denied */}
        {tonightActive && geoError && !coords && !zip && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--ink2)" }}>
              Location blocked — enter a zip instead:
            </span>
            <input
              value={zipDraft}
              onChange={(e) => setZipDraft(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="e.g. 80202"
              inputMode="numeric"
              style={{
                width: 90,
                padding: "6px 10px",
                borderRadius: 20,
                border: "1.5px solid var(--line)",
                fontSize: 14,
              }}
            />
            <button
              className="dn-btn dn-btn--sm dn-btn--primary"
              disabled={zipDraft.length !== 5}
              onClick={() => setSearchParams((p) => { p.set("zip", zipDraft); return p; })}
            >
              Go
            </button>
          </div>
        )}

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
          {orderedCategories.map((cat) => {
            const isFav = favIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                className={`dn-btn dn-btn--sm ${categoryId === cat.id ? "dn-btn--primary" : "dn-btn--tonal"}`}
                onClick={() =>
                  setSearchParams((p) => { p.set("category", cat.id); return p; })
                }
                style={isFav && categoryId !== cat.id ? { boxShadow: "inset 0 0 0 1.5px var(--primary)" } : undefined}
                title={isFav ? "One of your favourites" : undefined}
              >
                {cat.emoji} {cat.name}{isFav ? " ★" : ""}
              </button>
            );
          })}
        </div>

        {/* Date-filter chips */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }} data-testid="date-chips">
          {([
            ["tonight", "🌙 Tonight"],
            ["this-weekend", "This weekend"],
            ["this-week", "This week"],
            ["anytime", "Anytime"],
          ] as const).map(([df, label]) => (
            <button
              key={df}
              className={`dn-btn dn-btn--sm ${dateFilter === df ? "dn-btn--primary" : "dn-btn--tonal"}`}
              onClick={() => setDateFilter(df)}
            >
              {label}
            </button>
          ))}
          {dateFilter === "tonight" && (
            <span style={{ fontSize: 12, color: "var(--ink2)", alignSelf: "center" }}>
              Only events dated today
            </span>
          )}
        </div>

        {/* Radius chips — search area for day trips & getaways */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }} data-testid="radius-chips">
          <span style={{ fontSize: 12, color: "var(--ink2)", fontWeight: 600 }}>Search area</span>
          {([
            [10, "Nearby · 10mi"],
            [25, "25mi"],
            [60, "60mi"],
            [150, "Day trip · 150mi"],
          ] as const).map(([r, label]) => (
            <button
              key={r}
              className={`dn-btn dn-btn--sm ${radius === r ? "dn-btn--primary" : "dn-btn--tonal"}`}
              onClick={() => setRadius(r)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {geoError && !zipActive && (
            <button className="dn-btn dn-btn--sm dn-btn--tonal" onClick={retryGeo}>
              Retry location
            </button>
          )}
        </div>

        {/* Day-trip copy nuance */}
        {radius === 150 && !isLoading && !isError && (
          <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 16, fontWeight: 600 }} data-testid="daytrip-header">
            Showing results within 150 mi — worth the drive 🚗
          </p>
        )}

        {/* Loading / error states */}
        <div id="discover-results" />
        {(isLoading || (tonightIsEmpty && weekendLoading)) && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink2)" }}>
            Loading…
          </div>
        )}
        {isError && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--error)" }}>
            Failed to load suggestions.
          </div>
        )}

        {/* Warm weekend fallback banner when tonight came up empty */}
        {showWeekendFallback && (
          <div
            style={{
              background: "var(--primary-soft)",
              borderRadius: 16,
              padding: "14px 18px",
              marginBottom: 20,
              fontSize: 14,
              color: "var(--primary)",
              fontWeight: 600,
            }}
            data-testid="tonight-fallback"
          >
            🌙 Quiet night out there — here's this weekend instead
          </div>
        )}

        {!isLoading && !isError && !weekendLoading && displayed.length === 0 && !showWeekendFallback && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink2)" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🧭</div>
            <h2 style={{ marginBottom: 8 }}>Nothing here yet</h2>
            <p style={{ color: "var(--ink2)" }}>Try a different category or wider radius.</p>
          </div>
        )}

        {/* Suggestions 4-up grid — real listings only */}
        {gridResults.length > 0 && !isLoading && (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}
            data-testid="suggestions-list"
            className="suggestions-grid"
          >
            {gridResults.map((s: Suggestion, i: number) => {
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
                    <SuggestionImage src={s.imageUrl} category={s.category} name={s.name} height={140} />
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
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate("/signup");
                        return;
                      }
                      setDetailSuggestion(s);
                    }}
                  >
                    {added ? "✓ In Plan" : isAuthenticated ? "+ Add to Plan" : "Sign up to save your plan →"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Ideas section — seed-catalog prompts, honestly framed */}
        {ideas.length > 0 && (
          <div style={{ marginTop: realResults.length > 0 ? 40 : 8 }} data-testid="ideas-section">
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
              Ideas to spark the plan ✨
            </h2>
            <p style={{ color: "var(--ink2)", fontSize: 14, marginBottom: 18 }}>
              No live listings for this filter yet — here are some starters.
            </p>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}
              className="suggestions-grid"
            >
              {ideas.map((s: Suggestion) => {
                const key = s.name + (s.address ?? "");
                const added = addedKeys.has(key);
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      border: "2px dashed var(--line)",
                      background: `${getCategoryColor(s.category)}55`,
                      borderRadius: 20,
                      padding: "24px 18px 18px",
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 10 }}>
                      {getCategoryEmoji(s.category)}
                    </div>
                    <h3 style={{ fontSize: 15, marginBottom: 6 }}>{s.name}</h3>
                    {s.description && (
                      <p style={{ color: "var(--ink2)", fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                        {s.description}
                      </p>
                    )}
                    <button
                      className={`dn-btn dn-btn--sm ${added ? "dn-btn--tonal" : "dn-btn--secondary"}`}
                      style={{ marginTop: "auto", width: "100%" }}
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate("/signup");
                          return;
                        }
                        if (added) return;
                        addOption({
                          name: s.name,
                          category: s.category,
                          address: s.address,
                          description: s.shortDescription || s.description,
                          imageUrl: s.imageUrl,
                          sourceUrl: s.sourceUrl,
                          eventDate: s.eventDate || s.date,
                          rating: s.rating,
                          priceLevel: s.priceLevel,
                          sourceName: s.sourceName || s.source,
                        });
                      }}
                    >
                      {added ? "✓ In Plan" : isAuthenticated ? "+ Add to Plan" : "Sign up to save your plan →"}
                    </button>
                  </div>
                );
              })}
            </div>
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
