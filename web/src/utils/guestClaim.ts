/**
 * Guest-to-member vote carryover (web side).
 *
 * A guest who voted via /vote/<token> has a guestId in localStorage
 * ('tp.guestId'). After signup/login we call POST /api/auth/claim-guest-votes
 * fire-and-forget so their guest votes become real member votes. If any were
 * converted, show a small toast. Never blocks the auth flow.
 */

import { authApi } from "../api/client";

export const GUEST_ID_KEY = "tp.guestId";

function showToast(message: string) {
  try {
    const el = document.createElement("div");
    el.textContent = message;
    el.setAttribute("role", "status");
    el.style.cssText = [
      "position:fixed",
      "left:50%",
      "bottom:32px",
      "transform:translateX(-50%)",
      "background:#0E8C8C",
      "color:#fff",
      "padding:12px 22px",
      "border-radius:14px 18px 14px 20px",
      "font-family:'Sora',system-ui,sans-serif",
      "font-weight:700",
      "font-size:14px",
      "box-shadow:0 8px 24px rgba(0,0,0,0.25)",
      "z-index:9999",
      "opacity:0",
      "transition:opacity 0.3s ease",
    ].join(";");
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; });
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 400);
    }, 4000);
  } catch {
    // toast is cosmetic — never throw
  }
}

/** Fire-and-forget: convert any guest votes to member votes after auth. */
export function claimGuestVotesIfAny(): void {
  try {
    const guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) return;
    authApi
      .claimGuestVotes(guestId)
      .then(({ data }) => {
        if (data.converted > 0) {
          showToast("Your guest vote came with you 🎉");
        }
        // Keep the guestId while votes are still pending (converted at group join)
        if (data.pending === 0) {
          localStorage.removeItem(GUEST_ID_KEY);
        }
      })
      .catch(() => {
        // non-blocking by design
      });
  } catch {
    // localStorage unavailable — nothing to do
  }
}
