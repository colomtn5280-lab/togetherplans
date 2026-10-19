import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, usersApi, authApi, groupsApi } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FavCategoryChips, loadFavCategories, saveFavCategories } from "../components/FavCategories";
import { findCategory } from "../constants/categories";
import { AppNav } from "../components/AppNav";

interface CategoryPref {
  categoryId: string;
  score: number;
  interactions: number;
}

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ── NotificationsPage ─────────────────────────────────────────────────────────

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await notificationsApi.list();
      return (res.data.notifications ?? []) as NotificationRecord[];
    },
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) return <div style={{ padding: 32 }}>Loading notifications…</div>;

  return (
    <>
      <AppNav />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 32 }}>Notifications</h1>

      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#666" }}>
          <p style={{ fontSize: "2rem" }}>🔔</p>
          <p style={{ marginBottom: 20 }}>Quiet for now — share a plan to change that</p>
          <Link to="/dashboard" className="dn-btn" style={{ display: "inline-block", textDecoration: "none" }}>
            Share a plan →
          </Link>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {notifications.map((notif) => (
            <li
              key={notif.id}
              style={{
                padding: "14px 16px",
                marginBottom: 8,
                borderRadius: 16,
                background: notif.read ? "#f9f9f9" : "#fff8e1",
                border: `1px solid ${notif.read ? "#eee" : "#ffe082"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: notif.read ? 400 : 600, marginBottom: 2 }}>
                  {notif.title}
                </div>
                <div style={{ color: "#555", fontSize: "0.9em" }}>{notif.message}</div>
                <div style={{ color: "#999", fontSize: "0.8em", marginTop: 4 }}>
                  {new Date(notif.created_at).toLocaleString()}
                </div>
              </div>
              {!notif.read && (
                <button
                  onClick={() => markRead.mutate(notif.id)}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.8em",
                    borderRadius: 14,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
    </>
  );
}

// ── SettingsPage ──────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const [exportStatus, setExportStatus] = useState<"idle" | "loading" | "done">("idle");
  const [favIds, setFavIds] = useState<string[]>(() => loadFavCategories());
  const [favPickerOpen, setFavPickerOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const handleFavChange = (ids: string[]) => {
    setFavIds(ids);
    saveFavCategories(ids);
  };

  const { data: preferences } = useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      const res = await usersApi.getPreferences();
      return res.data;
    },
  });

  const handleExport = async () => {
    setExportStatus("loading");
    try {
      const [meRes, groupsRes] = await Promise.all([
        authApi.me(),
        groupsApi.list(),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: meRes.data,
        groups: groupsRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `datenight-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus("done");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch {
      setExportStatus("idle");
      alert("Export failed. Please try again.");
    }
  };

  const requestDeletion = useMutation({
    mutationFn: () => usersApi.requestDeletion(),
    onSuccess: () => {
      alert("Account scheduled for deletion in 30 days. You can cancel this from the same page.");
      clearAuth();
    },
  });

  const cats = (preferences?.categories ?? []) as CategoryPref[];

  return (
    <>
      <AppNav />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 32 }}>{t('settings.title')}</h1>

      {/* Account info */}
      <section style={{ marginBottom: 32, padding: 20, background: "#f9f9f9", borderRadius: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>{t('settings.account')}</h2>
        <p style={{ margin: "4px 0", color: "#444" }}>
          <strong>Email:</strong> {user?.email ?? "—"}
        </p>
        {user?.firstName && (
          <p style={{ margin: "4px 0", color: "#444" }}>
            <strong>Name:</strong> {user.firstName} {user.lastName ?? ""}
          </p>
        )}
        <button
          onClick={clearAuth}
          className="dn-btn dn-btn--secondary"
          style={{ marginTop: 12 }}
        >
          {t('settings.signOut')}
        </button>
      </section>

      {cats.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "1.1rem" }}>Activity preferences</h2>
          <p style={{ color: "#666", fontSize: "0.9em", marginTop: 0 }}>
            Learned from your past accepts, rejects, and lock-ins. Updated automatically.
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {[...cats]
              .sort((a, b) => b.score - a.score)
              .slice(0, 6)
              .map((cat) => (
                <li
                  key={cat.categoryId}
                  style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}
                >
                  <span style={{ minWidth: 100, textTransform: "capitalize" }}>
                    {cat.categoryId.replace(/-/g, " ")}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 14,
                      background: "#eee",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round(cat.score * 100)}%`,
                        background: cat.score > 0.5 ? "#28a745" : "#dc3545",
                        borderRadius: 14,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "0.8em", color: "#666", minWidth: 32, textAlign: "right" }}>
                    {Math.round(cat.score * 100)}%
                  </span>
                </li>
              ))}
          </ul>
          <p style={{ fontSize: "0.8em", color: "#999" }}>
            Based on {cats.reduce((sum, c) => sum + (c.interactions ?? 0), 0)} interactions
          </p>
        </section>
      )}

      {/* Favorite categories */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Favorite categories</h2>
          <button
            className="dn-btn dn-btn--secondary"
            onClick={() => setFavPickerOpen((v) => !v)}
            style={{ fontSize: 13, padding: "6px 14px" }}
          >
            {favPickerOpen ? "Done" : "Edit"}
          </button>
        </div>
        <p style={{ color: "#666", fontSize: "0.9em", marginTop: 6 }}>
          {favIds.length > 0
            ? favIds
                .map((id) => {
                  const cat = findCategory(id);
                  return cat ? `${cat.emoji} ${cat.name}` : id;
                })
                .join(" · ")
            : "None picked yet — favourites float to the top of Discover."}
        </p>
        {favPickerOpen && (
          <div style={{ marginTop: 12 }}>
            <FavCategoryChips selected={favIds} onChange={handleFavChange} />
          </div>
        )}
      </section>

      {/* Navigation */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.1rem" }}>Quick links</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Link to="/groups" style={{ color: "#0066cc" }}>← Back to groups</Link>
          <Link to="/notifications" style={{ color: "#0066cc" }}>🔔 Notifications</Link>
          <Link to="/suggestions" style={{ color: "#0066cc" }}>✨ Browse activities</Link>
        </nav>
      </section>

      {/* Language selector */}
      <section style={{ marginBottom: 32, padding: 20, background: "#f9f9f9", borderRadius: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Language</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[{ code: "en", label: "🇺🇸 English" }, { code: "es", label: "🇪🇸 Español" }].map(lang => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`dn-btn ${i18n.language.startsWith(lang.code) ? "dn-btn--primary" : "dn-btn--secondary"}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      {/* GDPR / Data rights */}
      <section
        style={{
          padding: 20,
          background: "var(--primary-soft, #e8f5f5)",
          borderRadius: 16,
          border: "1px solid var(--primary, #0E8C8C)",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Your data rights (GDPR / CCPA)</h2>
        <p style={{ color: "#555", fontSize: "0.9em" }}>
          You own your data. Export it as JSON or request permanent deletion (30-day grace period).
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleExport}
            disabled={exportStatus === "loading"}
            className="dn-btn dn-btn--secondary"
          >
            {exportStatus === "loading"
              ? t('common.loading')
              : exportStatus === "done"
                ? "✓ Export downloaded!"
                : t('settings.exportData')}
          </button>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Schedule account deletion? You have 30 days to cancel. This cannot be undone after 30 days.",
                )
              ) {
                requestDeletion.mutate();
              }
            }}
            disabled={requestDeletion.isPending}
            className="dn-btn"
            style={{
              background: "#dc3545",
              borderColor: "#dc3545",
            }}
          >
            {requestDeletion.isPending ? "Scheduling…" : t('settings.deleteAccount')}
          </button>
        </div>
      </section>
    </div>
    </>
  );
}
