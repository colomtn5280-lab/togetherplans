import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { groupsApi } from "../api/client";
import type { Group } from "../types";

const createSchema = z.object({
  name: z.string().min(1, "Group name required"),
  description: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;

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
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <nav style={{ marginBottom: 24 }}>
        <Link to="/dashboard">← Dashboard</Link>
      </nav>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1>Groups</h1>
        <button onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Cancel" : "New group"}
        </button>
      </div>

      {showCreate && (
        <section
          style={{
            border: "1px solid #ccc",
            padding: 16,
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <h2>Create a group</h2>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
            <div>
              <label htmlFor="name">Group name</label>
              <input id="name" type="text" {...register("name")} />
              {errors.name && <p role="alert">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="description">Description (optional)</label>
              <input id="description" type="text" {...register("description")} />
            </div>
            {createMutation.isError && (
              <p role="alert">{createMutation.error.message}</p>
            )}
            <button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create group"}
            </button>
          </form>
        </section>
      )}

      {isLoading && <p>Loading groups…</p>}
      {isError && <p role="alert">Failed to load groups.</p>}

      {!isLoading && groups && groups.length === 0 && (
        <p data-testid="no-groups">No groups yet. Create one above.</p>
      )}

      {groups && groups.length > 0 && (
        <ul data-testid="groups-list" style={{ listStyle: "none", padding: 0 }}>
          {groups.map((g) => (
            <li
              key={g.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Link to={`/groups/${g.id}`}>
                <strong>{g.name}</strong>
              </Link>
              {g.description && (
                <p style={{ margin: "4px 0 0", color: "#555" }}>
                  {g.description}
                </p>
              )}
              <div style={{ marginTop: 8 }}>
                <Link to={`/groups/${g.id}`}>
                  <button>View group →</button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
