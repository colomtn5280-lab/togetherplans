/**
 * LoadingSpinner — DMU logo loader SVG for DateMeUp web.
 * Animates via CSS keyframes in loading.css (l-a, l-b, l-chev classes).
 */

export function LoadingSpinner({ size = 56, label }: { size?: number; label?: string }) {
  return (
    <div className="dmu-loader" role="status" style={{ '--dmu-loader-size': `${size}px` } as React.CSSProperties}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path className="l-chev" d="M33 24L50 11L67 24" fill="none" stroke="#0E8C8C" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
        <g transform="rotate(8 34 82)"><g className="l-a"><circle cx="34" cy="47" r="12" fill="#0E8C8C"/><path d="M17 98V80a17 17 0 0 1 34 0v18z" fill="#0E8C8C"/></g></g>
        <g transform="rotate(-8 66 84)"><g className="l-b"><circle cx="66" cy="49" r="12" fill="#7CB518"/><path d="M49 98V82a17 17 0 0 1 34 0v16z" fill="#7CB518"/></g></g>
      </svg>
      {label && <span className="l-text">{label}</span>}
    </div>
  );
}

/** Inline loading state for page-level fetch (centered in a container) */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
      <LoadingSpinner size={56} label={label} />
    </div>
  );
}
