import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/client";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation<
    SignupResponse,
    AxiosError<ApiError>,
    FormData
  >({
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

  return (
    <main style={{ maxWidth: 420, margin: "60px auto", padding: "0 16px" }}>
      <h1>DateNight</h1>
      <h2>Create an account</h2>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div>
          <label htmlFor="firstName">First name</label>
          <input id="firstName" type="text" {...register("firstName")} />
          {errors.firstName && <p role="alert">{errors.firstName.message}</p>}
        </div>

        <div>
          <label htmlFor="lastName">Last name</label>
          <input id="lastName" type="text" {...register("lastName")} />
        </div>

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
            autoComplete="new-password"
          />
          {errors.password && <p role="alert">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p role="alert">{errors.confirmPassword.message}</p>
          )}
        </div>

        {mutation.error && (
          <p role="alert" data-testid="signup-error">
            {mutation.error.response?.data?.message ?? "Signup failed"}
          </p>
        )}

        <button type="submit" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </main>
  );
}
