import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { notificationsApi, groupsApi } from "../api/client";
import type { Group } from "../types";
import "./AppNav.css";

// ── Helpers ──────────────────────────────────────────────────────────────────

function CalendarSvg({ size = 22, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="17" rx="2.5" stroke={color} strokeWidth="2" />
      <line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      <line x1="8" y1="2" x2="8" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="2" x2="16" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AppNav() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const navigate = useNavigate();

  // ── Notification badge state ──────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.list();
      // API returns { count, notifications } — use unread count if available
      const data = res.data as { count?: number; unreadCount?: number; notifications?: unknown[] };
      const count =
        data.unreadCount ??
        data.count ??
        (Array.isArray(data.notifications) ? data.notifications.length : 0);
      setUnreadCount(count);
    } catch {
      // silently ignore — badge just stays at 0
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchNotifications]);

  // ── New Plan button state ─────────────────────────────────
  const [groups, setGroups] = useState<Group[]>([]);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    if (!showGroupPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowGroupPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showGroupPicker]);

  const handleNewPlan = useCallback(async () => {
    if (!isAuthenticated) return;
    setGroupsLoading(true);
    try {
      const res = await groupsApi.list();
      const g = res.data ?? [];
      setGroups(g);
      if (g.length === 1) {
        navigate(`/groups/${g[0].id}/proposals/new`);
      } else {
        setShowGroupPicker(true);
      }
    } catch {
      // fallback: go to groups page
      navigate("/groups");
    } finally {
      setGroupsLoading(false);
    }
  }, [isAuthenticated, navigate]);

  const handleGroupPick = useCallback(
    (groupId: string) => {
      setShowGroupPicker(false);
      navigate(`/groups/${groupId}/proposals/new`);
    },
    [navigate],
  );

  // ── Mobile drawer state ───────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // ── Avatar initials ───────────────────────────────────────
  const initials = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? "?";

  // ── Nav links config ──────────────────────────────────────
  const navLinks = [
    { to: "/dashboard", label: "Home", icon: "⌂" as React.ReactNode },
    {
      to: "/groups",
      label: "Plans",
      icon: (<CalendarSvg size={16} color="currentColor" />) as React.ReactNode,
    },
    { to: "/suggestions", label: "Discover", icon: "🧭" as React.ReactNode },
    { to: "/after-dark", label: "After Dark 🌙", icon: "🌙" as React.ReactNode },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────── */}
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
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: "var(--primary)",
              borderRadius: "38% 62% 55% 45%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(-6deg)",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <CalendarSvg size={22} color="white" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              color: "var(--ink)",
            }}
          >
            TogetherPlans
          </span>
        </Link>

        {/* Center: Segmented nav (authenticated, desktop) */}
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
                  onClick={() => {
                    if (link.to === "/dashboard") {
                      // User explicitly chose Home — stop the empty-dashboard
                      // → Discover redirect from bouncing them back.
                      localStorage.setItem("dn.skipDiscoverRedirect", "1");
                    }
                  }}
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
              {/* + New Plan button (desktop) */}
              <div
                className="app-nav__new-plan-wrap"
                style={{ position: "relative" }}
                ref={pickerRef}
              >
                <button
                  onClick={handleNewPlan}
                  disabled={groupsLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 18px",
                    background: "var(--primary)",
                    color: "var(--on-primary, #fff)",
                    border: "none",
                    borderRadius: 24,
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: groupsLoading ? "wait" : "pointer",
                    whiteSpace: "nowrap",
                    transition: "opacity 150ms",
                    opacity: groupsLoading ? 0.7 : 1,
                  }}
                >
                  New Date Plan
                </button>

                {/* Inline group picker dropdown */}
                {showGroupPicker && (
                  <div className="app-nav__group-picker">
                    <div className="app-nav__group-picker-label">Choose a group</div>
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        className="app-nav__group-picker-item"
                        onClick={() => handleGroupPick(g.id)}
                      >
                        {g.name}
                      </button>
                    ))}
                    {groups.length === 0 && (
                      <div
                        className="app-nav__group-picker-item"
                        style={{ color: "var(--ink2)", cursor: "default" }}
                      >
                        No groups yet
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bell with notification badge */}
              <div
                className="app-nav__bell"
                style={{ position: "relative", display: "flex" }}
              >
                <Link
                  to="/notifications"
                  aria-label={
                    unreadCount > 0
                      ? `Notifications (${unreadCount} unread)`
                      : "Notifications"
                  }
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
                    color: "var(--primary)",
                    position: "relative",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        minWidth: 16,
                        height: 16,
                        background: "var(--error, #e53e3e)",
                        borderRadius: 16,
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: "var(--font-display)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 3px",
                        lineHeight: 1,
                        border: "1.5px solid var(--surface)",
                      }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </div>

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
                  color: "var(--on-primary, #fff)",
                  textDecoration: "none",
                }}
              >
                {initials}
              </Link>

              {/* Hamburger (mobile only) */}
              <button
                className="app-nav__mobile-hamburger"
                aria-label="Open menu"
                onClick={() => setDrawerOpen(true)}
              >
                ☰
              </button>
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
      </nav>

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      {isAuthenticated && (
        <>
          {/* Overlay */}
          {drawerOpen && (
            <div
              className="app-nav__drawer-overlay"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Drawer panel */}
          <aside
            className={`app-nav__drawer${drawerOpen ? " app-nav__drawer--open" : ""}`}
            role="dialog"
            aria-label="Navigation menu"
            aria-modal="true"
          >
            <button
              className="app-nav__drawer-close"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
            >
              ✕
            </button>

            {/* Notification badge link in drawer */}
            <Link
              to="/notifications"
              className={`app-nav__drawer-link${location.pathname === "/notifications" ? " app-nav__drawer-link--active" : ""}`}
            >
              <span className="app-nav__drawer-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </span>
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    minWidth: 20,
                    height: 20,
                    background: "var(--error, #e53e3e)",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 5px",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/settings"
              className={`app-nav__drawer-link${location.pathname === "/settings" ? " app-nav__drawer-link--active" : ""}`}
            >
              <span className="app-nav__drawer-icon">⚙️</span>
              Settings
            </Link>
          </aside>
        </>
      )}

      {/* ── Bottom Tab Bar (mobile only) ─────────────────────── */}
      {isAuthenticated && (
        <nav className="app-nav__bottom-bar" aria-label="Main navigation">
          {/* Home */}
          <Link
            to="/dashboard"
            onClick={() => localStorage.setItem("dn.skipDiscoverRedirect", "1")}
            className={`app-nav__tab${location.pathname === "/dashboard" ? " app-nav__tab--active" : ""}`}
          >
            <span className="app-nav__tab-icon">⌂</span>
            Home
          </Link>

          {/* Plans */}
          <Link
            to="/groups"
            className={`app-nav__tab${location.pathname === "/groups" ? " app-nav__tab--active" : ""}`}
          >
            <span className="app-nav__tab-icon">📅</span>
            Plans
          </Link>

          {/* + New Plan (center teal circle) */}
          <button
            className="app-nav__tab app-nav__tab--new-plan"
            onClick={handleNewPlan}
            disabled={groupsLoading}
            aria-label="New Plan"
          >
            <span className="app-nav__tab-icon">+</span>
            New Plan
          </button>

          {/* Discover */}
          <Link
            to="/suggestions"
            className={`app-nav__tab${location.pathname === "/suggestions" ? " app-nav__tab--active" : ""}`}
          >
            <span className="app-nav__tab-icon">🧭</span>
            Discover
          </Link>

          {/* After Dark */}
          <Link
            to="/after-dark"
            className={`app-nav__tab${location.pathname === "/after-dark" ? " app-nav__tab--active" : ""}`}
          >
            <span className="app-nav__tab-icon">🌙</span>
            After Dark
          </Link>

          {/* Menu / Hamburger */}
          <button
            className={`app-nav__tab${drawerOpen ? " app-nav__tab--active" : ""}`}
            onClick={() => setDrawerOpen(true)}
            aria-label="More"
          >
            <span className="app-nav__tab-icon">☰</span>
            More
          </button>
        </nav>
      )}

      {/* Spacer so content isn't hidden behind bottom bar on mobile */}
      {isAuthenticated && <div className="app-nav__bottom-spacer" aria-hidden="true" />}

      {/* Mobile group picker (shown when bottom-bar New Plan triggers multi-group) */}
      {showGroupPicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 400,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setShowGroupPicker(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "16px 16px 0 0",
              width: "100%",
              maxWidth: 480,
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 16px 8px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--ink)",
                borderBottom: "1px solid var(--line)",
              }}
            >
              Choose a group
            </div>
            {groups.map((g) => (
              <button
                key={g.id}
                className="app-nav__group-picker-item"
                style={{ width: "100%", fontSize: 15 }}
                onClick={() => handleGroupPick(g.id)}
              >
                {g.name}
              </button>
            ))}
            {groups.length === 0 && (
              <div style={{ padding: 16, color: "var(--ink2)", fontSize: 14 }}>
                No groups yet. Create one first!
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
