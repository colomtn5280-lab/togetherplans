import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/client";

export function FacebookCallbackPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    async function handleCallback() {
      // Check for error in query params
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      if (error) {
        const msg =
          params.get("error_description") ??
          t("auth.facebookFailed");
        setErrorMsg(msg);
        setStatus("error");
        if (window.opener) {
          window.opener.postMessage(
            { type: "FB_AUTH_ERROR", error: msg },
            window.location.origin,
          );
          window.close();
        }
        return;
      }

      // Parse access_token from URL hash (implicit / response_type=token flow)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");

      if (!accessToken) {
        const msg = t("auth.facebookFailed");
        setErrorMsg(msg);
        setStatus("error");
        if (window.opener) {
          window.opener.postMessage(
            { type: "FB_AUTH_ERROR", error: msg },
            window.location.origin,
          );
          window.close();
        }
        return;
      }

      try {
        // Fetch user info from Facebook Graph API
        const graphRes = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`,
        );
        const fbUser: { id?: string; name?: string; email?: string } =
          await graphRes.json();

        // Post to our backend
        const { data } = await authApi.facebookLogin(
          accessToken,
          fbUser.id ?? "",
          fbUser.email,
          fbUser.name,
        );

        // Send result to opener and close popup
        if (window.opener) {
          window.opener.postMessage(
            { type: "FB_AUTH_SUCCESS", data },
            window.location.origin,
          );
          window.close();
        } else {
          // Not running in a popup (shouldn't normally happen)
          setStatus("success");
        }
      } catch {
        const msg = t("auth.facebookFailed");
        setErrorMsg(msg);
        setStatus("error");
        if (window.opener) {
          window.opener.postMessage(
            { type: "FB_AUTH_ERROR", error: msg },
            window.location.origin,
          );
          window.close();
        }
      }
    }

    handleCallback();
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
        <h2>{t("auth.facebookFailed")}</h2>
        <p style={{ color: "var(--ink2)", maxWidth: 360 }}>{errorMsg}</p>
        <Link to="/login" className="dn-btn">
          {t("auth.backToSignIn")}
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
      <div style={{ fontSize: 32 }}>⏳</div>
      <p style={{ color: "var(--ink2)" }}>{t("common.loading")}</p>
    </div>
  );
}
