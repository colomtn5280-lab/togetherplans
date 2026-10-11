/**
 * NewProposalPage — Finalize step
 * Redesigned to match Jarvis 9.24.26 design system.
 */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { proposalsApi, groupsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import { usePlanBuilder } from "../contexts/PlanBuilderContext";
import { useAuthStore } from "../store/auth.store";
import type { Group, PlanBuilderOption } from "../types";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";

// ── Category helpers ──────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "Dining": "#FDEBD0", "Restaurants & Dining": "#FDEBD0",
  "Live Music": "#EBD5FB", "Concerts": "#EBD5FB",
  "Comedy": "#FEF9C3",
  "Movies": "#D5E8FD", "Theater & Plays": "#D5E8FD",
  "Arts & Culture": "#FCE4EC",
  "Outdoors": "#D4EDDA", "Hiking Trails": "#D4EDDA",
  "Sports & Active": "#FFE0B2",
  "Wine & Drinks": "#F5D9DE",
  "Wellness & Spa": "#D0F4F1",
  Custom: "#F0F0F0",
};
const CATEGORY_EMOJIS: Record<string, string> = {
  "Dining": "🍽️", "Restaurants & Dining": "🍽️",
  "Live Music": "🎵", "Concerts": "🎸",
  "Comedy": "🎤",
  "Movies": "🎬", "Theater & Plays": "🎭",
  "Arts & Culture": "🎨",
  "Outdoors": "🌿", "Hiking Trails": "🥾",
  "Sports & Active": "🏟️",
  "Wine & Drinks": "🍷",
  "Wellness & Spa": "💆",
  "Hotel Stays": "🏨",
  "Local Experiences": "📍",
  Custom: "✏️",
};

function getCategoryEmoji(cat: string): string { return CATEGORY_EMOJIS[cat] ?? "📍"; }
function getCategoryColor(cat: string): string { return CATEGORY_COLORS[cat] ?? "#F0F0F0"; }

function suggestTitle(opts: PlanBuilderOption[]): string {
  if (opts.length === 0) return "";
  const categories = opts.map((o) => o.category);
  const dates = opts.filter((o) => o.eventDate).map((o) => o.eventDate!.slice(0, 10));
  if (dates.length > 0 && new Set(dates).size === 1) {
    const d = new Date(dates[0]);
    return `Date Night · ${d.toLocaleDateString(undefined, { weekday: "long" })}`;
  }
  const hasDining = categories.some((c) => c.includes("Dining") || c.includes("Restaurant"));
  const hasEntertainment = categories.some((c) =>
    c.includes("Music") || c.includes("Theater") || c.includes("Comedy")
  );
  if (hasDining && hasEntertainment) {
    const diner = opts.find((o) => o.category.includes("Dining") || o.category.includes("Restaurant"));
    const show = opts.find((o) => o.category.includes("Music") || o.category.includes("Theater") || o.category.includes("Comedy"));
    if (diner && show) {
      return `${diner.name.split(" ").slice(0, 2).join(" ")} + ${show.name.split(" ").slice(0, 2).join(" ")}`;
    }
  }
  return `${categories[0].replace(/\s*(Night|Show|Events?)$/i, '')} Night`;
}

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#0E8C8C", "#7CB518", "#2FC4C1", "#A8E04B", "#FCE44E", "#F87171", "#E39B12"];
function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${2 + Math.random() * 2}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: `${8 + Math.floor(Math.random() * 10)}px`,
  }));
  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: fixed; pointer-events: none; z-index: 9999;
          border-radius: 2px;
          animation: confettiFall linear forwards;
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left, top: "-20px",
            width: p.size, height: p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </>
  );
}

// ── Activity Card (Jarvis .opt style) ─────────────────────────────────────────
const OPT_RADII = [
  "22px 30px 20px 26px",
  "30px 22px 26px 20px",
  "20px 26px 30px 22px",
  "26px 20px 22px 30px",
];

