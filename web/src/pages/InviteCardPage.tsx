// TODO i18n: instrument this file with useTranslation() hooks
// All strings have translations in /public/locales/{en,es}/translation.json
import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { inviteCardsApi } from "../api/client";
import { CARD_HTML, CARD_SHARED_CSS, CARD_NAMES } from "../constants/inviteCardTemplates";

type Template = { id: string; name: string };
type Step = "pick" | "customise";

// ── Card category filter ─────────────────────────────────────────────────────
const CARD_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "formal", label: "📜 Formal" },
  { key: "playful", label: "🎨 Playful" },
  { key: "minimal", label: "⬜ Minimal" },
  { key: "bold", label: "⚡ Bold" },
] as const;
type CardCategory = (typeof CARD_CATEGORIES)[number]["key"];

// Map template IDs to categories (unlisted → "playful" by default)
const CARD_CATEGORY_MAP: Record<string, CardCategory> = {
  // Formal
  "2a": "formal", // Boarding Pass
  "3e": "formal", // Passport Page
  "3d": "formal", // Formal Invitation
  "2g": "formal", // Newspaper
  "2l": "formal", // Magazine Cover
  // Minimal
  "1k": "minimal", // Receipt
  "1d": "minimal", // Retro Postcard
  "3c": "minimal", // Trading Card
  "2k": "minimal", // Badge / Seal
  // Bold
  "1j": "bold",   // Neon Sign
  "1a": "bold",   // Bold Poster
  "2f": "bold",   // Scoreboard
  "2e": "bold",   // Chalkboard
  // Playful (explicit)
  "3a": "playful", // Luggage Tag
  "3b": "playful", // Mixtape / Tape
  "3j": "playful", // Tarot Card
  "3h": "playful", // Bingo Card
  "2d": "playful", // Comic Panel
  "3g": "playful", // Sticky Notes
  "1c": "playful", // Polaroid
};

