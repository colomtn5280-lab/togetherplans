/**
 * DmuLogo — DateMeUp logo mark SVG.
 * Used on auth pages (Login, Signup, JoinPage, GroupsPage) in place of the
 * purple calendar emoji. Matches the favicon.svg and loading spinner exactly.
 */
export function DmuLogo({ size = 52 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block", margin: "0 auto" }}
    >
      {/* Teal chevron */}
      <path
        d="M33 24L50 11L67 24"
        fill="none"
        stroke="#0E8C8C"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left figure — teal */}
      <g transform="rotate(8 34 82)">
        <circle cx="34" cy="47" r="12" fill="#0E8C8C" />
        <path d="M17 98V80a17 17 0 0 1 34 0v18z" fill="#0E8C8C" />
      </g>
      {/* Right figure — green */}
      <g transform="rotate(-8 66 84)">
        <circle cx="66" cy="49" r="12" fill="#7CB518" />
        <path d="M49 98V82a17 17 0 0 1 34 0v16z" fill="#7CB518" />
      </g>
    </svg>
  );
}