function OptionCard({ opt, index, onRemove }: { opt: PlanBuilderOption; index: number; onRemove: () => void }) {
  const radius = OPT_RADII[index % OPT_RADII.length];
  const bg = getCategoryColor(opt.category);
  const emoji = getCategoryEmoji(opt.category);

  return (
    <div style={{
      position: "relative",
      borderRadius: radius,
      background: "var(--surface)",
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 10,
      boxShadow: "0 4px 16px rgba(16,24,32,.07)",
    }}>
      {/* Category dot */}
      <div style={{
        width: 46,
        height: 46,
        borderRadius: "50% 45% 55% 50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        flexShrink: 0,
      }}>
        {opt.imageUrl
          ? <img src={opt.imageUrl} alt="" style={{ width: 46, height: 46, borderRadius: "50% 45% 55% 50%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          : emoji}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>
          {opt.name}
        </div>
        {opt.address && (
          <div style={{ fontSize: 12, color: "var(--ink2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {opt.address}
          </div>
        )}
        {opt.category && (
          <div style={{ fontSize: 11, color: "var(--ink2)", marginTop: 1 }}>{opt.category}</div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        aria-label="Remove"
        style={{
          width: 32, height: 32,
          borderRadius: "50%",
          border: "1.5px solid var(--line)",
          background: "var(--bg)",
          color: "var(--ink2)",
          cursor: "pointer",
          fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          transition: "background .15s, color .15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--error-soft)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--error)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink2)"; }}
      >
        ×
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function NewProposalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const { options: pbOptions, clearPlan } = usePlanBuilder();

  const stateOptions: PlanBuilderOption[] = (location.state as any)?.options ?? [];
  const [options, setOptions] = useState<PlanBuilderOption[]>(
    stateOptions.length > 0 ? stateOptions : pbOptions
  );

  useEffect(() => {
    if (stateOptions.length === 0) setOptions(pbOptions);
  }, [pbOptions]);

  const earliestEventDate = options
    .filter((o) => o.eventDate)
    .map((o) => new Date(o.eventDate!))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const defaultDatetime = (() => {
    const d = earliestEventDate ? new Date(earliestEventDate) : (() => { const n = new Date(); n.setDate(n.getDate() + 1); n.setHours(19, 0, 0, 0); return n; })();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours() || 19)}:${pad(d.getMinutes())}`;
  })();

  const [title, setTitle] = useState(() => suggestTitle(options));
  const [datetime, setDatetime] = useState(defaultDatetime);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [partnerName, setPartnerName] = useState("your partner");
  const [titleError, setTitleError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const titleInitialized = useRef(false);

  useEffect(() => {
    if (!titleInitialized.current && options.length > 0) {
      setTitle(suggestTitle(options));
      titleInitialized.current = true;
    }
  }, [options]);

  useEffect(() => {
    groupsApi.list().then((res) => {
      const gs: Group[] = Array.isArray(res.data) ? res.data : (res.data as any)?.groups ?? [];
      setGroups(gs);
      if (gs.length > 0) setSelectedGroupId(gs[0].id);
      const g = gs[0];
      if (g?.members?.length === 2) {
        const me = localStorage.getItem("userId") ?? "";
        const partner = g.members.find((m: any) => m.userId !== me);
        if (partner) setPartnerName((partner as any).user?.displayName ?? "your partner");
      }
    }).catch(() => {}).finally(() => setGroupsLoaded(true));
  }, []);

  const isSoloStart = groupsLoaded && groups.length === 0;
  const firstName = authUser?.firstName ?? authUser?.displayName?.split(" ")[0] ?? "Your";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) { setTitleError("Title is required"); throw new Error("no title"); }
      setTitleError("");
      if (options.length < 1) { setOptionsError("Add at least 1 activity"); throw new Error("no options"); }
      if (options.length > 5) { setOptionsError("Maximum 5 options"); throw new Error("too many"); }
      setOptionsError("");

      let groupId = selectedGroupId;
      if (!groupId) {
        if (!isSoloStart) { setOptionsError("Select a group"); throw new Error("no group"); }
        const groupRes = await groupsApi.create({ name: `${firstName}'s plans` });
        groupId = (groupRes.data as any)?.id ?? "";
        if (!groupId) { setOptionsError("Could not set up your space. Please try again."); throw new Error("group create failed"); }
      }

      const dt = new Date(datetime);
      const apiOptions = options.map((o) => ({
        name: o.name, category: o.category, description: o.description,
        address: o.address, imageUrl: o.imageUrl, sourceUrl: o.sourceUrl,
        eventDate: o.eventDate, rating: o.rating, priceLevel: o.priceLevel, sourceName: o.sourceName,
      }));

      const res = await proposalsApi.create({ groupId, title: title.trim(), dateTime: dt.toISOString(), options: apiOptions });
      const id = (res.data as any)?.id ?? (res.data as any)?.proposal?.id ?? "";
      return { id, solo: isSoloStart };
    },
    onSuccess: ({ id, solo }: { id: string; solo: boolean }) => {
      clearPlan();
      if (solo && id) { navigate(`/proposals/${id}`, { state: { openInvite: true } }); return; }
      setCreatedId(id);
      setSuccess(true);
    },
  });

  // ── Success Screen ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <>
        <Confetti />
        <AppNav />
        <main style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>🎉</div>
          <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: "12px 6px 14px 6px", background: "var(--lime)", color: "#101820", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11, letterSpacing: ".06em", marginBottom: 16 }}>
            LOCKED IN
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 800, letterSpacing: "-.04em", marginBottom: 12 }}>
            Plan sent to {partnerName}!
          </h1>
          <p style={{ color: "var(--ink2)", marginBottom: 36, maxWidth: 380, fontSize: 17 }}>
            They'll vote on your options. You'll hear back when a decision is locked in.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
            <Link to={`/proposals/${createdId}`} className="dn-btn" style={{ justifyContent: "center" }}>
              View Plan
            </Link>
            <Link to="/discover" className="dn-btn dn-btn--tonal" style={{ justifyContent: "center" }}>
              Keep Exploring
            </Link>
          </div>
        </main>
      </>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 18px",
    borderRadius: 999,
    border: "1.5px solid var(--line)",
    fontSize: 15,
    fontFamily: "var(--font-body)",
    boxSizing: "border-box",
    background: "var(--surface)",
    color: "var(--ink)",
    outline: "none",
    transition: "border-color .15s, box-shadow .15s",
  };

  // ── Main Layout ──────────────────────────────────────────────────────────────
  return (
    <>
      <AppNav />

      {/* Page-level blob accents */}
      <div style={{ position: "fixed", top: -180, right: -140, width: 520, height: 460, borderRadius: "48% 52% 45% 55%/55% 45% 55% 45%", background: "var(--primary-soft)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -160, left: -180, width: 440, height: 380, borderRadius: "52% 48% 55% 45%/45% 55% 45% 55%", background: "var(--lime-soft)", pointerEvents: "none", zIndex: 0 }} />

      <main style={{ position: "relative", zIndex: 1, padding: "32px clamp(16px, 4vw, 48px) 64px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <span style={{ display: "inline-block", padding: "5px 12px", borderRadius: "12px 6px 14px 6px", background: "var(--lime)", color: "#101820", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11, letterSpacing: ".06em", transform: "rotate(-2deg)", marginBottom: 12 }}>
            {options.length === 0 ? "BUILD YOUR PLAN" : `${options.length} ACTIVIT${options.length === 1 ? "Y" : "IES"} ADDED`}
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(32px,5vw,52px)", letterSpacing: "-.04em", lineHeight: 1, margin: 0 }}>
            Finalize Your Plan<span style={{ color: "var(--primary)", display: "inline-block", transform: "rotate(8deg)" }}>.</span>
          </h1>
        </div>

        {/* Two-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>

          {/* ── Left: Activities ── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>
                Activities ({options.length} / 5)
              </h2>
            </div>

            {optionsError && (
              <p style={{ color: "var(--error)", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{optionsError}</p>
            )}

            {options.length === 0 ? (
              <div style={{
                border: "2px dashed var(--line)",
                borderRadius: "30px 22px 34px 20px",
                padding: "48px 32px",
                textAlign: "center",
                color: "var(--ink2)",
                background: "var(--surface)",
              }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🗓️</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 6, color: "var(--ink)" }}>
                  Nothing added yet
                </div>
                <div style={{ fontSize: 14, marginBottom: 24 }}>
                  Browse Discover and tap + Add to Date on anything that looks good.
                </div>
                <Link
                  to="/discover"
                  className="dn-btn"
                  style={{ display: "inline-flex", justifyContent: "center" }}
                >
                  Browse Discover
                </Link>
              </div>
            ) : (
              <>
                {options.map((opt, i) => (
                  <OptionCard key={opt.id} opt={opt} index={i} onRemove={() => setOptions((prev) => prev.filter((o) => o.id !== opt.id))} />
                ))}

                {options.length < 5 && (
                  <Link
                    to="/discover"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      width: "100%",
                      height: 52,
                      borderRadius: "26px 20px 26px 20px",
                      border: "2px dashed var(--line)",
                      background: "transparent",
                      color: "var(--ink2)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: "none",
                      marginTop: 4,
                      transition: "border-color .15s, color .15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--line)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink2)"; }}
                  >
                    + Add another activity
                  </Link>
                )}
              </>
            )}
          </div>

          {/* ── Right: Form ── */}
          <div style={{
            background: "var(--surface)",
            borderRadius: "30px 22px 34px 20px",
            padding: "28px 28px 32px",
            boxShadow: "0 8px 24px rgba(16,24,32,.07)",
          }}>

            {/* Title */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink2)", marginBottom: 8 }}>
                Plan Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Date Night · Friday"
                style={{ ...inputStyle, borderColor: titleError ? "var(--error)" : "var(--line)" }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--primary)"; (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px var(--primary-soft)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = titleError ? "var(--error)" : "var(--line)"; (e.target as HTMLInputElement).style.boxShadow = "none"; }}
              />
              {titleError && <p style={{ color: "var(--error)", fontSize: 12, marginTop: 6, fontWeight: 600 }}>{titleError}</p>}
            </div>

            {/* Date / time */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink2)", marginBottom: 8 }}>
                When?
              </label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--primary)"; (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px var(--primary-soft)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--line)"; (e.target as HTMLInputElement).style.boxShadow = "none"; }}
              />
            </div>

            {/* Group selector */}
            {groups.length > 1 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink2)", marginBottom: 8 }}>
                  Send To
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Solo-start notice */}
            {isSoloStart && (
              <div style={{
                background: "var(--primary-soft)",
                borderRadius: "16px 10px 16px 10px",
                padding: "14px 18px",
                fontSize: 13,
                color: "var(--ink)",
                marginBottom: 20,
                lineHeight: 1.4,
              }}>
                ✨ We'll start <strong>{firstName}'s plans</strong> for you — then share a link with whoever you're planning with. They can vote without signing up.
              </div>
            )}

            {/* Mutation error */}
            {mutation.isError && (
              <div style={{ background: "var(--error-soft)", borderRadius: "14px 8px 14px 8px", padding: "12px 16px", color: "var(--error)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {(mutation.error as AxiosError<ApiError>)?.response?.data?.error ?? "Failed to create proposal. Please try again."}
              </div>
            )}

            {/* Submit button — full Jarvis .btn.lg treatment */}
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              style={{
                width: "100%",
                height: 56,
                borderRadius: "28px 20px 28px 20px",
                background: mutation.isPending ? "var(--ink2)" : "var(--primary)",
                color: "#fff",
                border: "none",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 17,
                cursor: mutation.isPending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 8px 24px rgba(16,24,32,.07)",
                transition: "transform .15s, box-shadow .15s",
                marginBottom: 10,
              }}
              onMouseEnter={(e) => { if (!mutation.isPending) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 28px rgba(14,140,140,.35)"; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(16,24,32,.07)"; }}
            >
              {mutation.isPending
                ? "Sending…"
                : isSoloStart
                  ? "Create plan & share →"
                  : `Send to ${partnerName} ♥`}
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink2)", margin: 0 }}>
              No ads. Your partner votes by link — no account needed.
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          main > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
