import { useForm } from "react-hook-form";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { proposalsApi, categoriesApi } from "../api/client";
import type { Proposal } from "../types";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";

interface FormData {
  categoryId: string;
  proposedDate: string;
  proposedTime: string;
  radiusKm: string;
}

export function NewProposalPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoriesApi.list();
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { radiusKm: "10" },
  });

  const mutation = useMutation<Proposal, AxiosError<ApiError>, FormData>({
    mutationFn: async (data) => {
      const res = await proposalsApi.create({
        groupId: groupId!,
        categoryId: data.categoryId,
        proposedDate: data.proposedDate,
        proposedTime: data.proposedTime || undefined,
        radiusKm: data.radiusKm ? parseInt(data.radiusKm, 10) : 10,
      });
      return res.data;
    },
    onSuccess: (data) => {
      navigate(`/proposals/${data.id}`);
    },
  });

  const onSubmit = (data: FormData) => {
    if (!data.categoryId) return;
    mutation.mutate(data);
  };

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>
      <nav style={{ marginBottom: 24 }}>
        <Link to={`/groups/${groupId}`}>← Back to group</Link>
      </nav>

      <h1>New proposal</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="categoryId">Activity category</label>
          <select
            id="categoryId"
            {...register("categoryId", { required: "Category required" })}
          >
            <option value="">Select a category…</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p role="alert">{errors.categoryId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="proposedDate">Proposed date</label>
          <input
            id="proposedDate"
            type="date"
            {...register("proposedDate", { required: "Date required" })}
            min={new Date().toISOString().split("T")[0]}
          />
          {errors.proposedDate && (
            <p role="alert">{errors.proposedDate.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="proposedTime">Preferred time (optional)</label>
          <input id="proposedTime" type="time" {...register("proposedTime")} />
        </div>

        <div>
          <label htmlFor="radiusKm">Search radius (km)</label>
          <input
            id="radiusKm"
            type="number"
            min={1}
            max={100}
            {...register("radiusKm")}
          />
        </div>

        {mutation.isError && (
          <p role="alert" data-testid="proposal-error">
            {mutation.error.response?.data?.message ??
              "Failed to create proposal"}
          </p>
        )}

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create proposal"}
        </button>
      </form>
    </main>
  );
}
