import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="265703486967-4krmr9fqc6su377v33od946jh6endhet.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
