import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, invitationsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import type { InviteMethod, Invitation } from "../types";

const INVITE_METHODS: InviteMethod[] = ["email", "sms", "qr", "link", "code"];

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>("link");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: group, isLoading, isError } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await groupsApi.get(groupId!);
      return res.data;
    },
    enabled: !!groupId,
  });

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

  if (isLoading) return (
    <>
      <AppNav />
      <main style={{ padding: "40px var(--gutter)", textAlign: "center" }}>
        <p style={{ color: "var(--ink2)" }}>Loading group…</p>
      </main>
    </>
  );

  if (isError || !group) return (
    <>
      <AppNav />
      <main style={{ padding: "40px var(--gutter)", textAlign: "center" }}>
        <p role="alert" style={{ color: "var(--error)" }}>Group not found.</p>
      </main>
    </>
  );

  return (
    <>
      <AppNav />
      <main style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "32px var(--gutter)" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link to="/groups" style={{ color: "var(--ink2)", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 700 }}>
            ← Groups
          </Link>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>{group.name}</h1>
            {group.description && <p style={{ color: "var(--ink2)" }}>{group.description}</p>}
          </div>
          <Link to={`/groups/${groupId}/proposals/new`} className="dn-btn">
            New proposal +
          </Link>
          <Link to={`/groups/${groupId}/after-dark`} className="dn-btn dn-btn--secondary" style={{ textDecoration: "none" }}>
            🌙 After Dark
          </Link>
        </div>

        {/* 2-column layout */}
        <div
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32, alignItems: "start" }}
          className="group-detail-grid"
        >
          {/* Left: Active proposal cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ color: "var(--ink2)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Open proposals
            </h3>
            <div
              className="dn-card dn-card--alt1"
              style={{ border: "2px solid var(--primary)", animation: "dn-pulse 2.4s infinite" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span className="dn-sticker">Your Turn</span>
              </div>
              <h3 style={{ marginBottom: 14 }}>Plan for {group.name}</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <button className="dn-chip selected">Option 1</button>
                <button className="dn-chip">Option 2</button>
              </div>
              <button className="dn-btn">Vote now ♥</button>
            </div>
          </div>

          {/* Right: Invite panel */}
          <div className="dn-card dn-card--alt2" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                    value={`${window.location.origin}/join/${generatedInvite.token ?? generatedInvite.inviteCode ?? ""}`}
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
            {(inviteMethod === "qr" || (inviteMethod === "link" && generatedInvite)) && (
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
                  <div style={{ fontSize: 11, color: "var(--ink2)", fontFamily: "var(--font-body)" }}>QR code</div>
                </div>
                <span
                  className="dn-sticker dn-sticker--lime"
                  style={{ position: "absolute", top: -8, right: -8, transform: "rotate(2deg)" }}
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
              <p role="alert" style={{ color: "var(--error)", fontSize: 13 }}>{inviteMutation.error.message}</p>
            )}

            {generatedInvite && (
              <div
                data-testid="invite-result"
                style={{ background: "var(--success-soft)", borderRadius: 12, padding: 12 }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--success)", marginBottom: 4 }}>
                  ✓ Invite created
                </div>
                <div style={{ fontSize: 12, color: "var(--ink2)" }}>
                  Code: <strong>{generatedInvite.token ?? generatedInvite.inviteCode}</strong>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink2)" }}>
                  Expires: {new Date(generatedInvite.expiresAt).toLocaleString()}
                </div>
              </div>
            )}

            {/* Members list */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <h3 style={{ marginBottom: 12, fontSize: 15 }}>Members ({group.members?.length ?? 0})</h3>
              {group.members && group.members.length > 0 ? (
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.members.map((m) => (
                    <li key={m.userId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                        {(m.user?.displayName ?? m.firstName ?? m.email ?? m.userId ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
                          {m.user?.displayName ?? m.firstName ?? m.email ?? m.userId}
                        </div>
                      </div>
                      {m.role === "owner" && (
                        <span className="dn-sticker dn-sticker--ink">Owner</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "var(--ink2)", fontSize: 14 }}>No members yet.</p>
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
