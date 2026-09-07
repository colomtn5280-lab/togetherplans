import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proposalsApi } from "../api/client";
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
    // EventSource doesn't support headers natively; pass token as query param
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
  const [showCounter, setShowCounter] = useState(false);
  const [counterNote, setCounterNote] = useState("");

  // Live consensus via SSE
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

  const acceptMutation = useMutation<
    unknown,
    AxiosError<ApiError>,
    { itemId: string }
  >({
    mutationFn: async ({ itemId }) => {
      const res = await proposalsApi.acceptItem(proposalId!, itemId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      queryClient.invalidateQueries({
        queryKey: ["proposal-dialogue", proposalId],
      });
    },
  });

  const rejectMutation = useMutation<
    unknown,
    AxiosError<ApiError>,
    { itemId: string }
  >({
    mutationFn: async ({ itemId }) => {
      const res = await proposalsApi.rejectItem(proposalId!, itemId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
    },
  });

  const counterMutation = useMutation<
    CounterProposal,
    AxiosError<ApiError>,
    Record<string, unknown>
  >({
    mutationFn: async (changes) => {
      const res = await proposalsApi.counter(proposalId!, changes);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      queryClient.invalidateQueries({
        queryKey: ["proposal-dialogue", proposalId],
      });
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
    },
  });

  if (isLoading) return <p>Loading proposal…</p>;
  if (isError || !proposal) return <p role="alert">Proposal not found.</p>;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <nav style={{ marginBottom: 24 }}>
        <Link to={`/groups/${proposal.groupId}`}>← Back to group</Link>
      </nav>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1>Proposal</h1>
          <p>
            Date: <strong>{proposal.proposedDate}</strong>
            {proposal.proposedTime && ` at ${proposal.proposedTime}`}
          </p>
          <p>
            Status:{" "}
            <span
              data-testid="proposal-status"
              style={{
                color:
                  proposal.status === "locked"
                    ? "green"
                    : proposal.status === "accepted"
                      ? "blue"
                      : "orange",
                fontWeight: "bold",
              }}
            >
              {proposal.status}
            </span>
          </p>
        </div>
        <button onClick={() => setShowCounter((v) => !v)}>
          {showCounter ? "Cancel" : "Counter-propose"}
        </button>
      </div>

      {/* SSE connection indicator + consensus panel */}
      {consensus && (
        <section
          style={{
            border: "1px solid #d4edda",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            background: "#f8fff9",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Consensus</h2>
            <span style={{ fontSize: "0.8em", color: sseConnected ? "#28a745" : "#999" }}>
              {sseConnected ? "● Live" : "○ Polling"}
            </span>
          </div>
          {(consensus.items as Array<Record<string, unknown>>)?.map((item) => {
            const total = item.totalMembers as number;
            const accepted = item.acceptedCount as number;
            const pct = total > 0 ? Math.round((accepted / total) * 100) : 0;
            return (
              <div key={item.itemId as string} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{(item.suggestionName as string) || (item.itemId as string)}</span>
                  <span style={{ fontSize: "0.85em", color: item.consensusReached ? "green" : "#666" }}>
                    {accepted}/{total} {item.consensusReached ? "✓ Consensus!" : ""}
                  </span>
                </div>
                <div style={{ height: 6, background: "#e9ecef", borderRadius: 3, marginTop: 4 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: item.consensusReached ? "#28a745" : "#007bff",
                      borderRadius: 3,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Lock-in button */}
      {proposal.status === "pending" && proposal.items.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => lockMutation.mutate({ itemId: proposal.items[0].id })}
            disabled={lockMutation.isPending}
            style={{
              background: "#e83e8c",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1em",
            }}
          >
            {lockMutation.isPending ? "Locking in…" : "Lock in date night 🔒"}
          </button>
          {lockMutation.isError && (
            <p role="alert" style={{ color: "red" }}>
              {(lockMutation.error as AxiosError<ApiError>).response?.data?.message}
            </p>
          )}
        </div>
      )}

      {/* Counter-proposal form */}
      {showCounter && (
        <section
          style={{
            border: "1px solid #f0c040",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <h2>Counter-proposal</h2>
          <div>
            <label htmlFor="counterNote">Notes / changes</label>
            <textarea
              id="counterNote"
              value={counterNote}
              onChange={(e) => setCounterNote(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
              placeholder="Describe what you'd like to change…"
            />
          </div>
          {counterMutation.isError && (
            <p role="alert">{counterMutation.error.response?.data?.message}</p>
          )}
          <button
            onClick={() =>
              counterMutation.mutate({ note: counterNote })
            }
            disabled={counterMutation.isPending || !counterNote.trim()}
          >
            {counterMutation.isPending ? "Submitting…" : "Submit counter-proposal"}
          </button>
        </section>
      )}

      {/* Suggestion items — spec: 3-5 per proposal */}
      <section>
        <h2>
          Activity suggestions ({proposal.items.length})
        </h2>

        {proposal.items.length === 0 && (
          <p>No suggestions attached yet.</p>
        )}

        <ul
          data-testid="proposal-items"
          style={{ listStyle: "none", padding: 0 }}
        >
          {proposal.items.map((item) => (
            <li
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                background:
                  item.status === "accepted"
                    ? "#f0fff4"
                    : item.status === "rejected"
                      ? "#fff5f5"
                      : "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>
                    {item.suggestion?.name ?? `Suggestion ${item.id}`}
                  </strong>
                  {item.suggestion?.rating && (
                    <span style={{ marginLeft: 8 }}>
                      ★ {item.suggestion.rating}
                    </span>
                  )}
                  {item.suggestion?.address && (
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "0.9em" }}>
                      {item.suggestion.address}
                    </p>
                  )}
                </div>
                {item.status === "pending" && (
                  <div>
                    <button
                      onClick={() => acceptMutation.mutate({ itemId: item.id })}
                      disabled={acceptMutation.isPending}
                      style={{ marginRight: 8, color: "green" }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate({ itemId: item.id })}
                      disabled={rejectMutation.isPending}
                      style={{ color: "red" }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {item.status !== "pending" && (
                  <span
                    style={{
                      fontWeight: "bold",
                      color: item.status === "accepted" ? "green" : "red",
                    }}
                  >
                    {item.status}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Dialogue history */}
      {dialogue && dialogue.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2>Dialogue history</h2>
          <ul
            data-testid="dialogue-history"
            style={{ listStyle: "none", padding: 0 }}
          >
            {dialogue.map((entry) => (
              <li
                key={entry.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span style={{ color: "#999", fontSize: "0.85em" }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </span>{" "}
                <strong>{entry.type}</strong> by {entry.userId}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
