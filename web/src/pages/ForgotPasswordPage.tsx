// TODO i18n: instrument this file with useTranslation() hooks
// All strings have translations in /public/locales/{en,es}/translation.json
import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/client";

export function ForgotPasswordPage() {
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
      <h1>TogetherPlans</h1>
      <h2>Forgot your password?</h2>

      {submitted ? (
        <div>
          <p>
            If that email is registered, a reset link has been sent.
          </p>
          <p>
            <Link to="/login" className="dn-btn dn-btn--secondary dn-btn--sm">Back to sign in</Link>
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: "var(--ink2, #666)", marginBottom: "16px" }}>
            Enter your email and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                Email
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
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p style={{ marginTop: 16 }}>
            <Link to="/login" className="dn-btn dn-btn--secondary dn-btn--sm">Back to sign in</Link>
          </p>
        </>
      )}
    </main>
  );
}
