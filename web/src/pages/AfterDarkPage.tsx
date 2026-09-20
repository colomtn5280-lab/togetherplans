import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppNav } from "../components/AppNav";
import { afterDarkApi } from "../api/client";
import type { AfterDarkStatus, AfterDarkSuggestion, AfterDarkMood } from "../types";

// ── Constants ─────────────────────────────────────────────────────────────────

const MOODS: { key: AfterDarkMood; emoji: string; label: string; tagline: string }[] = [
  { key: "adventurous", emoji: "🧗", label: "Adventurous", tagline: "Surprise us" },
  { key: "romantic",    emoji: "💫", label: "Romantic",    tagline: "Just the two of us" },
  { key: "social",      emoji: "🥂", label: "Social",      tagline: "Good vibes & people" },
  { key: "chill",       emoji: "🌙", label: "Chill",       tagline: "Low-key night" },
  { key: "spontaneous", emoji: "⚡", label: "Spontaneous", tagline: "Whatever, let's go" },
  { key: "cultural",    emoji: "🎨", label: "Cultural",    tagline: "Art, music, scene" },
];

const CATEGORY_EMOJI: Record<string, string> = {
  "Live Music":       "🎵",
  Comedy:             "😂",
  "Wine & Drinks":    "🍷",
  Dining:             "🍽️",
  "Unique & Quirky":  "✨",
  "Local Experience": "📍",
  "Arts & Culture":   "🎨",
};

// ── Countdown ─────────────────────────────────────────────────────────────────

function Countdown({ minutes }: { minutes: number }) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (
    <div style={{ textAlign: "center", padding: "48px 32px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🌆</div>
      <h2 style={{ marginBottom: 8 }}>After Dark in {h > 0 ? `${h}h ${m}m` : `${m}m`}</h2>
      <p style={{ color: "var(--ink2)" }}>Come back at 9 PM for late-night mode.</p>
    </div>
  );
}

// ── Mood chip ─────────────────────────────────────────────────────────────────

function MoodChip({
  mood,
  isSelected,
  isSaving,
  onClick,
}: {
  mood: typeof MOODS[number];
  isSelected: boolean;
  isSaving: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 18px",
        borderRadius: 20,
        border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--line)"}`,
        background: isSelected ? "var(--primary-soft)" : "var(--surface)",
        cursor: "pointer",
        minWidth: 100,
        gap: 4,
        transition: "all 0.15s ease",
        transform: isSelected ? "scale(1.04)" : "scale(1)",
        boxShadow: isSelected ? "var(--shadow-card)" : "none",
      }}
    >
      <span style={{ fontSize: 24 }}>{mood.emoji}</span>
      <span style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 13,
        color: isSelected ? "var(--primary)" : "var(--ink)",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}>
        {isSelected && !isSaving && <span style={{ fontSize: 11 }}>✓</span>}
        {mood.label}
      </span>
      <span style={{ fontSize: 11, color: isSelected ? "var(--primary)" : "var(--ink2)" }}>
        {isSaving && isSelected ? "Saving…" : mood.tagline}
      </span>
    </button>
  );
}

// ── Suggestion card ───────────────────────────────────────────────────────────

