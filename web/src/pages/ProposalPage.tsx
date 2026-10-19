import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { proposalsApi, shareCardsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import { useAuthStore } from "../store/auth.store";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";
import "./proposal.css";

// ── Category helpers ──────────────────────────────────────────────────────────
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

// ── Option card (horizontal, dmu-* CSS classes) ───────────────────────────────
interface OptionCardProps {
  option: any;
  index: number;
  mySentiment: string | null;
  voteCount: number;
  memberCount: number;
  consensus: boolean;
  canVote: boolean;
  onVote: (sentiment: 'APPROVE' | 'MAYBE' | 'REJECT', comment?: string) => void;
  votePending: boolean;
  existingComment?: string;
}

function OptionCard({ option, index, mySentiment, voteCount, memberCount, consensus, canVote, onVote, votePending, existingComment }: OptionCardProps) {
  const catEmoji = getCategoryEmoji(option.category);
  const [voteComment, setVoteComment] = useState(existingComment ?? '');

  // nth-child index is 1-based; here we replicate the CSS pattern manually for the winner card override
  const nthClass = consensus ? "dmu-option dmu-option-winner" : "dmu-option";

  return (
    <article className={nthClass}>
      {/* Left: photo */}
      <div
        className="dmu-option-img"
        style={{
          backgroundImage: option.imageUrl
            ? `url(${option.imageUrl}),linear-gradient(135deg,#086B6B,#0E8C8C)`
            : "linear-gradient(135deg,#086B6B,#0E8C8C)",
        }}
      >
        <span className="dmu-option-cat">
          {option.category ?? catEmoji}
        </span>
        {option.imageCredit && (
          <span className="dmu-credit">{option.imageCredit}</span>
        )}
        {!option.imageUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              color: "#fff",
            }}
            aria-hidden="true"
          >
            {catEmoji}
          </div>
        )}
      </div>

      {/* Right: body */}
      <div className="dmu-option-body">
        <h2>{option.name ?? `Option ${index + 1}`}</h2>

        <div className="dmu-option-meta">
          {option.address && (
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>
              </svg>
              {option.address}
            </span>
          )}
          {option.eventDate && (
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="4"/><path d="M3 10h18M8 3v3M16 3v3"/>
              </svg>
              {formatEventDate(option.eventDate)}
            </span>
          )}
          {(option.rating != null || option.priceLevel != null) && (
            <span>
              {option.rating != null && <span>★ {option.rating.toFixed(1)}</span>}
              {option.priceLevel != null && <span>{formatPriceLevel(option.priceLevel)}</span>}
            </span>
          )}
          {option.sourceUrl && (
            <span>
              <a
                href={option.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: "var(--primary)", textDecoration: "none" }}
              >
                View details →
              </a>
            </span>
          )}
        </div>

        <div className="dmu-option-foot" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
          <span className="dmu-voters">
            {consensus
              ? "✓ Everyone picked this"
              : mySentiment
                ? "You've voted on this one"
                : memberCount > 1
                  ? "Tap to vote — you can approve multiple options"
                  : "Tap to vote — you can approve multiple options"}
            {memberCount > 0 && !consensus && ` · ${voteCount}/${memberCount}`}
          </span>
          {canVote && (
            <div className="dmu-vote-row">
              <button
                className="dmu-vote-btn dmu-vote-approve"
                aria-pressed={mySentiment === 'APPROVE'}
                onClick={() => onVote('APPROVE')}
                disabled={votePending}
              >
                {mySentiment === 'APPROVE' ? "✓ I'm in 👍" : "I'm in 👍"}
              </button>
              <button
                className="dmu-vote-btn dmu-vote-maybe"
                aria-pressed={mySentiment === 'MAYBE'}
                onClick={() => onVote('MAYBE')}
                disabled={votePending}
              >
                {mySentiment === 'MAYBE' ? "✓ Maybe 🤔" : "Maybe 🤔"}
              </button>
              <button
                className="dmu-vote-btn dmu-vote-reject"
                aria-pressed={mySentiment === 'REJECT'}
                onClick={() => onVote('REJECT')}
                disabled={votePending}
              >
                {mySentiment === 'REJECT' ? "✗ Don't think so 🙅" : "Don't think so 🙅"}
              </button>
            </div>
          )}
          {mySentiment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                className="dmu-vote-comment"
                placeholder="Add a note... (optional)"
                maxLength={280}
                value={voteComment}
                onChange={e => setVoteComment(e.target.value)}
                rows={2}
              />
              <button
                className="dmu-btn dmu-btn-auto"
                style={{ alignSelf: 'flex-end', height: 32, fontSize: 12, padding: '0 16px' }}
                onClick={() => onVote(mySentiment as 'APPROVE'|'MAYBE'|'REJECT', voteComment)}
                disabled={votePending}
              >
                Save note
              </button>
            </div>
          )}
          {option.votes?.filter((v: any) => v.comment).map((v: any) => (
            <div key={v.id} className="dmu-vote-note">
              <span className="dmu-vote-note-name">{v.user?.displayName?.split(' ')[0]}:</span>
              <span className="dmu-vote-note-text">"{v.comment}"</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ProposalPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const soloShare = !!(location.state as { openInvite?: boolean } | null)?.openInvite;
  const [showInviteModal, setShowInviteModal] = useState(soloShare);
  const prevStatusRef = useRef<string | null>(null);
  const confettiInjectedRef = useRef(false);

  const { data: proposal, isLoading, isError, refetch } = useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => {
      const res = await proposalsApi.get(proposalId!);
      return res.data;
    },
    enabled: !!proposalId,
    // SSE handles real-time updates when OPEN; keep stale data until SSE pushes
    refetchInterval: false,
  });

  // SSE: real-time updates when proposal is OPEN
  const accessToken = useAuthStore((s) => s.accessToken) || localStorage.getItem('accessToken');
  useEffect(() => {
    if (!proposalId || !accessToken || proposal?.status !== 'OPEN') return;

    const apiBase = (import.meta as any).env?.VITE_API_URL || 'https://datenight-api-mh74edz3ja-uc.a.run.app';
    const url = `${apiBase}/api/proposals/${proposalId}/stream?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'update' && msg.proposal) {
          queryClient.setQueryData(['proposal', proposalId], (old: any) => ({
            ...old,
            ...msg.proposal,
          }));
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      es.close();
      // Fallback: single manual refetch after 5s on SSE failure
      const t = setTimeout(() => { refetch(); }, 5000);
      return () => clearTimeout(t);
    };

    return () => es.close();
  }, [proposalId, accessToken, proposal?.status, queryClient, refetch]);

  useEffect(() => {
    if (!proposal) return;
    const prev = prevStatusRef.current;
    const current = proposal.status;
    if (
      (current === "DECIDED" || current === "locked") &&
      !celebrationDismissed
    ) {
      if (prev === null || (prev !== "DECIDED" && prev !== "locked")) {
        setShowCelebration(true);
      }
    }
    prevStatusRef.current = current;
  }, [proposal?.status, celebrationDismissed]);

  useEffect(() => {
    if (!proposal) return;
    if (prevStatusRef.current === null) {
      prevStatusRef.current = proposal.status;
    }
  }, [proposal]);

  const voteMutation = useMutation<unknown, AxiosError<ApiError>, { optionId: string; sentiment: 'APPROVE' | 'MAYBE' | 'REJECT'; comment?: string }>({
    mutationFn: async ({ optionId, sentiment, comment }) => {
      const res = await proposalsApi.vote(proposalId!, optionId, sentiment, comment);
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

  const [newComment, setNewComment] = useState('');

  const { data: comments = [] } = useQuery({
    queryKey: ['proposal-comments', proposalId],
    queryFn: async () => { const r = await proposalsApi.getComments(proposalId!); return r.data; },
    enabled: !!proposalId,
  });

  const addCommentMutation = useMutation({
    mutationFn: (body: string) => proposalsApi.addComment(proposalId!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposal-comments', proposalId] }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => proposalsApi.deleteComment(proposalId!, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposal-comments', proposalId] }),
  });

  if (isLoading) return (
    <>
      <AppNav />
      <main className="dmu-wrap dmu-page" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--ink2)" }}>Loading proposal…</p>
      </main>
    </>
  );

  if (isError || !proposal) return (
    <>
      <AppNav />
      <main className="dmu-wrap dmu-page" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🗓️</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>{t('proposal.planNotFound')}</h1>
        <p style={{ color: "var(--ink2)", marginBottom: "2rem", maxWidth: 360, margin: "0 auto 2rem" }}>
          {t('proposal.planNotFoundDesc')}
        </p>
        <Link to="/groups" className="dn-btn dn-btn--primary" style={{ display: "inline-block" }}>
          {t('proposal.backToPlans')}
        </Link>
      </main>
    </>
  );

  const options = proposal.options ?? proposal.items ?? [];
  const tally = proposal.tally ?? [];
  const memberCount = proposal.memberCount ?? 0;
  const members: any[] = (proposal as any).members ?? [];
  const myUserId = user?.userId ?? user?.id ?? "";
  // Map of optionId -> sentiment ('APPROVE'|'MAYBE'|'REJECT')
  const myVoteMap = new Map<string, string>(
    options
      .filter((opt: any) => opt.votes?.some((v: any) => v.userId === myUserId))
      .map((opt: any) => {
        const v = opt.votes.find((v: any) => v.userId === myUserId);
        return [opt.id, v?.sentiment ?? 'APPROVE'];
      })
  );

  const isDecided = proposal.status === "DECIDED" || proposal.status === "locked";
  const isOpen = proposal.status === "OPEN" || proposal.status === "pending";
  const isCancelled = proposal.status === "CANCELLED" || proposal.status === "rejected";

  const winningOption =
    options.find((opt: any) => tally.find((t: any) => t.optionId === opt.id)?.consensus) ??
    options.reduce<any>((best: any, opt: any) => {
      const votes = tally.find((t: any) => t.optionId === opt.id)?.votes ?? 0;
      const bestVotes = best ? (tally.find((t: any) => t.optionId === best.id)?.votes ?? 0) : -1;
      return votes > bestVotes ? opt : best;
    }, null);

  // All options with consensus=true in tally (for multi-consensus display)
  const consensusOptions = options.filter((opt: any) =>
    tally.find((t: any) => t.optionId === opt.id && t.consensus === true)
  );
  const runnerUpOption = consensusOptions.length > 1
    ? consensusOptions.find((opt: any) => opt.id !== winningOption?.id)
    : null;

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

  // Proposal date for meta line and details
  const proposalDateStr = proposal.dateTime ?? proposal.proposedDate;
  const formattedDate = proposalDateStr
    ? new Date(proposalDateStr).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "—";

  // Meta line: "Sat, Oct 10 · proposed by you · N options"
  const createdBy = (proposal as any).createdByUserId === myUserId
    ? "proposed by you"
    : (proposal as any).createdByName
      ? `proposed by ${(proposal as any).createdByName}`
      : "";
  const metaParts = [formattedDate, createdBy, options.length > 0 ? `${options.length} option${options.length !== 1 ? "s" : ""}` : ""].filter(Boolean);

  // Status sticker class
  const statusClass = isDecided
    ? "dmu-status dmu-status-matched"
    : isCancelled
      ? "dmu-status dmu-status-cancelled"
      : "dmu-status dmu-status-open";
  const statusLabel = isDecided ? "IT'S A MATCH" : isCancelled ? "CANCELLED" : "VOTING OPEN";

  // Progress bar width
  const progressPct = memberCount > 0 ? Math.round((votedCount / memberCount) * 100) : 0;

  // Avatar initial
  function avatarInitial(name: string): string {
    return (name ?? "?")[0].toUpperCase();
  }

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

      <main className="dmu-wrap dmu-page">

        {/* ── Back link: pill-shaped with group name, inside dmu-wrap ── */}
        <Link className="dmu-back" to={`/groups/${proposal.groupId}`}>
          ← {groupName}
        </Link>

        {/* ── Page head: status sticker + title + meta + invite button ── */}
        <div className="dmu-pr-head">
          <div className="dmu-pr-title">
            <span className={statusClass}>{statusLabel}</span>
            <h1 className="dmu-hello">{proposal.title ?? "Proposal"}</h1>
            <p className="dmu-sub">{metaParts.join(" · ")}</p>
          </div>

          {isOpen && (
            <button
              className="dmu-btn dmu-btn-ghost dmu-btn-auto dmu-pr-invite"
              type="button"
              onClick={() => setShowInviteModal(true)}
            >
              Invite someone to vote
            </button>
          )}
          {isDecided && (
            <button
              className="dmu-btn dmu-btn-primary dmu-btn-auto"
              type="button"
              style={{ height: 42 }}
              onClick={() => setShowShareModal(true)}
            >
              📤 Share plan
            </button>
          )}
        </div>

        {/* ── Two-column grid ── */}
        <div className="dmu-grid dmu-gd-grid">

          {/* ── Main column ── */}
          <section>

            {/* DECIDED: winner banner */}
            {isDecided && winningOption && (
              <div style={{ marginBottom: 28 }}>
                <div className="dmu-section-head"><span>🏆 The plan</span></div>
                <article className="dmu-option" style={{ border: "2px solid var(--lime, #7CB518)" }}>
                  <div
                    className="dmu-option-img"
                    style={{
                      backgroundImage: winningOption.imageUrl
                        ? `url(${winningOption.imageUrl}),linear-gradient(135deg,#086B6B,#0E8C8C)`
                        : "linear-gradient(135deg,#086B6B,#0E8C8C)",
                    }}
                  >
                    <span className="dmu-option-cat" style={{ background: "var(--lime, #7CB518)", color: "#101820" }}>
                      🏆 Winner
                    </span>
                    {!winningOption.imageUrl && (
                      <div
                        style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 52, color: "#fff",
                        }}
                        aria-hidden="true"
                      >
                        {getCategoryEmoji(winningOption.category)}
                      </div>
                    )}
                  </div>
                  <div className="dmu-option-body">
                    <h2>{winningOption.name}</h2>
                    <div className="dmu-option-meta">
                      {winningOption.address && (
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>
                          </svg>
                          {winningOption.address}
                        </span>
                      )}
                      {winningOption.eventDate && (
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="16" rx="4"/><path d="M3 10h18M8 3v3M16 3v3"/>
                          </svg>
                          {formatEventDate(winningOption.eventDate)}
                        </span>
                      )}
                    </div>
                    <div className="dmu-option-foot">
                      <span className="dmu-voters">✓ Everyone agreed on this!</span>
                      <a
                        href={buildGoogleCalendarUrl(
                          proposal.title ?? winningOption.name ?? "Our Plan",
                          winningOption.address ?? "",
                          winningOption.eventDate ?? proposal.dateTime,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dmu-btn dmu-btn-primary dmu-btn-auto"
                        style={{ height: 38, fontSize: 13, textDecoration: "none" }}
                      >
                        📅 Add to Calendar
                      </a>
                    </div>
                  </div>
                </article>
              </div>
            )}

            {/* Options list header */}
            <div className="dmu-section-head">
              <span>Options · tap to approve</span>
            </div>

            {/* Options */}
            <div className="dmu-options" data-testid="proposal-items">
              {options.map((option: any, i: number) => {
                const tallyEntry = tally.find((t: any) => t.optionId === option.id);
                const voteCount = tallyEntry?.votes ?? option.votes?.length ?? 0;
                const consensus = tallyEntry?.consensus ?? false;

                return (
                  <OptionCard
                    key={option.id}
                    option={option}
                    index={i}
                    mySentiment={myVoteMap.get(option.id) ?? null}
                    voteCount={voteCount}
                    memberCount={memberCount}
                    consensus={consensus}
                    canVote={isOpen}
                    onVote={(sentiment, comment) => voteMutation.mutate({ optionId: option.id, sentiment, comment })}
                    votePending={voteMutation.isPending}
                    existingComment={option.votes?.find((v: any) => v.userId === myUserId)?.comment ?? undefined}
                  />
                );
              })}

              {options.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "var(--ink2)" }}>
                  No options yet.
                </div>
              )}
            </div>

            {/* Done voting banner */}
            {myVoteMap.size > 0 && isOpen && (() => {
              const proposerRaw: string | undefined =
                (proposal as any).createdByName ??
                (proposal as any).creatorName ??
                (proposal as any).creator?.displayName;
              const proposerFirst = proposerRaw
                ? proposerRaw.split(" ")[0]
                : null;
              // Don't show "Let You know" when the current user is the proposer
              const isMyProposal = (proposal as any).createdByUserId === myUserId;
              const btnLabel = isMyProposal || !proposerFirst
                ? "Let them know 👍"
                : `Let ${proposerFirst} know 👍`;
              return (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 13, color: "var(--ink2)", margin: "0 0 8px", textAlign: "center" }}>
                    You've voted on {myVoteMap.size} option{myVoteMap.size !== 1 ? "s" : ""}
                  </p>
                  <button
                    className="dmu-btn dmu-btn-primary dmu-btn-block"
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                  >
                    {btnLabel}
                  </button>
                </div>
              );
            })()}

            {/* Add another option — proposer only, while nobody has voted */}
            {isOpen && votedCount === 0 && (
              <Link
                className="dmu-add-option"
                to="/discover"
                style={{ marginTop: 4, textDecoration: "none" }}
              >
                <span className="dmu-new-plus" aria-hidden="true">+</span>
                <span>
                  <b>Add another option</b>
                  <small>Two or three ideas make it easier to agree</small>
                </span>
              </Link>
            )}

            {/* Vote errors */}
            {voteMutation.isError && (
              <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 16 }}>
                {(voteMutation.error as AxiosError<ApiError>)?.response?.data?.message ?? "Vote action failed"}
              </p>
            )}

            {/* Discussion thread */}
            <section className="dmu-discussion">
              <h3 className="dmu-discussion-title">Discussion</h3>
              {(comments as any[]).map((c: any) => (
                <div key={c.id} className="dmu-comment">
                  <span className="dmu-comment-name">{c.user?.displayName?.split(' ')[0]}</span>
                  <span className="dmu-comment-body">{c.body}</span>
                  <span className="dmu-comment-time">{new Date(c.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  {c.userId === myUserId && (
                    <button className="dmu-comment-del" onClick={() => deleteCommentMutation.mutate(c.id)}>×</button>
                  )}
                </div>
              ))}
              <div className="dmu-comment-input-row">
                <input
                  className="dmu-comment-input"
                  placeholder="Say something..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newComment.trim()) { addCommentMutation.mutate(newComment.trim()); setNewComment(''); } }}
                  maxLength={500}
                />
                <button
                  className="dmu-comment-send"
                  onClick={() => { if (newComment.trim()) { addCommentMutation.mutate(newComment.trim()); setNewComment(''); } }}
                >Send</button>
              </div>
            </section>
          </section>

          {/* ── Right rail ── */}
          <aside className="dmu-rail">

            {/* Who's voted card */}
            <div className="dmu-card">
              <div className="dmu-card-head">
                <h2>Who's voted</h2>
                <span className="dmu-count">{votedCount} of {memberCount || "?"}</span>
              </div>
              <div
                className="dmu-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={memberCount || 1}
                aria-valuenow={votedCount}
              >
                <span style={{ width: `${progressPct}%` }} />
              </div>

              {/* Member list */}
              {members.length > 0 && (
                <ul className="dmu-members">
                  {members.map((m: any) => {
                    const hasVoted = options.some((opt: any) =>
                      opt.votes?.some((v: any) => v.userId === m.userId)
                    );
                    const isPending = m.status === "pending" || m.status === "invited" || !m.joined;
                    const displayName = m.userId === myUserId ? "You" : (m.name ?? m.displayName ?? "Member");
                    const initial = avatarInitial(displayName);

                    return (
                      <li key={m.userId ?? m.id} className={isPending ? "dmu-pending" : ""}>
                        <span className={`dmu-av ${isPending ? "dmu-av-empty" : "dmu-av-teal"}`}>
                          {initial}
                        </span>
                        <span className="dmu-g-text">
                          <b>{displayName}</b>
                          <small>{isPending ? "Hasn't joined yet" : hasVoted ? "Voted" : "Not voted yet"}</small>
                        </span>
                        {isPending ? (
                          <button
                            className="dmu-copy"
                            type="button"
                            onClick={() => setShowInviteModal(true)}
                          >
                            Invite
                          </button>
                        ) : (
                          <span className={`dmu-vote-state${hasVoted ? " is-in" : ""}`}>
                            {hasVoted ? "✓" : "—"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Fallback if no members array */}
              {members.length === 0 && memberCount > 0 && (
                <p style={{ fontSize: 12, color: "var(--ink2)", margin: "12px 0 0" }}>
                  {votedCount} of {memberCount} members have voted.
                </p>
              )}

              <p className="dmu-card-sub">
                Hearts stay hidden until everyone has voted.{isDecided ? "" : " The plan locks in when you both pick the same option."}
              </p>

              {isOpen && (
                <button
                  className="dmu-copy"
                  type="button"
                  style={{ marginTop: 14, width: "100%" }}
                  onClick={() => setShowInviteModal(true)}
                >
                  Invite
                </button>
              )}
            </div>

            {/* Not feeling it? card — only when open */}
            {isOpen && (
              <div className="dmu-card">
                <div className="dmu-card-head"><h2>Not feeling it?</h2></div>
                <p className="dmu-card-sub">
                  Counter-propose keeps this option and lets you swap in new ones. Votes reset.
                </p>
                <Link
                  className="dmu-btn dmu-btn-primary dmu-btn-block"
                  to={`/groups/${proposal.groupId}`}
                >
                  Counter-propose
                </Link>

                {!showCancelConfirm ? (
                  <button
                    className="dmu-btn dmu-btn-ghost dmu-danger dmu-btn-block dmu-pr-cancel"
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancel proposal
                  </button>
                ) : (
                  <div style={{ marginTop: 12, textAlign: "center" }}>
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
            <div className="dmu-pr-details">
              <div><span>Date</span><b>{formattedDate}</b></div>
              <div><span>Group</span><b>{groupName}</b></div>
              {isOpen && memberCount > 0 && (
                <div><span>Reminder</span><b>Fri 8 PM, if not everyone's voted</b></div>
              )}
            </div>
          </aside>
        </div>

        {/* ── Match celebration overlay ── */}
        {showCelebration && !celebrationDismissed && (
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
              <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
              <h1 style={{ fontFamily: "Sora, var(--font-display), sans-serif", fontSize: 32, marginBottom: 8, color: "#0E8C8C" }}>
                {t('proposal.itsAMatch')}
              </h1>
              {runnerUpOption ? (
                <p style={{ color: "var(--ink2)", marginBottom: 24 }}>
                  You both loved <b>{winningOption?.name}</b> (and <b>{runnerUpOption.name}</b> too!) We picked the headliner. 🎭
                </p>
              ) : (
                <p style={{ color: "var(--ink2)", marginBottom: 24 }}>Everyone agreed. It's happening!</p>
              )}

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
                      background: "linear-gradient(135deg,#086B6B,#0E8C8C)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64,
                    }}>
                      {getCategoryEmoji(winningOption.category)}
                    </div>
                  )}
                  <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>{winningOption.name}</h2>
                  {winningOption.category && (
                    <p style={{ color: "var(--ink2)", fontSize: 13, margin: "0 0 4px" }}>{winningOption.category}</p>
                  )}
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
                  {t('proposal.addToCalendar')}
                </a>
                <Link
                  to={`/proposals/${proposalId}/invite-card`}
                  className="dn-btn"
                  style={{ textDecoration: "none", display: "block", background: "var(--primary)", color: "#fff", border: "none" }}
                >
                  {t('proposal.pickInviteCard')}
                </Link>
                {/* Message partner */}
                {(() => {
                  const isMobileWeb = /iPhone|Android/i.test(navigator.userAgent);
                  const messageHref = isMobileWeb
                    ? `sms:?&body=${encodeURIComponent("Let's celebrate! Our plan is decided on TogetherPlans 🎉")}`
                    : `https://wa.me/?text=${encodeURIComponent("Let's celebrate! Our plan is decided on TogetherPlans 🎉")}`;
                  return (
                    <a
                      href={messageHref}
                      className="dn-btn dn-btn--outline"
                      style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                    >
                      {t('proposal.messagePartner')}
                    </a>
                  );
                })()}
                <button
                  className="dn-btn"
                  style={{ background: "var(--lime)", color: "#fff", border: "none" }}
                  onClick={() => {
                    setShowCelebration(false);
                    setCelebrationDismissed(true);
                    setShowShareModal(true);
                  }}
                >
                  📤 Share Plan
                </button>
                <button
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--ink2)", fontSize: 13, marginTop: 4, textDecoration: "underline",
                  }}
                  onClick={() => {
                    setShowCelebration(false);
                    setCelebrationDismissed(true);
                  }}
                >
                  View all votes
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
    </>
  );
}
