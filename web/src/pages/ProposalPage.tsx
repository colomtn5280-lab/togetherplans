import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proposalsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import { useAuthStore } from "../store/auth.store";
import type { CounterProposal } from "../types";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";

/** Hook: subscribes to SSE consensus stream for a proposal */
function useConsensusStream(proposalId: string | undefined) {
  const [consensus, setConsensus] = useState<Record<string, unknown> | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!proposalId) return;

    const token = localStorage.getItem("accessToken") ?? "";
    const url = `/api/v1/proposals/${proposalId}/consensus/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as { type: string; data?: Record<string, unknown> };
        if (msg.type === "connected" || msg.type === "consensus_update") {
          setConsensus(msg.data ?? null);
        }
      } catch { /* ignore parse errors */ }
    };

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [proposalId]);

  return { consensus, connected };
}

export function ProposalPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showCounter, setShowCounter] = useState(false);
  const [counterNote, setCounterNote] = useState("");
  const [showConsensusModal, setShowConsensusModal] = useState(false);

  const { consensus, connected: sseConnected } = useConsensusStream(proposalId);

  const { data: proposal, isLoading, isError } = useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => {
      const res = await proposalsApi.get(proposalId!);
      return res.data;
    },
    enabled: !!proposalId,
  });

  const { data: dialogue } = useQuery({
    queryKey: ["proposal-dialogue", proposalId],
    queryFn: async () => {
      const res = await proposalsApi.dialogue(proposalId!);
      return res.data;
    },
    enabled: !!proposalId,
  });

  const acceptMutation = useMutation<unknown, AxiosError<ApiError>, { itemId: string }>({
    mutationFn: async ({ itemId }) => {
      const res = await proposalsApi.acceptItem(proposalId!, itemId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      queryClient.invalidateQueries({ queryKey: ["proposal-dialogue", proposalId] });
    },
  });

  const rejectMutation = useMutation<unknown, AxiosError<ApiError>, { itemId: string }>({
    mutationFn: async ({ itemId }) => {
      const res = await proposalsApi.rejectItem(proposalId!, itemId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
    },
  });

  const counterMutation = useMutation<CounterProposal, AxiosError<ApiError>, Record<string, unknown>>({
    mutationFn: async (changes) => {
      const res = await proposalsApi.counter(proposalId!, changes);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      queryClient.invalidateQueries({ queryKey: ["proposal-dialogue", proposalId] });
      setShowCounter(false);
      setCounterNote("");
    },
  });

  const lockMutation = useMutation<unknown, AxiosError<ApiError>, { itemId: string }>({
    mutationFn: async ({ itemId }) => {
      const res = await proposalsApi.lock(proposalId!, itemId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      setShowConsensusModal(true);
    },
  });

  // Check for consensus reached
  const consensusReached = consensus &&
    (consensus.items as Array<Record<string, unknown>>)?.some((item) => item.consensusReached);

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

  const statusSticker = () => {
    if (proposal.status === "locked") return <span className="dn-sticker dn-sticker--lime">Locked In 🎉</span>;
    if (proposal.status === "accepted") return <span className="dn-sticker dn-sticker--success">Accepted</span>;
    return <span className="dn-sticker">Open</span>;
  };

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
              data-testid="proposal-items"
            >
              {proposal.items.map((item, i) => {
                const accepted = item.status === "accepted";
                const rejected = item.status === "rejected";
                return (
                  <div
                    key={item.id}
                    className={`dn-card${i % 2 === 1 ? " dn-card--alt1" : ""}`}
                    style={{
                      background: accepted ? "var(--lime-soft)" : rejected ? "var(--error-soft)" : "var(--surface)",
                      position: "relative",
                    }}
                  >
                    {/* Image slot */}
                    <div
                      style={{
                        height: 110,
                        borderRadius: 16,
                        marginBottom: 14,
                        background: `repeating-linear-gradient(
                          45deg,
                          var(--bg),
                          var(--bg) 8px,
                          var(--line) 8px,
                          var(--line) 16px
                        )`,
                      }}
                    />

                    {/* Heart stamp */}
                    <button
                      onClick={() => {
                        if (item.status === "pending") {
                          acceptMutation.mutate({ itemId: item.id });
                        } else if (item.status === "accepted") {
                          rejectMutation.mutate({ itemId: item.id });
                        }
                      }}
                      disabled={acceptMutation.isPending || rejectMutation.isPending}
                      style={{
                        position: "absolute",
                        top: 96,
                        right: 16,
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        border: "none",
                        cursor: "pointer",
                        background: accepted ? "var(--lime)" : "var(--surface)",
                        color: accepted ? "var(--on-lime)" : "var(--ink2)",
                        fontSize: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--shadow-dock)",
                        transition: "transform 150ms, background 150ms",
                      }}
                      aria-label={accepted ? "Remove vote" : "Vote for this option"}
                    >
                      {accepted ? "♥" : "♡"}
                    </button>

                    <h3 style={{ fontSize: 15, marginBottom: 4 }}>
                      {item.suggestion?.name ?? `Option ${i + 1}`}
                    </h3>
                    {item.suggestion?.address && (
                      <p style={{ color: "var(--ink2)", fontSize: 12 }}>
                        📍 {item.suggestion.address}
                      </p>
                    )}
                    {item.suggestion?.rating && (
                      <p style={{ color: "var(--ink2)", fontSize: 12 }}>★ {item.suggestion.rating}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {proposal.items.length === 0 && (
              <div className="dn-card" style={{ textAlign: "center", padding: 40 }}>
                <p style={{ color: "var(--ink2)" }}>No suggestions attached yet.</p>
              </div>
            )}

            {/* Lock-in button */}
            {proposal.status === "pending" && proposal.items.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <button
                  onClick={() => lockMutation.mutate({ itemId: proposal.items[0].id })}
                  disabled={lockMutation.isPending}
                  className="dn-btn dn-btn--ink"
                  style={{ width: "100%" }}
                >
                  {lockMutation.isPending ? "Locking in…" : "Lock in date night 🔒"}
                </button>
                {lockMutation.isError && (
                  <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 8 }}>
                    {(lockMutation.error as AxiosError<ApiError>).response?.data?.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: Status + Votes + Counter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status + title */}
            <div className="dn-card dn-card--alt2">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                {statusSticker()}
                <span style={{ fontSize: 12, color: sseConnected ? "var(--success)" : "var(--ink2)", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                  {sseConnected ? "● Live" : "○ Polling"}
                </span>
              </div>
              <p style={{ color: "var(--ink2)", fontSize: 13, marginBottom: 4 }}>
                Date: <strong style={{ color: "var(--ink)" }}>{proposal.proposedDate}</strong>
                {proposal.proposedTime && ` at ${proposal.proposedTime}`}
              </p>
              <p style={{ color: "var(--ink2)", fontSize: 13 }} data-testid="proposal-status">
                Status: <strong style={{ color: "var(--ink)" }}>{proposal.status}</strong>
              </p>
            </div>

            {/* Consensus / Votes */}
            {consensus && (
              <div className="dn-card dn-card--alt3">
                <h3 style={{ marginBottom: 14, fontSize: 15 }}>Votes</h3>
                {(consensus.items as Array<Record<string, unknown>>)?.map((item) => {
                  const total = item.totalMembers as number;
                  const accepted = item.acceptedCount as number;
                  const pct = total > 0 ? Math.round((accepted / total) * 100) : 0;
                  return (
                    <div key={item.itemId as string} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)" }}>
                          {(item.suggestionName as string) || (item.itemId as string)}
                        </span>
                        <span style={{ fontSize: 12, color: item.consensusReached ? "var(--success)" : "var(--ink2)" }}>
                          {accepted}/{total} {item.consensusReached ? "✓" : ""}
                        </span>
                      </div>
                      <div style={{ height: 6, background: "var(--line)", borderRadius: 3 }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: item.consensusReached ? "var(--lime)" : "var(--primary)",
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

            {/* Mismatch banner */}
            {proposal.status === "pending" && (
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
                  ⚠️ Not all members have voted
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
                <textarea
                  id="counterNote"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  rows={3}
                  className="dn-input"
                  placeholder="Describe what you'd like to change…"
                  style={{ height: "auto", padding: "12px 16px", resize: "vertical" }}
                />
                {counterMutation.isError && (
                  <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 8 }}>
                    {counterMutation.error.response?.data?.message}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    className="dn-btn"
                    onClick={() => counterMutation.mutate({ note: counterNote })}
                    disabled={counterMutation.isPending || !counterNote.trim()}
                  >
                    {counterMutation.isPending ? "Submitting…" : "Submit →"}
                  </button>
                  <button
                    className="dn-btn dn-btn--secondary"
                    onClick={() => setShowCounter(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Dialogue history */}
            {dialogue && dialogue.length > 0 && (
              <div className="dn-card dn-card--alt3">
                <h3 style={{ marginBottom: 12, fontSize: 15 }}>History</h3>
                <ul data-testid="dialogue-history" style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {dialogue.map((entry) => (
                    <li key={entry.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                      <span style={{ color: "var(--ink2)", fontSize: 11 }}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>{" "}
                      <strong style={{ fontFamily: "var(--font-display)", fontSize: 12 }}>{entry.type}</strong>
                      <span style={{ color: "var(--ink2)", fontSize: 12 }}> by {entry.userId === user?.userId ? "you" : entry.userId}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Consensus modal */}
        {(showConsensusModal || consensusReached) && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
            }}
            onClick={() => setShowConsensusModal(false)}
          >
            <div
              className="dn-card"
              style={{
                width: "100%",
                maxWidth: 460,
                textAlign: "center",
                padding: 48,
                borderRadius: "44px 36px 48px 40px",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Confetti dots */}
              <div style={{ position: "relative", marginBottom: 24 }}>
                {["var(--primary)", "var(--lime)", "var(--warning)", "var(--error)"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      width: 10,
                      height: 10,
                      background: c,
                      borderRadius: "50%",
                      top: -20,
                      left: `${20 + i * 20}%`,
                      animation: `dn-confetti-fall ${0.8 + i * 0.2}s ease-out forwards`,
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h2 style={{ marginBottom: 8 }}>You're locked in!</h2>
              <p style={{ color: "var(--ink2)", marginBottom: 24 }}>
                Everyone agreed. It's happening. Get excited!
              </p>
              <button className="dn-btn" onClick={() => setShowConsensusModal(false)} style={{ width: "100%" }}>
                Amazing ♥
              </button>
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .proposal-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
