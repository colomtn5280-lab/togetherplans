import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { groupsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import type { Group } from "../types";

const createSchema = z.object({
  name: z.string().min(1, "Group name required"),
  description: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;

const CARD_CLASSES = ["", "dn-card--alt1", "dn-card--alt2", "dn-card--alt3"];

export function GroupsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: groups, isLoading, isError } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await groupsApi.list();
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation<Group, Error, CreateFormData>({
    mutationFn: async (data) => {
      const res = await groupsApi.create(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      reset();
      setShowCreate(false);
    },
  });

  return (
    <>
      <AppNav />
      <main style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "32px var(--gutter)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Your groups</h1>
            <p style={{ color: "var(--ink2)" }}>Plan date nights with the people you love.</p>
          </div>
          <button
            className={`dn-btn${showCreate ? " dn-btn--secondary" : ""}`}
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? "Cancel" : "New group +"}
          </button>
        </div>

        {/* Create group form */}
        {showCreate && (
          <div className="dn-card dn-card--alt1" style={{ marginBottom: 32, padding: 28, border: "1.5px solid var(--primary)" }}>
            <h3 style={{ marginBottom: 20 }}>Create a group</h3>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label
                  htmlFor="name"
                  style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}
                >
                  Group name
                </label>
                <input
                  id="name"
                  type="text"
                  className={`dn-input${errors.name ? " error" : ""}`}
                  {...register("name")}
                  placeholder="e.g. Us Two 💑"
                />
                {errors.name && <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 4 }}>{errors.name.message}</p>}
              </div>
              <div>
                <label
                  htmlFor="description"
                  style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}
                >
                  Description (optional)
                </label>
                <input
                  id="description"
                  type="text"
                  className="dn-input"
                  {...register("description")}
                  placeholder="What's this group for?"
                />
              </div>
              {createMutation.isError && (
                <p role="alert" style={{ color: "var(--error)", fontSize: 13 }}>{createMutation.error.message}</p>
              )}
              <button type="submit" className="dn-btn" disabled={createMutation.isPending} style={{ alignSelf: "flex-start" }}>
                {createMutation.isPending ? "Creating…" : "Create group →"}
              </button>
            </form>
          </div>
        )}

        {isLoading && <p style={{ color: "var(--ink2)" }}>Loading groups…</p>}
        {isError && <p role="alert" style={{ color: "var(--error)" }}>Failed to load groups.</p>}

        {/* Groups grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
          className="groups-grid"
        >
          {groups && groups.map((g: Group, i: number) => (
            <Link key={g.id} to={`/groups/${g.id}`} style={{ textDecoration: "none" }}>
              <div className={`dn-card ${CARD_CLASSES[i % 4]}`} style={{ height: "100%", minHeight: 160 }}>
                {/* Stacked avatars */}
                <div style={{ display: "flex", marginBottom: 14 }}>
                  {["A", "B", "C"].slice(0, 2).map((_letter, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: idx === 0 ? "var(--primary)" : "var(--lime)",
                        color: idx === 0 ? "var(--on-primary)" : "var(--on-lime)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        marginLeft: idx === 0 ? 0 : -10,
                        border: "2px solid var(--surface)",
                        zIndex: 2 - idx,
                        position: "relative",
                      }}
                    >
                      {g.name.charAt(idx).toUpperCase()}
                    </div>
                  ))}
                </div>
                <h3 style={{ marginBottom: 6 }}>{g.name}</h3>
                <p style={{ color: "var(--ink2)", fontSize: 13, marginBottom: 14 }}>
                  {g.members?.length ?? 1} members · 1 open
                </p>
                <span className="dn-sticker">Active</span>
              </div>
            </Link>
          ))}

          {/* New group cell */}
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: "transparent",
              border: "2px dashed var(--line)",
              borderRadius: "30px 22px 34px 20px",
              padding: 20,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              minHeight: 160,
              transition: "border-color 150ms, background 150ms",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-soft)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "var(--primary-soft)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              +
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--ink2)" }}>
              New group
            </span>
          </button>
        </div>

        {!isLoading && groups && groups.length === 0 && !showCreate && (
          <div data-testid="no-groups" style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📅</div>
            <h2 style={{ marginBottom: 8 }}>No groups yet</h2>
            <p style={{ color: "var(--ink2)", marginBottom: 24 }}>Create a group to start planning with your partner or friends.</p>
            <button className="dn-btn" onClick={() => setShowCreate(true)}>Create your first group →</button>
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .groups-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 1024px) and (min-width: 769px) {
            .groups-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
