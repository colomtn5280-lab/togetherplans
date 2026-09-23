/**
 * PlanBuilderDock — fixed bottom-right button that opens a slide-up panel
 * showing current plan options with remove buttons and a Finalize link.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanBuilder } from "../contexts/PlanBuilderContext";
import type { PlanBuilderOption } from "../types";

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

function OptionCard({ opt, onRemove }: { opt: PlanBuilderOption; onRemove: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const bg = CATEGORY_COLORS[opt.category] ?? "#F0F0F0";
  const emoji = CATEGORY_EMOJIS[opt.category] ?? "📍";
  const priceStr = opt.priceLevel ? "$".repeat(opt.priceLevel) : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      {/* Thumbnail */}
      {opt.imageUrl && !imgErr ? (
        <img
          src={opt.imageUrl}
          alt={opt.name}
          style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
          onError={() => setImgErr(true)}
        />
      ) : (
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 8,
            backgroundColor: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {emoji}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {opt.name}
        </div>
        {opt.address && (
          <div style={{ fontSize: 12, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {opt.address}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--ink2)", marginTop: 2 }}>
          {opt.rating != null && <span>★ {opt.rating.toFixed(1)}</span>}
          {priceStr && <span>{priceStr}</span>}
        </div>
      </div>

      <button
        onClick={onRemove}
        style={{
          background: "var(--line)",
          border: "none",
          borderRadius: "50%",
          width: 26,
          height: 26,
          cursor: "pointer",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

export function PlanBuilderDock() {
  const { options, removeOption } = usePlanBuilder();
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);

  if (options.length === 0) return null;

  return (
    <>
      {/* Dock button */}
      <button
        onClick={() => setPanelOpen(true)}
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 400,
          background: "var(--primary)",
          color: "#fff",
          border: "none",
          borderRadius: 24,
          padding: "12px 20px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(14,140,140,0.4)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-display)",
        }}
      >
        🗓 Plan ({options.length})
      </button>

      {/* Slide-up panel backdrop */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 500,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomRightRadius: 0,
              width: "100%",
              maxWidth: 480,
              maxHeight: "80vh",
              padding: "28px 24px 40px",
              boxShadow: "var(--shadow-dock)",
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 20, fontFamily: "var(--font-display)" }}>
                Your Plan
              </h3>
              <span style={{ color: "var(--ink2)", fontSize: 14 }}>
                {options.length} / 5
              </span>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {options.map((opt) => (
                <OptionCard key={opt.id} opt={opt} onRemove={() => removeOption(opt.id)} />
              ))}
            </div>

            <button
              className="dn-btn dn-btn--primary"
              style={{ width: "100%", marginTop: 20 }}
              onClick={() => {
                setPanelOpen(false);
                navigate("/proposals/new", { state: { options } });
              }}
            >
              Finalize →
            </button>

            <button
              style={{
                background: "none",
                border: "none",
                color: "var(--ink2)",
                cursor: "pointer",
                marginTop: 12,
                fontSize: 14,
              }}
              onClick={() => setPanelOpen(false)}
            >
              Keep browsing
            </button>
          </div>
        </div>
      )}
    </>
  );
}
