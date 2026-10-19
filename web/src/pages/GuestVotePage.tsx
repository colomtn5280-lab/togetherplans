// All strings have translations in /public/locales/{en,es}/translation.json
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { publicShareApi } from "../api/client";
import type { PublicShareProposal, PublicShareOption } from "../types";
import { AdUnit } from "../components/AdUnit";

const GUEST_ID_KEY = "tp.guestId";
const GUEST_NAME_KEY = "tp.guestName";

export function getGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `g-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  "Restaurants & Dining": "🍽️",
  "Live Music & Concerts": "🎵",
  "Comedy Shows": "😂",
  Comedy: "😂",
  "Movies & Theater": "🎬",
  Movies: "🎬",
  "Art & Museums": "🎨",
  "Arts & Culture": "🎨",
  "Outdoor Adventures": "🏔️",
  Outdoors: "🌿",
  "Sports & Active": "🏃",
  Active: "🏃",
  "Nightlife & Bars": "🍸",
  "Wellness & Spa": "💆",
  "Wine & Drinks": "🍷",
  Dining: "🍽️",
};
const emojiFor = (cat: string) => CATEGORY_EMOJIS[cat] ?? "📍";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }) + " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// ── Option card ───────────────────────────────────────────────────────────────

function GuestOptionCard({
  opt,
  isMyVote,
  showTallies,
  maxVotes,
  isWinner,
  disabled,
  onVote,
}: {
  opt: PublicShareOption;
  isMyVote: boolean;
  showTallies: boolean;
  maxVotes: number;
  isWinner: boolean;
  disabled: boolean;
  onVote: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const pct = maxVotes > 0 ? Math.round((opt.totalVotes / maxVotes) * 100) : 0;

  return (
    <button
      onClick={onVote}
      disabled={disabled}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: isMyVote ? "rgba(14,140,140,0.08)" : "var(--surface)",
        border: isMyVote ? "2.5px solid var(--primary)" : isWinner ? "2.5px solid var(--lime)" : "2px solid var(--line)",
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
        color: "var(--ink)",
        transition: "border-color .15s, background .15s, transform .1s",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {opt.imageUrl && !imgErr ? (
          <img
            src={opt.imageUrl}
            alt=""
            onError={() => setImgErr(true)}
            style={{ width: 64, height: 64, borderRadius: 20, objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: 20, flexShrink: 0,
            background: "var(--bg)", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 28,
          }}>
            {emojiFor(opt.category)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
            {isWinner ? "🏆 " : ""}{opt.name}
          </div>
          <span style={{
            display: "inline-block",
            background: "var(--bg)",
            borderRadius: 999,
            padding: "2px 10px",
            fontSize: 12,
            color: "var(--ink2)",
            marginBottom: 2,
          }}>
            {emojiFor(opt.category)} {opt.category}
          </span>
          {opt.address && (
            <div style={{ fontSize: 12, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              📍 {opt.address}
            </div>
          )}
          {opt.eventDate && (
            <div style={{ fontSize: 12, color: "var(--ink2)" }}>📅 {formatDate(opt.eventDate)}</div>
          )}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: isMyVote ? "var(--primary)" : "var(--bg)",
          color: isMyVote ? "#fff" : "var(--ink2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, border: isMyVote ? "none" : "2px solid var(--line)",
        }}>
          {isMyVote ? "✓" : "♥"}
        </div>
      </div>

      {showTallies && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink2)", marginBottom: 4 }}>
            <span>{opt.totalVotes} {opt.totalVotes === 1 ? "vote" : "votes"}</span>
            {isMyVote && <span style={{ color: "var(--primary)", fontWeight: 700 }}>Your pick</span>}
          </div>
          <div style={{ height: 7, background: "var(--line)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: isMyVote ? "var(--primary)" : "var(--lime)",
              borderRadius: 14,
              transition: "width .5s ease",
            }} />
          </div>
        </div>
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function GuestVotePage() {
  const { t } = useTranslation();
  const { shareToken } = useParams<{ shareToken: string }>();
  const queryClient = useQueryClient();
  const guestId = getGuestId();

  const [guestName, setGuestName] = useState(() => localStorage.getItem(GUEST_NAME_KEY) ?? "");
  const [justVoted, setJustVoted] = useState(false);

  const { data: proposal, isLoading, isError } = useQuery<PublicShareProposal>({
    queryKey: ["public-share", shareToken, guestId],
    queryFn: async () => {
      const res = await publicShareApi.get(shareToken!, guestId);
      return res.data;
    },
    enabled: !!shareToken,
    retry: false,
  });

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const trimmed = guestName.trim();
      if (trimmed) localStorage.setItem(GUEST_NAME_KEY, trimmed);
      const res = await publicShareApi.vote(shareToken!, {
        optionId,
        guestId,
        ...(trimmed ? { guestName: trimmed } : {}),
      });
      return res.data;
    },
    onSuccess: (data) => {
      setJustVoted(true);
      queryClient.setQueryData(["public-share", shareToken, guestId], data.proposal);
    },
  });

  // scroll to top on vote confirmation
  useEffect(() => {
    if (justVoted) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [justVoted]);

  if (isLoading) {
    return (
      <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--ink2)" }}>{t("guestVote.loading")}</p>
      </main>
    );
  }

  // Friendly 404
  if (isError || !proposal) {
    return (
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 14, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 64 }}>🗺️</div>
        <h1 style={{ fontSize: 24, margin: 0 }}>{t("guestVote.linkNotWorking")}</h1>
        <p style={{ color: "var(--ink2)", maxWidth: 380 }}>
          {t("guestVote.linkBroken")}
        </p>
        <Link to="/signup" className="dn-btn dn-btn--primary" style={{ marginTop: 8 }}>
          {t("guestVote.planYourNight")}
        </Link>
        <a href="https://togetherplans.app" style={{ color: "var(--ink2)", fontSize: 13 }}>togetherplans.app</a>
      </main>
    );
  }

  const isOpen = proposal.status === "OPEN";
  const hasVoted = !!proposal.yourVote;
  const showTallies = hasVoted || !isOpen;
  const maxVotes = Math.max(1, ...proposal.options.map((o) => o.totalVotes));
  const winner = proposal.winnerOptionId
    ? proposal.options.find((o) => o.id === proposal.winnerOptionId)
    : null;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "28px 18px 60px" }}>
      {/* Branding */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <a href="https://togetherplans.app" style={{
          fontFamily: "'Sora', system-ui, sans-serif", fontWeight: 800,
          fontSize: 15, color: "var(--primary)", textDecoration: "none", letterSpacing: "-0.01em",
        }}>
          TogetherPlans
        </a>
      </div>

      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-deep, #065f5f) 100%)",
        borderRadius: "28px 22px 30px 24px",
        padding: "26px 22px",
        marginBottom: 22,
        color: "#fff",
      }}>
        <p style={{ margin: "0 0 6px", fontSize: 13, opacity: 0.85 }}>
          {proposal.groupName} proposed:
        </p>
        <h1 style={{ margin: "0 0 10px", fontSize: 26, lineHeight: 1.2, fontFamily: "'Sora', system-ui, sans-serif" }}>
          {proposal.title}
        </h1>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>🗓 {formatDate(proposal.dateTime)}</p>
      </header>

      {/* Decided banner */}
      {!isOpen && (
        <div style={{
          background: "rgba(124,181,24,0.12)", border: "2px solid var(--lime)",
          borderRadius: 16, padding: "14px 18px", marginBottom: 18, textAlign: "center",
        }}>
          <strong>{winner ? t("guestVote.wonBanner", { name: winner.name }) : `${t("guestVote.planDecided")} 🎉`}</strong>
        </div>
      )}

      {/* Vote confirmation */}
      {isOpen && justVoted && (
        <div style={{
          background: "rgba(14,140,140,0.1)", border: "2px solid var(--primary)",
          borderRadius: 16, padding: "12px 18px", marginBottom: 18, textAlign: "center",
        }}>
          {t("guestVote.voteCounted")}
        </div>
      )}
      {isOpen && !justVoted && hasVoted && (
        <p style={{ textAlign: "center", color: "var(--ink2)", fontSize: 14, marginBottom: 16 }}>
          {t("guestVote.youVoted")}
        </p>
      )}
      {isOpen && !hasVoted && (
        <p style={{ textAlign: "center", color: "var(--ink2)", fontSize: 15, marginBottom: 16 }}>
          {t("guestVote.tapFavorite")}
        </p>
      )}

      {/* Optional name (skippable) */}
      {isOpen && !hasVoted && (
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder={t("guestVote.namePlaceholder")}
          maxLength={60}
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 16px",
            borderRadius: 20, border: "1.5px solid var(--line)", fontSize: 14,
            marginBottom: 16, background: "var(--surface)", color: "var(--ink)",
            fontFamily: "inherit",
          }}
        />
      )}

      {/* Options */}
      {proposal.options.map((opt) => (
        <GuestOptionCard
          key={opt.id}
          opt={opt}
          isMyVote={proposal.yourVote === opt.id}
          showTallies={showTallies}
          maxVotes={maxVotes}
          isWinner={proposal.winnerOptionId === opt.id}
          disabled={!isOpen || voteMutation.isPending}
          onVote={() => {
            if (isOpen && proposal.yourVote !== opt.id) voteMutation.mutate(opt.id);
          }}
        />
      ))}

      {voteMutation.isError && (
        <p style={{ color: "var(--error, #c0392b)", fontSize: 14, textAlign: "center" }}>
          {t("guestVote.couldntSaveVote")}
        </p>
      )}

      <AdUnit slot="XXXXXXXXXX" style={{ margin: '1.5rem 0' }} className="ad-unit--guest-vote" />

      {/* Post-vote signup panel */}
      {(hasVoted || !isOpen) && (
        <div style={{
          marginTop: 28, background: "var(--surface)", border: "2px solid var(--line)",
          borderRadius: 20, padding: "22px 20px", textAlign: "center",
        }}>
          {isOpen ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <h2 style={{ margin: "0 0 6px", fontSize: 19, fontFamily: "'Sora', system-ui, sans-serif" }}>
                {t("guestVote.wantASay")}
              </h2>
              <p style={{ color: "var(--ink2)", fontSize: 14, margin: "0 0 16px" }}>
                {t("guestVote.guestVotesAdvise", { groupName: proposal.groupName })}
              </p>
              <Link to="/signup" className="dn-btn dn-btn--primary" style={{ minWidth: 220 }}>
                {t("guestVote.createFreeAccount")}
              </Link>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
              <h2 style={{ margin: "0 0 6px", fontSize: 19, fontFamily: "'Sora', system-ui, sans-serif" }}>
                {t("guestVote.planYourOwnNight")}
              </h2>
              <p style={{ color: "var(--ink2)", fontSize: 14, margin: "0 0 16px" }}>
                {t("guestVote.browseEvents")}
              </p>
              <Link to="/signup" className="dn-btn dn-btn--primary" style={{ minWidth: 220 }}>
                {t("guestVote.getStartedFree")}
              </Link>
            </>
          )}
        </div>
      )}

      {/* Footer branding */}
      <p style={{ textAlign: "center", color: "var(--ink2)", fontSize: 12, marginTop: 28 }}>
        {t("guestVote.madeWith")}
      </p>
    </main>
  );
}
