import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { invitationsApi } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import type { Invitation } from "../types";

interface InviteDetails {
  groupName?: string;
  groupId?: string;
  inviterName?: string;
  expiresAt: string;
}

export function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [groupId, setGroupId] = useState<string | undefined>();

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link.");
      setLoading(false);
      return;
    }
    invitationsApi
      .get(token)
      .then((res) => {
        const raw = res.data as Invitation & {
          group?: { id?: string; name?: string };
          inviter?: { displayName?: string };
        };
        const details: InviteDetails = {
          groupName: raw.groupName ?? raw.group?.name,
          groupId: raw.groupId ?? raw.group?.id,
          inviterName: raw.inviterName ?? raw.inviter?.displayName,
          expiresAt: raw.expiresAt,
        };
        setInvite(details);
        setGroupId(details.groupId);
        setLoading(false);
      })
      .catch(() => {
        setError("This invite link is invalid or has expired.");
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setJoining(true);
    try {
      const res = await invitationsApi.accept(token);
      setJoined(true);
      const resolvedGroupId = groupId ?? (res.data.group as { id?: string } | undefined)?.id;
      setTimeout(() => {
        if (resolvedGroupId) {
          navigate(`/groups/${resolvedGroupId}`, { replace: true });
        } else {
          navigate("/groups", { replace: true });
        }
      }, 1500);
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : "") ||
        ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "");
      if (msg.toLowerCase().includes("already a member")) {
        setError("You're already a member of this group.");
      } else {
        setError("Failed to join group. The invite may have expired or already been used.");
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-80px",
          left: "-80px",
          width: 300,
          height: 300,
          background: "var(--primary-soft)",
          borderRadius: "50%",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: "-80px",
          right: "-80px",
          width: 320,
          height: 320,
          background: "var(--lime-soft)",
          borderRadius: "50%",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      <div
        className="dn-card"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 440,
          borderRadius: "44px 36px 48px 40px",
          boxShadow: "var(--shadow-dock)",
          padding: "40px 36px",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "var(--primary)",
              borderRadius: "38% 62% 55% 45%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              margin: "0 auto 10px",
              transform: "rotate(-6deg)",
            }}
            aria-hidden="true"
          >
            📅
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 17,
              color: "var(--ink)",
            }}
          >
            DateNight
          </div>
        </div>

        {loading && (
          <p style={{ color: "var(--ink2)" }}>Loading invite…</p>
        )}

        {error && !loading && (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
            <h2 style={{ marginBottom: 8 }}>Invalid invite</h2>
            <p style={{ color: "var(--error)", marginBottom: 24 }}>{error}</p>
            <Link to="/" className="dn-btn">Go home</Link>
          </div>
        )}

        {!loading && !error && invite && (
          <div>
            {joined ? (
              <div>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h2 style={{ marginBottom: 8 }}>You're in!</h2>
                <p style={{ color: "var(--ink2)" }}>Redirecting to your group…</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
                <h2 style={{ marginBottom: 8 }}>You're invited!</h2>
                {invite.groupName && (
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--primary)", marginBottom: 8 }}>
                    You've been invited to join {invite.groupName}
                  </p>
                )}
                {invite.inviterName && (
                  <p style={{ color: "var(--ink2)", marginBottom: 8 }}>
                    Invited by <strong>{invite.inviterName}</strong>
                  </p>
                )}
                <p style={{ color: "var(--ink2)", fontSize: 13, marginBottom: 28 }}>
                  Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                </p>

                {isAuthenticated ? (
                  <button
                    className="dn-btn"
                    style={{ width: "100%" }}
                    onClick={handleAccept}
                    disabled={joining}
                  >
                    {joining ? "Joining…" : "Join group →"}
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ color: "var(--ink2)", fontSize: 14, marginBottom: 4 }}>
                      Sign in or create an account to join.
                    </p>
                    <Link
                      to={`/login?redirect=/join/${token}`}
                      className="dn-btn"
                      style={{ width: "100%" }}
                    >
                      Log in
                    </Link>
                    <Link
                      to={`/signup?redirect=/join/${token}`}
                      className="dn-btn dn-btn--secondary"
                      style={{ width: "100%" }}
                    >
                      Create account
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
