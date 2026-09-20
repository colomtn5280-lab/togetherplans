import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { groupsApi } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import { AppNav } from "../components/AppNav";
import type { Group } from "../types";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await groupsApi.list();
      return res.data;
    },
  });

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.firstName ?? user?.email?.split("@")[0] ?? "there";

  const hasGroups = groups && groups.length > 0;

  return (
    <>
      <AppNav />
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
                {hasGroups ? "One plan needs you." : `${greeting}, ${firstName}.`}
              </h1>
              {!hasGroups && (
                <p style={{ color: "var(--ink2)" }}>Create a group to start planning date nights.</p>
              )}
            </div>

            {/* YOUR TURN card */}
            {hasGroups && (
              <div
                className="dn-card dn-card--alt1"
                style={{
                  border: "2px solid var(--primary)",
                  animation: "dn-pulse 2.4s infinite",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span className="dn-sticker">Your Turn</span>
                  <span style={{ color: "var(--ink2)", fontSize: 13 }}>tap to vote</span>
                </div>
                <h3 style={{ marginBottom: 14 }}>Friday Night Plans</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  <button className="dn-chip selected">Italian Restaurant</button>
                  <button className="dn-chip" style={{ background: "var(--lime-soft)", color: "var(--lime)" }}>
                    Movie Night
                  </button>
                  <button className="dn-chip">Bowling</button>
                </div>
                <Link to={`/groups/${groups[0].id}`} className="dn-btn">
                  Vote now ♥
                </Link>
              </div>
            )}

            {/* Coming Up section */}
            {hasGroups && (
              <div>
                <h3 style={{ marginBottom: 12, color: "var(--ink2)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                  Coming Up
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {groups.slice(0, 2).map((g: Group, i: number) => (
                    <Link key={g.id} to={`/groups/${g.id}`} style={{ textDecoration: "none" }}>
                      <div
                        className={`dn-card dn-card--alt${(i + 1) % 3}`}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}
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
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
                            {g.name}
                          </div>
                          {g.description && (
                            <div style={{ fontSize: 13, color: "var(--ink2)" }}>{g.description}</div>
                          )}
                        </div>
                        <span className="dn-sticker dn-sticker--lime">Decided</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !hasGroups && (
              <div className="dn-card" style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                <h3 style={{ marginBottom: 8 }}>No plans yet</h3>
                <p style={{ color: "var(--ink2)", marginBottom: 20 }}>
                  Create a group and invite your partner or friends.
                </p>
                <Link to="/groups" className="dn-btn">Create a group →</Link>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3>Your groups</h3>
                <Link to="/groups" className="dn-btn dn-btn--sm dn-btn--tonal">Manage</Link>
              </div>
              {isLoading && <p style={{ color: "var(--ink2)", fontSize: 14 }}>Loading…</p>}
              {!isLoading && !hasGroups && (
                <div data-testid="empty-groups" style={{ textAlign: "center", padding: "20px 0" }}>
                  <p style={{ color: "var(--ink2)", fontSize: 14, marginBottom: 12 }}>No groups yet.</p>
                  <Link to="/groups" className="dn-btn dn-btn--sm">Create one →</Link>
                </div>
              )}
              {hasGroups && (
                <ul data-testid="groups-list" style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {groups.map((g: Group) => (
                    <li key={g.id}>
                      <Link to={`/groups/${g.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
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
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
                          {g.name}
                        </span>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--success)",
                            marginLeft: "auto",
                          }}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Get the app */}
            <div className="dn-card dn-card--alt3 dn-btn--tonal" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 8 }}>Get the app</h3>
              <p style={{ color: "var(--ink2)", fontSize: 13, marginBottom: 16 }}>
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
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 10, opacity: 0.7 }}>Download on the</div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>App Store</div>
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
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 10, opacity: 0.7 }}>Get it on</div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>Google Play</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign out */}
            <button onClick={handleLogout} className="dn-btn dn-btn--secondary" style={{ width: "100%" }}>
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
