// TODO i18n: instrument this file with useTranslation() hooks
// All strings have translations in /public/locales/{en,es}/translation.json
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Safety-net callback page for Apple Sign-In redirect flow.
 *
 * The primary Apple flow uses `usePopup: true` in the JS SDK, so this page is
 * rarely hit. If it is (e.g. the SDK falls back to a redirect), it forwards
 * whatever params/hash it received back to the opener via postMessage.
 */
export function AppleCallbackPage() {
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    const error = params.get("error");
    if (error) {
      const msg =
        params.get("error_description") ??
        "Apple Sign-In was cancelled or failed.";
      if (window.opener) {
        window.opener.postMessage(
          { type: "APPLE_AUTH_ERROR", error: msg },
          window.location.origin,
        );
        window.close();
      } else {
        setStatus("error");
      }
      return;
    }

    // Collect any token/code params that Apple may have sent
    const payload: Record<string, string> = {};
    params.forEach((v, k) => { payload[k] = v; });
    hashParams.forEach((v, k) => { payload[k] = v; });

    if (window.opener && Object.keys(payload).length > 0) {
      window.opener.postMessage(
        { type: "APPLE_AUTH_PARAMS", payload },
        window.location.origin,
      );
      window.close();
    } else {
      setStatus("done");
    }
  }, []);

  if (status === "error") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "40px 20px",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48 }}>😕</div>
        <h2>Apple Sign-In Failed</h2>
        <p style={{ color: "var(--ink2)", maxWidth: 360 }}>
          Apple Sign-In was cancelled or encountered an error.
        </p>
        <Link to="/login" className="dn-btn">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 32 }}>🍎</div>
      <p style={{ color: "var(--ink2)" }}>Completing Apple Sign-In…</p>
    </div>
  );
}
