import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { proposalsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import type { Proposal } from "../types";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";

interface OptionInput {
  name: string;
  category: string;
  description?: string;
  address?: string;
}

interface FormData {
  title: string;
  date: string;
  time: string;
  options: OptionInput[];
}

const CATEGORIES = ["Dining", "Movie", "Adventure", "Nightlife", "Culture", "Outdoors", "Sports", "Other"];

export function NewProposalPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      date: "",
      time: "19:00",
      options: [
        { name: "", category: "Dining", description: "", address: "" },
        { name: "", category: "Dining", description: "", address: "" },
        { name: "", category: "Dining", description: "", address: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });

  const mutation = useMutation<Proposal, AxiosError<ApiError>, FormData>({
    mutationFn: async (data) => {
      const dateTime = data.time
        ? `${data.date}T${data.time}:00`
        : `${data.date}T19:00:00`;
      const filledOptions = data.options.filter((o) => o.name.trim());
      if (filledOptions.length < 3) {
        throw new Error("Please provide at least 3 options with names.");
      }
      const res = await proposalsApi.create({
        groupId: groupId!,
        title: data.title,
        dateTime,
        options: filledOptions.map((o) => ({
          name: o.name,
          category: o.category || "Other",
          description: o.description || undefined,
          address: o.address || undefined,
        })),
      });
      return res.data;
    },
    onSuccess: () => {
      navigate(`/groups/${groupId}`);
    },
    onError: (err) => {
      setSubmitError((err as Error).message ?? err.response?.data?.message ?? "Failed to create proposal");
    },
  });

  return (
    <>
      <AppNav />
      <main style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "32px var(--gutter)" }}>
        <div style={{ marginBottom: 24 }}>
          <Link to={`/groups/${groupId}`} style={{ color: "var(--ink2)", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 700 }}>
            ← Back to group
          </Link>
        </div>

        <h1 style={{ marginBottom: 8 }}>New proposal</h1>
        <p style={{ color: "var(--ink2)", marginBottom: 32 }}>
          Add options for everyone to vote on.
        </p>

        <div style={{ maxWidth: 600 }}>
          <form
            onSubmit={handleSubmit((d) => mutation.mutate(d))}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}
              >
                Proposal title
              </label>
              <input
                id="title"
                type="text"
                className={`dn-input${errors.title ? " error" : ""}`}
                {...register("title", { required: "Title required" })}
                placeholder="e.g. Friday Night Plans"
              />
              {errors.title && <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 4 }}>{errors.title.message}</p>}
            </div>

            {/* Date + Time row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label
                  htmlFor="date"
                  style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}
                >
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  className={`dn-input${errors.date ? " error" : ""}`}
                  {...register("date", { required: "Date required" })}
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.date && <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 4 }}>{errors.date.message}</p>}
              </div>
              <div>
                <label
                  htmlFor="time"
                  style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}
                >
                  Time (optional)
                </label>
                <input
                  id="time"
                  type="time"
                  className="dn-input"
                  {...register("time")}
                />
              </div>
            </div>

            {/* Options */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <label
                  style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}
                >
                  Options
                </label>
                <button
                  type="button"
                  className="dn-btn dn-btn--sm dn-btn--tonal"
                  onClick={() => fields.length < 5 && append({ name: "", category: "Dining", description: "", address: "" })}
                  disabled={fields.length >= 5}
                >
                  + Add option
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {fields.map((field, i) => (
                  <div key={field.id} className="dn-card dn-card--alt1" style={{ padding: "20px 20px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>Option {i + 1}</span>
                      {fields.length > 3 && (
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", fontSize: 18, lineHeight: 1 }}
                          aria-label="Remove option"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--ink2)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Name *
                          </label>
                          <input
                            type="text"
                            className="dn-input"
                            {...register(`options.${i}.name` as const, { required: true })}
                            placeholder="e.g. Sushi Palace"
                            style={{ height: 38 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--ink2)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Category
                          </label>
                          <select
                            className="dn-input"
                            {...register(`options.${i}.category` as const)}
                            style={{ height: 38 }}
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "var(--ink2)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Address (optional)
                        </label>
                        <input
                          type="text"
                          className="dn-input"
                          {...register(`options.${i}.address` as const)}
                          placeholder="123 Main St"
                          style={{ height: 38 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {submitError && (
              <p role="alert" data-testid="proposal-error" style={{ color: "var(--error)", fontSize: 13 }}>
                {submitError}
              </p>
            )}

            <button
              type="submit"
              className="dn-btn"
              disabled={mutation.isPending}
              style={{ alignSelf: "flex-start" }}
            >
              {mutation.isPending ? "Creating…" : "Create proposal →"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