// ── Card Preview ────────────────────────────────────────────────────────────
// Renders the actual sc-card design at 35% scale inside a fixed-size thumbnail.
function CardPreview({ templateId, size = "thumb" }: { templateId: string; size?: "thumb" | "large" }) {
  const cardHtml = CARD_HTML[templateId];
  const isLarge = size === "large";

  // The sc-card designs are 360×640px. Scale down to fit thumbnail.
  const CARD_W = 360;
  const CARD_H = 640;
  const scale = isLarge ? 0.55 : 0.33;
  const thumbW = Math.round(CARD_W * scale);
  const thumbH = Math.round(CARD_H * scale);

  if (!cardHtml) {
    // Fallback for unknown template
    return (
      <div style={{
        width: thumbW, height: thumbH,
        background: "var(--primary-soft)",
        borderRadius: isLarge ? 18 : 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ink2)", fontSize: 12, textAlign: "center", padding: 8,
      }}>
        {CARD_NAMES[templateId] || templateId}
      </div>
    );
  }

  return (
    <div style={{
      width: thumbW,
      height: thumbH,
      overflow: "hidden",
      borderRadius: isLarge ? 18 : 10,
      flexShrink: 0,
      position: "relative",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    }}>
      {/* Inject shared CSS once per card — contained by the outer clip */}
      <style dangerouslySetInnerHTML={{ __html: CARD_SHARED_CSS }} />
      {/* Scale the 360×640 card down to thumbnail size */}
      <div
        className="dn"
        style={{
          width: CARD_W,
          height: CARD_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          userSelect: "none",
        }}
        dangerouslySetInnerHTML={{ __html: cardHtml }}
      />
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export function InviteCardPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("pick");
  const [selectedCategory, setSelectedCategory] = useState<CardCategory>("all");
  const [selected, setSelected] = useState<Template | null>(null);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch templates from API (for IDs + names)
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["invite-card-templates"],
    queryFn: async () => {
      const res = await inviteCardsApi.getTemplates();
      return res.data;
    },
    staleTime: 5 * 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      templateId, noteText, skipped, file,
    }: { templateId?: string; noteText?: string; skipped?: boolean; file?: File | null }) => {
      const res = await inviteCardsApi.save(proposalId!, { templateId, note: noteText, skipped });
      if (file) await inviteCardsApi.uploadPhoto(proposalId!, file);
      return res.data;
    },
    onSuccess: () => {
      navigate(`/proposals/${proposalId}`, { state: { openInvite: true } });
    },
  });

  const handleSelectTemplate = (tpl: Template) => {
    setSelected(tpl);
    setStep("customise");
  };

  const handleSkip = () => saveMutation.mutate({ skipped: true });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert("Photo must be under 20 MB."); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUseCard = () => {
    saveMutation.mutate({ templateId: selected?.id, noteText: note.trim() || undefined, file: photo });
  };

  // Filter templates by selected category (unlisted → playful)
  const filteredTemplates = selectedCategory === "all"
    ? templates
    : templates.filter((tpl) => (CARD_CATEGORY_MAP[tpl.id] ?? "playful") === selectedCategory);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px 80px" }}>

      {/* ── STEP 1: Picker ── */}
      {step === "pick" && (
        <>
          <div style={{ marginBottom: 8 }}>
            <Link
              to={`/proposals/${proposalId}`}
              style={{ color: "var(--ink2)", fontSize: 14, textDecoration: "none", fontWeight: 600 }}
            >
              ← Back to proposal
            </Link>
          </div>

          <h1 style={{ margin: "16px 0 6px", fontSize: 28, fontFamily: "var(--font-display)" }}>
            Pick an invite card
          </h1>
          <p style={{ margin: "0 0 20px", color: "var(--ink2)", fontSize: 15 }}>
            {templates.length} designs — each personalised with your plan details.
          </p>

          {/* Category filter tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {CARD_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={selectedCategory === cat.key ? "dn-btn dn-btn--primary dn-btn--sm" : "dn-btn dn-btn--sm"}
                style={{ fontWeight: selectedCategory === cat.key ? 700 : 500 }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink2)" }}>
              Loading card designs…
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: 20,
              }}
            >
              {filteredTemplates.map((tpl) => {
                const isSelected = selected?.id === tpl.id;
                const displayName = CARD_NAMES[tpl.id] || tpl.name;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    title={displayName}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {/* Card design thumbnail */}
                    <div style={{
                      position: "relative",
                      borderRadius: 12,
                      outline: isSelected ? "3px solid var(--primary)" : "3px solid transparent",
                      outlineOffset: 2,
                      transition: "outline-color 0.15s",
                    }}>
                      <CardPreview templateId={tpl.id} size="thumb" />
                      {isSelected && (
                        <div style={{
                          position: "absolute", top: 6, right: 6,
                          width: 22, height: 22, borderRadius: "50%",
                          background: "var(--primary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                        }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l2.5 2.5L10 3" stroke="#fff" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Name label */}
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: "var(--ink)",
                      maxWidth: 120, textAlign: "center", lineHeight: 1.3,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {displayName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 36, textAlign: "center" }}>
            <button
              onClick={handleSkip}
              disabled={saveMutation.isPending}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--ink2)", fontSize: 14, fontWeight: 600,
              }}
            >
              {saveMutation.isPending ? "Saving…" : "Skip this step →"}
            </button>
          </div>

          {saveMutation.isError && (
            <p style={{ color: "var(--error)", textAlign: "center", marginTop: 12 }}>
              Something went wrong. Please try again.
            </p>
          )}
        </>
      )}

      {/* ── STEP 2: Customise ── */}
      {step === "customise" && selected && (
        <>
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => setStep("pick")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--ink2)", fontSize: 14, fontWeight: 600, padding: 0,
              }}
            >
              ← Change template
            </button>
          </div>

          <h1 style={{ margin: "0 0 24px", fontSize: 28, fontFamily: "var(--font-display)" }}>
            Customise your card
          </h1>

          <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Large preview */}
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{
                margin: 0, fontSize: 11, fontWeight: 700, color: "var(--ink2)",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                Preview — {CARD_NAMES[selected.id] || selected.name}
              </p>
              <div style={{
                outline: "3px solid var(--primary)", outlineOffset: 3, borderRadius: 20,
                overflow: "hidden",
              }}>
                <CardPreview templateId={selected.id} size="large" />
              </div>
            </div>

            {/* Form */}
            <div style={{ flex: 1, minWidth: 260 }}>
              {/* Note */}
              <div className="dn-card" style={{ marginBottom: 16, padding: 20 }}>
                <label htmlFor="card-note" style={{ display: "block", fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
                  Add a personal note{" "}
                  <span style={{ color: "var(--ink2)", fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  id="card-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 140))}
                  maxLength={140}
                  rows={4}
                  placeholder="e.g. Can't wait to see you there! 🎉"
                  className="dn-input"
                  style={{ height: "auto", resize: "vertical", paddingTop: 10, paddingBottom: 10 }}
                />
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink2)", textAlign: "right" }}>
                  {note.length}/140
                </p>
              </div>

              {/* Photo */}
              <div className="dn-card" style={{ marginBottom: 24, padding: 20 }}>
                <label style={{ display: "block", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>
                  Add a photo{" "}
                  <span style={{ color: "var(--ink2)", fontWeight: 400 }}>(optional)</span>
                </label>
                {photoPreview ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                      src={photoPreview}
                      alt="Selected"
                      style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "2px solid var(--primary)" }}
                    />
                    <button
                      className="dn-btn dn-btn--secondary"
                      onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      style={{ height: 36, fontSize: 13 }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button className="dn-btn dn-btn--secondary" onClick={() => fileInputRef.current?.click()} style={{ height: 40 }}>
                    📷 Choose photo
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--ink2)" }}>Max 20 MB</p>
              </div>

              {/* CTA */}
              <button
                className="dn-btn"
                onClick={handleUseCard}
                disabled={saveMutation.isPending}
                style={{ width: "100%" }}
              >
                {saveMutation.isPending ? "Saving…" : "Use this card ✓"}
              </button>

              {saveMutation.isError && (
                <p style={{ color: "var(--error)", marginTop: 12, fontSize: 14 }}>
                  Something went wrong. Please try again.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 600px) {
          .invite-card-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
