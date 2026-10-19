import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/client";
import type { AxiosError } from "axios";
import type { ApiError } from "../types";

const schema = z.object({
  token: z.string().min(1, "Verification token required"),
});

type FormData = z.infer<typeof schema>;

export function VerifyEmailPage() {
  const { t } = useTranslation();
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
      <h2>{t("auth.verifyEmail")}</h2>

      {email && (
        <p>
          {t("auth.sentCodeTo", { email })}
        </p>
      )}

      {mutation.isSuccess ? (
        <div>
          <p>{t("auth.emailVerified")} <Link to="/login">{t("auth.signIn")}</Link></p>
        </div>
      ) : (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div>
            <label htmlFor="token">{t("auth.verificationCode")}</label>
            <input
              id="token"
              type="text"
              {...register("token")}
              autoComplete="one-time-code"
              placeholder={t("auth.enterCode")}
            />
            {errors.token && <p role="alert">{errors.token.message}</p>}
          </div>

          {mutation.error && (
            <p role="alert" data-testid="verify-error">
              {mutation.error.response?.data?.message ?? t("common.error")}
            </p>
          )}

          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t("auth.verifying") : t("auth.verifyEmailBtn")}
          </button>
        </form>
      )}

      <p>
        {t("auth.wrongEmail")} <Link to="/signup">{t("auth.backToSignUp")}</Link>
      </p>
    </main>
  );
}
