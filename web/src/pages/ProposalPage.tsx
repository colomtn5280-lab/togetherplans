import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proposalsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import { useAuthStore } from "../store/auth.store";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";

export function ProposalPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showCounter, setShowCounter] = useState(false);
  const [showConsensusModal, setShowConsensusModal] = useState(false);

  const { data: proposal, isLoading, isError } = useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => {
      const res = await proposalsApi.get(proposalId!);
      return res.data;
    },
    enabled: !!proposalId,
  });

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

  const statusSticker = () => {
    const s = proposal.status;
    if (s === "DECIDED" || s === "locked") return <span className="dn-sticker dn-sticker--lime">Decided 🎉</span>;
    if (s === "CANCELLED" || s === "rejected") return <span className="dn-sticker dn-sticker--ink">Cancelled</span>;
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

        {/* Title + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          {statusSticker()}
          <h1 style={{ margin: 0, fontSize: 24 }}>{proposal.title ?? "Proposal"}</h1>
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
              {options.map((option, i) => {
                const hasMyVote = myVotedOptionId === option.id;
                const tallyEntry = tally.find((t) => t.optionId === option.id);
                const voteCount = tallyEntry?.votes ?? option.votes?.length ?? 0;
                const consensus = tallyEntry?.consensus ?? false;

                return (
                  <div
                    key={option.id}
                    className={`dn-card${i % 2 === 1 ? " dn-card--alt1" : ""}`}
                    style={{
                      background: consensus ? "var(--lime-soft)" : "var(--surface)",
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
                        top: 96,
                        right: 16,
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        border: "none",
                        cursor: "pointer",
                        background: hasMyVote ? "var(--lime)" : "var(--surface)",
                        color: hasMyVote ? "var(--on-lime)" : "var(--ink2)",
                        fontSize: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--shadow-dock)",
                        transition: "transform 150ms, background 150ms",
                      }}
                      aria-label={hasMyVote ? "Remove vote" : "Vote for this option"}
                    >
                      {hasMyVote ? "♥" : "♡"}
                    </button>

                    <h3 style={{ fontSize: 15, marginBottom: 4 }}>
                      {option.name ?? `Option ${i + 1}`}
                    </h3>
                    {option.address && (
                      <p style={{ color: "var(--ink2)", fontSize: 12 }}>
                        📍 {option.address}
                      </p>
                    )}
                    {option.category && (
                      <span className="dn-sticker dn-sticker--lime" style={{ fontSize: 11 }}>
                        {option.category}
                      </span>
                    )}
                    <p style={{ color: "var(--ink2)", fontSize: 12, marginTop: 8 }}>
                      {voteCount}{memberCount > 0 ? `/${memberCount}` : ""} vote{voteCount !== 1 ? "s" : ""}
                      {consensus && " ✓"}
                    </p>
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

            {/* Cancel button */}
            {(proposal.status === "OPEN" || proposal.status === "pending") && (
              <button
                className="dn-btn dn-btn--secondary"
                onClick={() => cancelMutation.mutate(undefined as never)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling…" : "Cancel proposal"}
              </button>
            )}
          </div>
        </div>

        {/* Consensus modal */}
        {showConsensusModal && (
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

        {/* error display */}
        {(voteMutation.isError || retractMutation.isError) && (
          <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 16 }}>
            {(voteMutation.error as AxiosError<ApiError>)?.response?.data?.message ??
             (retractMutation.error as AxiosError<ApiError>)?.response?.data?.message ??
             "Vote action failed"}
          </p>
        )}

        {/* suppress unused refs */ null}

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
