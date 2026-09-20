import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/client";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";

const schema = z.object({
  token: z.string().min(1, "Verification token required"),
});

type FormData = z.infer<typeof schema>;

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation<{ message: string }, AxiosError<ApiError>, FormData>({
    mutationFn: async (data) => {
      const res = await authApi.verifyEmail({ email, token: data.token });
      return res.data;
    },
    onSuccess: () => {
      navigate("/login");
    },
  });

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1>TogetherPlans</h1>
      <h2>Verify your email</h2>

      {email && (
        <p>
          We sent a verification code to <strong>{email}</strong>. Enter it
          below.
        </p>
      )}

      {mutation.isSuccess ? (
        <div>
          <p>Email verified! <Link to="/login">Sign in</Link></p>
        </div>
      ) : (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div>
            <label htmlFor="token">Verification code</label>
            <input
              id="token"
              type="text"
              {...register("token")}
              autoComplete="one-time-code"
              placeholder="Enter code from email"
            />
            {errors.token && <p role="alert">{errors.token.message}</p>}
          </div>

          {mutation.error && (
            <p role="alert" data-testid="verify-error">
              {mutation.error.response?.data?.message ?? "Verification failed"}
            </p>
          )}

          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Verifying…" : "Verify email"}
          </button>
        </form>
      )}

      <p>
        Wrong email? <Link to="/signup">Back to sign up</Link>
      </p>
    </main>
  );
}
