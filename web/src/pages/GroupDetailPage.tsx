import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, invitationsApi, safetyApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import type { InviteMethod, Invitation, Proposal } from "../types";

const INVITE_METHODS: InviteMethod[] = ["email", "sms", "qr", "link", "code"];

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
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>("link");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    if (!generatedInvite) return;
    const token = generatedInvite.token ?? generatedInvite.inviteCode ?? "";
    const link = `${window.location.origin}/join/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
      <main
        style={{
          maxWidth: "var(--content-max)",
          margin: "0 auto",
          padding: "32px var(--gutter)",
        }}
      >
        {/* Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link
            to="/groups"
            style={{
              color: "var(--ink2)",
              fontSize: 13,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          >
            ← Groups
          </Link>
        </div>

        {/* ── Group Header ── */}
        <div
          className="dn-card"
          style={{ marginBottom: 32, padding: "28px 28px 24px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            {/* Name + avatars */}
            <div>
              <h1 style={{ marginBottom: 12 }}>{group.name}</h1>
              {group.description && (
                <p style={{ color: "var(--ink2)", marginBottom: 14 }}>
                  {group.description}
                </p>
              )}
              {/* Member avatars */}
              {group.members && group.members.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex" }}>
                    {group.members.slice(0, 6).map((m, idx) => {
                      const name =
                        m.user?.displayName ?? m.firstName ?? m.email ?? m.userId ?? "?";
                      return (
                        <div
                          key={m.userId}
                          title={name}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background:
                              idx % 2 === 0 ? "var(--primary)" : "var(--lime)",
                            color:
                              idx % 2 === 0
                                ? "var(--on-primary, #fff)"
                                : "var(--on-lime, #fff)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--font-display)",
                            fontWeight: 800,
                            fontSize: 13,
                            marginLeft: idx === 0 ? 0 : -10,
                            border: "2px solid var(--surface)",
                            zIndex: 10 - idx,
                            position: "relative",
                            flexShrink: 0,
                          }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                      );
                    })}
                  </div>
                  <span style={{ color: "var(--ink2)", fontSize: 13, marginLeft: 6 }}>
                    {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                to={`/groups/${groupId}/proposals/new`}
                className="dn-btn"
                style={{ textDecoration: "none" }}
              >
                + New Proposal
              </Link>
            </div>
          </div>
        </div>

        {/* 2-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 32,
            alignItems: "start",
          }}
          className="group-detail-grid"
        >
          {/* Left: Recent proposals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3
              style={{
                color: "var(--ink2)",
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
              }}
            >
              Recent proposals
            </h3>

            {recentProposals.length === 0 ? (
              <div
                className="dn-card dn-card--alt1"
                style={{ textAlign: "center", padding: "40px 32px" }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
                <h3 style={{ marginBottom: 8 }}>No plans yet — start one!</h3>
                <p
                  style={{
                    color: "var(--ink2)",
                    fontSize: 14,
                    marginBottom: 20,
                  }}
                >
                  Propose ideas and let everyone vote on the perfect plan.
                </p>
                <Link
                  to={`/groups/${groupId}/proposals/new`}
                  className="dn-btn"
                  style={{ textDecoration: "none" }}
                >
                  + New Proposal
                </Link>
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
          <div
            className="dn-card dn-card--alt2"
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <h3>Invite members</h3>

            {/* Method chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {INVITE_METHODS.map((m) => (
                <button
                  key={m}
                  className={`dn-chip${inviteMethod === m ? " selected" : ""}`}
                  onClick={() => {
                    setInviteMethod(m);
                    setGeneratedInvite(null);
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

            {inviteMethod === "sms" && (
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
                  Phone number
                </label>
                <input
                  id="invitePhone"
                  type="tel"
                  className="dn-input"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                />
              </div>
            )}

            {/* Link field */}
            {inviteMethod === "link" && generatedInvite && (
              <div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="dn-input"
                    readOnly
                    value={`${window.location.origin}/join/${
                      generatedInvite.token ?? generatedInvite.inviteCode ?? ""
                    }`}
                    style={{ fontSize: 12 }}
                  />
                  <button
                    className="dn-btn dn-btn--sm dn-btn--tonal"
                    onClick={handleCopy}
                    style={{ flexShrink: 0 }}
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
              className="dn-btn"
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

        <style>{`
          @media (max-width: 768px) {
            .group-detail-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
