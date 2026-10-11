import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proposalsApi, shareCardsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import { useAuthStore } from "../store/auth.store";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";

// ── Category helpers ──────────────────────────────────────────────────────────
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

function getCategoryEmoji(cat: string): string {
  return CATEGORY_EMOJIS[cat] ?? "📍";
}
function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "#F0F0F0";
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

function formatPriceLevel(level: number): string {
  return "$".repeat(Math.max(1, Math.min(4, level)));
}

function buildGoogleCalendarUrl(title: string, venue: string, dateStr?: string): string {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const text = encodeURIComponent(title);
  const details = encodeURIComponent(venue);
  let dates = "";
  if (dateStr) {
    try {
      const start = new Date(dateStr);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h
      const fmt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      dates = `&dates=${fmt(start)}/${fmt(end)}`;
    } catch {
      // no dates
    }
  }
  return `${base}&text=${text}${dates}&details=${details}`;
}

// ── Confetti pieces (generated once) ─────────────────────────────────────────
const CONFETTI_COLORS = ["#0E8C8C", "#7CB518", "#ffffff", "#FFD700"];
const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: Math.random() * 2.5,
  size: 8 + Math.random() * 8,
  duration: 2.5 + Math.random() * 2,
}));

// ── Share modal ───────────────────────────────────────────────────────────────
interface ShareModalProps {
  proposalId: string;
  onClose: () => void;
}
function ShareModal({ proposalId, onClose }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    shareCardsApi.generate(proposalId)
      .then((res) => {
        const data = res.data as { shareUrl?: string; url?: string; token?: string };
        const url =
          data.shareUrl ??
          data.url ??
          (data.token
            ? `${window.location.origin}/share/${data.token}`
            : null);
        setShareUrl(url);
      })
      .catch(() => setError("Could not generate share link."))
      .finally(() => setLoading(false));
  }, [proposalId]);

  function handleCopy() {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const waUrl = shareUrl
    ? `https://wa.me/?text=${encodeURIComponent("Check out our plan: " + shareUrl)}`
    : null;
  const ogImageUrl = `${window.location.origin}/api/share-cards/${proposalId}/og-image`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        className="dn-card"
        style={{
          width: "100%",
          maxWidth: 460,
          padding: 32,
          borderRadius: "32px 28px 36px 28px",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 8, fontFamily: "var(--font-display)" }}>Share this plan 🎉</h2>

        {loading && <p style={{ color: "var(--ink2)" }}>Generating link…</p>}
        {error && <p style={{ color: "var(--error)" }}>{error}</p>}

        {shareUrl && (
          <>
            <div
              style={{
                background: "var(--bg)",
                borderRadius: 20,
                padding: "10px 14px",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--ink2)",
                  wordBreak: "break-all",
                  textAlign: "left",
                  flex: 1,
                }}
              >
                {shareUrl}
              </span>
              <button
                className="dn-btn dn-btn--sm"
                onClick={handleCopy}
                style={{ flexShrink: 0 }}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>

            {/* OG image preview */}
            <img
              src={ogImageUrl}
              alt="Plan preview"
              style={{
                width: "100%",
                borderRadius: 16,
                marginBottom: 16,
                objectFit: "cover",
                maxHeight: 200,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="dn-btn"
                style={{
                  display: "block",
                  textDecoration: "none",
                  marginBottom: 12,
                  background: "#25D366",
                  color: "#fff",
                  border: "none",
                }}
              >
                📱 Share on WhatsApp
              </a>
            )}
          </>
        )}

        <button
          className="dn-btn dn-btn--secondary"
          onClick={onClose}
          style={{ width: "100%" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Invite-to-vote modal (open proposals — guest voting share link) ──────────
function InviteVoteModal({ proposalId, soloIntro, onClose }: { proposalId: string; soloIntro?: boolean; onClose: () => void }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    proposalsApi.shareLink(proposalId)
      .then((res) => {
        setShareUrl(res.data.shareUrl);
        // Auto-copy for convenience
        navigator.clipboard?.writeText(res.data.shareUrl).then(() => setCopied(true)).catch(() => {});
      })
      .catch(() => setError("Could not create the invite link."));
  }, [proposalId]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const msg = shareUrl ? encodeURIComponent(`Help us pick! Vote on our plan (no account needed): ${shareUrl}`) : "";
  const waUrl = shareUrl ? `https://wa.me/?text=${msg}` : null;
  const smsUrl = shareUrl ? `sms:?&body=${msg}` : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,21,25,0.55)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dn-card"
        style={{ maxWidth: 440, width: "100%", padding: 28 }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8, fontFamily: "var(--font-display)" }}>
          Invite someone to vote 🗳
        </h2>
        <p style={{ color: "var(--ink2)", fontSize: 14, marginBottom: 18 }}>
          {soloIntro
            ? "Send this to whoever you're planning with — they can vote without an account."
            : "Anyone with this link can vote on the options — no account needed. Guest votes advise the group; members decide."}
        </p>

        {error && <p style={{ color: "var(--error)", fontSize: 14 }}>{error}</p>}
        {!shareUrl && !error && <p style={{ color: "var(--ink2)", fontSize: 14 }}>Creating link…</p>}

        {shareUrl && (
          <>
            <div style={{
              background: "var(--bg)", border: "1.5px solid var(--line)", borderRadius: 14,
              padding: "10px 14px", fontSize: 13, color: "var(--primary)",
              wordBreak: "break-all", marginBottom: 14,
            }}>
              {shareUrl}
            </div>
            <button className="dn-btn dn-btn--primary" onClick={handleCopy} style={{ width: "100%", marginBottom: 10 }}>
              {copied ? "✓ Copied to clipboard!" : "📋 Copy link"}
            </button>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="dn-btn" style={{ flex: 1, textAlign: "center", textDecoration: "none" }}>
                  📱 WhatsApp
                </a>
              )}
              {smsUrl && (
                <a href={smsUrl} className="dn-btn" style={{ flex: 1, textAlign: "center", textDecoration: "none" }}>
                  💬 Text / SMS
                </a>
              )}
            </div>
          </>
        )}

        <button className="dn-btn dn-btn--secondary" onClick={onClose} style={{ width: "100%" }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ProposalPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showCounter, setShowCounter] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  // Solo-start: auto-open the guest-vote invite sheet when navigated with state
  const soloShare = !!(location.state as { openInvite?: boolean } | null)?.openInvite;
  const [showInviteModal, setShowInviteModal] = useState(soloShare);
  const prevStatusRef = useRef<string | null>(null);
  const confettiInjectedRef = useRef(false);

  const { data: proposal, isLoading, isError } = useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => {
      const res = await proposalsApi.get(proposalId!);
      return res.data;
    },
    enabled: !!proposalId,
  });

  // Auto-show celebration when status becomes DECIDED
  useEffect(() => {
    if (!proposal) return;
    const prev = prevStatusRef.current;
    const current = proposal.status;
    if (
      (current === "DECIDED" || current === "locked") &&
      prev !== null &&
      prev !== "DECIDED" &&
      prev !== "locked"
    ) {
      setShowCelebration(true);
    }
    prevStatusRef.current = current;
  }, [proposal?.status]);

  // Also auto-show when navigating directly to an already-DECIDED proposal
  // (only on first load — prev is null)
  useEffect(() => {
    if (!proposal) return;
    if (prevStatusRef.current === null) {
      prevStatusRef.current = proposal.status;
    }
  }, [proposal]);

  const voteMutation = useMutation<unknown, AxiosError<ApiError>, { optionId: string }>({
    mutationFn: async ({ optionId }) => {
      const res = await proposalsApi.vote(proposalId!, optionId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
    },
  });

  const retractMutation = useMutation<unknown, AxiosError<ApiError>>({
    mutationFn: async () => {
      const res = await proposalsApi.retractVote(proposalId!);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
    },
  });

  const cancelMutation = useMutation<unknown, AxiosError<ApiError>>({
    mutationFn: async () => {
      const res = await proposalsApi.cancel(proposalId!);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
    },
  });

  if (isLoading) return (
    <>
      <AppNav />
      <main style={{ padding: "40px var(--gutter)", textAlign: "center" }}>
        <p style={{ color: "var(--ink2)" }}>Loading proposal…</p>
      </main>
    </>
  );

  if (isError || !proposal) return (
    <>
      <AppNav />
      <main style={{ padding: "40px var(--gutter)", textAlign: "center" }}>
        <p role="alert" style={{ color: "var(--error)" }}>Proposal not found.</p>
      </main>
    </>
  );

  // Normalize: backend returns options[], legacy may return items[]
  const options = proposal.options ?? proposal.items ?? [];
  const tally = proposal.tally ?? [];
  const memberCount = proposal.memberCount ?? 0;

  const myUserId = user?.userId ?? user?.id ?? "";

  // Which option has the current user voted for?
  const myVotedOptionId = options.find((opt) =>
    opt.votes?.some((v) => v.userId === myUserId)
  )?.id;

  const isDecided = proposal.status === "DECIDED" || proposal.status === "locked";

  // Find the winning option (consensus or most votes)
  const winningOption =
    options.find((opt) => tally.find((t) => t.optionId === opt.id)?.consensus) ??
    options.reduce<typeof options[0] | null>((best, opt) => {
      const votes = tally.find((t) => t.optionId === opt.id)?.votes ?? 0;
      const bestVotes = best ? (tally.find((t) => t.optionId === best.id)?.votes ?? 0) : -1;
      return votes > bestVotes ? opt : best;
    }, null);

  const statusSticker = () => {
    const s = proposal.status;
    if (s === "DECIDED" || s === "locked") return <span className="dn-sticker dn-sticker--lime">Decided 🎉</span>;
    if (s === "CANCELLED" || s === "rejected") return <span className="dn-sticker dn-sticker--ink">Cancelled</span>;
    return <span className="dn-sticker">Open</span>;
  };

  // Inject confetti keyframes once
  function ConfettiStyle() {
    if (confettiInjectedRef.current) return null;
    confettiInjectedRef.current = true;
    return (
      <style>{`
        @keyframes dn-confetti-fall {
          0%   { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    );
  }

  return (
    <>
      <AppNav />
      <main style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "32px var(--gutter)" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link to={`/groups/${proposal.groupId}`} style={{ color: "var(--ink2)", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 700 }}>
            ← Back to group
          </Link>
        </div>

        {/* Title + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          {statusSticker()}
          <h1 style={{ margin: 0, fontSize: 24 }}>{proposal.title ?? "Proposal"}</h1>
          {isDecided && (
            <button
              className="dn-btn dn-btn--sm"
              style={{ marginLeft: "auto" }}
              onClick={() => setShowShareModal(true)}
            >
              📤 Share
            </button>
          )}
          {proposal.status === "OPEN" && (
            <button
              className="dn-btn dn-btn--sm"
              style={{ marginLeft: "auto" }}
              onClick={() => setShowInviteModal(true)}
            >
              🗳 Invite someone to vote
            </button>
          )}
        </div>

        {/* DECIDED: winning option banner */}
        {isDecided && winningOption && (
          <div
            className="dn-card"
            style={{
              marginBottom: 32,
              background: "linear-gradient(135deg, rgba(14,140,140,0.08), rgba(124,181,24,0.08))",
              border: "2px solid var(--lime)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
              {/* image */}
              {winningOption.imageUrl ? (
                <img
                  src={winningOption.imageUrl}
                  alt={winningOption.name}
                  style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 20, flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div style={{
                  width: 120, height: 90, borderRadius: 20, flexShrink: 0,
                  background: getCategoryColor(winningOption.category),
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
                }}>
                  {getCategoryEmoji(winningOption.category)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 12, color: "var(--lime)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4 }}>
                  🏆 The plan
                </div>
                <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>{winningOption.name}</h2>
                {winningOption.address && (
                  <p style={{ color: "var(--ink2)", fontSize: 13, margin: "0 0 4px" }}>📍 {winningOption.address}</p>
                )}
                {winningOption.eventDate && (
                  <p style={{ color: "var(--ink2)", fontSize: 13, margin: "0 0 4px" }}>
                    📅 {formatEventDate(winningOption.eventDate)}
                  </p>
                )}
                {/* Share this plan button */}
                <button
                  className="dn-btn"
                  style={{ marginTop: 12 }}
                  onClick={() => setShowShareModal(true)}
                >
                  Share this plan 🎉
                </button>
                <p style={{ fontSize: 13, color: "var(--ink2)", margin: "14px 0 0", lineHeight: 1.5 }}>
                  Relive it later — the plan stays right here.{" "}
                  <Link to="/suggestions" style={{ color: "var(--primary)", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                    Ready for the next one? →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2-column layout */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}
          className="proposal-grid"
        >
          {/* Left: Options 2-up grid */}
          <div>
            <h3 style={{ marginBottom: 16, color: "var(--ink2)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Options
            </h3>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
              className="proposal-options-grid"
              data-testid="proposal-items"
            >
              {options.map((option, i) => {
                const hasMyVote = myVotedOptionId === option.id;
                const tallyEntry = tally.find((t) => t.optionId === option.id);
                const voteCount = tallyEntry?.votes ?? option.votes?.length ?? 0;
                const consensus = tallyEntry?.consensus ?? false;
                const catColor = getCategoryColor(option.category);
                const catEmoji = getCategoryEmoji(option.category);

                return (
                  <div
                    key={option.id}
                    className={`dn-card${i % 2 === 1 ? " dn-card--alt1" : ""}`}
                    style={{
                      background: consensus ? "var(--lime-soft)" : "var(--surface)",
                      position: "relative",
                      padding: 0,
                      overflow: "hidden",
                    }}
                  >
                    {/* Image header */}
                    {option.imageUrl ? (
                      <img
                        src={option.imageUrl}
                        alt={option.name}
                        style={{
                          width: "100%",
                          height: 160,
                          objectFit: "cover",
                          borderRadius: "12px 12px 0 0",
                          display: "block",
                        }}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          const fallback = img.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = "flex";
                          img.style.display = "none";
                        }}
                      />
                    ) : null}
                    {/* Fallback colored block — always rendered, hidden if imageUrl loaded */}
                    <div
                      style={{
                        width: "100%",
                        height: 160,
                        background: catColor,
                        borderRadius: "12px 12px 0 0",
                        display: option.imageUrl ? "none" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 48,
                      }}
                      aria-hidden="true"
                    >
                      {catEmoji}
                    </div>

                    {/* Heart vote button */}
                    <button
                      onClick={() => {
                        if (hasMyVote) {
                          retractMutation.mutate(undefined as never);
                        } else {
                          voteMutation.mutate({ optionId: option.id });
                        }
                      }}
                      disabled={voteMutation.isPending || retractMutation.isPending}
                      style={{
                        position: "absolute",
                        top: 136,
                        right: 16,
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        border: "none",
                        cursor: "pointer",
                        background: hasMyVote ? "var(--lime)" : "var(--surface)",
                        color: hasMyVote ? "var(--on-lime)" : "var(--ink2)",
                        fontSize: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--shadow-dock)",
                        transition: "transform 150ms, background 150ms",
                        zIndex: 2,
                      }}
                      aria-label={hasMyVote ? "Remove vote" : "Vote for this option"}
                    >
                      {hasMyVote ? "♥" : "♡"}
                    </button>

                    {/* Card body */}
                    <div style={{ padding: "14px 16px 16px" }}>
                      <h3 style={{ fontSize: 14, marginBottom: 4, marginTop: 0 }}>
                        {option.name ?? `Option ${i + 1}`}
                      </h3>

                      {option.address && (
                        <p style={{ color: "var(--ink2)", fontSize: 12, margin: "0 0 3px" }}>
                          📍 {option.address}
                        </p>
                      )}

                      {/* Rating + price */}
                      {(option.rating != null || option.priceLevel != null) && (
                        <p style={{ color: "var(--ink2)", fontSize: 12, margin: "0 0 3px" }}>
                          {option.rating != null && `★ ${option.rating.toFixed(1)}`}
                          {option.rating != null && option.priceLevel != null && "  "}
                          {option.priceLevel != null && formatPriceLevel(option.priceLevel)}
                        </p>
                      )}

                      {/* Event date */}
                      {option.eventDate && (
                        <p style={{ color: "var(--ink2)", fontSize: 12, margin: "0 0 3px" }}>
                          📅 {formatEventDate(option.eventDate)}
                        </p>
                      )}

                      {option.category && (
                        <span className="dn-sticker dn-sticker--lime" style={{ fontSize: 11 }}>
                          {option.category}
                        </span>
                      )}

                      <p style={{ color: "var(--ink2)", fontSize: 12, marginTop: 6, marginBottom: 4 }}>
                        {voteCount}{memberCount > 0 ? `/${memberCount}` : ""} vote{voteCount !== 1 ? "s" : ""}
                        {consensus && " ✓"}
                      </p>

                      {/* View details link */}
                      {option.sourceUrl && (
                        <a
                          href={option.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 12, color: "var(--primary)", textDecoration: "none" }}
                        >
                          View Details →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {options.length === 0 && (
              <div className="dn-card" style={{ textAlign: "center", padding: 40 }}>
                <p style={{ color: "var(--ink2)" }}>No options yet.</p>
              </div>
            )}
          </div>

          {/* Right: Status + Votes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status card */}
            <div className="dn-card dn-card--alt2">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                {statusSticker()}
              </div>
              {(proposal.dateTime || proposal.proposedDate) && (
                <p style={{ color: "var(--ink2)", fontSize: 13, marginBottom: 4 }}>
                  Date: <strong style={{ color: "var(--ink)" }}>
                    {proposal.dateTime
                      ? new Date(proposal.dateTime).toLocaleDateString()
                      : proposal.proposedDate}
                  </strong>
                </p>
              )}
              <p style={{ color: "var(--ink2)", fontSize: 13 }} data-testid="proposal-status">
                Status: <strong style={{ color: "var(--ink)" }}>{proposal.status}</strong>
              </p>
              {memberCount > 0 && (
                <p style={{ color: "var(--ink2)", fontSize: 13 }}>
                  Members: <strong>{memberCount}</strong>
                </p>
              )}

              {/* Show celebration button if decided */}
              {isDecided && (
                <button
                  className="dn-btn dn-btn--sm"
                  style={{ marginTop: 10 }}
                  onClick={() => setShowCelebration(true)}
                >
                  🎉 See the match!
                </button>
              )}
            </div>

            {/* Tally */}
            {tally.length > 0 && (
              <div className="dn-card dn-card--alt3">
                <h3 style={{ marginBottom: 14, fontSize: 15 }}>Vote tally</h3>
                {tally.map((t) => {
                  const opt = options.find((o) => o.id === t.optionId);
                  const pct = memberCount > 0 ? Math.round((t.votes / memberCount) * 100) : 0;
                  return (
                    <div key={t.optionId} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)" }}>
                          {opt?.name ?? t.optionId}
                        </span>
                        <span style={{ fontSize: 12, color: t.consensus ? "var(--success)" : "var(--ink2)" }}>
                          {t.votes}{memberCount > 0 ? `/${memberCount}` : ""} {t.consensus ? "✓" : ""}
                        </span>
                      </div>
                      <div style={{ height: 6, background: "var(--line)", borderRadius: 3 }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: t.consensus ? "var(--lime)" : "var(--primary)",
                            borderRadius: 3,
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mismatch / counter banner */}
            {(proposal.status === "OPEN" || proposal.status === "pending") && (
              <div
                style={{
                  background: "var(--warning-soft)",
                  borderRadius: 20,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <p style={{ color: "var(--on-warning-soft)", fontSize: 13, margin: 0 }}>
                  ⚠️ Voting is open
                </p>
                <button
                  className="dn-btn dn-btn--sm dn-btn--ink"
                  onClick={() => setShowCounter(true)}
                >
                  Counter-propose
                </button>
              </div>
            )}

            {/* Counter-proposal form */}
            {showCounter && (
              <div className="dn-card dn-card--alt1" style={{ border: "1.5px solid var(--warning)" }}>
                <h3 style={{ marginBottom: 12, fontSize: 15 }}>Counter-proposal</h3>
                <p style={{ color: "var(--ink2)", fontSize: 13, marginBottom: 8 }}>
                  Counter-proposals require a new plan. Use the group page to create a new proposal.
                </p>
                <button
                  className="dn-btn dn-btn--secondary"
                  onClick={() => setShowCounter(false)}
                >
                  Close
                </button>
              </div>
            )}

            {/* Delete / Cancel Date Plan */}
            {(proposal.status === "OPEN" || proposal.status === "pending") && (
              <button
                className="dmu-btn dmu-btn-ghost dmu-danger"
                style={{ width: "100%", marginTop: 8 }}
                onClick={() => cancelMutation.mutate(undefined as never)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling…" : "Delete Date Plan"}
              </button>
            )}
          </div>
        </div>

        {/* ── Match celebration overlay ────────────────────────────────────── */}
        {showCelebration && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "linear-gradient(135deg, #0E8C8C 0%, #7CB518 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 400,
              overflow: "hidden",
            }}
          >
            <ConfettiStyle />

            {/* Confetti */}
            {CONFETTI_PIECES.map((p) => (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: `${p.left}%`,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                  animation: `dn-confetti-fall ${p.duration}s ${p.delay}s ease-in infinite`,
                  opacity: 0,
                }}
                aria-hidden="true"
              />
            ))}

            {/* Card */}
            <div
              style={{
                background: "rgba(255,255,255,0.95)",
                borderRadius: 32,
                padding: "40px 32px",
                maxWidth: 480,
                width: "90%",
                textAlign: "center",
                position: "relative",
                zIndex: 2,
                boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
              }}
            >
              <h1 style={{ fontFamily: "Sora, var(--font-display), sans-serif", fontSize: 32, marginBottom: 8, color: "#0E8C8C" }}>
                🎉 It's a Match!
              </h1>
              <p style={{ color: "var(--ink2)", marginBottom: 24 }}>Everyone agreed. It's happening!</p>

              {winningOption && (
                <div style={{ marginBottom: 24 }}>
                  {/* Option image */}
                  {winningOption.imageUrl ? (
                    <img
                      src={winningOption.imageUrl}
                      alt={winningOption.name}
                      style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 16, marginBottom: 16 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: 160, borderRadius: 16, marginBottom: 16,
                      background: getCategoryColor(winningOption.category),
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64,
                    }}>
                      {getCategoryEmoji(winningOption.category)}
                    </div>
                  )}
                  <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>{winningOption.name}</h2>
                  {winningOption.address && (
                    <p style={{ color: "var(--ink2)", fontSize: 14, margin: "0 0 4px" }}>📍 {winningOption.address}</p>
                  )}
                  {winningOption.eventDate && (
                    <p style={{ color: "var(--ink2)", fontSize: 14, margin: 0 }}>📅 {formatEventDate(winningOption.eventDate)}</p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Add to Calendar */}
                <a
                  href={buildGoogleCalendarUrl(
                    proposal.title ?? winningOption?.name ?? "Our Plan",
                    winningOption?.address ?? "",
                    winningOption?.eventDate ?? proposal.dateTime,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dn-btn"
                  style={{ textDecoration: "none", display: "block" }}
                >
                  📅 Add to Calendar
                </a>

                {/* Share Plan */}
                <button
                  className="dn-btn"
                  style={{ background: "var(--lime)", color: "#fff", border: "none" }}
                  onClick={() => {
                    setShowCelebration(false);
                    setShowShareModal(true);
                  }}
                >
                  📤 Share Plan
                </button>

                {/* View Plan */}
                <button
                  className="dn-btn dn-btn--secondary"
                  onClick={() => setShowCelebration(false)}
                >
                  View Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Share modal ──────────────────────────────────────────────────── */}
        {showShareModal && proposalId && (
          <ShareModal
            proposalId={proposalId}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {/* ── Invite-to-vote modal (guest voting) ──────────────────────────── */}
        {showInviteModal && proposalId && (
          <InviteVoteModal
            proposalId={proposalId}
            soloIntro={soloShare}
            onClose={() => setShowInviteModal(false)}
          />
        )}

        {/* error display */}
        {(voteMutation.isError || retractMutation.isError) && (
          <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 16 }}>
            {(voteMutation.error as AxiosError<ApiError>)?.response?.data?.message ??
             (retractMutation.error as AxiosError<ApiError>)?.response?.data?.message ??
             "Vote action failed"}
          </p>
        )}

        <style>{`
          @media (max-width: 768px) {
            .proposal-grid {
              grid-template-columns: 1fr !important;
            }
            .proposal-options-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 480px) {
            .proposal-options-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
