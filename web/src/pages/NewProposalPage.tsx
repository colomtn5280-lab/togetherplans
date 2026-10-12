/**
 * NewProposalPage — Finalize step
 * Redesigned to match Jarvis 9.24.26 design system.
 * Flow update 10.12.26: partner name/contact entry moved to the point of
 * sending (via the InviteModal on ProposalPage) — no longer blocks the form.
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

// ── Option card ───────────────────────────────────────────────────────────────
function OptionCard({ opt, index, onRemove }: { opt: PlanBuilderOption; index: number; onRemove: () => void }) {
  const catColor = getCategoryColor(opt.category);
  const catEmoji = getCategoryEmoji(opt.category);
  const radii = [
    "22px 30px 20px 26px",
    "30px 22px 26px 20px",
    "20px 26px 30px 22px",
  ];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "120px minmax(0,1fr)",
      background: "var(--surface)",
      borderRadius: radii[index % 3],
      overflow: "hidden",
      boxShadow: "0 4px 16px rgba(16,24,32,.07)",
      marginBottom: 12,
      position: "relative",
    }}>
      {/* Thumbnail */}
      {opt.imageUrl ? (
        <img
          src={opt.imageUrl}
          alt={opt.name}
          style={{ width: "100%", height: "100%", minHeight: 100, objectFit: "cover", display: "block" }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            const fb = img.nextElementSibling as HTMLElement | null;
            if (fb) fb.style.display = "flex";
            img.style.display = "none";
          }}
        />
      ) : null}
      <div
        style={{
          width: "100%",
          minHeight: 100,
          background: catColor,
          display: opt.imageUrl ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
        }}
        aria-hidden="true"
      >
        {catEmoji}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px 12px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          fontSize: 10,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          letterSpacing: ".04em",
          color: "var(--primary)",
          textTransform: "uppercase",
        }}>
          {opt.category}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, lineHeight: 1.3, color: "var(--ink)" }}>
          {opt.name}
        </div>
        {opt.address && (
          <div style={{ fontSize: 11, color: "var(--ink2)", lineHeight: 1.3 }}>📍 {opt.address}</div>
        )}
        {opt.eventDate && (
          <div style={{ fontSize: 11, color: "var(--ink2)" }}>
            📅 {new Date(opt.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </div>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        aria-label="Remove"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,.85)",
          color: "var(--error)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 800,
          lineHeight: 1,
          backdropFilter: "blur(4px)",
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function NewProposalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { options: pbOptions, clearPlan } = usePlanBuilder();
  const authUser = useAuthStore((s) => s.user);

  const stateOptions: PlanBuilderOption[] = (location.state as { options?: PlanBuilderOption[] } | null)?.options ?? [];
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
  const [personalMessage, setPersonalMessage] = useState("");
  const [titleError, setTitleError] = useState("");
  const [optionsError, setOptionsError] = useState("");
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
  // Partner hasn't joined if selected group has only 1 member
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const partnerNotJoined = !isSoloStart && selectedGroup && (selectedGroup.members?.length ?? 0) < 2;
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

      const res = await proposalsApi.create({
        groupId,
        title: title.trim(),
        dateTime: dt.toISOString(),
        options: apiOptions,
        ...(personalMessage.trim() ? { message: personalMessage.trim() } : {}),
      } as any);
      const id = (res.data as any)?.id ?? (res.data as any)?.proposal?.id ?? "";
      return { id, groupId };
    },
    onSuccess: ({ id }: { id: string; groupId: string }) => {
      clearPlan();
      // Always navigate to the proposal detail page.
      // If solo-start or partner hasn't joined yet, open the invite sheet immediately
      // so the user can share the link right then — no prior blocking of the form.
      const needsInvite = isSoloStart || !!partnerNotJoined;
      navigate(`/proposals/${id}`, { state: { openInvite: needsInvite } });
    },
  });

  const mutationErrMsg = mutation.isError
    ? (mutation.error as AxiosError<ApiError>)?.response?.data?.error
    : null;
  void mutationErrMsg; // used inline below

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

            {/* Partner not yet joined — informational only, no block */}
            {partnerNotJoined && (
              <div style={{
                background: "var(--lime-soft)",
                borderRadius: "16px 10px 16px 10px",
                padding: "14px 18px",
                fontSize: 13,
                color: "var(--ink)",
                marginBottom: 20,
                lineHeight: 1.4,
              }}>
                💌 You'll get a link to share with {partnerName} right after — they can vote without an account.
              </div>
            )}

            {/* Personalized message */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink2)", marginBottom: 8 }}>
                Personal message <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Hey! I put together some ideas for us — can't wait to hear what you think 💚"
                rows={3}
                style={{
                  ...inputStyle,
                  borderRadius: 20,
                  padding: "12px 18px",
                  resize: "none",
                  lineHeight: 1.5,
                }}
                onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--primary)"; (e.target as HTMLTextAreaElement).style.boxShadow = "0 0 0 3px var(--primary-soft)"; }}
                onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--line)"; (e.target as HTMLTextAreaElement).style.boxShadow = "none"; }}
              />
            </div>

            {/* Mutation error */}
            {mutation.isError && (
              <div style={{ background: "var(--error-soft)", borderRadius: "14px 8px 14px 8px", padding: "12px 16px", color: "var(--error)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {(mutation.error as AxiosError<ApiError>)?.response?.data?.error ?? "Failed to create proposal. Please try again."}
              </div>
            )}

            {/* Submit button */}
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
