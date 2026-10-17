import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { inviteCardsApi } from "../api/client";

// DateMeUp palette for template tiles
const DMU_PALETTE = ["#0E8C8C", "#7CB518", "#E39B12", "#5D6B76", "#D9F1F0"];

// Tile text color — light palette (#D9F1F0) needs dark text
const tileTextColor = (bg: string) => (bg === "#D9F1F0" ? "#1a1a2e" : "#ffffff");

type Template = { id: string; name: string };
type Step = "pick" | "customise";

export function InviteCardPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("pick");
  const [selected, setSelected] = useState<Template | null>(null);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["invite-card-templates"],
    queryFn: async () => {
      const res = await inviteCardsApi.getTemplates();
      return res.data;
    },
    staleTime: 5 * 60_000,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({
      templateId,
      noteText,
      skipped,
      file,
    }: {
      templateId?: string;
      noteText?: string;
      skipped?: boolean;
      file?: File | null;
    }) => {
      const res = await inviteCardsApi.save(proposalId!, {
        templateId,
        note: noteText,
        skipped,
      });
      // Upload photo if provided
      if (file) {
        await inviteCardsApi.uploadPhoto(proposalId!, file);
      }
      return res.data;
    },
    onSuccess: () => {
      navigate(`/proposals/${proposalId}`, { state: { openInvite: true } });
    },
  });

  // Handle template selection
  const handleSelectTemplate = (tpl: Template) => {
    setSelected(tpl);
    setStep("customise");
  };

  // Handle skip
  const handleSkip = () => {
    saveMutation.mutate({ skipped: true });
  };

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("Photo must be under 20 MB.");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Handle use this card
  const handleUseCard = () => {
    saveMutation.mutate({
      templateId: selected?.id,
      noteText: note.trim() || undefined,
      file: photo,
    });
  };

  const tileBg = (idx: number) => DMU_PALETTE[idx % DMU_PALETTE.length];

  return (
    <div className="dmu-wrap" style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px 64px" }}>
      {/* ── STEP 1: Template Picker ── */}
      {step === "pick" && (
        <>
          {/* Header */}
          <div style={{ marginBottom: 8 }}>
            <Link to={`/proposals/${proposalId}`} className="dmu-back">
              ← Back to proposal
            </Link>
          </div>

          <div className="dmu-section-head" style={{ marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Pick an invite card
            </h1>
            <p style={{ margin: "8px 0 0", color: "var(--ink2)", fontSize: 15 }}>
              Your invitees will receive this card with the invite link.
            </p>
          </div>

          {isLoading ? (
            <p style={{ color: "var(--ink2)", padding: "40px 0", textAlign: "center" }}>
              Loading templates…
            </p>
          ) : (
            <div
              className="invite-card-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
                marginTop: 24,
              }}
            >
              {templates.map((tpl, idx) => {
                const bg = tileBg(idx);
                const isSelected = selected?.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    aria-label={`Select template: ${tpl.name}`}
                  >
                    {/* Tile */}
                    <div
                      style={{
                        position: "relative",
                        height: 180,
                        background: bg,
                        borderRadius: "16px 4px 16px 4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 12,
                        border: isSelected ? "3px solid #0E8C8C" : "3px solid transparent",
                        transition: "border-color 0.15s",
                        boxSizing: "border-box",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-display, 'Sora', sans-serif)",
                          fontWeight: 700,
                          fontSize: 13,
                          color: tileTextColor(bg),
                          textAlign: "center",
                          lineHeight: 1.3,
                          wordBreak: "break-word",
                        }}
                      >
                        {tpl.name}
                      </span>

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                              d="M2 7l3.5 3.5L12 3.5"
                              stroke="#0E8C8C"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Name label */}
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--ink, #1a1a2e)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {tpl.name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Skip */}
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <button
              className="dmu-btn dmu-btn-ghost"
              onClick={handleSkip}
              disabled={saveMutation.isPending}
              style={{ fontSize: 14 }}
            >
              {saveMutation.isPending ? "Saving…" : "Skip this step →"}
            </button>
          </div>

          {saveMutation.isError && (
            <p style={{ color: "red", textAlign: "center", marginTop: 12 }}>
              Something went wrong. Please try again.
            </p>
          )}
        </>
      )}

      {/* ── STEP 2: Customise ── */}
      {step === "customise" && selected && (
        <>
          <div style={{ marginBottom: 8 }}>
            <button
              className="dmu-back"
              onClick={() => setStep("pick")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              ← Change template
            </button>
          </div>

          <div className="dmu-section-head" style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Customise your card
            </h1>
          </div>

          <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Preview */}
            <div style={{ flexShrink: 0 }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Preview
              </p>
              <div
                style={{
                  width: 220,
                  height: 180,
                  background: tileBg(
                    templates.findIndex((t) => t.id === selected.id)
                  ),
                  borderRadius: "16px 4px 16px 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  boxSizing: "border-box",
                  border: "3px solid #0E8C8C",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display, 'Sora', sans-serif)",
                    fontWeight: 700,
                    fontSize: 14,
                    color: tileTextColor(
                      tileBg(templates.findIndex((t) => t.id === selected.id))
                    ),
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  {selected.name}
                </span>
              </div>
            </div>

            {/* Form */}
            <div style={{ flex: 1, minWidth: 260 }}>
              {/* Note */}
              <div className="dmu-card" style={{ marginBottom: 16, padding: 16 }}>
                <label
                  htmlFor="card-note"
                  style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14 }}
                >
                  Add a personal note <span style={{ color: "var(--ink2)", fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  id="card-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 140))}
                  maxLength={140}
                  rows={4}
                  placeholder="e.g. Can't wait to see you there! 🎉"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid var(--border, #e0e0e0)",
                    borderRadius: 8,
                    fontFamily: "var(--font-body, sans-serif)",
                    fontSize: 14,
                    resize: "vertical",
                    boxSizing: "border-box",
                    outline: "none",
                    color: "var(--ink, #1a1a2e)",
                    background: "var(--surface, #ffffff)",
                  }}
                />
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink2)", textAlign: "right" }}>
                  {note.length}/140
                </p>
              </div>

              {/* Photo */}
              <div className="dmu-card" style={{ marginBottom: 24, padding: 16 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                  Add a photo <span style={{ color: "var(--ink2)", fontWeight: 400 }}>(optional)</span>
                </label>

                {photoPreview ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                      src={photoPreview}
                      alt="Selected photo preview"
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "2px solid #0E8C8C",
                      }}
                    />
                    <button
                      className="dmu-btn dmu-btn-ghost"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{ fontSize: 13 }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    className="dmu-btn dmu-btn-ghost"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ fontSize: 14 }}
                  >
                    📷 Choose photo
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                />
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--ink2)" }}>Max 20 MB</p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  className="dmu-btn dmu-btn-primary"
                  onClick={handleUseCard}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Saving…" : "Use this card"}
                </button>
              </div>

              {saveMutation.isError && (
                <p style={{ color: "red", marginTop: 12, fontSize: 14 }}>
                  Something went wrong. Please try again.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Responsive grid style */}
      <style>{`
        @media (max-width: 680px) {
          .invite-card-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
