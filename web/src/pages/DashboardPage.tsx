import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { groupsApi } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import { AppNav } from "../components/AppNav";
import { OnboardingModal } from "../components/OnboardingModal";
import type { Group, Proposal } from "../types";

/** Returns true if the current user has already voted on this proposal */
function hasUserVoted(proposal: Proposal, userId: string | undefined): boolean {
  if (!userId) return false;
  const options = proposal.options ?? proposal.items ?? [];
  return options.some((opt) =>
    (opt.votes ?? []).some((v) => v.userId === userId)
  );
}

function statusLabel(status: string) {
  if (status === "OPEN" || status === "pending") return "OPEN";
  if (status === "DECIDED" || status === "accepted" || status === "locked") return "DECIDED";
  return status.toUpperCase();
}

function statusColor(status: string) {
  const s = statusLabel(status);
  if (s === "OPEN") return "var(--primary)";
  if (s === "DECIDED") return "var(--lime)";
  return "var(--ink2)";
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return !localStorage.getItem("tp_onboarded");
  });

  const userId: string | undefined =
    (user as { userId?: string; id?: string } | null)?.userId ??
    (user as { userId?: string; id?: string } | null)?.id;

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await groupsApi.list();
      return res.data;
    },
  });

  // First-session flow: a user with zero groups lands in Discover instead of
  // an empty dashboard — unless they explicitly navigated here from the nav
  // (dn.skipDiscoverRedirect) or the onboarding modal is still open.
  useEffect(() => {
    if (showOnboarding) return;
    if (isLoading || !groups) return;
    if (groups.length > 0) return;
    if (localStorage.getItem("dn.skipDiscoverRedirect")) return;
    navigate("/suggestions", { replace: true });
  }, [showOnboarding, isLoading, groups, navigate]);

  // Fetch proposals for ALL groups in parallel
  const groupIds = (groups ?? []).map((g: Group) => g.id);

  const proposalQueries = groupIds.map((gid: string) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery<Proposal[]>({
      queryKey: ["proposals", gid],
      queryFn: async () => {
        const res = await groupsApi.proposals(gid);
        return res.data;
      },
      enabled: !!gid,
    })
  );

  // Collect all open proposals where the user hasn't voted, across all groups
  const pendingVotes: Array<{ group: Group; proposal: Proposal }> = [];
  proposalQueries.forEach((q, idx) => {
    const group = (groups ?? [])[idx];
    if (!group || !q.data) return;
    q.data.forEach((p) => {
      const isOpen = p.status === "OPEN" || p.status === "pending";
      if (isOpen && !hasUserVoted(p, userId)) {
        pendingVotes.push({ group, proposal: p });
      }
    });
  });

  // Sort oldest first by proposal id (UUIDs are time-ordered on this backend)
  // or by dateTime/proposedDate if available
  pendingVotes.sort((a, b) => {
    const da = a.proposal.dateTime ?? a.proposal.proposedDate ?? a.proposal.id;
    const db = b.proposal.dateTime ?? b.proposal.proposedDate ?? b.proposal.id;
    return da < db ? -1 : da > db ? 1 : 0;
  });

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    (user as { firstName?: string; displayName?: string; email?: string } | null)?.firstName ??
    (user as { firstName?: string; displayName?: string; email?: string } | null)?.displayName ??
    (user as { firstName?: string; displayName?: string; email?: string } | null)?.email?.split("@")[0] ??
    "there";

  const hasGroups = groups && groups.length > 0;

  return (
    <>
      <AppNav />

      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      <main style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "32px var(--gutter)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 32,
            alignItems: "start",
          }}
          className="dashboard-grid"
        >
          {/* ── Left Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h1 style={{ marginBottom: 4 }}>
                {hasGroups && pendingVotes.length > 0
                  ? pendingVotes.length === 1
                    ? "One plan needs you."
                    : `${pendingVotes.length} plans need your vote.`
                  : `${greeting}, ${firstName}.`}
              </h1>
              {!hasGroups && (
                <p style={{ color: "var(--ink2)" }}>
                  Create a group to start planning together.
                </p>
              )}
            </div>

            {/* YOUR TURN section — show ALL pending votes */}
            {hasGroups && pendingVotes.length > 0 && (
              <div>
                <h3
                  style={{
                    marginBottom: 12,
                    color: "var(--ink2)",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                  }}
                >
                  Your Turn
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendingVotes.map(({ group, proposal }) => {
                    const optionCount =
                      (proposal.options ?? proposal.items ?? []).length;
                    return (
                      <div
                        key={proposal.id}
                        className="dn-card dn-card--alt1"
                        style={{
                          border: "2px solid var(--primary)",
                          animation: "dn-pulse 2.4s infinite",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                          }}
                        >
                          <span className="dn-sticker">Your Turn</span>
                          <span style={{ color: "var(--ink2)", fontSize: 13 }}>
                            {group.name}
                          </span>
                        </div>
                        <h3 style={{ marginBottom: 8 }}>
                          {proposal.title ?? "Open proposal"}
                        </h3>
                        <p
                          style={{
                            color: "var(--ink2)",
                            fontSize: 13,
                            marginBottom: 14,
                          }}
                        >
                          {optionCount} option{optionCount !== 1 ? "s" : ""} to vote on
                        </p>
                        <Link
                          to={`/groups/${proposal.groupId}/proposals/${proposal.id}`}
                          className="dn-btn"
                        >
                          Vote Now →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All caught up */}
            {hasGroups && pendingVotes.length === 0 && !isLoading && (
              <div
                className="dn-card dn-card--alt1"
                style={{ border: "2px solid var(--primary)" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <span className="dn-sticker dn-sticker--lime">All caught up</span>
                </div>
                <h3 style={{ marginBottom: 14 }}>No open proposals</h3>
                <Link
                  to={`/groups/${groups![0].id}/proposals/new`}
                  className="dn-btn"
                >
                  Start a new plan +
                </Link>
              </div>
            )}

            {/* Coming Up section */}
            {hasGroups && (
              <div>
                <h3
                  style={{
                    marginBottom: 12,
                    color: "var(--ink2)",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                  }}
                >
                  Coming Up
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {groups.slice(0, 2).map((g: Group, i: number) => (
                    <Link key={g.id} to={`/groups/${g.id}`} style={{ textDecoration: "none" }}>
                      <div
                        className={`dn-card dn-card--alt${(i + 1) % 3}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "14px 16px",
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: "var(--primary-soft)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--font-display)",
                            fontWeight: 800,
                            fontSize: 14,
                            color: "var(--primary)",
                            flexShrink: 0,
                          }}
                        >
                          {g.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              fontSize: 14,
                              color: "var(--ink)",
                            }}
                          >
                            {g.name}
                          </div>
                          {g.description && (
                            <div style={{ fontSize: 13, color: "var(--ink2)" }}>
                              {g.description}
                            </div>
                          )}
                        </div>
                        <span className="dn-sticker dn-sticker--lime">Active</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state — no groups */}
            {!isLoading && !hasGroups && (
              <div
                className="dn-card"
                style={{ textAlign: "center", padding: "48px 40px" }}
              >
                <div style={{ fontSize: 64, marginBottom: 16 }}>🗓️✨</div>
                <h2 style={{ marginBottom: 8 }}>Start your first plan</h2>
                <p
                  style={{
                    color: "var(--ink2)",
                    marginBottom: 28,
                    lineHeight: 1.6,
                    maxWidth: 340,
                    margin: "0 auto 28px",
                  }}
                >
                  Create a group for your partner, friends, or family — then
                  propose ideas and vote together on the perfect plan.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Link to="/suggestions" className="dn-btn">
                    Browse tonight's ideas →
                  </Link>
                  <Link to="/groups" className="dn-btn dn-btn--secondary">
                    Create a group
                  </Link>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="dn-card" style={{ padding: 40, textAlign: "center" }}>
                <p style={{ color: "var(--ink2)" }}>Loading plans…</p>
              </div>
            )}
          </div>

          {/* ── Right Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Groups list */}
            <div className="dn-card dn-card--alt2">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3>Your groups</h3>
                <Link to="/groups" className="dn-btn dn-btn--sm dn-btn--tonal">
                  Manage
                </Link>
              </div>
              {isLoading && (
                <p style={{ color: "var(--ink2)", fontSize: 14 }}>Loading…</p>
              )}
              {!isLoading && !hasGroups && (
                <div
                  data-testid="empty-groups"
                  style={{ textAlign: "center", padding: "20px 0" }}
                >
                  <p style={{ color: "var(--ink2)", fontSize: 14, marginBottom: 12 }}>
                    No groups yet.
                  </p>
                  <Link to="/groups" className="dn-btn dn-btn--sm">
                    Create one →
                  </Link>
                </div>
              )}
              {hasGroups && (
                <ul
                  data-testid="groups-list"
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {groups.map((g: Group) => {
                    const groupPending = pendingVotes.filter(
                      (pv) => pv.group.id === g.id
                    ).length;
                    return (
                      <li key={g.id}>
                        <Link
                          to={`/groups/${g.id}`}
                          style={{
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              background: "var(--primary-soft)",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "var(--font-display)",
                              fontWeight: 800,
                              fontSize: 13,
                              color: "var(--primary)",
                              flexShrink: 0,
                            }}
                          >
                            {g.name.charAt(0).toUpperCase()}
                          </div>
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              fontSize: 14,
                              color: "var(--ink)",
                              flex: 1,
                            }}
                          >
                            {g.name}
                          </span>
                          {groupPending > 0 ? (
                            <span
                              style={{
                                background: "var(--primary)",
                                color: "#fff",
                                borderRadius: 99,
                                fontSize: 11,
                                fontFamily: "var(--font-display)",
                                fontWeight: 800,
                                padding: "2px 8px",
                                flexShrink: 0,
                              }}
                            >
                              {groupPending} vote{groupPending > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "var(--success)",
                              }}
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Get the app */}
            <div
              className="dn-card dn-card--alt3 dn-btn--tonal"
              style={{ padding: 20 }}
            >
              <h3 style={{ marginBottom: 8 }}>Get the app</h3>
              <p
                style={{
                  color: "var(--ink2)",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                Vote on the go with our iOS & Android apps.
              </p>
              <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "var(--ink)",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                >
                  <span>🍎</span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 10,
                        opacity: 0.7,
                      }}
                    >
                      Download on the
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      App Store
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "var(--ink)",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                >
                  <span>▶</span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 10,
                        opacity: 0.7,
                      }}
                    >
                      Get it on
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Google Play
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="dn-btn dn-btn--secondary"
              style={{ width: "100%" }}
            >
              Sign out
            </button>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .dashboard-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}

// Suppress unused import warning — used for type narrowing
void statusLabel;
void statusColor;
