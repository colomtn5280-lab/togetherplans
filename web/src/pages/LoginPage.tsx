import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import { authApi } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import type { LoginResponse } from "../types";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

type FormData = z.infer<typeof schema>;

// Facebook App ID
const FB_APP_ID = "1748102416338228";

function handleFacebookLogin() {
  const redirectUri = encodeURIComponent(window.location.origin + "/auth/facebook/callback");
  window.location.href = `https://www.facebook.com/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${redirectUri}&scope=email,public_profile`;
}

// Apple Sign-In requires VITE_APPLE_SERVICE_ID to be set by Jake
// and the Apple JS SDK loaded in index.html
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: object) => void;
        signIn: () => Promise<{
          authorization: { id_token: string };
          user?: { name?: { firstName?: string; lastName?: string }; email?: string };
        }>;
      };
    };
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

  const [socialError, setSocialError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation<LoginResponse, AxiosError<ApiError>, FormData>({
    mutationFn: async (data) => {
      const res = await authApi.login(data);
      return res.data;
    },
    onSuccess: (data) => {
      const user = data.user ?? { userId: data.userId ?? "", email: data.email ?? "" };
      const accessToken = data.accessToken || data.token || "";
      const refreshToken = data.refreshToken || "";
      setAuth(user, accessToken, refreshToken);
      navigate(from, { replace: true });
    },
  });

  async function handleAppleLogin() {
    const appleServiceId = import.meta.env.VITE_APPLE_SERVICE_ID;
    if (!appleServiceId) {
      setSocialError("Apple Sign-In is not configured yet. Please try another method.");
      return;
    }
    if (!window.AppleID) {
      setSocialError("Apple Sign-In SDK failed to load. Please refresh and try again.");
      return;
    }
    try {
      window.AppleID.auth.init({
        clientId: appleServiceId,
        scope: "name email",
        redirectURI: window.location.origin + "/auth/apple/callback",
        usePopup: true,
      });
      const res = await window.AppleID.auth.signIn();
      const identityToken = res.authorization.id_token;
      const displayName = res.user?.name
        ? [res.user.name.firstName, res.user.name.lastName].filter(Boolean).join(" ")
        : undefined;
      const email = res.user?.email;
      const { data } = await authApi.appleLogin(identityToken, displayName, email);
      const user = data.user ?? { userId: data.userId ?? "", email: data.email ?? "" };
      const accessToken = data.accessToken || data.token || "";
      const refreshToken = data.refreshToken || "";
      setAuth(user, accessToken, refreshToken);
      navigate(from, { replace: true });
    } catch {
      setSocialError("Apple Sign-In failed. Please try again.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "40px 16px",
      }}
    >
      {/* Background blobs */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-80px",
          left: "-80px",
          width: 300,
          height: 300,
          background: "var(--primary-soft)",
          borderRadius: "50%",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: "-80px",
          right: "-80px",
          width: 320,
          height: 320,
          background: "var(--lime-soft)",
          borderRadius: "50%",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      <div
        className="dn-card"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 420,
          borderRadius: "44px 36px 48px 40px",
          boxShadow: "var(--shadow-dock)",
          padding: "40px 36px",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "var(--primary)",
              borderRadius: "38% 62% 55% 45%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              margin: "0 auto 10px",
              transform: "rotate(-6deg)",
            }}
            aria-hidden="true"
          >
            📅
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 17,
              color: "var(--ink)",
            }}
          >
            TogetherPlans
          </div>
        </div>

        <h2 style={{ marginBottom: 24, fontSize: 26, textAlign: "center" }}>Welcome back</h2>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label
              htmlFor="email"
              style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`dn-input${errors.email ? " error" : ""}`}
              {...register("email")}
              autoComplete="email"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 4 }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginBottom: 6, color: "var(--ink2)", textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`dn-input${errors.password ? " error" : ""}`}
              {...register("password")}
              autoComplete="current-password"
              placeholder="••••••••"
            />
            {errors.password && (
              <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 4 }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {mutation.error && (
            <div
              role="alert"
              data-testid="login-error"
              style={{
                background: "var(--error-soft)",
                color: "var(--error)",
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 13,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
              }}
            >
              {mutation.error.response?.data?.message ?? mutation.error.response?.data?.error ?? "Invalid email or password"}
            </div>
          )}

          <button
            type="submit"
            className="dn-btn"
            disabled={isSubmitting || mutation.isPending}
            style={{ width: "100%", marginTop: 8 }}
          >
            {mutation.isPending ? "Signing in…" : "Log in"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span style={{ color: "var(--ink2)", fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Google */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={(cred) => {
                setSocialError(null);
                if (!cred.credential) return;
                authApi.googleLogin(cred.credential).then(res => {
                  const d = res.data;
                  const user = d.user ?? { userId: d.userId ?? "", email: d.email ?? "" };
                  const accessToken = d.accessToken || d.token || "";
                  const refreshToken = d.refreshToken || "";
                  setAuth(user, accessToken, refreshToken);
                  navigate(from, { replace: true });
                }).catch(() => setSocialError("Google sign-in failed. Please try again."));
              }}
              onError={() => setSocialError("Google sign-in failed. Please try again.")}
              width="100%"
              text="signin_with"
            />
          </div>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => { setSocialError(null); handleFacebookLogin(); }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #1877F2",
              background: "#1877F2",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            Sign in with Facebook
          </button>

          {/* Apple — requires VITE_APPLE_SERVICE_ID configured by Jake */}
          {import.meta.env.VITE_APPLE_SERVICE_ID && (
            <button
              type="button"
              onClick={() => { setSocialError(null); handleAppleLogin(); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #000",
                background: "#000",
                color: "#fff",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <svg width="18" height="20" viewBox="0 0 814 1000" fill="white" aria-hidden="true">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-148.3-107.3C46.8 793.7 0 663.6 0 542.5C0 285.8 199.3 146 395.6 146c99.2 0 181.9 66.6 244.4 66.6 60.5 0 155.3-70.4 270.2-70.4zM574.4 0C617.7 0 720.6 28.5 790.9 120.5c-3.2 3.2-76 44.2-76 148.4 0 89.8 67.5 141.2 68.7 142.5-1.3 3.9-24.1 81.2-111.7 116.6-14.1 5.8-46.2 16-84.5 16-57.3 0-108.2-32.3-166.5-32.3-54.5 0-111.7 32.3-165.9 32.3-3.2 0-22.7-.6-33.3-1.3z"/>
              </svg>
              Sign in with Apple
            </button>
          )}

          {/* Inline social auth error */}
          {socialError && (
            <div
              role="alert"
              data-testid="social-error"
              style={{
                background: "var(--error-soft)",
                color: "var(--error)",
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 13,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {socialError}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
          <Link to="/forgot-password" style={{ color: "var(--ink2)", fontSize: 13 }}>
            Forgot password?
          </Link>
          <span style={{ fontSize: 14, color: "var(--ink2)" }}>
            No account?{" "}
            <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 700 }}>
              Create one free →
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