function SuggestionCard({
  item,
  index,
  groupId,
  onImpulse,
}: {
  item: AfterDarkSuggestion;
  index: number;
  groupId: string | undefined;
  onImpulse: (item: AfterDarkSuggestion) => void;
}) {
  const emoji = CATEGORY_EMOJI[item.category] ?? "🌙";
  const cardClass = ["dn-card", index % 2 === 1 ? "dn-card--alt1" : "", index % 3 === 2 ? "dn-card--alt2" : ""].filter(Boolean).join(" ");

  return (
    <div className={cardClass} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 22,
          background: "var(--primary-soft)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0,
        }}>
          {emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
            {item.name}
          </div>
          {item.venue && <div style={{ fontSize: 13, color: "var(--ink2)" }}>{item.venue}</div>}
        </div>
        {/* Cost sticker */}
        <span className={`dn-sticker ${item.costTier === "free" ? "" : "dn-sticker--lime"}`} style={{ fontSize: 11, flexShrink: 0 }}>
          {item.costTier === "free" ? "FREE" : (item.price ?? item.costTier)}
        </span>
      </div>

      {/* Description */}
      {item.shortDescription && (
        <p style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.5, margin: 0 }}>
          {item.shortDescription}
        </p>
      )}

      {/* Meta pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {item.address && (
          <span style={{ fontSize: 12, color: "var(--primary)", background: "var(--primary-soft)", padding: "3px 10px", borderRadius: 999 }}>
            📍 {item.address}
          </span>
        )}
        {item.distanceMiles !== undefined && (
          <span style={{ fontSize: 12, color: "var(--primary)", background: "var(--primary-soft)", padding: "3px 10px", borderRadius: 999 }}>
            {item.distanceMiles.toFixed(1)} mi
          </span>
        )}
        {item.timeStart && (
          <span style={{ fontSize: 12, color: "var(--on-warning-soft)", background: "var(--warning-soft)", padding: "3px 10px", borderRadius: 999 }}>
            🕐 {item.timeStart}
          </span>
        )}
      </div>

      {/* CTA row */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {groupId ? (
          <button
            className="dn-btn dn-btn--sm"
            onClick={() => onImpulse(item)}
            style={{ flex: 1 }}
          >
            ⚡ Let's go here
          </button>
        ) : (
          <span style={{ fontSize: 12, color: "var(--ink2)", fontStyle: "italic" }}>
            Open from a group to create an impulse plan
          </span>
        )}
        {item.ticketUrl && (
          <a
            href={item.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dn-btn dn-btn--sm dn-btn--secondary"
          >
            🎟 Tickets
          </a>
        )}
      </div>
    </div>
  );
}

// ── Impulse modal ─────────────────────────────────────────────────────────────

