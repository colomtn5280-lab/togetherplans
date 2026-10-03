import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FavCategoryChips, loadFavCategories, saveFavCategories } from "./FavCategories";

interface OnboardingModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    emoji: "🎉",
    title: "Welcome to DateMeUp",
    illustration: (
      <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>🗓️✨</div>
    ),
    body: "DateMeUp makes it easy to plan date nights, outings, and adventures with the people you love. Propose ideas, everyone votes, and the best plan wins — together.",
    cta: null,
  },
  {
    emoji: "👥",
    title: "Create your first group",
    illustration: (
      <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1, display: "flex", gap: 4, justifyContent: "center" }}>
        <span>💑</span><span>👨‍👩‍👧</span><span>🧑‍🤝‍🧑</span>
      </div>
    ),
    body: "Groups keep your plans organised — create one for your partner, your friend crew, or your family. Add members and start proposing plans instantly.",
    cta: { label: "Create a group →", route: "/groups" },
  },
  {
    emoji: "🔍",
    title: "Discover activities",
    illustration: (
      <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1, display: "flex", gap: 4, justifyContent: "center" }}>
        <span>🍽️</span><span>🎬</span><span>🎭</span>
      </div>
    ),
    body: "Browse the Discover tab to find restaurants, events, experiences, and more near you. Add favourites to your plan and send it to your group to vote.",
    cta: { label: "Browse activities →", route: "/suggestions" },
  },
  {
    emoji: "💚",
    title: "What are you two into?",
    illustration: (
      <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1, display: "flex", gap: 4, justifyContent: "center" }}>
        <span>🍷</span><span>🥾</span><span>🎸</span>
      </div>
    ),
    body: "Pick up to 5 favourites and we'll put them front and centre on Discover. Totally optional — skip if you'd rather wander.",
    cta: null,
  },
];

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [favIds, setFavIds] = useState<string[]>(() => loadFavCategories());
  const navigate = useNavigate();

  const current = STEPS[step];
  const isFavStep = step === STEPS.length - 1;

  const handleClose = () => {
    if (favIds.length > 0) saveFavCategories(favIds);
    localStorage.setItem("tp_onboarded", "1");
    onClose();
  };

  const handleCta = () => {
    if (current.cta) {
      handleClose();
      navigate(current.cta.route);
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="dn-card"
        style={{
          maxWidth: 480,
          width: "100%",
          padding: "40px 36px 32px",
          position: "relative",
          textAlign: "center",
          animation: "dn-pulse 0s", // reset; use card shadow
        }}
      >
        {/* Skip */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 16,
            right: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--ink2)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Skip
        </button>

        {/* Illustration */}
        <div style={{ marginBottom: 4 }}>
          {typeof current.illustration !== "string"
            ? current.illustration
            : <div style={{ fontSize: 64, marginBottom: 16 }}>{current.illustration}</div>}
        </div>

        {/* Step badge */}
        <span
          className="dn-sticker dn-sticker--lime"
          style={{ marginBottom: 16, display: "inline-block" }}
        >
          {step + 1} of {STEPS.length}
        </span>

        <h2 style={{ marginBottom: 12 }}>{current.title}</h2>
        <p style={{ color: "var(--ink2)", marginBottom: isFavStep ? 20 : 28, lineHeight: 1.6 }}>
          {current.body}
        </p>

        {isFavStep && (
          <div style={{ marginBottom: 24, maxHeight: 260, overflowY: "auto" }}>
            <FavCategoryChips selected={favIds} onChange={setFavIds} />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {current.cta && (
            <button onClick={handleCta} className="dn-btn">
              {current.cta.label}
            </button>
          )}
          <button
            onClick={handleNext}
            className={`dn-btn${current.cta ? " dn-btn--secondary" : ""}`}
          >
            {step < STEPS.length - 1
              ? "Next →"
              : favIds.length > 0
                ? "Save & get started ♥"
                : "Get started ♥"}
          </button>
        </div>

        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 28,
          }}
        >
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background: i === step ? "var(--primary)" : "var(--line)",
                transition: "width 200ms, background 200ms",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
