import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
        // Guest→member vote carryover: fire-and-forget after any signup/login.
        // Deferred so it never blocks or breaks the auth flow.
        setTimeout(() => {
          import("../utils/guestClaim")
            .then((m) => m.claimGuestVotesIfAny())
            .catch(() => {});
        }, 0);
      },

      clearAuth: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        window.location.href = "/";
      },

      updateTokens: (accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
        set({ accessToken, refreshToken });
      },
    }),
    {
      name: "datenight-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
