/**
 * NewProposalPage — FINALIZE step (rewritten)
 *
 * Receives built options from PlanBuilderContext (or router state).
 * Allows editing title, datetime, group, adding/removing options.
 * Sends proposal to backend. Shows success screen with confetti.
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

// ── Category helpers ─────────────────────────────────────────────────────────
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
    const show = opts.find((o) => o.category.includes("Music") || o.category.includes("Theater"));
    if (diner && show) {
      return `${diner.name.split(" ").slice(0, 2).join(" ")} + ${show.name.split(" ").slice(0, 2).join(" ")}`;
    }
  }
  return `${categories[0]} Night`;
}

// ── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_STYLE = `
@keyframes confettiFall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  position: fixed;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confettiFall linear forwards;
  pointer-events: none;
  z-index: 9999;
}
`;
const CONFETTI_COLORS = ["#0E8C8C", "#7CB518", "#2FC4C1", "#A8E04B", "#FCE44E", "#F87171"];

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${2 + Math.random() * 2}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: `${8 + Math.floor(Math.random() * 10)}px`,
    rotation: `${Math.random() * 360}deg`,
  }));
  return (
    <>
      <style>{CONFETTI_STYLE}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            top: 0,
            background: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotation})`,
          }}
        />
      ))}
    </>
  );
}

// ── Option Card ───────────────────────────────────────────────────────────────
function OptionCard({ opt, onRemove }: { opt: PlanBuilderOption; onRemove: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const bg = getCategoryColor(opt.category);
  const emoji = getCategoryEmoji(opt.category);
  const priceStr = opt.priceLevel ? "$".repeat(opt.priceLevel) : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "var(--bg)",
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
      }}
    >
      {/* Thumbnail */}
      {opt.imageUrl && !imgErr ? (
        <img
          src={opt.imageUrl}
          alt=""
          style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
          onError={() => setImgErr(true)}
        />
      ) : (
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 10,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          {emoji}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {opt.name}
        </div>
        {opt.address && (
          <div style={{ fontSize: 13, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            📍 {opt.address}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          {opt.rating != null && <span style={{ fontSize: 13, color: "#7CB518" }}>★ {opt.rating.toFixed(1)}</span>}
          {priceStr && <span style={{ fontSize: 13, color: "var(--ink2)" }}>{priceStr}</span>}
        </div>
      </div>
      <button
        onClick={onRemove}
        style={{
          background: "var(--line)",
          border: "none",
          borderRadius: "50%",
          width: 28,
          height: 28,
          cursor: "pointer",
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── Preview Panel ─────────────────────────────────────────────────────────────
function PreviewPanel({ opts, title, partnerName }: { opts: PlanBuilderOption[]; title: string; partnerName: string }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: 16, padding: 20, marginTop: 24 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "var(--ink2)" }}>
        Preview — what {partnerName} sees
      </h3>
      <h4 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: 20 }}>
        {title || "Date Night"}
      </h4>
      {opts.map((opt) => (
        <div
          key={opt.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--bg)",
            borderRadius: 12,
            padding: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: getCategoryColor(opt.category),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {getCategoryEmoji(opt.category)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{opt.name}</div>
            {opt.address && <div style={{ fontSize: 12, color: "var(--ink2)" }}>{opt.address}</div>}
          </div>
          {/* Greyed vote button */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.4,
              fontSize: 16,
            }}
          >
            ♥
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function NewProposalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const { options: pbOptions, clearPlan } = usePlanBuilder();

  // Options come from router state (from PlanBuilderDock) or context
  const stateOptions: PlanBuilderOption[] = (location.state as any)?.options ?? [];
  const [options, setOptions] = useState<PlanBuilderOption[]>(
    stateOptions.length > 0 ? stateOptions : pbOptions
  );

  // Sync from context if no router state
  useEffect(() => {
    if (stateOptions.length === 0) {
      setOptions(pbOptions);
    }
  }, [pbOptions]);

  // Earliest eventDate for date pre-fill
  const earliestEventDate = options
    .filter((o) => o.eventDate)
    .map((o) => new Date(o.eventDate!))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const defaultDatetime = (() => {
    if (earliestEventDate) {
      const d = new Date(earliestEventDate);
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T19:00`;
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
  const [showPreview, setShowPreview] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  // Update title suggestion when options change
  const titleInitialized = useRef(false);
  useEffect(() => {
    if (!titleInitialized.current && options.length > 0) {
      setTitle(suggestTitle(options));
      titleInitialized.current = true;
    }
  }, [options]);

  // Load groups
  useEffect(() => {
    groupsApi.list().then((res) => {
      const gs: Group[] = Array.isArray(res.data) ? res.data : (res.data as any)?.groups ?? [];
      setGroups(gs);
      if (gs.length > 0) setSelectedGroupId(gs[0].id);
      // Find partner name in 2-member group
      const g = gs[0];
      if (g?.members?.length === 2) {
        const me = localStorage.getItem("userId") ?? "";
        const partner = g.members.find((m) => m.userId !== me);
        if (partner) setPartnerName(partner.user?.displayName ?? "your partner");
      }
    }).catch(() => {}).finally(() => setGroupsLoaded(true));
  }, []);

  // Solo-start: zero-group users get a personal space auto-created on send
  const isSoloStart = groupsLoaded && groups.length === 0;
  const firstName =
    authUser?.firstName ??
    authUser?.displayName?.split(" ")[0] ??
    "Your";

  const removeOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) { setTitleError("Title is required"); throw new Error("no title"); }
      setTitleError("");
      if (options.length < 1) { setOptionsError("Add at least 1 activity"); throw new Error("no options"); }
      if (options.length > 5) { setOptionsError("Maximum 5 options"); throw new Error("too many"); }
      setOptionsError("");

      let groupId = selectedGroupId;
      let solo = false;
      if (!groupId) {
        if (!isSoloStart) { setOptionsError("Select a group"); throw new Error("no group"); }
        // Solo-start: transparently create a personal space — no group wall
        const groupRes = await groupsApi.create({ name: `${firstName}'s plans` });
        groupId = (groupRes.data as any)?.id ?? "";
        if (!groupId) { setOptionsError("Could not set up your space. Please try again."); throw new Error("group create failed"); }
        solo = true;
      }

      const dt = new Date(datetime);
      const apiOptions = options.map((o) => ({
        name: o.name,
        category: o.category,
        description: o.description,
        address: o.address,
        imageUrl: o.imageUrl,
        sourceUrl: o.sourceUrl,
        eventDate: o.eventDate,
        rating: o.rating,
        priceLevel: o.priceLevel,
        sourceName: o.sourceName,
      }));

      const res = await proposalsApi.create({
        groupId,
        title: title.trim(),
        dateTime: dt.toISOString(),
        options: apiOptions,
      });
      const id = (res.data as any)?.id ?? (res.data as any)?.proposal?.id ?? "";
      return { id, solo };
    },
    onSuccess: ({ id, solo }: { id: string; solo: boolean }) => {
      clearPlan();
      if (solo && id) {
        // Land on the proposal page with the guest-vote share sheet auto-opened
        navigate(`/proposals/${id}`, { state: { openInvite: true } });
        return;
      }
      setCreatedId(id);
      setSuccess(true);
    },
  });

  if (success) {
    return (
      <>
        <Confetti />
        <AppNav />
        <main
          style={{
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, marginBottom: 12 }}>
            Plan sent to {partnerName}!
          </h1>
          <p style={{ color: "var(--ink2)", marginBottom: 32, maxWidth: 400 }}>
            They'll vote on your options and you'll be notified when a decision is made.
          </p>
          <Link
            to={`/proposals/${createdId}`}
            className="dn-btn dn-btn--primary"
            style={{ marginBottom: 12, minWidth: 200 }}
          >
            View Plan
          </Link>
          <Link
            to="/discover"
            className="dn-btn dn-btn--tonal"
            style={{ minWidth: 200 }}
          >
            Keep Exploring
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <main style={{ padding: "24px 32px", maxWidth: 700, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, marginBottom: 24 }}>
          Finalize Your Plan
        </h1>

        {/* Options list */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-display)" }}>
              Activities ({options.length} / 5)
            </h2>
          </div>

          {optionsError && (
            <p style={{ color: "var(--error)", fontSize: 14, marginBottom: 8 }}>{optionsError}</p>
          )}

          {options.length === 0 && (
            <div
              style={{
                border: "2px dashed var(--line)",
                borderRadius: 16,
                padding: 32,
                textAlign: "center",
                color: "var(--ink2)",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
              No activities yet. Browse Discover to add some!
            </div>
          )}

          {options.map((opt) => (
            <OptionCard key={opt.id} opt={opt} onRemove={() => removeOption(opt.id)} />
          ))}

          {options.length < 5 && (
            <Link
              to="/discover"
              className="dn-btn dn-btn--tonal"
              style={{ width: "100%", marginTop: 8, justifyContent: "center", display: "flex" }}
            >
              + Add another activity
            </Link>
          )}
        </section>

        {/* Title */}
        <section style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: 14, color: "var(--ink2)" }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Date Night · Friday"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid ${titleError ? "var(--error)" : "var(--line)"}`,
              fontSize: 15,
              fontFamily: "var(--font-body)",
              boxSizing: "border-box",
              background: "var(--surface)",
              color: "var(--ink)",
            }}
          />
          {titleError && <p style={{ color: "var(--error)", fontSize: 13, marginTop: 4 }}>{titleError}</p>}
        </section>

        {/* Date / time */}
        <section style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: 14, color: "var(--ink2)" }}>
            When?
          </label>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid var(--line)",
              fontSize: 15,
              fontFamily: "var(--font-body)",
              boxSizing: "border-box",
              background: "var(--surface)",
              color: "var(--ink)",
              cursor: "pointer",
            }}
          />
        </section>

        {/* Group selector */}
        {groups.length > 1 && (
          <section style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: 14, color: "var(--ink2)" }}>
              Send to
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid var(--line)",
                fontSize: 15,
                fontFamily: "var(--font-body)",
                background: "var(--surface)",
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </section>
        )}

        {/* Solo-start notice — zero-group users, no wall */}
        {isSoloStart && (
          <section style={{ marginBottom: 20 }}>
            <div style={{
              background: "rgba(14,140,140,0.07)",
              border: "1.5px solid var(--primary)",
              borderRadius: 14,
              padding: "14px 18px",
              fontSize: 14,
              color: "var(--ink)",
            }}>
              ✨ We'll start a personal space for you (<strong>{firstName}'s plans</strong>) —
              then you can send a link to whoever you're planning with, and they can vote without an account.
            </div>
          </section>
        )}

        {/* Preview toggle */}
        <button
          className="dn-btn dn-btn--tonal"
          style={{ width: "100%", marginBottom: 12 }}
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? "Hide Preview" : "Preview →"}
        </button>

        {showPreview && (
          <PreviewPanel opts={options} title={title} partnerName={partnerName} />
        )}

        {/* Error from mutation */}
        {mutation.isError && (
          <p style={{ color: "var(--error)", fontSize: 14, marginTop: 12 }}>
            {(mutation.error as AxiosError<ApiError>)?.response?.data?.error ?? "Failed to create proposal. Please try again."}
          </p>
        )}

        {/* Submit */}
        <button
          className="dn-btn dn-btn--primary"
          style={{ width: "100%", marginTop: 20, fontSize: 16 }}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending
            ? "Sending…"
            : isSoloStart
              ? "Create plan & get share link →"
              : `Send to ${partnerName} ♥`}
        </button>
      </main>
    </>
  );
}
