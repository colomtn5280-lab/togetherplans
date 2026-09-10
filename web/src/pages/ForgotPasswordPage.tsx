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
      <h1>DateNight</h1>
      <h2>Forgot your password?</h2>

      {submitted ? (
        <div>
          <p>
            If that email is registered, a reset link has been sent.
          </p>
          <p>
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: "#666", marginBottom: "16px" }}>
            Enter your email and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {error && <p role="alert">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p>
            <Link to="/login">Back to sign in</Link>
          </p>
        </>
      )}
    </main>
  );
}
