// TODO i18n: instrument this file with useTranslation() hooks
// All strings have translations in /public/locales/{en,es}/translation.json
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { authApi } from "../api/client";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid or expired reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      navigate("/login", {
        state: { message: "Password reset successfully. You can now sign in." },
        replace: true,
      });
    } catch {
      setError("Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
        <h1>TogetherPlans</h1>
        <h2>Reset password</h2>
        <p role="alert">Invalid or expired reset link.</p>
        <p>
          <Link to="/forgot-password" className="dn-btn dn-btn--secondary dn-btn--sm">
            Request a new reset link
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1>TogetherPlans</h1>
      <h2>Reset your password</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label htmlFor="password" style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
            New password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="dn-input"
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="dn-input"
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        {error && <p role="alert" style={{ color: "var(--error, #dc3545)", margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading} className="dn-btn">
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </main>
  );
}
