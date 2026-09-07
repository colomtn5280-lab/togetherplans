import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { groupsApi } from "../api/client";
import { useAuthStore } from "../store/auth.store";

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

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <h1>DateNight</h1>
        <div>
          <span style={{ marginRight: 16 }}>
            {user?.firstName ?? user?.email}
          </span>
          <button onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2>Your groups</h2>
          <Link to="/groups">
            <button>Manage groups</button>
          </Link>
        </div>

        {isLoading && <p>Loading groups…</p>}

        {!isLoading && (!groups || groups.length === 0) && (
          <div data-testid="empty-groups">
            <p>You haven&apos;t joined any groups yet.</p>
            <Link to="/groups">
              <button>Create your first group</button>
            </Link>
          </div>
        )}

        {groups && groups.length > 0 && (
          <ul data-testid="groups-list" style={{ listStyle: "none", padding: 0 }}>
            {groups.map((g) => (
              <li key={g.id} style={{ marginBottom: 12 }}>
                <Link to={`/groups/${g.id}`}>
                  <strong>{g.name}</strong>
                </Link>
                {g.description && (
                  <span style={{ marginLeft: 8, color: "#666" }}>
                    {g.description}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Quick links</h2>
        <nav>
          <Link to="/groups" style={{ marginRight: 16 }}>
            Groups
          </Link>
          <Link to="/suggestions">Browse activities</Link>
        </nav>
      </section>
    </main>
  );
}