function ImpulseModal({
  item,
  groupId,
  onClose,
  onSuccess,
}: {
  item: AfterDarkSuggestion;
  groupId: string;
  onClose: () => void;
  onSuccess: (proposalId: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      afterDarkApi.impulse(groupId, item.name, item.category, item.address),
    onSuccess: (res) => onSuccess(res.data.proposal.id),
    onError: (err: any) => setError(err?.response?.data?.error ?? "Failed to create impulse proposal"),
  });

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 300, padding: "0 0 0 0",
      }}
      onClick={onClose}
    >
      <div
        className="dn-card"
        style={{
          width: "100%", maxWidth: 560,
          borderRadius: "32px 32px 0 0",
          padding: "40px 32px 48px",
          textAlign: "center",
          boxShadow: "var(--shadow-dock)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
        <h2 style={{ marginBottom: 8 }}>Let's go!</h2>
        <p style={{ color: "var(--ink2)", marginBottom: 24, lineHeight: 1.6 }}>
          This creates a spontaneous proposal for<br />
          <strong style={{ color: "var(--primary)" }}>{item.name}</strong><br />
          with your group — tonight, 2 hours from now.
        </p>
        {error && (
          <p style={{ color: "var(--error)", fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="dn-btn"
            onClick={() => mutate()}
            disabled={isPending}
            style={{ flex: 1 }}
          >
            {isPending ? "Creating…" : "⚡ Create impulse proposal"}
          </button>
          <button className="dn-btn dn-btn--secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AfterDarkPage ─────────────────────────────────────────────────────────────

export function AfterDarkPage() {
  const { groupId } = useParams<{ groupId?: string }>();
  const navigate = useNavigate();

  const [selectedMood, setSelectedMood] = useState<AfterDarkMood | null>(null);
  const [savingMood, setSavingMood] = useState(false);
  const [suggestions, setSuggestions] = useState<AfterDarkSuggestion[]>([]);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [impulseItem, setImpulseItem] = useState<AfterDarkSuggestion | null>(null);

  // Status check
  const { data: status } = useQuery<AfterDarkStatus>({
    queryKey: ["after-dark-status"],
    queryFn: async () => {
      const offset = -new Date().getTimezoneOffset();
      const res = await afterDarkApi.status(offset);
      return res.data;
    },
    refetchInterval: 60_000,
  });

  const isActive = status?.active ?? false;

  // Sync stored mood from status
  useEffect(() => {
    if (status?.currentMood && !selectedMood) {
      setSelectedMood(status.currentMood);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load suggestions
  const loadSuggestions = useCallback(async (mood?: AfterDarkMood | null) => {
    setLoadingSugg(true);
    try {
      const res = await afterDarkApi.suggestions({ mood: mood ?? undefined });
      setSuggestions(res.data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSugg(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) loadSuggestions(selectedMood);
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set mood mutation
  const moodMutation = useMutation({
    mutationFn: (mood: AfterDarkMood) => afterDarkApi.setMood(mood),
    onSuccess: (_data, mood) => {
      loadSuggestions(mood);
    },
  });

  const handleMoodSelect = (mood: AfterDarkMood) => {
    const prev = selectedMood;
    setSelectedMood(mood);
    setSavingMood(true);
    setTimeout(() => setSavingMood(false), 2000);
    moodMutation.mutate(mood, {
      onError: () => setSelectedMood(prev),
    });
  };

  const handleImpulseSuccess = (proposalId: string) => {
    setImpulseItem(null);
    navigate(`/proposals/${proposalId}`);
  };

  return (
    <>
      <AppNav />
      <main
        style={{
          maxWidth: "var(--content-max)",
          margin: "0 auto",
          padding: "32px var(--gutter) 80px",
          background: isActive ? "#0A1018" : "var(--bg)",
          minHeight: "100vh",
          transition: "background 0.4s ease",
        }}
      >
        {/* Breadcrumb */}
        {groupId && (
          <div style={{ marginBottom: 24 }}>
            <Link
              to={`/groups/${groupId}`}
              style={{ color: isActive ? "rgba(255,255,255,0.5)" : "var(--ink2)", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              ← Back to group
            </Link>
          </div>
        )}

        {/* Status banner */}
        {isActive ? (
          <div style={{
            background: "rgba(14,140,140,0.15)",
            border: "1px solid rgba(14,140,140,0.3)",
            borderRadius: "44px 36px 48px 40px",
            padding: "40px 36px",
            marginBottom: 32,
            textAlign: "center",
            boxShadow: "0 0 60px rgba(14,140,140,0.2)",
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌙</div>
            <h1 style={{ color: "#ffffff", marginBottom: 8 }}>After Dark is on</h1>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>Active until 3 AM · Late-night mode</p>
          </div>
        ) : (
          <div className="dn-card" style={{ marginBottom: 32 }}>
            <Countdown minutes={status?.minutesUntilActive ?? 0} />
          </div>
        )}

        {/* Mood selector */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            marginBottom: 16, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
            color: isActive ? "rgba(255,255,255,0.5)" : "var(--ink2)",
            fontFamily: "var(--font-display)", fontWeight: 700,
          }}>
            What's the vibe?
          </h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {MOODS.map((m) => (
              <MoodChip
                key={m.key}
                mood={m}
                isSelected={selectedMood === m.key}
                isSaving={savingMood}
                onClick={() => handleMoodSelect(m.key)}
              />
            ))}
          </div>
          {savingMood && (
            <p style={{
              marginTop: 12,
              fontSize: 13,
              color: isActive ? "rgba(255,255,255,0.5)" : "var(--ink2)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
            }}>
              Saving mood…
            </p>
          )}
        </div>

        {/* Suggestions */}
        {isActive ? (
          <>
            <h3 style={{
              marginBottom: 20, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-display)", fontWeight: 700,
            }}>
              {moodMutation.isPending
                ? "Updating…"
                : selectedMood
                  ? `${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} picks`
                  : "Tonight\u2019s picks"}
            </h3>

            {loadingSugg ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.4)" }}>
                Finding late-night spots…
              </div>
            ) : suggestions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🌃</div>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>
                  No suggestions found. Try a different mood or set your location in settings.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {suggestions.slice(0, 18).map((item, i) => (
                  <SuggestionCard
                    key={item.id}
                    item={item}
                    index={i}
                    groupId={groupId}
                    onImpulse={setImpulseItem}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "var(--ink2)" }}>
              Set your vibe above — suggestions unlock when After Dark starts at 9 PM.
            </p>
          </div>
        )}

        {/* Floating "Let's go NOW" */}
        {isActive && suggestions.length > 0 && groupId && (
          <div style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
          }}>
            <button
              className="dn-btn"
              onClick={() => setImpulseItem(suggestions[0])}
              style={{
                background: "var(--lime)",
                color: "var(--on-lime)",
                padding: "16px 40px",
                fontSize: 16,
                borderRadius: 28,
                boxShadow: "var(--shadow-dock)",
              }}
            >
              ⚡ Let's go NOW
            </button>
          </div>
        )}
      </main>

      {/* Impulse modal */}
      {impulseItem && groupId && (
        <ImpulseModal
          item={impulseItem}
          groupId={groupId}
          onClose={() => setImpulseItem(null)}
          onSuccess={handleImpulseSuccess}
        />
      )}
    </>
  );
}
