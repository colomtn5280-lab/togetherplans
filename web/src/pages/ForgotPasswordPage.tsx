import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/client";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch {
      // Always show success to avoid email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1>{t("forgotPassword.appName")}</h1>
      <h2>{t("forgotPassword.title")}</h2>

      {submitted ? (
        <div>
          <p>
            {t("forgotPassword.resetLinkSent")}
          </p>
          <p>
            <Link to="/login" className="dn-btn dn-btn--secondary dn-btn--sm">{t("forgotPassword.backToSignIn")}</Link>
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: "var(--ink2, #666)", marginBottom: "16px" }}>
            {t("forgotPassword.enterEmail")}
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                {t("auth.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="dn-input"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>

            {error && <p role="alert" style={{ color: "var(--error, #dc3545)", margin: 0 }}>{error}</p>}

            <button type="submit" disabled={loading} className="dn-btn">
              {loading ? t("forgotPassword.sending") : t("forgotPassword.sendResetLink")}
            </button>
          </form>

          <p style={{ marginTop: 16 }}>
            <Link to="/login" className="dn-btn dn-btn--secondary dn-btn--sm">{t("forgotPassword.backToSignIn")}</Link>
          </p>
        </>
      )}
    </main>
  );
}
