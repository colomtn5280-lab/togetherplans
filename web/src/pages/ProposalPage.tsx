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
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const fmt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      dates = `&dates=${fmt(start)}/${fmt(end)}`;
    } catch {
      // no dates
    }
  }
  return `${base}&text=${text}${dates}&details=${details}`;
}

// ── Confetti ──────────────────────────────────────────────────────────────────
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

// ── Invite-to-vote modal ──────────────────────────────────────────────────────
function InviteVoteModal({ proposalId, soloIntro, onClose }: { proposalId: string; soloIntro?: boolean; onClose: () => void }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    proposalsApi.shareLink(proposalId)
      .then((res) => {
        setShareUrl(res.data.shareUrl);
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
            : "Anyone with this link can vote on the options — no account needed."}
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

// ── Status sticker ────────────────────────────────────────────────────────────
function StatusSticker({ status }: { status: string }) {
  const isDecided = status === "DECIDED" || status === "locked";
  const isCancelled = status === "CANCELLED" || status === "rejected";

  const styles: React.CSSProperties = {
    display: "inline-block",
    padding: "5px 10px",
    marginBottom: 10,
    borderRadius: "12px 6px 14px 6px",
    fontFamily: "Sora, var(--font-display), sans-serif",
    fontWeight: 800,
    fontSize: 10,
    letterSpacing: ".08em",
    ...(isDecided
      ? { background: "var(--lime, #7CB518)", color: "#101820", transform: "rotate(-3deg)" }
      : isCancelled
        ? { background: "var(--line, #DDE3E8)", color: "var(--ink2, #5D6B76)", transform: "none" }
        : { background: "#FCE44E", color: "#101820", transform: "rotate(-3deg)" }),
  };

  return (
    <span style={styles}>
      {isDecided ? "IT'S A MATCH" : isCancelled ? "CANCELLED" : "VOTING OPEN"}
    </span>
  );
}

// ── Option card (horizontal, 10.12.26 design) ─────────────────────────────────
const CARD_RADII = [
  "22px 30px 20px 26px",
  "30px 22px 26px 20px",
  "20px 26px 30px 22px",
];

interface OptionCardProps {
  option: any;
  index: number;
  hasMyVote: boolean;
  voteCount: number;
  memberCount: number;
  consensus: boolean;
  canVote: boolean;
  onVote: () => void;
  onRetract: () => void;
  votePending: boolean;
}

function OptionCard({ option, index, hasMyVote, voteCount, memberCount, consensus, canVote, onVote, onRetract, votePending }: OptionCardProps) {
  const catColor = getCategoryColor(option.category);
  const catEmoji = getCategoryEmoji(option.category);
  const radius = CARD_RADII[index % 3];

  const heartStyle: React.CSSProperties = {
    appearance: "none",
    flexShrink: 0,
    width: 52,
    height: 52,
    borderRadius: "50% 45% 55% 50%",
    border: `2px solid ${hasMyVote ? "var(--primary, #0E8C8C)" : "var(--line, #DDE3E8)"}`,
    background: hasMyVote ? "var(--primary, #0E8C8C)" : "var(--surface, #fff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: canVote ? "pointer" : "default",
    transition: "transform .15s, background .15s, border-color .15s",
    fontSize: 22,
    color: hasMyVote ? "#fff" : "var(--ink2, #5D6B76)",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px minmax(0,1fr)",
        background: consensus ? "var(--lime-soft, #EAF6D3)" : "var(--surface, #fff)",
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(16,24,32,.07)",
        marginBottom: 14,
      }}
      className="proposal-option-card"
    >
      {/* Photo */}
      <div
        style={{
          position: "relative",
          minHeight: 170,
          background: catColor,
          backgroundImage: option.imageUrl ? `url(${option.imageUrl}), linear-gradient(135deg,#086B6B,#0E8C8C)` : `linear-gradient(135deg,${catColor},${catColor})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Category chip */}
        <span style={{
          position: "absolute",
          left: 12,
          top: 12,
          padding: "4px 9px",
          borderRadius: 999,
          background: "rgba(255,255,255,.92)",
          color: "#086B6B",
          fontFamily: "Sora, var(--font-display), sans-serif",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: ".04em",
        }}>
          {option.category ?? catEmoji}
        </span>

        {/* No image fallback emoji */}
        {!option.imageUrl && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            color: "#fff",
          }} aria-hidden="true">
            {catEmoji}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ display: "flex", flexDirection: "column", padding: "18px 20px" }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2, letterSpacing: "-.02em", margin: "0 0 10px" }}>
          {option.name ?? `Option ${index + 1}`}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink2, #5D6B76)", flex: 1 }}>
          {option.address && (
            <span style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2, color: "var(--primary, #0E8C8C)" }} aria-hidden="true">
                <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>
              </svg>
              {option.address}
            </span>
          )}
          {option.eventDate && (
            <span style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2, color: "var(--primary, #0E8C8C)" }} aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="4"/><path d="M3 10h18M8 3v3M16 3v3"/>
              </svg>
              {formatEventDate(option.eventDate)}
            </span>
          )}
          {(option.rating != null || option.priceLevel != null) && (
            <span style={{ display: "flex", gap: 8 }}>
              {option.rating != null && <span>★ {option.rating.toFixed(1)}</span>}
              {option.priceLevel != null && <span>{formatPriceLevel(option.priceLevel)}</span>}
            </span>
          )}
          {option.sourceUrl && (
            <a
              href={option.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "var(--primary, #0E8C8C)", textDecoration: "none", marginTop: 4 }}
            >
              View details →
            </a>
          )}
        </div>

        {/* Footer: who's voted hint + heart */}
        <div style={{ marginTop: "auto", paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--ink2, #5D6B76)" }}>
            {consensus
              ? "✓ Everyone picked this"
              : hasMyVote
                ? "Your vote is in"
                : "Tap heart to vote"}
            {memberCount > 0 && !consensus && ` · ${voteCount}/${memberCount}`}
          </span>
          {canVote && (
            <button
              onClick={hasMyVote ? onRetract : onVote}
              disabled={votePending}
              style={heartStyle}
              aria-pressed={hasMyVote}
              aria-label={hasMyVote ? "Remove vote" : `Vote for ${option.name}`}
              onMouseEnter={(e) => {
                if (!hasMyVote) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary, #0E8C8C)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!hasMyVote) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line, #DDE3E8)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                }
              }}
            >
              {hasMyVote ? "♥" : "♡"}
            </button>
          )}
        </div>
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
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
      setShowCancelConfirm(false);
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

  const options = proposal.options ?? proposal.items ?? [];
  const tally = proposal.tally ?? [];
  const memberCount = proposal.memberCount ?? 0;
  const myUserId = user?.userId ?? user?.id ?? "";
  const myVotedOptionId = options.find((opt: any) =>
    opt.votes?.some((v: any) => v.userId === myUserId)
  )?.id;

  const isDecided = proposal.status === "DECIDED" || proposal.status === "locked";
  const isOpen = proposal.status === "OPEN" || proposal.status === "pending";

  const winningOption =
    options.find((opt: any) => tally.find((t: any) => t.optionId === opt.id)?.consensus) ??
    options.reduce<any>((best: any, opt: any) => {
      const votes = tally.find((t: any) => t.optionId === opt.id)?.votes ?? 0;
      const bestVotes = best ? (tally.find((t: any) => t.optionId === best.id)?.votes ?? 0) : -1;
      return votes > bestVotes ? opt : best;
    }, null);

  // How many members have voted (at least one option)
  const votedCount = (() => {
    const voterIds = new Set<string>();
    options.forEach((opt: any) => {
      (opt.votes ?? []).forEach((v: any) => { if (v.userId) voterIds.add(v.userId); });
    });
    return voterIds.size;
  })();

  // Group name for back link
  const groupName = (proposal as any).group?.name ?? (proposal as any).groupName ?? "Group";

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

  // Format the proposal date for the details list
  const proposalDateStr = proposal.dateTime ?? proposal.proposedDate;
  const formattedDate = proposalDateStr
    ? new Date(proposalDateStr).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <>
      <AppNav />

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "0 clamp(16px,4vw,40px) 64px" }}>

        {/* ── Back link — pill shaped with group name ── */}
        <div style={{ padding: "14px 0 0" }}>
          <Link
            to={`/groups/${proposal.groupId}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 999,
              background: "var(--bg, #F4F6F8)",
              color: "var(--ink2, #5D6B76)",
              fontFamily: "Sora, var(--font-display), sans-serif",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              transition: "background .15s",
            }}
          >
            ← {groupName}
          </Link>
        </div>

        {/* ── Page head: status + title + invite button ── */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 18,
          marginTop: 14,
          marginBottom: 28,
          flexWrap: "wrap",
        }}>
          <div style={{ minWidth: 0 }}>
            <StatusSticker status={proposal.status} />
            <h1 style={{
              fontFamily: "Sora, var(--font-display), sans-serif",
              fontWeight: 800,
              fontSize: "clamp(24px,4vw,36px)",
              letterSpacing: "-.03em",
              lineHeight: 1.1,
              margin: "0 0 6px",
            }}>
              {proposal.title ?? "Proposal"}
            </h1>
            <p style={{ color: "var(--ink2, #5D6B76)", fontSize: 13, margin: 0 }}>
              {formattedDate}
              {(proposal as any).createdByName ? ` · proposed by ${(proposal as any).createdByName}` : ""}
              {options.length > 0 ? ` · ${options.length} option${options.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
            {isOpen && (
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  height: 42,
                  padding: "0 18px",
                  borderRadius: "22px 16px 22px 16px",
                  border: "1.5px solid var(--line, #DDE3E8)",
                  background: "transparent",
                  color: "var(--ink, #101820)",
                  fontFamily: "Sora, var(--font-display), sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "border-color .15s",
                }}
              >
                Invite someone to vote
              </button>
            )}
            {isDecided && (
              <button
                onClick={() => setShowShareModal(true)}
                style={{
                  height: 42,
                  padding: "0 18px",
                  borderRadius: "22px 16px 22px 16px",
                  border: "none",
                  background: "var(--primary, #0E8C8C)",
                  color: "#fff",
                  fontFamily: "Sora, var(--font-display), sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                📤 Share plan
              </button>
            )}
          </div>
        </div>

        {/* ── Decided: winner banner ── */}
        {isDecided && winningOption && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px minmax(0,1fr)",
              background: "linear-gradient(135deg, rgba(14,140,140,0.06), rgba(124,181,24,0.06))",
              border: "2px solid var(--lime, #7CB518)",
              borderRadius: "22px 30px 20px 26px",
              overflow: "hidden",
              marginBottom: 32,
            }}
            className="proposal-option-card"
          >
            <div style={{
              minHeight: 170,
              background: getCategoryColor(winningOption.category),
              backgroundImage: winningOption.imageUrl
                ? `url(${winningOption.imageUrl}), linear-gradient(135deg,#086B6B,#0E8C8C)`
                : undefined,
              backgroundPosition: "center",
              backgroundSize: "cover",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              color: "#fff",
              position: "relative",
            }}>
              {!winningOption.imageUrl && getCategoryEmoji(winningOption.category)}
              <span style={{
                position: "absolute",
                left: 12,
                top: 12,
                padding: "4px 9px",
                borderRadius: 999,
                background: "var(--lime, #7CB518)",
                color: "#101820",
                fontFamily: "Sora, var(--font-display), sans-serif",
                fontWeight: 700,
                fontSize: 10,
              }}>
                🏆 The plan
              </span>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>{winningOption.name}</h2>
              {winningOption.address && (
                <p style={{ color: "var(--ink2)", fontSize: 13, margin: "0 0 4px" }}>📍 {winningOption.address}</p>
              )}
              {winningOption.eventDate && (
                <p style={{ color: "var(--ink2)", fontSize: 13, margin: "0 0 12px" }}>
                  📅 {formatEventDate(winningOption.eventDate)}
                </p>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: "auto", flexWrap: "wrap" }}>
                <a
                  href={buildGoogleCalendarUrl(
                    proposal.title ?? winningOption.name ?? "Our Plan",
                    winningOption.address ?? "",
                    winningOption.eventDate ?? proposal.dateTime,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: "20px 14px 20px 14px",
                    background: "var(--primary, #0E8C8C)",
                    color: "#fff",
                    fontFamily: "Sora, var(--font-display), sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  📅 Add to Calendar
                </a>
                <button
                  onClick={() => setShowCelebration(true)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "14px 20px 14px 20px",
                    border: "1.5px solid var(--line)",
                    background: "transparent",
                    color: "var(--ink)",
                    fontFamily: "Sora, var(--font-display), sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  🎉 See the match!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Two-column grid ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 28, alignItems: "start" }}
          className="proposal-grid"
        >
          {/* ── Main: Options ── */}
          <section>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}>
              <span style={{
                fontFamily: "Sora, var(--font-display), sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--ink2)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}>
                Options · tap a heart to vote
              </span>
            </div>

            <div data-testid="proposal-items">
              {options.map((option: any, i: number) => {
                const tallyEntry = tally.find((t: any) => t.optionId === option.id);
                const voteCount = tallyEntry?.votes ?? option.votes?.length ?? 0;
                const consensus = tallyEntry?.consensus ?? false;
                const hasMyVote = myVotedOptionId === option.id;

                return (
                  <OptionCard
                    key={option.id}
                    option={option}
                    index={i}
                    hasMyVote={hasMyVote}
                    voteCount={voteCount}
                    memberCount={memberCount}
                    consensus={consensus}
                    canVote={isOpen}
                    onVote={() => voteMutation.mutate({ optionId: option.id })}
                    onRetract={() => retractMutation.mutate(undefined as never)}
                    votePending={voteMutation.isPending || retractMutation.isPending}
                  />
                );
              })}
            </div>

            {options.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "var(--ink2)" }}>
                No options yet.
              </div>
            )}

            {/* Add option row (proposer only, while nobody has voted) */}
            {isOpen && votedCount === 0 && (
              <Link
                to="/discover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 18px",
                  border: "2px dashed var(--line, #DDE3E8)",
                  borderRadius: "22px 18px 24px 18px",
                  color: "var(--ink, #101820)",
                  textDecoration: "none",
                  marginTop: 4,
                  transition: "border-color .15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--primary, #0E8C8C)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--line, #DDE3E8)"; }}
              >
                <span style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--primary-soft, #D9F1F0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--primary, #0E8C8C)",
                }}>
                  +
                </span>
                <span>
                  <b style={{ display: "block", fontFamily: "Sora, var(--font-display), sans-serif", fontSize: 15 }}>Add another option</b>
                  <small style={{ fontSize: 12, color: "var(--ink2)" }}>Two or three ideas make it easier to agree</small>
                </span>
              </Link>
            )}

            {/* Vote/retract errors */}
            {(voteMutation.isError || retractMutation.isError) && (
              <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 16 }}>
                {(voteMutation.error as AxiosError<ApiError>)?.response?.data?.message ??
                 (retractMutation.error as AxiosError<ApiError>)?.response?.data?.message ??
                 "Vote action failed"}
              </p>
            )}
          </section>

          {/* ── Rail ── */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Who's voted card */}
            <div style={{
              background: "var(--surface, #fff)",
              borderRadius: "22px 30px 20px 26px",
              padding: "20px 22px",
              boxShadow: "0 4px 16px rgba(16,24,32,.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontFamily: "Sora, var(--font-display), sans-serif", fontWeight: 800, fontSize: 15 }}>
                  Who's voted
                </h2>
                <span style={{ fontFamily: "Sora, var(--font-display), sans-serif", fontWeight: 700, fontSize: 12, color: "var(--ink2)" }}>
                  {votedCount} of {memberCount || "?"}
                </span>
              </div>

              {/* Progress bar */}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={memberCount || 1}
                aria-valuenow={votedCount}
                style={{ height: 8, borderRadius: 999, background: "var(--bg, #F4F6F8)", overflow: "hidden", marginBottom: 16 }}
              >
                <span style={{
                  display: "block",
                  height: "100%",
                  width: memberCount > 0 ? `${Math.round((votedCount / memberCount) * 100)}%` : "0%",
                  borderRadius: 999,
                  background: "var(--lime, #7CB518)",
                  transition: "width .4s ease",
                }} />
              </div>

              <p style={{ fontSize: 12, color: "var(--ink2)", margin: 0, lineHeight: 1.5 }}>
                Hearts stay hidden until everyone has voted. The plan locks in when you both pick the same option.
              </p>

              {isOpen && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    marginTop: 14,
                    width: "100%",
                    height: 38,
                    borderRadius: "20px 14px 20px 14px",
                    border: "1.5px solid var(--line, #DDE3E8)",
                    background: "transparent",
                    color: "var(--ink, #101820)",
                    fontFamily: "Sora, var(--font-display), sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Invite
                </button>
              )}
            </div>

            {/* Not feeling it? / Counter-propose card */}
            {isOpen && (
              <div style={{
                background: "var(--surface, #fff)",
                borderRadius: "30px 22px 26px 20px",
                padding: "20px 22px",
                boxShadow: "0 4px 16px rgba(16,24,32,.07)",
              }}>
                <h2 style={{ margin: "0 0 8px", fontFamily: "Sora, var(--font-display), sans-serif", fontWeight: 800, fontSize: 15 }}>
                  Not feeling it?
                </h2>
                <p style={{ color: "var(--ink2)", fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
                  Counter-propose to keep your options and swap in new ones. Votes reset.
                </p>
                <Link
                  to={`/groups/${proposal.groupId}`}
                  style={{
                    display: "flex",
                    width: "100%",
                    height: 42,
                    borderRadius: "22px 16px 22px 16px",
                    background: "var(--primary, #0E8C8C)",
                    color: "#fff",
                    fontFamily: "Sora, var(--font-display), sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                    }}
                >
                  Counter-propose
                </Link>

                {/* Cancel — with confirmation */}
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    style={{
                      width: "100%",
                      height: 38,
                      borderRadius: "16px 22px 16px 22px",
                      border: "1.5px solid transparent",
                      background: "transparent",
                      color: "var(--error, #EF4444)",
                      fontFamily: "Sora, var(--font-display), sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cancel proposal
                  </button>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 10 }}>
                      Are you sure? This can't be undone.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        style={{
                          flex: 1, height: 36, borderRadius: 999,
                          border: "1.5px solid var(--line)", background: "transparent",
                          color: "var(--ink)", cursor: "pointer", fontSize: 13, fontWeight: 700,
                          fontFamily: "Sora, var(--font-display), sans-serif",
                        }}
                      >
                        Keep it
                      </button>
                      <button
                        onClick={() => cancelMutation.mutate(undefined as never)}
                        disabled={cancelMutation.isPending}
                        style={{
                          flex: 1, height: 36, borderRadius: 999,
                          border: "none", background: "var(--error, #EF4444)",
                          color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
                          fontFamily: "Sora, var(--font-display), sans-serif",
                          opacity: cancelMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        {cancelMutation.isPending ? "Cancelling…" : "Yes, cancel"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Details list */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "4px 4px 0",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                <span style={{ color: "var(--ink2)" }}>Date</span>
                <b style={{ fontWeight: 600, textAlign: "right" }}>{formattedDate}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                <span style={{ color: "var(--ink2)" }}>Group</span>
                <b style={{ fontWeight: 600, textAlign: "right" }}>{groupName}</b>
              </div>
              {isOpen && memberCount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                  <span style={{ color: "var(--ink2)" }}>Reminder</span>
                  <b style={{ fontWeight: 600, textAlign: "right" }}>24h before, if not everyone's voted</b>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                <span style={{ color: "var(--ink2)" }}>Status</span>
                <b style={{ fontWeight: 600, textAlign: "right" }} data-testid="proposal-status">{proposal.status}</b>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Match celebration overlay ── */}
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

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

        {/* ── Share modal ── */}
        {showShareModal && proposalId && (
          <ShareModal
            proposalId={proposalId}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {/* ── Invite-to-vote modal ── */}
        {showInviteModal && proposalId && (
          <InviteVoteModal
            proposalId={proposalId}
            soloIntro={soloShare}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </main>

      <style>{`
        @media (max-width: 960px) {
          .proposal-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 767px) {
          .proposal-option-card {
            grid-template-columns: 1fr !important;
          }
          .proposal-option-card > div:first-child {
            min-height: 160px !important;
          }
        }
      `}</style>
    </>
  );
}
