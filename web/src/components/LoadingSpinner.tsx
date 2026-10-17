/**
 * LoadingSpinner — animated teal ring spinner for DateMeUp web.
 * Pure CSS, no external deps. Keyframes in index.css.
 */
interface LoadingSpinnerProps {
  size?: number;
  label?: string;
  fullscreen?: boolean;
  color?: string;
}

export function LoadingSpinner({
  size = 40,
  label,
  fullscreen,
  color = "var(--primary)",
}: LoadingSpinnerProps) {
  const spinner = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `${Math.max(3, size / 10)}px solid ${color}22`,
          borderTopColor: color,
          animation: "dn-spin 0.9s linear infinite",
          flexShrink: 0,
        }}
      />
      {label && (
        <p style={{
          margin: 0,
          fontSize: 14,
          color: "var(--ink2)",
          fontFamily: "var(--font-body)",
        }}>
          {label}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        zIndex: 200,
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}

/** Inline loading state for page-level fetch (centered in a container) */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
      <LoadingSpinner size={40} label={label} />
    </div>
  );
}
