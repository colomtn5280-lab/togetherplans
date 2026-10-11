import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { groupsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import type { Group } from "../types";
import "./groups.css";

const createSchema = z.object({
  name: z.string().min(1, "Group name required"),
  description: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;

const AVATAR_COLORS = ["dmu-av-teal", "dmu-av-lime", "dmu-av-amber", "dmu-av-teal"];

type FilterTab = "all" | "couples" | "family";

export function GroupsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
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

  const allGroups: Group[] = groups ?? [];

  const counts = {
    all: allGroups.length,
    couples: allGroups.filter((g) => (g.members?.length ?? 1) <= 2).length,
    family: allGroups.filter((g) => (g.members?.length ?? 1) > 2).length,
  };

  const filtered =
    filter === "all"
      ? allGroups
      : filter === "couples"
      ? allGroups.filter((g) => (g.members?.length ?? 1) <= 2)
      : allGroups.filter((g) => (g.members?.length ?? 1) > 2);

  return (
    <>
      <AppNav />
      <main>
        <div className="dmu-wrap dmu-page">

          {/* Page header */}
          <div className="dmu-page-head">
            <div>
              <h1 className="dmu-hello" style={{ fontSize: 32 }}>Your groups</h1>
              <p className="dmu-sub">Plan with the people you love.</p>
            </div>
            <button
              className={`dmu-btn ${showCreate ? "dmu-btn-ghost" : "dmu-btn-primary"}`}
              onClick={() => setShowCreate((v) => !v)}
            >
              {showCreate ? "Cancel" : "+ New group"}
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="dmu-card" style={{ marginTop: 24, border: "1.5px solid var(--primary)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
                Create a group
              </h3>
              <form
                onSubmit={handleSubmit((d) => createMutation.mutate(d))}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div>
                  <label htmlFor="name" style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                    Group name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={`dn-input${errors.name ? " error" : ""}`}
                    {...register("name")}
                    placeholder="e.g. Us Two 💑"
                    style={{ width: "100%" }}
                  />
                  {errors.name && <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 4 }}>{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="description" style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                    Description (optional)
                  </label>
                  <input
                    id="description"
                    type="text"
                    className="dn-input"
                    {...register("description")}
                    placeholder="What's this group for?"
                    style={{ width: "100%" }}
                  />
                </div>
                {createMutation.isError && (
                  <p role="alert" style={{ color: "var(--error)", fontSize: 13 }}>{createMutation.error.message}</p>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="dmu-btn dmu-btn-primary" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating…" : "Create group →"}
                  </button>
                  <button type="button" className="dmu-btn dmu-btn-ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter tabs */}
          {allGroups.length > 0 && (
            <div className="dmu-filter">
              {(["all", "couples", "family"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  aria-selected={filter === tab}
                  onClick={() => setFilter(tab)}
                >
                  {tab === "all" ? "All" : tab === "couples" ? "Couples" : "Friends & family"} · {counts[tab]}
                </button>
              ))}
            </div>
          )}

          {/* State feedback */}
          {isLoading && <p style={{ color: "var(--ink2)", marginTop: 24 }}>Loading groups…</p>}
          {isError && <p role="alert" style={{ color: "var(--error)", marginTop: 24 }}>Failed to load groups.</p>}

          {/* Groups grid */}
          <div className="dmu-groups-grid" data-testid="groups-grid">
            {filtered.map((g: Group) => {
              const memberCount = g.members?.length ?? 1;
              const memberLabel = memberCount === 1 ? "1 member" : `${memberCount} members`;
              const initial = g.name.charAt(0).toUpperCase();
              const members = g.members ?? [];
              return (
                <Link key={g.id} to={`/groups/${g.id}`} className="dmu-group">
                  <div className="dmu-group-top">
                    <div className="dmu-stack">
                      {members.length > 0
                        ? members.slice(0, 4).map((m: any, idx: number) => (
                            <div key={m.id ?? idx} className={`dmu-av ${AVATAR_COLORS[idx % 4]}`}>
                              {(m.firstName ?? m.name ?? "?").charAt(0).toUpperCase()}
                            </div>
                          ))
                        : (
                            <div className={`dmu-av dmu-av-teal`}>{initial}</div>
                          )}
                      {members.length > 4 && (
                        <div className="dmu-av" style={{ background: "var(--bg)", color: "var(--ink2)", fontSize: 11 }}>
                          +{members.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="dmu-pill dmu-pill-active">Active</span>
                  </div>

                  <h2>{g.name}</h2>
                  <p className="dmu-group-meta">
                    {memberCount === 2 ? "Couple" : "Group"} · {memberLabel}
                  </p>

                  {/* Open plan row */}
                  <div className="dmu-open">
                    <span className="dmu-open-dot" />
                    <span className="dmu-open-text">
                      <b>No plan yet</b>
                      <small>Start one →</small>
                    </span>
                    <span className="dmu-open-go">›</span>
                  </div>
                </Link>
              );
            })}

            {/* New group dashed card */}
            <button className="dmu-group dmu-group-new" onClick={() => setShowCreate(true)}>
              <div className="dmu-new-plus">+</div>
              <b>New group</b>
              <small>Couple, friends, or family</small>
            </button>
          </div>

          {/* Empty state */}
          {!isLoading && allGroups.length === 0 && !showCreate && (
            <div data-testid="no-groups" style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📅</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, marginBottom: 8 }}>No groups yet</h2>
              <p style={{ color: "var(--ink2)", marginBottom: 24 }}>Create a group to start planning with your partner or friends.</p>
              <button className="dmu-btn dmu-btn-primary" onClick={() => setShowCreate(true)}>
                Create your first group →
              </button>
            </div>
          )}

        </div>

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
