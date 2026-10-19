import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueries } from "@tanstack/react-query";
import { groupsApi, suggestionsApi } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import { AppNav } from "../components/AppNav";
import { OnboardingModal } from "../components/OnboardingModal";
import { usePlanBuilder } from "../contexts/PlanBuilderContext";
import type { Group, Proposal } from "../types";
import "./add-to-date-button.css";

type Suggestion = {
  id: string;
  name: string;
  category?: string;
  address?: string;
  imageUrl?: string;
  distanceMiles?: number;
  source?: string;
  sourceName?: string;
  description?: string;
  shortDescription?: string;
  sourceUrl?: string;
  eventDate?: string;
  date?: string;
  rating?: number;
  priceLevel?: number;
};

function hasUserVoted(proposal: Proposal, userId: string | undefined): boolean {
  if (!userId) return false;
  const options = proposal.options ?? proposal.items ?? [];
  return options.some((opt) =>
    (opt.votes ?? []).some((v) => v.userId === userId)
  );
}

function getGroupInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function groupStatusLine(
  groupId: string,
  pendingVotes: Array<{ group: Group; proposal: Proposal }>,
  decidedProposals: Array<{ group: Group; proposal: Proposal }>
): string {
  const pending = pendingVotes.find((pv) => pv.group.id === groupId);
  if (pending) return "Your vote needed";
  const decided = decidedProposals.find((d) => d.group.id === groupId);
  if (decided) return `Decided · ${decided.proposal.title ?? "Plan ready"}`;
  return "No plan yet · Start one →";
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const { addOption, options } = usePlanBuilder();

  // Derive addedKeys from options (match SuggestionsPage pattern)
  const addedKeys = new Set(
    options.map((o) => o.name + (o.address ?? ""))
  );

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
    enabled: true,
    staleTime: 30_000,
  });

  // Read stored geolocation from localStorage (same key as SuggestionsPage)
  const storedLocation = (() => {
    try {
      const raw = localStorage.getItem("dn_last_location");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { lat: number; lng: number };
      if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        return { lat: parsed.lat, lng: parsed.lng };
      }
      return null;
    } catch {
      return null;
    }
  })();

  // Nearby ideas for the "Ideas near you" row
  const { data: ideasData } = useQuery({
    queryKey: ["dashboard-ideas", storedLocation?.lat, storedLocation?.lng],
    queryFn: async () => {
      try {
        const params: Record<string, unknown> = {
          category: "restaurants-dining",
          radius: 25,
        };
        if (storedLocation) {
          params.lat = storedLocation.lat;
          params.lng = storedLocation.lng;
        }
        const res = await suggestionsApi.list(params);
        return (res.data ?? []).slice(0, 3) as Suggestion[];
      } catch {
        return [] as Suggestion[];
      }
    },
    staleTime: 120_000,
  });
  const ideas: Suggestion[] = ideasData ?? [];

  useEffect(() => {
    if (showOnboarding) return;
    if (isLoading || !groups) return;
    if (groups.length > 0) return;
    if (localStorage.getItem("dn.skipDiscoverRedirect")) return;
    navigate("/suggestions", { replace: true });
  }, [showOnboarding, isLoading, groups, navigate]);

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

  const decidedProposals: Array<{ group: Group; proposal: Proposal }> = [];
  proposalQueries.forEach((q, idx) => {
    const group = (groups ?? [])[idx];
    if (!group || !q.data) return;
    q.data.forEach((p) => {
      const isDecided =
        p.status === "DECIDED" ||
        p.status === "accepted" ||
        p.status === "locked";
      if (isDecided) decidedProposals.push({ group, proposal: p });
    });
  });

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
  const firstGroupId = hasGroups ? groups![0].id : null;

  return (
    <>
      <AppNav />

      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      <main>
        <div className="dmu-wrap">
          {/* ── Two-column grid ── */}
          <div className="dmu-grid">

            {/* Left / main column */}
            <div>
              <h1 className="dmu-hello">{greeting}, {firstName}.</h1>

              {/* Pending votes subline */}
              {!isLoading && (
                <p className="dmu-sub">
                  {pendingVotes.length > 0
                    ? `${pendingVotes.length} plan${pendingVotes.length !== 1 ? "s" : ""} waiting for your vote.`
                    : "All caught up. No open proposals."}
                </p>
              )}

              {/* Pending vote cards */}
              {hasGroups && pendingVotes.length > 0 && (
                <>
                  <div className="dmu-section-head" style={{ marginTop: 28 }}>
                    <span>Your Turn</span>
                  </div>
                  {pendingVotes.map(({ group, proposal }) => {
                    const optionCount = (proposal.options ?? proposal.items ?? []).length;
                    return (
                      <div key={proposal.id} className="dmu-hero" style={{ marginTop: 0, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <span className="dmu-hero-sticker">YOUR TURN</span>
                          <span style={{ fontSize: 13, opacity: 0.85 }}>{group.name}</span>
                        </div>
                        <h2 style={{ marginTop: 0 }}>{proposal.title ?? "Open proposal"}</h2>
                        <p>{optionCount} option{optionCount !== 1 ? "s" : ""} to vote on</p>
                        <Link
                          to={`/proposals/${proposal.id}`}
                          className="dmu-btn dmu-btn-light"
                        >
                          Vote Now →
                        </Link>
                      </div>
                    );
                  })}
                </>
              )}

              {/* All caught up hero */}
              {hasGroups && pendingVotes.length === 0 && !isLoading && (
                <div className="dmu-hero" style={{ marginTop: 26 }}>
                  <span className="dmu-hero-sticker">ALL CAUGHT UP ✓</span>
                  <h2>What are we doing this weekend?</h2>
                  <p>No open proposals right now.</p>
                  {firstGroupId && (
                    <Link
                      to={`/groups/${firstGroupId}/proposals/new`}
                      className="dmu-btn dmu-btn-light"
                    >
                      + Start a new plan
                    </Link>
                  )}
                </div>
              )}

              {/* Empty state (no groups) */}
              {!isLoading && !hasGroups && (
                <div className="dmu-hero" style={{ marginTop: 26 }}>
                  <span className="dmu-hero-sticker">WELCOME ✨</span>
                  <h2>Start your first plan</h2>
                  <p>Create a group, propose ideas, and vote together.</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link to="/suggestions" className="dmu-btn dmu-btn-light">
                      Browse ideas →
                    </Link>
                    <Link to="/groups" className="dmu-btn dmu-btn-light" style={{ background: "rgba(255,255,255,.18)", boxShadow: "none" }}>
                      Create a group
                    </Link>
                  </div>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="dmu-hero" style={{ marginTop: 26 }}>
                  <p style={{ opacity: 0.7 }}>Loading plans…</p>
                </div>
              )}

              {/* Ideas near you */}
              {ideas.length > 0 && (
                <>
                  <div className="dmu-section-head">
                    <span>Ideas near you</span>
                    <Link to="/suggestions">See all</Link>
                  </div>
                  <div className="dmu-ideas">
                    {ideas.map((s) => {
                      const key = s.name + (s.address ?? "");
                      const added = addedKeys.has(key);
                      return (
                        <div key={s.id} className="dmu-idea">
                          <div
                            className="dmu-idea-img"
                            style={s.imageUrl ? { backgroundImage: `url(${s.imageUrl})` } : {}}
                          >
                            {!s.imageUrl && (
                              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
                                🍽️
                              </span>
                            )}
                          </div>
                          <div className="dmu-idea-body">
                            {s.category && <div className="dmu-cat">{s.category.replace(/-/g, " ").toUpperCase()}</div>}
                            <h3>{s.name}</h3>
                            {s.distanceMiles != null && (
                              <div className="dmu-meta">{s.distanceMiles.toFixed(1)} mi away</div>
                            )}
                            <button
                              className="dmu-add"
                              aria-pressed={added ? "true" : "false"}
                              style={{ marginTop: 12 }}
                              onClick={() => {
                                if (added) return;
                                addOption({
                                  name: s.name ?? "",
                                  category: s.category ?? "experiences",
                                  address: s.address,
                                  description: s.shortDescription || s.description,
                                  imageUrl: s.imageUrl,
                                  sourceUrl: s.sourceUrl,
                                  eventDate: s.eventDate ?? s.date ?? undefined,
                                  rating: s.rating,
                                  priceLevel: s.priceLevel,
                                  sourceName: s.sourceName || s.source,
                                });
                              }}
                            >
                              {added ? "Added" : "Add to Date"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Right rail */}
            <div className="dmu-rail">

              {/* Groups card */}
              <div className="dmu-card">
                <div className="dmu-card-head">
                  <h2>Your groups</h2>
                  <Link to="/groups">Manage</Link>
                </div>

                {isLoading && <p style={{ color: "var(--ink2)", fontSize: 14, marginTop: 10 }}>Loading…</p>}

                {!isLoading && !hasGroups && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ color: "var(--ink2)", fontSize: 14, marginBottom: 10 }}>No groups yet.</p>
                    <Link to="/groups" className="dmu-btn dmu-btn-primary" style={{ display: "inline-flex" }}>
                      Create one →
                    </Link>
                  </div>
                )}

                {hasGroups && (
                  <ul className="dmu-groups" data-testid="groups-list">
                    {groups.map((g: Group) => {
                      const statusLine = groupStatusLine(g.id, pendingVotes, decidedProposals);
                      const initial = getGroupInitial(g.name);
                      return (
                        <li key={g.id}>
                          <Link to={`/groups/${g.id}`}>
                            <div className="dmu-av dmu-av-teal">{initial}</div>
                            <div className="dmu-g-text">
                              <b>{g.name}</b>
                              <small>{statusLine}</small>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <button className="dmu-btn dmu-btn-dashed" onClick={() => navigate("/groups")}>
                  + New group
                </button>
              </div>

              {/* Account card */}
              <div className="dmu-card">
                <div className="dmu-acct">
                  <div className="dmu-av dmu-av-lg">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="dmu-g-text">
                    <b>{firstName}</b>
                    <small>{(user as any)?.email ?? ""}</small>
                  </div>
                </div>
                <div className="dmu-acct-actions">
                  <Link to="/settings" className="dmu-btn dmu-btn-ghost">
                    Settings
                  </Link>
                  <form onSubmit={(e) => { e.preventDefault(); handleLogout(); }}>
                    <button type="submit" className="dmu-btn dmu-btn-ghost dmu-danger" style={{ width: "100%" }}>
                      Sign out
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Slim footer */}
        <footer className="dmu-foot">
          <div className="dmu-wrap dmu-foot-in">
            <div className="dmu-legal">
              <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
            </div>
            <span className="dmu-foot-label">Vote on the go</span>
            <a
              href="https://apps.apple.com/app/id6806890578"
              target="_blank"
              rel="noopener noreferrer"
              className="dmu-store"
            >
              <span>🍎</span> App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=app.datemeup.datenight"
              target="_blank"
              rel="noopener noreferrer"
              className="dmu-store"
            >
              <span>▶</span> Google Play
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
