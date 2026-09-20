import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export function AppNav() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const initials = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? "?";

  const navLinks = [
    { to: "/dashboard", label: "Home", icon: "⌂" },
    { to: "/groups", label: "Plans", icon: "📅" },
    { to: "/suggestions", label: "Discover", icon: "🧭" },
  ];

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 72,
        background: "var(--surface)",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--gutter)",
        maxWidth: "100%",
      }}
    >
      {/* Left: Logo */}
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div
          style={{
            width: 48,
            height: 48,
            background: "var(--primary)",
            borderRadius: "38% 62% 55% 45%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            transform: "rotate(-6deg)",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          📅
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--ink)",
          }}
        >
          DateNight
        </span>
      </Link>

      {/* Center: Segmented nav (authenticated, desktop only) */}
      {isAuthenticated && (
        <div
          className="app-nav__segments"
          style={{
            display: "flex",
            background: "var(--surface)",
            boxShadow: "var(--shadow-card)",
            borderRadius: 24,
            padding: 4,
            gap: 2,
          }}
        >
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 20,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                  background: active ? "var(--primary)" : "transparent",
                  color: active ? "var(--on-primary)" : "var(--ink2)",
                  transition: "background 150ms, color 150ms",
                }}
              >
                <span aria-hidden="true">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {isAuthenticated ? (
          <>
            {/* Bell */}
            <Link
              to="/notifications"
              aria-label="Notifications"
              style={{
                width: 42,
                height: 42,
                background: "var(--bg)",
                borderRadius: "50% 38% 50% 38%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                textDecoration: "none",
                boxShadow: "var(--shadow-card)",
              }}
            >
              🔔
            </Link>
            {/* Avatar */}
            <Link
              to="/settings"
              aria-label="Settings"
              style={{
                width: 42,
                height: 42,
                background: "var(--primary)",
                borderRadius: "45% 55% 38% 62%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 15,
                color: "var(--on-primary)",
                textDecoration: "none",
              }}
            >
              {initials}
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="dn-btn dn-btn--secondary dn-btn--sm">
              Log in
            </Link>
            <Link to="/signup" className="dn-btn dn-btn--sm">
              Get started
            </Link>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .app-nav__segments { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
