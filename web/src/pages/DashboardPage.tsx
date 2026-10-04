import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueries } from "@tanstack/react-query";
import { groupsApi } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import { AppNav } from "../components/AppNav";
import { OnboardingModal } from "../components/OnboardingModal";
import type { Group, Proposal } from "../types";
import "./DashboardPage.css";

/** Returns true if the current user has already voted on this proposal */
function hasUserVoted(proposal: Proposal, userId: string | undefined): boolean {
  if (!userId) return false;
  const options = proposal.options ?? proposal.items ?? [];
  return options.some((opt) =>
    (opt.votes ?? []).some((v) => v.userId === userId)
  );
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
    // Always run — don't block on user being in store yet (token in axios interceptor)
    enabled: true,
    staleTime: 30_000,
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

  // Fetch proposals for ALL groups in parallel.
  const groupIds = (groups ?? []).map((g: Group) => g.id);

  const proposalQueries = useQueries({
    queries: groupIds.map((gid: string) => ({
      queryKey: ["proposals", gid],
      queryFn: async (): Promise<Proposal[]> => {
        const res = await groupsApi.proposals(gid);
        return res.data;
      },
      enabled: !!gid,
    })),
  });

  // Collect all open proposals where the user hasn't voted
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

  // Decided proposals for "Coming up"
  const decidedProposals: Array<{ group: Group; proposal: Proposal }> = [];
  proposalQueries.forEach((q, idx) => {
    const group = (groups ?? [])[idx];
    if (!group || !q.data) return;
    q.data.forEach((p) => {
      const isDecided =
        p.status === "DECIDED" ||
        p.status === "accepted" ||
        p.status === "locked";
      if (isDecided) {
        decidedProposals.push({ group, proposal: p });
      }
    });
  });

  // Sort pending oldest first
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
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    (user as { firstName?: string; displayName?: string; email?: string } | null)
      ?.firstName ??
    (user as { firstName?: string; displayName?: string; email?: string } | null)
      ?.displayName ??
    (user as { firstName?: string; displayName?: string; email?: string } | null)
      ?.email?.split("@")[0] ??
    "there";

  const hasGroups = groups && groups.length > 0;

  return (
    <>
      <AppNav />

      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      <main className="db-main">
        <div className="db-grid">

          {/* ── Left / Main Column ── */}
          <div className="db-left">
            {/* Greeting */}
            <div className="db-greeting">
              <h1>{`${greeting}, ${firstName}.`}</h1>
            </div>

            {/* YOUR TURN — show ALL pending votes */}
            {hasGroups && pendingVotes.length > 0 && (
              <div>
                <div className="db-section-label">Your Turn</div>
                <div className="db-stack">
                  {pendingVotes.map(({ group, proposal }) => {
                    const optionCount =
                      (proposal.options ?? proposal.items ?? []).length;
                    return (
                      <div
                        key={proposal.id}
                        className="dn-card dn-card--alt1 db-your-turn"
                      >
                        <div className="db-your-turn-header">
                          <span className="dn-sticker">Your Turn</span>
                          <span className="db-group-name">{group.name}</span>
                        </div>
                        <h3 className="db-proposal-title">
                          {proposal.title ?? "Open proposal"}
                        </h3>
                        <p className="db-proposal-meta">
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
              <div className="dn-card dn-card--alt1 db-caught-up">
                <span className="dn-sticker dn-sticker--lime">All caught up</span>
                <h3>No open proposals</h3>
                <Link
                  to={`/groups/${groups![0].id}/proposals/new`}
                  className="dn-btn"
                >
                  Start a new plan +
                </Link>
              </div>
            )}

            {/* Coming Up — decided proposals */}
            {hasGroups && decidedProposals.length > 0 && (
              <div>
                <div className="db-section-label">Coming Up</div>
                <div className="db-stack">
                  {decidedProposals.slice(0, 3).map(({ group, proposal }, i) => (
                    <Link
                      key={proposal.id}
                      to={`/groups/${proposal.groupId}/proposals/${proposal.id}`}
                      className={`dn-card dn-card--alt${(i + 1) % 3} db-coming-up`}
                    >
                      <div className="db-coming-up-inner">
                        <div className="db-avatar">
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="db-coming-up-text">
                          <div className="db-coming-up-title">
                            {proposal.title ?? "Decided plan"}
                          </div>
                          <div className="db-coming-up-group">{group.name}</div>
                        </div>
                        <span className="dn-sticker dn-sticker--lime">DECIDED</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="dn-card db-loading">
                <p>Loading plans…</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !hasGroups && (
              <div className="dn-card db-empty">
                <div className="db-empty-icon">🗓️✨</div>
                <h2>Start your first plan</h2>
                <p>
                  Create a group for your partner, friends, or family — then
                  propose ideas and vote together on the perfect plan.
                </p>
                <div className="db-empty-ctas">
                  <Link to="/suggestions" className="dn-btn">
                    Browse tonight's ideas →
                  </Link>
                  <Link to="/groups" className="dn-btn dn-btn--secondary">
                    Create a group
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Rail ── */}
          <div className="db-right">
            {/* Your Groups card */}
            <div className="dn-card dn-card--alt2 db-groups-card">
              <div className="db-groups-header">
                <h3>Your groups</h3>
                <Link to="/groups" className="dn-btn dn-btn--sm dn-btn--tonal">
                  Manage
                </Link>
              </div>

              {isLoading && (
                <p className="db-rail-loading">Loading…</p>
              )}

              {!isLoading && !hasGroups && (
                <div className="db-groups-empty">
                  <p>No groups yet.</p>
                  <Link to="/groups" className="dn-btn dn-btn--sm">
                    Create one →
                  </Link>
                </div>
              )}

              {hasGroups && (
                <ul className="db-groups-list" data-testid="groups-list">
                  {groups.map((g: Group) => {
                    const groupPending = pendingVotes.filter(
                      (pv) => pv.group.id === g.id
                    ).length;
                    const memberCount =
                      (g as any).memberCount ??
                      (g as any).members?.length ??
                      null;
                    return (
                      <li key={g.id}>
                        <Link to={`/groups/${g.id}`} className="db-group-row">
                          {/* Stacked avatar dots */}
                          <div className="db-dot-stack">
                            <span
                              className="db-dot"
                              style={{ background: "var(--primary)" }}
                            />
                            {memberCount && memberCount > 1 && (
                              <span
                                className="db-dot"
                                style={{ background: "var(--lime)" }}
                              />
                            )}
                          </div>
                          <span className="db-group-name-rail">{g.name}</span>
                          {groupPending > 0 ? (
                            <span className="db-open-badge">
                              {groupPending} open
                            </span>
                          ) : (
                            <span className="db-dot-ok" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Account card */}
            <div className="dn-card dn-card--alt3 db-account-card">
              <h3>Account</h3>
              {user && (
                <p className="db-account-email">
                  {(user as any).email ?? (user as any).displayName ?? ""}
                </p>
              )}
              <div className="db-account-actions">
                <Link to="/settings" className="db-settings-link">
                  ⚙ Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="dn-btn dn-btn--secondary db-signout-btn"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — Get the app */}
        <footer className="db-footer">
          <p className="db-footer-label">Get the app</p>
          <div className="db-footer-badges">
            <a
              href="https://apps.apple.com/app/id6806890578"
              target="_blank"
              rel="noopener noreferrer"
              className="db-store-badge"
            >
              <span>🍎</span>
              <span className="db-store-text">
                <span className="db-store-sub">Download on the</span>
                <span className="db-store-name">App Store</span>
              </span>
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=app.datemeup.datenight"
              target="_blank"
              rel="noopener noreferrer"
              className="db-store-badge"
            >
              <span>▶</span>
              <span className="db-store-text">
                <span className="db-store-sub">Get it on</span>
                <span className="db-store-name">Google Play</span>
              </span>
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
