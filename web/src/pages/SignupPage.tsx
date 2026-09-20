import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import { authApi } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import type { SignupResponse } from "../types";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";

const schema = z
  .object({
    email: z.string().email("Valid email required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name required"),
    lastName: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation<SignupResponse, AxiosError<ApiError>, FormData>({
    mutationFn: async (data) => {
      const res = await authApi.signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      navigate(`/verify-email?email=${encodeURIComponent(variables.email)}`);
    },
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 12,
    marginBottom: 6,
    color: "var(--ink2)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

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
          right: "-80px",
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
          left: "-80px",
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
          maxWidth: 460,
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

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ display: "inline", fontSize: 26 }}>Create your account </h2>
          <span className="dn-sticker dn-sticker--lime" style={{ verticalAlign: "middle" }}>free</span>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="firstName" style={labelStyle}>First name</label>
              <input
                id="firstName"
                type="text"
                className={`dn-input${errors.firstName ? " error" : ""}`}
                {...register("firstName")}
                placeholder="Alex"
              />
              {errors.firstName && (
                <p role="alert" style={{ color: "var(--error)", fontSize: 12, marginTop: 4 }}>
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" style={labelStyle}>Last name</label>
              <input
                id="lastName"
                type="text"
                className="dn-input"
                {...register("lastName")}
                placeholder="Smith"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" style={labelStyle}>Email</label>
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
            <label htmlFor="password" style={labelStyle}>Password</label>
            <input
              id="password"
              type="password"
              className={`dn-input${errors.password ? " error" : ""}`}
              {...register("password")}
              autoComplete="new-password"
              placeholder="••••••••"
            />
            {errors.password && (
              <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 4 }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" style={labelStyle}>Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              className={`dn-input${errors.confirmPassword ? " error" : ""}`}
              {...register("confirmPassword")}
              autoComplete="new-password"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p role="alert" style={{ color: "var(--error)", fontSize: 13, marginTop: 4 }}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {mutation.error && (
            <div
              role="alert"
              data-testid="signup-error"
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
              {mutation.error.response?.data?.message ?? "Signup failed"}
            </div>
          )}

          <button
            type="submit"
            className="dn-btn"
            disabled={isSubmitting || mutation.isPending}
            style={{ width: "100%", marginTop: 8 }}
          >
            {mutation.isPending ? "Creating account…" : "Create account →"}
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
                setAuth(
                  { userId: res.data.userId, email: res.data.email },
                  res.data.accessToken,
                  res.data.refreshToken,
                );
                navigate(from, { replace: true });
              }).catch(() => alert("Google sign-in failed"));
            }}
            onError={() => alert("Google sign-in failed")}
            width="100%"
            text="signup_with"
          />
        </div>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span style={{ fontSize: 14, color: "var(--ink2)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
              Log in →
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
