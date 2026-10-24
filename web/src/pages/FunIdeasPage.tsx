/**
 * FunIdeasPage.tsx
 *
 * Non-institutional creative activity ideas for couples, friends, and families.
 * Three audience bubble buttons filter the catalog.
 * Cards match the dn-card / dmu-add pattern used across the app.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppNav } from "../components/AppNav";
import { useAuthStore } from "../store/auth.store";
import { usePlanBuilder } from "../contexts/PlanBuilderContext";
import { funIdeasApi } from "../api/client";
import "./add-to-date-button.css";

type Audience = "Couples" | "Friends" | "Family";

const AUDIENCES: { id: Audience; emoji: string; label: string; tagline: string }[] = [
  { id: "Couples",  emoji: "💑", label: "Couples",  tagline: "Just the two of you" },
  { id: "Friends",  emoji: "🙌", label: "Friends",  tagline: "Group nights out or in" },
  { id: "Family",   emoji: "👨‍👩‍👧", label: "Family",   tagline: "Everyone included" },
];

// Soft gradient backgrounds per audience — decorative, no photos needed
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #E8F8F7 0%, #D4F0EE 100%)",
  "linear-gradient(135deg, #F0EAF8 0%, #E2D4F0 100%)",
  "linear-gradient(135deg, #FFF4E8 0%, #FDECD4 100%)",
  "linear-gradient(135deg, #EAF4E0 0%, #D6EDCC 100%)",
  "linear-gradient(135deg, #FEE8E8 0%, #FDDADA 100%)",
  "linear-gradient(135deg, #E8F0FE 0%, #D4E4FD 100%)",
];

const DURATION_LABEL: Record<number, string> = {
  30:   "30 min",
  60:   "1 hr",
  90:   "1.5 hrs",
  120:  "2 hrs",
  150:  "2.5 hrs",
  180:  "3 hrs",
  240:  "4 hrs",
  360:  "6 hrs",
  480:  "8 hrs",
  720:  "Half day",
  1440: "Overnight",
};

function durationLabel(mins?: number): string {
  if (!mins) return "";
  return DURATION_LABEL[mins] ?? `${Math.round(mins / 60)} hrs`;
}

function costLabel(tier?: 1 | 2 | 3): string {
  if (!tier) return "";
  return ["Free / cheap", "Moderate", "Splurge"][tier - 1];
}

interface FunIdeaResult {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tags: string[];
  audience: Audience[];
  costTier?: 1 | 2 | 3;
  durationMinutes?: number;
  category: string;
  source: string;
}

export function FunIdeasPage() {
  const [activeAudience, setActiveAudience] = useState<Audience>("Couples");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuthStore();
  const { addOption } = usePlanBuilder();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["fun-ideas", activeAudience],
    queryFn: () => funIdeasApi.list(activeAudience),
    staleTime: 1000 * 60 * 60, // 1 hr — static catalog, no need to refetch
    select: (res: { data: FunIdeaResult[] }) => res.data,
  });

  const ideas: FunIdeaResult[] = data ?? [];

  function handleAdd(idea: FunIdeaResult) {
    if (!isAuthenticated) {
      navigate("/signup");
      return;
    }
    if (addedIds.has(idea.id)) return;
    addOption({
      name: idea.name,
      category: "Fun Ideas",
      description: idea.description,
      sourceName: "Fun Ideas",
    });
    setAddedIds((prev) => new Set([...prev, idea.id]));
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 120 }}>
      <AppNav />

      {/* ── Header ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 32 }}>💡</span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            Fun Ideas
          </h1>
        </div>
        <p
          style={{
            color: "var(--ink2)",
            fontSize: 15,
            fontFamily: "var(--font-body)",
            margin: "0 0 28px",
            lineHeight: 1.5,
          }}
        >
          Creative, non-venue ideas to make any plan unforgettable.
          Add one to your date proposal — or do it on its own.
        </p>

        {/* ── Audience bubble buttons ── */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
          role="radiogroup"
          aria-label="Who is this for?"
        >
          {AUDIENCES.map((a) => {
            const active = activeAudience === a.id;
            return (
              <button
                key={a.id}
                role="radio"
                aria-checked={active}
                onClick={() => setActiveAudience(a.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "14px 20px 12px",
                  borderRadius: active ? "20px 28px 20px 28px" : "28px 20px 28px 20px",
                  border: active
                    ? "2.5px solid var(--primary)"
                    : "2px solid var(--line)",
                  background: active ? "var(--primary-soft)" : "var(--surface)",
                  color: active ? "var(--primary)" : "var(--ink2)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.18s",
                  minWidth: 90,
                  boxShadow: active ? "0 4px 16px rgba(14,140,140,0.15)" : "none",
                }}
              >
                <span style={{ fontSize: 22 }}>{a.emoji}</span>
                <span>{a.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    fontFamily: "var(--font-body)",
                    color: active ? "var(--primary)" : "var(--ink3)",
                    opacity: 0.9,
                  }}
                >
                  {a.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Result count ── */}
        {!isLoading && (
          <p
            style={{
              fontSize: 13,
              color: "var(--ink3)",
              fontFamily: "var(--font-body)",
              margin: "0 0 16px",
            }}
          >
            {ideas.length} idea{ideas.length !== 1 ? "s" : ""} for{" "}
            <strong style={{ color: "var(--ink2)" }}>{activeAudience}</strong>
          </p>
        )}
      </div>

      {/* ── Card grid ── */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="dn-card"
                style={{
                  height: 200,
                  background: "var(--surface)",
                  animation: "pulse 1.4s ease-in-out infinite",
                }}
              />
            ))
          : ideas.map((idea, i) => {
              const added = addedIds.has(idea.id);
              const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
              const altClass = i % 3 === 1 ? " dn-card--alt1" : i % 3 === 2 ? " dn-card--alt2" : "";

              return (
                <div
                  key={idea.id}
                  className={`dn-card${altClass}`}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  {/* Emoji hero area */}
                  <div
                    style={{
                      height: 100,
                      background: gradient,
                      borderRadius: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 44,
                      marginBottom: 14,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {idea.emoji}
                  </div>

                  {/* Category sticker */}
                  <span
                    className="dn-sticker dn-sticker--lime"
                    style={{ marginBottom: 8, alignSelf: "flex-start" }}
                  >
                    Fun Ideas
                  </span>

                  {/* Name */}
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                      color: "var(--ink)",
                      margin: "0 0 6px",
                    }}
                  >
                    {idea.name}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--ink2)",
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.5,
                      margin: "0 0 10px",
                      flex: 1,
                    }}
                  >
                    {idea.description}
                  </p>

                  {/* Meta: duration + cost */}
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginBottom: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {idea.durationMinutes && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--ink3)",
                          fontFamily: "var(--font-body)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        ⏱ {durationLabel(idea.durationMinutes)}
                      </span>
                    )}
                    {idea.costTier && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--ink3)",
                          fontFamily: "var(--font-body)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        💰 {costLabel(idea.costTier)}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 14,
                      }}
                    >
                      {idea.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 100,
                            background: "var(--surface2, var(--bg))",
                            border: "1px solid var(--line)",
                            color: "var(--ink3)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add to Date button */}
                  <button
                    className="dmu-add"
                    aria-pressed={added ? "true" : "false"}
                    style={{ marginTop: "auto" }}
                    onClick={() => handleAdd(idea)}
                  >
                    {added
                      ? "Added"
                      : isAuthenticated
                      ? "Add to Date"
                      : "Sign up to save your plan →"}
                  </button>
                </div>
              );
            })}
      </div>

      {/* Empty state — shouldn't happen with static catalog */}
      {!isLoading && ideas.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--ink3)",
            fontFamily: "var(--font-body)",
          }}
        >
          <p style={{ fontSize: 40, marginBottom: 12 }}>💡</p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>No ideas found</p>
          <p style={{ fontSize: 14 }}>Try a different audience filter above.</p>
        </div>
      )}
    </div>
  );
}
