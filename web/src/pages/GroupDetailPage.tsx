import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "../api/client";
import type { InviteMethod, Invitation } from "../types";

const INVITE_METHODS: InviteMethod[] = ["email", "sms", "qr", "link", "code"];

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>("link");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState<Invitation | null>(null);

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
      const res = await groupsApi.invite(groupId!, {
        method: inviteMethod,
        email: inviteEmail || undefined,
        phone: invitePhone || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedInvite(data);
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });

  if (isLoading) return <p>Loading group…</p>;
  if (isError || !group) return <p role="alert">Group not found.</p>;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <nav style={{ marginBottom: 24 }}>
        <Link to="/groups">← Groups</Link>
      </nav>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
        <div>
          <h1>{group.name}</h1>
          {group.description && <p>{group.description}</p>}
        </div>
        <Link to={`/groups/${groupId}/proposals/new`}>
          <button>New proposal</button>
        </Link>
      </div>

      {/* Members */}
      <section style={{ marginBottom: 32 }}>
        <h2>Members ({group.members?.length ?? 0})</h2>
        {group.members && group.members.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {group.members.map((m) => (
              <li key={m.userId} style={{ padding: "6px 0" }}>
                {m.firstName ?? ""} {m.email}{" "}
                <span style={{ color: "#999", fontSize: "0.85em" }}>
                  ({m.role})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No members yet.</p>
        )}
      </section>

      {/* Invite section */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 20,
          marginBottom: 32,
        }}
      >
        <h2>Invite someone</h2>

        <div style={{ marginBottom: 12 }}>
          <label>Invite method: </label>
          {INVITE_METHODS.map((m) => (
            <label key={m} style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="inviteMethod"
                value={m}
                checked={inviteMethod === m}
                onChange={() => {
                  setInviteMethod(m);
                  setGeneratedInvite(null);
                }}
              />{" "}
              {m}
            </label>
          ))}
        </div>

        {inviteMethod === "email" && (
          <div>
            <label htmlFor="inviteEmail">Email address</label>
            <input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
            />
          </div>
        )}

        {inviteMethod === "sms" && (
          <div>
            <label htmlFor="invitePhone">Phone number</label>
            <input
              id="invitePhone"
              type="tel"
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              placeholder="+15551234567"
            />
          </div>
        )}

        <button
          onClick={() => inviteMutation.mutate()}
          disabled={inviteMutation.isPending}
          style={{ marginTop: 12 }}
        >
          {inviteMutation.isPending ? "Generating invite…" : "Generate invite"}
        </button>

        {inviteMutation.isError && (
          <p role="alert">{inviteMutation.error.message}</p>
        )}

        {generatedInvite && (
          <div
            data-testid="invite-result"
            style={{
              marginTop: 16,
              padding: 12,
              background: "#f0fff4",
              borderRadius: 6,
            }}
          >
            <strong>Invite code:</strong> {generatedInvite.inviteCode}
            <br />
            <strong>Method:</strong> {generatedInvite.method}
            <br />
            <strong>Expires:</strong>{" "}
            {new Date(generatedInvite.expiresAt).toLocaleString()}
          </div>
        )}
      </section>
    </main>
  );
}
