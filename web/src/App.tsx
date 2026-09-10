import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GroupsPage } from "./pages/GroupsPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { ProposalPage } from "./pages/ProposalPage";
import { NewProposalPage } from "./pages/NewProposalPage";
import { SuggestionsPage } from "./pages/SuggestionsPage";
import { NotificationsPage, SettingsPage } from "./pages/NotificationsSettingsPage";
import { LandingPage } from "./pages/LandingPage";
import { PrivacyPolicyPage, TermsPage, SupportPage } from "./pages/LegalPages";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function NotFoundPage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      textAlign: "center",
      padding: "40px 20px",
      gap: "16px",
    }}>
      <div style={{ fontSize: "80px" }}>🗓️</div>
      <h1 style={{ fontSize: "80px", margin: 0, color: "var(--accent)", fontFamily: "var(--mono)" }}>404</h1>
      <h2 style={{ margin: 0 }}>Page not found</h2>
      <p style={{ color: "var(--text)", maxWidth: "360px" }}>
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          background: "var(--accent)",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        ← Back to home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Public pages — accessible to everyone ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* ── Public-only routes (redirect authenticated users to dashboard) ── */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* ── Password reset — public but not public-only ── */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ── Protected routes (redirect unauthenticated users to login) ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:groupId" element={<GroupDetailPage />} />
            <Route
              path="/groups/:groupId/proposals/new"
              element={<NewProposalPage />}
            />
            <Route
              path="/proposals/:proposalId"
              element={<ProposalPage />}
            />
            <Route path="/suggestions" element={<SuggestionsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* ── Catch-all 404 ── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export { NotFoundPage };
