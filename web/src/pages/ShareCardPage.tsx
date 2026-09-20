import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppNav } from "../components/AppNav";
import { shareCardsApi } from "../api/client";
import type { ShareCard } from "../types";

const CATEGORY_EMOJI: Record<string, string> = {
  Dining:             "🍽️",
  "Live Music":       "🎵",
  Comedy:             "😂",
  "Theater & Plays":  "🎭",
  Movies:             "🎬",
  "Streaming Night":  "📺",
  Outdoors:           "🌿",
  "Day Trip":         "🚗",
  "Wine & Drinks":    "🍷",
  "Arts & Culture":   "🎨",
  Active:             "🏃",
  "Local Experience": "📍",
  "Unique & Quirky":  "✨",
};

// ── VoteBar ───────────────────────────────────────────────────────────────────

function VoteBar({
  name,
  voteCount,
  totalVotes,
  isWinner,
}: {
  name: string;
  voteCount: number;
  totalVotes: number;
  isWinner: boolean;
}) {
  const [width, setWidth] = useState(0);
  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  // Animate in after mount
  useEffect(() => {
    const id = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(id);
  }, [pct]);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 14,
          color: isWinner ? "var(--primary)" : "var(--ink)",
        }}>
          {isWinner ? "🏆 " : ""}{name}
        </span>
        <span style={{ fontSize: 13, color: "var(--ink2)" }}>
          {voteCount} {voteCount === 1 ? "vote" : "votes"}
        </span>
      </div>
      <div style={{ height: 8, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${width}%`,
          background: isWinner ? "var(--lime)" : "var(--primary-soft)",
          borderRadius: 4,
          transition: "width 0.7s ease",
        }} />
      </div>
    </div>
  );
}

// ── ShareCardPage ─────────────────────────────────────────────────────────────

export function ShareCardPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const [copied, setCopied] = useState(false);

  // Generate (idempotent POST) — ensures card is fresh
  const { data: card, isLoading, isError } = useQuery<ShareCard>({
    queryKey: ["share-card", proposalId],
    queryFn: async () => {
      const res = await shareCardsApi.generate(proposalId!);
      return res.data;
    },
    enabled: !!proposalId,
  });

  const handleCopy = () => {
    if (!card) return;
    navigator.clipboard.writeText(card.shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (!card) return;
    if (navigator.share) {
      navigator.share({
        title: card.og.title,
        text: card.og.description,
        url: card.shareUrl,
      });
    } else {
      handleCopy();
    }
  };

  if (isLoading) return (
    <>
      <AppNav />
      <main style={{ padding: "40px var(--gutter)", textAlign: "center" }}>
        <p style={{ color: "var(--ink2)" }}>Building your share card…</p>
      </main>
    </>
  );

  if (isError || !card) return (
    <>
      <AppNav />
      <main style={{ padding: "40px var(--gutter)", textAlign: "center" }}>
        <p style={{ color: "var(--error)" }}>Couldn't load share card.</p>
        <Link to="/dashboard" style={{ color: "var(--primary)", marginTop: 12, display: "block" }}>
          ← Back to dashboard
        </Link>
      </main>
    </>
  );

  const winner = card.winningOption;
  const emoji = winner ? (CATEGORY_EMOJI[winner.category] ?? "📅") : "📅";

  return (
    <>
      <AppNav />

      {/* OG meta — injected dynamically for share previews */}
      <title>{card.og.title}</title>

      <main style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "32px var(--gutter)" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link
            to={`/proposals/${card.proposalId}`}
            style={{ color: "var(--ink2)", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            ← Back to proposal
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}
          className="share-grid">

          {/* Left: hero card */}
          <div>
            {/* Hero banner */}
            <div style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%)",
              borderRadius: "44px 36px 48px 40px",
              padding: "40px 36px",
              marginBottom: 24,
              position: "relative",
              overflow: "hidden",
              boxShadow: "var(--shadow-dock)",
            }}>
              {/* Decorative circle */}
              <div style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "var(--lime)",
                opacity: 0.15,
              }} />

              <span className="dn-sticker dn-sticker--lime" style={{ marginBottom: 20, display: "inline-block" }}>
                DECIDED 🎉
              </span>

              <div style={{ fontSize: 64, marginBottom: 12 }}>{emoji}</div>

              <h1 style={{
                color: "var(--on-primary)",
                fontSize: 32,
                letterSpacing: "-0.02em",
                marginBottom: 8,
                position: "relative",
              }}>
                {winner?.name ?? card.title}
              </h1>

              <p style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-body)", fontSize: 15, marginBottom: 20 }}>
                {card.groupName}
              </p>

              {/* Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span style={{
                  background: "rgba(255,255,255,0.9)",
                  color: "var(--primary)",
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                }}>
                  📅 {card.dateFormatted}
                </span>
                <span style={{
                  background: "rgba(255,255,255,0.9)",
                  color: "var(--primary)",
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                }}>
                  🕐 {card.timeFormatted}
                </span>
                {winner?.address && (
                  <span style={{
                    background: "rgba(255,255,255,0.9)",
                    color: "var(--primary)",
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    maxWidth: 280,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    📍 {winner.address}
                  </span>
                )}
              </div>
            </div>

            {/* Vote breakdown */}
            <div className="dn-card">
              <h3 style={{ marginBottom: 20, fontSize: 15, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                How the group voted
              </h3>
              {card.allOptions.map((opt) => (
                <VoteBar
                  key={opt.id}
                  name={opt.name}
                  voteCount={opt.voteCount}
                  totalVotes={card.totalVotes}
                  isWinner={opt.isWinner}
                />
              ))}
              <p style={{ color: "var(--ink2)", fontSize: 13, marginTop: 8 }}>
                {card.totalVotes} total {card.totalVotes === 1 ? "vote" : "votes"}
              </p>
            </div>
          </div>

          {/* Right: share actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Share URL */}
            <div className="dn-card dn-card--alt1">
              <h3 style={{ marginBottom: 12, fontSize: 15 }}>Share this plan</h3>
              <p style={{ color: "var(--ink2)", fontSize: 13, marginBottom: 16 }}>
                Anyone with this link can view the card — no account needed.
              </p>

              {/* URL box */}
              <div style={{
                background: "var(--bg)",
                border: "1.5px solid var(--line)",
                borderRadius: 14,
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--primary)",
                fontFamily: "var(--font-mono)",
                wordBreak: "break-all",
                marginBottom: 12,
              }}>
                {card.shareUrl}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="dn-btn"
                  onClick={handleShare}
                  style={{ flex: 1 }}
                >
                  {typeof navigator !== "undefined" && "share" in navigator
                    ? "📤 Share"
                    : copied ? "✓ Copied!" : "📋 Copy link"}
                </button>
              </div>
            </div>

            {/* OG preview */}
            <div className="dn-card dn-card--alt2">
              <h3 style={{ marginBottom: 12, fontSize: 14, color: "var(--ink2)" }}>
                Preview (how it looks when shared)
              </h3>
              <div style={{
                border: "1px solid var(--line)",
                borderRadius: 12,
                overflow: "hidden",
                fontSize: 13,
              }}>
                {/* OG image strip */}
                <div style={{
                  height: 90,
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                }}>
                  {emoji}
                </div>
                <div style={{ padding: "10px 12px", background: "var(--surface)" }}>
                  <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4, fontSize: 13 }}>
                    {card.og.title}
                  </div>
                  <div style={{ color: "var(--ink2)", fontSize: 12, lineHeight: 1.4 }}>
                    {card.og.description}
                  </div>
                  <div style={{ color: "var(--ink2)", fontSize: 11, marginTop: 6 }}>
                    togetherplans.app
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket CTA */}
            {winner?.ticketUrl && (
              <a
                href={winner.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="dn-btn dn-btn--secondary"
                style={{ textAlign: "center", textDecoration: "none" }}
              >
                🎟 Get tickets
              </a>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .share-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

// ── Public share viewer (no auth required) ────────────────────────────────────
// Route: /share/:shareToken  — resolves token → card and shows read-only view

export function PublicSharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [copied, setCopied] = useState(false);

  const { data: card, isLoading, isError } = useQuery<ShareCard>({
    queryKey: ["share-card-public", shareToken],
    queryFn: async () => {
      const res = await shareCardsApi.byToken(shareToken!);
      return res.data;
    },
    enabled: !!shareToken,
  });

  const handleCopy = () => {
    if (!card) return;
    navigator.clipboard.writeText(card.shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) return (
    <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--ink2)" }}>Loading…</p>
    </main>
  );

  if (isError || !card) return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 }}>
      <div style={{ fontSize: 64 }}>🔍</div>
      <h2>Share card not found</h2>
      <p style={{ color: "var(--ink2)" }}>This link may have expired or been removed.</p>
      <a href="/" className="dn-btn">Go to DateNight</a>
    </main>
  );

  const winner = card.winningOption;
  const emoji = winner ? (CATEGORY_EMOJI[winner.category] ?? "📅") : "📅";

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%)",
        borderRadius: "44px 36px 48px 40px",
        padding: "40px 32px",
        marginBottom: 24,
        textAlign: "center",
        boxShadow: "var(--shadow-dock)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30, width: 140, height: 140,
          borderRadius: "50%", background: "var(--lime)", opacity: 0.15,
        }} />
        <span className="dn-sticker dn-sticker--lime" style={{ marginBottom: 20, display: "inline-block" }}>
          DECIDED 🎉
        </span>
        <div style={{ fontSize: 72, marginBottom: 16 }}>{emoji}</div>
        <h1 style={{ color: "#fff", fontSize: 28, marginBottom: 8 }}>{winner?.name ?? card.title}</h1>
        <p style={{ color: "rgba(255,255,255,.75)", marginBottom: 20 }}>{card.groupName} · {card.dateFormatted} at {card.timeFormatted}</p>
        {winner?.address && (
          <p style={{ color: "rgba(255,255,255,.8)", fontSize: 14 }}>📍 {winner.address}</p>
        )}
      </div>

      {/* Vote breakdown */}
      <div className="dn-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: 14, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          How the group voted
        </h3>
        {card.allOptions.map((opt) => (
          <VoteBar
            key={opt.id}
            name={opt.name}
            voteCount={opt.voteCount}
            totalVotes={card.totalVotes}
            isWinner={opt.isWinner}
          />
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "var(--ink2)", fontSize: 14, marginBottom: 16 }}>
          Planned with DateNight — the app for couples & friends
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://togetherplans.app" className="dn-btn">Get DateNight →</a>
          <button className="dn-btn dn-btn--secondary" onClick={handleCopy}>
            {copied ? "✓ Copied!" : "📋 Copy link"}
          </button>
        </div>
      </div>
    </main>
  );
}
