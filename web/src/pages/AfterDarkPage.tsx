/**
 * AfterDarkPage.tsx
 *
 * Dark, sensual, distinct from Discover.
 * Fetches 40 curated intimate activities (20 Romantic / 20 Spicy) and displays them
 * in a moody grid. Users can filter by tier and add items to a Plan.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { afterDarkApi, groupsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import { useAuthStore } from "../store/auth.store";
import type { AfterDarkItem } from "../types";
import type { Group } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function hoursUntil9pm(): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(21, 0, 0, 0);
  if (target <= now) return 0; // already past 9pm
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60));
}

// ── Group picker modal ────────────────────────────────────────────────────────

function GroupPickerModal({
  groups,
  onSelect,
  onClose,
  title,
}: {
  groups: Group[];
  onSelect: (groupId: string) => void;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1A0F1E",
          borderRadius: "24px",
          padding: "32px",
          maxWidth: 400,
          width: "100%",
          border: "1px solid #3D1A2A",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            color: "#F7E3E7",
            margin: "0 0 8px",
            fontSize: 20,
          }}
        >
          {title}
        </h3>
        <p style={{ color: "rgba(247,227,231,0.6)", fontSize: 14, margin: "0 0 20px" }}>
          Choose which group to add this to:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              style={{
                background: "rgba(178,72,94,0.15)",
                border: "1px solid #B2485E",
                borderRadius: 14,
                padding: "14px 18px",
                textAlign: "left",
                cursor: "pointer",
                color: "#F7E3E7",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(178,72,94,0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(178,72,94,0.15)")
              }
            >
              {g.name}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: "1px solid rgba(247,227,231,0.2)",
            borderRadius: 12,
            color: "rgba(247,227,231,0.5)",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Add Idea modal ────────────────────────────────────────────────────────────

function AddIdeaModal({
  groups,
  onClose,
  onSuccess,
}: {
  groups: Group[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"ROMANTIC" | "SPICY">("ROMANTIC");
  const [icon, setIcon] = useState("💡");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !groupId) {
      setError("Please fill in all fields and select a group.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await afterDarkApi.createIdea({ title: title.trim(), description: description.trim(), tier, icon, groupId });
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Failed to create idea");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(247,227,231,0.2)",
    borderRadius: 12,
    color: "#F7E3E7",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1A0F1E",
          borderRadius: "24px",
          padding: "32px",
          maxWidth: 440,
          width: "100%",
          border: "1px solid #3D1A2A",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            color: "#F7E3E7",
            margin: "0 0 20px",
            fontSize: 20,
          }}
        >
          ✨ Add your own idea
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            style={inputStyle}
            placeholder="Title (e.g. Midnight rooftop drinks)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
          />
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
            placeholder="Description — what makes it special?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="Icon emoji (e.g. 🍷)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={4}
          />
          {/* Tier toggle */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["ROMANTIC", "SPICY"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 12,
                  border: "1px solid",
                  borderColor: tier === t ? "#B2485E" : "rgba(247,227,231,0.2)",
                  background: tier === t ? "rgba(178,72,94,0.25)" : "transparent",
                  color: tier === t ? "#F7E3E7" : "rgba(247,227,231,0.5)",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {t === "ROMANTIC" ? "💫 Romantic" : "🔥 Spicy"}
              </button>
            ))}
          </div>
          {/* Group picker */}
          {groups.length > 1 && (
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id} style={{ background: "#1A0F1E" }}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          {error && (
            <p style={{ color: "#ff6b6b", fontSize: 13, margin: 0 }}>{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "14px",
              background: "#B2485E",
              border: "none",
              borderRadius: 14,
              color: "#fff",
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Adding…" : "Add idea"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "12px",
              background: "transparent",
              border: "1px solid rgba(247,227,231,0.2)",
              borderRadius: 12,
              color: "rgba(247,227,231,0.5)",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────────

function AfterDarkCard({
  item,
  onAddToPlan,
}: {
  item: AfterDarkItem;
  onAddToPlan: (item: AfterDarkItem) => void;
}) {
  const isSpicy = item.tier === "SPICY";

  // Determine text color based on bg darkness
  const isDarkBg = ["#2D1B2E", "#8E3448", "#4A1525", "#B2485E"].includes(item.color);
  const textColor = isDarkBg ? "#F7E3E7" : "#2D1020";
  const subTextColor = isDarkBg ? "rgba(247,227,231,0.7)" : "rgba(45,16,32,0.65)";
  const badgeBg = isDarkBg ? "rgba(255,255,255,0.12)" : "rgba(45,16,32,0.1)";

  return (
    <div
      style={{
        background: item.color,
        borderRadius: 22,
        padding: "24px 20px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        minHeight: 200,
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)";
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: 44, marginBottom: 12, lineHeight: 1 }}>{item.icon}</div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: textColor,
          margin: "0 0 8px",
          lineHeight: 1.3,
        }}
      >
        {item.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: subTextColor,
          margin: "0 0 16px",
          lineHeight: 1.5,
          flex: 1,
        }}
      >
        {item.description}
      </p>

      {/* Tier badge */}
      <div
        style={{
          position: "absolute",
          bottom: 58,
          left: 16,
          background: badgeBg,
          borderRadius: 100,
          padding: "3px 10px",
          fontSize: 11,
          fontWeight: 600,
          color: textColor,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {isSpicy ? "🔥 Spicy" : "💫 Romantic"}
      </div>

      {/* Add to Plan button */}
      <button
        onClick={() => onAddToPlan(item)}
        style={{
          width: "100%",
          padding: "10px 0",
          background: isDarkBg ? "rgba(255,255,255,0.15)" : "rgba(178,72,94,0.15)",
          border: isDarkBg ? "1px solid rgba(255,255,255,0.25)" : "1px solid #B2485E",
          borderRadius: 12,
          color: isDarkBg ? "#F7E3E7" : "#B2485E",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          marginTop: "auto",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = isDarkBg
            ? "rgba(255,255,255,0.25)"
            : "rgba(178,72,94,0.25)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = isDarkBg
            ? "rgba(255,255,255,0.15)"
            : "rgba(178,72,94,0.15)";
        }}
      >
        + Add to Plan
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AfterDarkPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [items, setItems] = useState<AfterDarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<"ALL" | "ROMANTIC" | "SPICY">("ALL");
  const [groups, setGroups] = useState<Group[]>([]);

  // Modal states
  const [pickerItem, setPickerItem] = useState<AfterDarkItem | null>(null);
  const [showAddIdeaModal, setShowAddIdeaModal] = useState(false);
  const [addIdeaSuccess, setAddIdeaSuccess] = useState(false);

  const hoursAway = hoursUntil9pm();

  useEffect(() => {
    if (!isAuthenticated) return;

    afterDarkApi
      .getItems({ limit: 100 })
      .then((res) => {
        setItems(res.data.items);
      })
      .catch((e: unknown) => {
        const err = e as { response?: { data?: { error?: string } } };
        setError(err?.response?.data?.error ?? "Failed to load ideas");
      })
      .finally(() => setLoading(false));

    groupsApi
      .list()
      .then((res) => {
        const gs: Group[] = Array.isArray(res.data) ? res.data : (res.data as { groups?: Group[] })?.groups ?? [];
        setGroups(gs);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const filteredItems =
    tierFilter === "ALL" ? items : items.filter((i) => i.tier === tierFilter);

  const handleAddToPlan = (item: AfterDarkItem) => {
    if (!isAuthenticated) {
      navigate("/signup");
      return;
    }
    if (groups.length === 0) {
      navigate("/groups");
      return;
    }
    if (groups.length === 1) {
      navigate(`/groups/${groups[0].id}/proposals/new`, {
        state: {
          prefillOption: {
            name: item.title,
            category: "After Dark",
            description: item.description,
          },
        },
      });
      return;
    }
    // Multiple groups — show picker
    setPickerItem(item);
  };

  const handleGroupSelected = (groupId: string) => {
    if (!pickerItem) return;
    setPickerItem(null);
    navigate(`/groups/${groupId}/proposals/new`, {
      state: {
        prefillOption: {
          name: pickerItem.title,
          category: "After Dark",
          description: pickerItem.description,
        },
      },
    });
  };

  // Page bg is dark
  const pageBg = "#0F0A14";

  return (
    <div style={{ minHeight: "100vh", background: pageBg, color: "#F7E3E7" }}>
      <AppNav />

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "32px 20px 80px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <h1
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(32px, 6vw, 52px)",
              color: "#B2485E",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            🌙 After Dark
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 17,
              color: "rgba(247,227,231,0.65)",
              margin: "8px 0 0",
            }}
          >
            For when the night gets interesting.
          </p>
        </div>

        {/* Time gate — informational only, content still shows */}
        {hoursAway > 0 && (
          <div
            style={{
              background: "rgba(178,72,94,0.12)",
              border: "1px solid rgba(178,72,94,0.3)",
              borderRadius: 18,
              padding: "14px 20px",
              textAlign: "center",
              marginBottom: 28,
              marginTop: 16,
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "rgba(247,227,231,0.7)",
              }}
            >
              After Dark wakes up at 9pm · {hoursAway}h away · Meanwhile, browse ideas below
            </span>
          </div>
        )}

        {/* Not logged in */}
        {!isAuthenticated && (
          <div
            style={{
              background: "rgba(178,72,94,0.12)",
              border: "1px solid rgba(178,72,94,0.3)",
              borderRadius: 18,
              padding: "20px 24px",
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            <p style={{ margin: "0 0 12px", color: "rgba(247,227,231,0.8)", fontSize: 15 }}>
              Sign in to add ideas to your plans
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "10px 22px",
                  background: "#B2485E",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Sign in
              </button>
              <button
                onClick={() => navigate("/signup")}
                style={{
                  padding: "10px 22px",
                  background: "transparent",
                  border: "1px solid rgba(247,227,231,0.3)",
                  borderRadius: 12,
                  color: "#F7E3E7",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Sign up free
              </button>
            </div>
          </div>
        )}

        {/* Tier toggle */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 32,
            marginTop: hoursAway > 0 ? 0 : 24,
          }}
        >
          {(["ALL", "ROMANTIC", "SPICY"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              style={{
                padding: "9px 20px",
                borderRadius: 100,
                border: "1px solid",
                borderColor: tierFilter === t ? "#B2485E" : "rgba(247,227,231,0.2)",
                background: tierFilter === t ? "#B2485E" : "transparent",
                color: tierFilter === t ? "#fff" : "rgba(247,227,231,0.6)",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {t === "ALL" ? "All" : t === "ROMANTIC" ? "💫 Romantic" : "🔥 Spicy"}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "rgba(247,227,231,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
              Loading ideas…
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <>
            <div
              className="after-dark-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 18,
              }}
            >
              {filteredItems.map((item) => (
                <AfterDarkCard
                  key={item.id}
                  item={item}
                  onAddToPlan={handleAddToPlan}
                />
              ))}

              {/* Add your own idea card */}
              {isAuthenticated && groups.length > 0 && (
                <div
                  onClick={() => setShowAddIdeaModal(true)}
                  style={{
                    background: "transparent",
                    border: "2px dashed rgba(178,72,94,0.4)",
                    borderRadius: 22,
                    padding: "32px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    cursor: "pointer",
                    minHeight: 200,
                    transition: "border-color 0.2s",
                    gap: 12,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(178,72,94,0.8)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(178,72,94,0.4)")
                  }
                >
                  <div style={{ fontSize: 36 }}>✨</div>
                  <p
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "rgba(247,227,231,0.7)",
                      margin: 0,
                    }}
                  >
                    + Add your own idea
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: "rgba(247,227,231,0.4)",
                      margin: 0,
                    }}
                  >
                    Something only your two know about
                  </p>
                </div>
              )}
            </div>

            {addIdeaSuccess && (
              <div
                style={{
                  marginTop: 24,
                  background: "rgba(178,72,94,0.15)",
                  border: "1px solid #B2485E",
                  borderRadius: 14,
                  padding: "14px 20px",
                  textAlign: "center",
                  color: "#F7E3E7",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                ✅ Idea added! Refresh to see it in your list.
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 640px) {
          .after-dark-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Group picker modal */}
      {pickerItem && (
        <GroupPickerModal
          groups={groups}
          title={`Add "${pickerItem.title}" to…`}
          onSelect={handleGroupSelected}
          onClose={() => setPickerItem(null)}
        />
      )}

      {/* Add idea modal */}
      {showAddIdeaModal && (
        <AddIdeaModal
          groups={groups}
          onClose={() => setShowAddIdeaModal(false)}
          onSuccess={() => {
            setShowAddIdeaModal(false);
            setAddIdeaSuccess(true);
            setTimeout(() => setAddIdeaSuccess(false), 5000);
          }}
        />
      )}
    </div>
  );
}

export default AfterDarkPage;
