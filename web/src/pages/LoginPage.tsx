import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
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
      setAuth(
        { userId: data.userId, email: data.email },
        data.accessToken,
        data.refreshToken,
      );
      navigate(from, { replace: true });
    },
  });

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1>DateNight</h1>
      <h2>Sign in</h2>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            {...register("email")}
            autoComplete="email"
          />
          {errors.email && <p role="alert">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            {...register("password")}
            autoComplete="current-password"
          />
          {errors.password && <p role="alert">{errors.password.message}</p>}
        </div>

        {mutation.error && (
          <p role="alert" data-testid="login-error">
            {mutation.error.response?.data?.message ?? "Login failed"}
          </p>
        )}

        <button type="submit" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p>
        Don&apos;t have an account? <Link to="/signup">Sign up</Link>
      </p>
    </main>
  );
}
