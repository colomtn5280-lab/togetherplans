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

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

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
            DateNight
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

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={(cred) => {
              if (!cred.credential) return;
              authApi.googleLogin(cred.credential).then(res => {
                const d = res.data;
                const user = d.user ?? { userId: d.userId ?? "", email: d.email ?? "" };
                const accessToken = d.accessToken || d.token || "";
                const refreshToken = d.refreshToken || "";
                setAuth(user, accessToken, refreshToken);
                navigate(from, { replace: true });
              }).catch(() => alert("Google sign-in failed"));
            }}
            onError={() => alert("Google sign-in failed")}
            width="100%"
            text="signin_with"
          />
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
