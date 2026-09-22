import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { proposalsApi } from "../api/client";
import { AppNav } from "../components/AppNav";
import { CATEGORIES, CUSTOM_CATEGORY } from "../constants/categories";
import type { Proposal, Suggestion } from "../types";
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

const DEFAULT_CATEGORY = CATEGORIES[11].name; // Restaurants & Dining

// ── Category picker grid (15 categories + Custom last) ────────────────────────
function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isKnown = CATEGORIES.some((c) => c.name === value);
  const [customMode, setCustomMode] = useState(!isKnown && value !== "");

  return (
    <div>
      <div
        className="category-picker-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}
      >
        {CATEGORIES.map((c) => {
          const selected = !customMode && value === c.name;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => { setCustomMode(false); onChange(c.name); }}
              aria-pressed={selected}
              title={c.tagline}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "10px 4px",
                borderRadius: 12,
                cursor: "pointer",
                border: `1.5px solid ${selected ? "var(--primary)" : "var(--line)"}`,
                background: selected ? "var(--primary)" : "var(--surface)",
                color: selected ? "#fff" : "var(--ink)",
                transition: "all .15s ease",
              }}
            >
              <span style={{ fontSize: 18 }}>{c.emoji}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, lineHeight: 1.15, textAlign: "center" }}>
                {c.name}
              </span>
            </button>
          );
        })}
        {/* Custom — always LAST */}
        <button
          type="button"
          onClick={() => { setCustomMode(true); onChange(""); }}
          aria-pressed={customMode}
          title={CUSTOM_CATEGORY.tagline}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "10px 4px",
            borderRadius: 12,
            cursor: "pointer",
            border: `1.5px ${customMode ? "solid var(--primary)" : "dashed var(--line)"}`,
            background: customMode ? "var(--primary)" : "var(--surface)",
            color: customMode ? "#fff" : "var(--ink)",
            transition: "all .15s ease",
          }}
        >
          <span style={{ fontSize: 18 }}>{CUSTOM_CATEGORY.emoji}</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, lineHeight: 1.15, textAlign: "center" }}>
            {CUSTOM_CATEGORY.name}
          </span>
        </button>
      </div>
      {customMode && (
        <input
          type="text"
          className="dn-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your own category, e.g. Pottery class"
          style={{ height: 38, marginTop: 8 }}
          autoFocus
        />
      )}
    </div>
  );
}

export function NewProposalPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillSuggestion = (location.state as { suggestion?: Suggestion } | null)?.suggestion;
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
        {
          name: prefillSuggestion?.name ?? "",
          category: prefillSuggestion?.category ?? DEFAULT_CATEGORY,
          description: "",
          address: prefillSuggestion?.address ?? "",
        },
        { name: "", category: DEFAULT_CATEGORY, description: "", address: "" },
        { name: "", category: DEFAULT_CATEGORY, description: "", address: "" },
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
          category: o.category || "Custom",
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
            style={{ display: "flex", flexDirection: "column", gap: 20, scrollMarginTop: 80, paddingTop: 4 }}
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
                  onClick={() => fields.length < 5 && append({ name: "", category: DEFAULT_CATEGORY, description: "", address: "" })}
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
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "var(--ink2)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Name *
                        </label>
                        <input
                          type="text"
                          className={`dn-input${errors.options?.[i]?.name ? " error" : ""}`}
                          {...register(`options.${i}.name` as const, { required: "Name required" })}
                          placeholder="e.g. Sushi Palace"
                          style={{ height: 38 }}
                        />
                        {errors.options?.[i]?.name && (
                          <p role="alert" style={{ color: "var(--error)", fontSize: 12, marginTop: 2 }}>
                            {errors.options[i]?.name?.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "var(--ink2)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Category
                        </label>
                        <Controller
                          control={control}
                          name={`options.${i}.category` as const}
                          render={({ field }) => (
                            <CategoryPicker value={field.value} onChange={field.onChange} />
                          )}
                        />
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
