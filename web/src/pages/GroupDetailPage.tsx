import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, invitationsApi, safetyApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import type { InviteMethod, Invitation, Proposal } from "../types";
import "./groups.css";
import "./group-detail.css";

// INVITE_METHODS kept for legacy reference

function statusLabel(status: string) {
  if (status === "OPEN" || status === "pending") return "OPEN";
  if (status === "DECIDED" || status === "accepted" || status === "locked") return "DECIDED";
  if (status === "CANCELLED") return "CANCELLED";
  return status.toUpperCase();
}

function statusStyles(status: string): React.CSSProperties {
  const s = statusLabel(status);
  if (s === "OPEN") {
    return { background: "var(--primary-soft)", color: "var(--primary)" };
  }
  if (s === "DECIDED") {
    return { background: "rgba(124,181,24,0.12)", color: "#4a7a0a" };
  }
  return { background: "var(--bg)", color: "var(--ink2)" };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>("link");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Safety: block / report state
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [reportingUserId, setReportingUserId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>("");
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);

  const { data: group, isLoading, isError } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await groupsApi.get(groupId!);
      return res.data;
    },
    enabled: !!groupId,
  });

  // Fetch proposals for this group
  const { data: proposals } = useQuery<Proposal[]>({
    queryKey: ["proposals", groupId],
    queryFn: async () => {
      const res = await groupsApi.proposals(groupId!);
      return res.data;
    },
    enabled: !!groupId,
  });

  // Show last 5 proposals, most recent first
  const recentProposals = (proposals ?? [])
    .slice()
    .sort((a, b) => {
      const da = a.dateTime ?? a.proposedDate ?? a.id;
      const db = b.dateTime ?? b.proposedDate ?? b.id;
      return da > db ? -1 : da < db ? 1 : 0;
    })
    .slice(0, 5);

  const inviteMutation = useMutation<Invitation, Error>({
    mutationFn: async () => {
      const res = await invitationsApi.create({
        groupId: groupId!,
        method: inviteMethod,
        target: inviteEmail || invitePhone || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedInvite(data);
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: () => groupsApi.delete(groupId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      navigate("/groups", { replace: true });
    },
  });

  const handleCopy = () => {
    if (!generatedInvite) return;
    // Backend returns full inviteUrl — extract token from it as fallback
    const token = generatedInvite.token ?? generatedInvite.inviteCode ??
      generatedInvite.inviteUrl?.split('/join/')[1] ??
      generatedInvite.inviteUrl?.split('/accept/')[1] ?? "";
    const link = generatedInvite.inviteUrl?.startsWith('http')
      ? generatedInvite.inviteUrl
      : `${window.location.origin}/join/${token}`;
    // Use clipboard API with execCommand fallback for older browsers
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        fallbackCopy(link);
      });
    } else {
      fallbackCopy(link);
    }
  };

  const fallbackCopy = (text: string) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent — browser doesn't support it
    }
    document.body.removeChild(el);
  };

  if (isLoading)
    return (
      <>
        <AppNav />
        <main style={{ padding: "40px var(--gutter)", textAlign: "center" }}>
          <p style={{ color: "var(--ink2)" }}>Loading group…</p>
        </main>
      </>
    );

  if (isError || !group)
    return (
      <>
        <AppNav />
        <main style={{ padding: "40px var(--gutter)", textAlign: "center" }}>
          <p role="alert" style={{ color: "var(--error)" }}>
            Group not found.
          </p>
        </main>
      </>
    );

  return (
    <>
      <AppNav />
      <main>
        <div className="dmu-wrap dmu-gd-grid">

          {/* Back link */}
          <Link to="/groups" className="dmu-back">← Your groups</Link>

          {/* ── Group Header ── */}
          <div className="dmu-gd-head">
            {/* Avatar stack */}
            <div className="dmu-stack dmu-stack-lg">
              {group.members && group.members.length > 0
                ? group.members.slice(0, 4).map((m: any, idx: number) => {
                    const name = m.user?.displayName ?? m.firstName ?? m.email ?? m.userId ?? "?";
                    return (
                      <div key={m.userId} title={name} className={`dmu-av ${idx % 2 === 0 ? "dmu-av-teal" : "dmu-av-lime"}`}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                    );
                  })
                : <div className="dmu-av dmu-av-teal">{group.name.charAt(0).toUpperCase()}</div>}
              {/* Dashed slot for pending partner (couples) */}
              {(group.members?.length ?? 0) < 2 && (
                <div className="dmu-av dmu-av-empty">?</div>
              )}
            </div>

            <div className="dmu-gd-title">
              <h1 className="dmu-hello" style={{ fontSize: 28 }}>{group.name}</h1>
              <p className="dmu-sub" style={{ margin: 0 }}>
                {(group.members?.length ?? 0) <= 2 ? "Couple" : "Group"} · {group.members?.length ?? 1} member{(group.members?.length ?? 1) !== 1 ? "s" : ""}
                {(group.members?.length ?? 0) < 2 ? " · Partner hasn't joined yet" : ""}
              </p>
            </div>

            <Link
              to={`/groups/${groupId}/proposals/new`}
              className="dmu-btn dmu-btn-primary dmu-gd-cta"
              style={{ textDecoration: "none" }}
            >
              New Date Plan
            </Link>
          </div>

          {/* 2-column layout */}
          <div
            style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 28, alignItems: "start", marginTop: 32 }}
            className="group-detail-grid"
          >
            {/* Left: Recent proposals */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="dmu-section-head">
                <span>Proposals</span>
              </div>

            {recentProposals.length === 0 ? (
              <div className="dmu-gd-empty">
                <div className="dmu-gd-empty-art">
                  <span className="dmu-card-a">🍜 Dinner?</span>
                  <span className="dmu-card-b">🎭 Show</span>
                  <span className="dmu-card-c">🌄 Hike</span>
                </div>
                <h2>No plans yet. Start one.</h2>
                <p>Propose ideas and let everyone vote on the perfect plan.</p>
                <div className="dmu-gd-empty-actions">
                  <Link
                    to={`/groups/${groupId}/proposals/new`}
                    className="dmu-btn dmu-btn-primary"
                    style={{ textDecoration: "none" }}
                  >
                  New Date Plan
                                    </Link>
                                    <Link
                                      to="/suggestions"
                                      className="dmu-btn dmu-btn-ghost dmu-btn-auto"
                                      style={{ textDecoration: "none" }}
                                    >
                                      Browse ideas
                                    </Link>
                                  </div>
                                </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recentProposals.map((p, i) => {
                  const optionCount = (p.options ?? p.items ?? []).length;
                  const sl = statusLabel(p.status);
                  const ss = statusStyles(p.status);
                  const isOpen = sl === "OPEN";
                  return (
                    <Link
                      key={p.id}
                      to={`/proposals/${p.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        className={`dn-card dn-card--alt${i % 3}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          padding: "16px 20px",
                          border: isOpen
                            ? "2px solid var(--primary)"
                            : "2px solid transparent",
                          animation: isOpen ? "dn-pulse 2.4s infinite" : "none",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              fontSize: 15,
                              color: "var(--ink)",
                              marginBottom: 4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.title ?? "Untitled proposal"}
                          </div>
                          <div
                            style={{
                              color: "var(--ink2)",
                              fontSize: 13,
                            }}
                          >
                            {formatDate(p.dateTime ?? p.proposedDate)}
                            {optionCount > 0 &&
                              ` · ${optionCount} option${optionCount !== 1 ? "s" : ""}`}
                          </div>
                        </div>
                        <span
                          style={{
                            ...ss,
                            borderRadius: 99,
                            padding: "4px 12px",
                            fontSize: 11,
                            fontFamily: "var(--font-display)",
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                            flexShrink: 0,
                          }}
                        >
                          {sl}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Invite panel */}
          <div className="dmu-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="dmu-card-head"><h2>Invite members</h2></div>

            {/* Method chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(["link", "email", "sms", "username"] as InviteMethod[]).map((m) => (
                <button
                  key={m}
                  className="dmu-chip"
                  data-selected={inviteMethod === m ? "true" : undefined}
                  style={{
                    background: inviteMethod === m ? "var(--primary)" : "var(--bg)",
                    color: inviteMethod === m ? "var(--on-primary, #fff)" : "var(--ink2)",
                    border: "none", borderRadius: "999px", padding: "6px 16px",
                    font: "700 12px 'Sora',sans-serif", letterSpacing: ".04em",
                    cursor: "pointer", transition: "background .15s",
                  }}
                  onClick={() => {
                    setInviteMethod(m);
                    setGeneratedInvite(null);
                    if (m === "link") {
                      setTimeout(() => inviteMutation.mutate(), 50);
                    }
                  }}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Email/SMS inputs */}
            {inviteMethod === "email" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 12,
                    marginBottom: 6,
                    color: "var(--ink2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Email address
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  className="dn-input"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@example.com"
                />
              </div>
            )}

            {inviteMethod === "sms" && generatedInvite && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 14, color: "var(--ink2)", margin: 0 }}>
                  Share the invite link via Messages, WhatsApp, email, or any app.
                </p>
                <button
                  className="dmu-btn dmu-btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => {
                    const url = generatedInvite.inviteUrl?.startsWith('http')
                      ? generatedInvite.inviteUrl
                      : `${window.location.origin}/join/${generatedInvite.token ?? ""}`;
                    if (navigator.share) {
                      navigator.share({
                        title: "Join me on DateMeUp",
                        text: "Help us pick our next date night — vote on the plan:",
                        url,
                      }).catch(() => {});
                    } else {
                      // Fallback: copy to clipboard
                      navigator.clipboard?.writeText(url).catch(() => {});
                    }
                  }}
                >
                  Share invite link
                </button>
              </div>
            )}

            {inviteMethod === "sms" && !generatedInvite && (
              <p style={{ fontSize: 14, color: "var(--ink2)", margin: 0 }}>
                Click "Generate invite" below to create a shareable link.
              </p>
            )}

            {/* Link field */}
            {inviteMethod === "link" && generatedInvite && (
              <div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="dn-input"
                    readOnly
                    value={
                      generatedInvite.inviteUrl?.startsWith('http')
                        ? generatedInvite.inviteUrl
                        : `${window.location.origin}/join/${generatedInvite.token ?? generatedInvite.inviteCode ?? ""}`
                    }
                    style={{ fontSize: 12 }}
                  />
                  <button
                    className="dmu-btn dmu-btn-primary"
                    onClick={handleCopy}
                    style={{ flexShrink: 0, height: 40, padding: "0 14px", fontSize: 13 }}
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {/* QR code card */}
            {(inviteMethod === "qr" ||
              (inviteMethod === "link" && generatedInvite)) && (
              <div
                style={{
                  width: 170,
                  height: 170,
                  background: "var(--bg)",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "rotate(-2deg)",
                  position: "relative",
                  alignSelf: "center",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48 }}>▦</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink2)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    QR code
                  </div>
                </div>
                <span
                  className="dn-sticker dn-sticker--lime"
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    transform: "rotate(2deg)",
                  }}
                >
                  72 H
                </span>
              </div>
            )}

            <button
              onClick={() => inviteMutation.mutate()}
              disabled={inviteMutation.isPending}
              className="dmu-btn dmu-btn-primary"
              style={{ width: "100%" }}
            >
              {inviteMutation.isPending ? "Generating…" : "Generate invite"}
            </button>

            {inviteMutation.isError && (
              <p role="alert" style={{ color: "var(--error)", fontSize: 13 }}>
                {inviteMutation.error.message}
              </p>
            )}

            {generatedInvite && (
              <div
                data-testid="invite-result"
                style={{
                  background: "var(--success-soft)",
                  borderRadius: 20,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--success)",
                    marginBottom: 4,
                  }}
                >
                  ✓ Invite created
                </div>
                <div style={{ fontSize: 12, color: "var(--ink2)" }}>
                  Code:{" "}
                  <strong>
                    {generatedInvite.token ?? generatedInvite.inviteCode}
                  </strong>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink2)" }}>
                  Expires:{" "}
                  {new Date(generatedInvite.expiresAt).toLocaleString()}
                </div>
              </div>
            )}

            {/* Members list */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <h3 style={{ marginBottom: 12, fontSize: 15 }}>
                Members ({group.members?.length ?? 0})
              </h3>

              {safetyMessage && (
                <div
                  style={{
                    background: "var(--success-soft)",
                    borderRadius: 20,
                    padding: "8px 12px",
                    marginBottom: 12,
                    fontSize: 13,
                    color: "var(--success)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                  }}
                >
                  ✓ {safetyMessage}
                </div>
              )}

              {group.members && group.members.length > 0 ? (
                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {group.members.map((m) => (
                    <li
                      key={m.userId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          background: "var(--primary-soft)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-display)",
                          fontWeight: 800,
                          fontSize: 12,
                          color: "var(--primary)",
                          flexShrink: 0,
                        }}
                      >
                        {(
                          m.user?.displayName ??
                          m.firstName ??
                          m.email ??
                          m.userId ??
                          "?"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: 13,
                            color: "var(--ink)",
                          }}
                        >
                          {m.user?.displayName ?? m.firstName ?? m.email ?? m.userId}
                        </div>
                      </div>
                      {m.role === "owner" && (
                        <span className="dn-sticker dn-sticker--ink">Owner</span>
                      )}

                      {/* Three-dot menu — only show for non-owner members */}
                      {m.role !== "owner" && (
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => {
                              setOpenMenuUserId((prev) =>
                                prev === m.userId ? null : m.userId
                              );
                              setReportingUserId(null);
                              setReportReason("");
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 18,
                              color: "var(--ink2)",
                              padding: "2px 6px",
                              borderRadius: 14,
                              lineHeight: 1,
                            }}
                            title="Member options"
                          >
                            ⋯
                          </button>

                          {openMenuUserId === m.userId && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "calc(100% + 4px)",
                                background: "var(--surface)",
                                border: "1px solid var(--line)",
                                borderRadius: 20,
                                boxShadow: "var(--shadow-card)",
                                zIndex: 10,
                                minWidth: 160,
                                overflow: "hidden",
                              }}
                            >
                              {reportingUserId === m.userId ? (
                                /* Inline report reason selector */
                                <div style={{ padding: 12 }}>
                                  <div
                                    style={{
                                      fontFamily: "var(--font-display)",
                                      fontWeight: 700,
                                      fontSize: 12,
                                      color: "var(--ink2)",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.06em",
                                      marginBottom: 8,
                                    }}
                                  >
                                    Report reason
                                  </div>
                                  {["spam", "harassment", "inappropriate", "other"].map(
                                    (r) => (
                                      <label
                                        key={r}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                          marginBottom: 6,
                                          cursor: "pointer",
                                          fontSize: 13,
                                          color: "var(--ink)",
                                        }}
                                      >
                                        <input
                                          type="radio"
                                          name={`report-reason-${m.userId}`}
                                          value={r}
                                          checked={reportReason === r}
                                          onChange={() => setReportReason(r)}
                                        />
                                        {r === "spam"
                                          ? "Spam"
                                          : r === "harassment"
                                          ? "Harassment"
                                          : r === "inappropriate"
                                          ? "Inappropriate"
                                          : "Other"}
                                      </label>
                                    )
                                  )}
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      marginTop: 10,
                                    }}
                                  >
                                    <button
                                      className="dn-btn dn-btn--sm"
                                      disabled={!reportReason}
                                      onClick={async () => {
                                        if (!reportReason) return;
                                        try {
                                          await safetyApi.reportUser({
                                            reportedUserId: m.userId,
                                            reason: reportReason,
                                          });
                                          setSafetyMessage("Report submitted");
                                          setTimeout(
                                            () => setSafetyMessage(null),
                                            3000
                                          );
                                        } catch {
                                          setSafetyMessage(
                                            "Could not submit report"
                                          );
                                          setTimeout(
                                            () => setSafetyMessage(null),
                                            3000
                                          );
                                        } finally {
                                          setOpenMenuUserId(null);
                                          setReportingUserId(null);
                                          setReportReason("");
                                        }
                                      }}
                                    >
                                      Submit report
                                    </button>
                                    <button
                                      className="dn-btn dn-btn--sm dn-btn--tonal"
                                      onClick={() => {
                                        setReportingUserId(null);
                                        setReportReason("");
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Default dropdown options */
                                <>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await safetyApi.blockUser(m.userId);
                                        setSafetyMessage("User blocked");
                                        setTimeout(
                                          () => setSafetyMessage(null),
                                          3000
                                        );
                                      } catch {
                                        setSafetyMessage("Could not block user");
                                        setTimeout(
                                          () => setSafetyMessage(null),
                                          3000
                                        );
                                      } finally {
                                        setOpenMenuUserId(null);
                                      }
                                    }}
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      background: "none",
                                      border: "none",
                                      textAlign: "left",
                                      padding: "10px 14px",
                                      cursor: "pointer",
                                      fontSize: 13,
                                      color: "var(--error)",
                                      fontFamily: "var(--font-display)",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Block user
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReportingUserId(m.userId);
                                      setReportReason("");
                                    }}
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      background: "none",
                                      border: "none",
                                      textAlign: "left",
                                      padding: "10px 14px",
                                      cursor: "pointer",
                                      fontSize: 13,
                                      color: "var(--ink)",
                                      fontFamily: "var(--font-display)",
                                      fontWeight: 700,
                                      borderTop: "1px solid var(--line)",
                                    }}
                                  >
                                    Report user
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "var(--ink2)", fontSize: 14 }}>
                  No members yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Delete Group */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
          {!confirmDelete ? (
            <button
              className="dmu-btn dmu-btn-ghost dmu-danger"
              style={{ width: "100%" }}
              onClick={() => setConfirmDelete(true)}
            >
              Delete group
            </button>
          ) : (
            <div style={{ background: "var(--surface)", borderRadius: "22px 16px 22px 16px", padding: "18px 20px", border: "1.5px solid var(--error)" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 12, color: "var(--ink)" }}>
                Delete this group? This can't be undone. All plans will be removed.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="dmu-btn dmu-btn-primary"
                  style={{ flex: 1, background: "var(--error)", height: 40 }}
                  onClick={() => deleteGroupMutation.mutate()}
                  disabled={deleteGroupMutation.isPending}
                >
                  {deleteGroupMutation.isPending ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  className="dmu-btn dmu-btn-ghost"
                  style={{ flex: 1, height: 40 }}
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
              {deleteGroupMutation.isError && (
                <p style={{ color: "var(--error)", fontSize: 12, marginTop: 8 }}>
                  Could not delete group. You may not be the owner.
                </p>
              )}
            </div>
          )}
        </div>

        <style>{`
          @media (max-width: 960px) {
            .group-detail-grid { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 767px) {
            .group-detail-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
        </div>{/* dmu-wrap */}

        {/* Slim footer */}
        <footer className="dmu-foot">
          <div className="dmu-wrap dmu-foot-in">
            <div className="dmu-legal">
              <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
            </div>
            <span className="dmu-foot-label">Vote on the go</span>
            <a href="https://apps.apple.com/app/id6806890578" target="_blank" rel="noopener noreferrer" className="dmu-store">
              <span>🍎</span> App Store
            </a>
            <a href="https://play.google.com/store/apps/details?id=app.datemeup.datenight" target="_blank" rel="noopener noreferrer" className="dmu-store">
              <span>▶</span> Google Play
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
