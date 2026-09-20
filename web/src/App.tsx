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
import { JoinPage } from "./pages/JoinPage";
import { ShareCardPage, PublicSharePage } from "./pages/ShareCardPage";
import { AfterDarkPage } from "./pages/AfterDarkPage";

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
      minHeight: "80vh",
      textAlign: "center",
      padding: "40px 20px",
      gap: "20px",
    }}>
      <div style={{
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: 140,
        color: "var(--primary)",
        lineHeight: 1,
        letterSpacing: "-0.04em",
      }}>
        404
      </div>
      <span className="dn-sticker">Lost?</span>
      <h2 style={{ margin: 0, fontSize: 26 }}>Page not found</h2>
      <p style={{ color: "var(--ink2)", maxWidth: "360px" }}>
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <Link to="/dashboard" className="dn-btn">
        Go to my plans →
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

          {/* ── Join via invite link — public ── */}
          <Route path="/join/:token" element={<JoinPage />} />

          {/* ── Public share card — no auth needed ── */}
          <Route path="/share/:shareToken" element={<PublicSharePage />} />

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
            <Route path="/proposals/:proposalId/share" element={<ShareCardPage />} />
            <Route path="/groups/:groupId/after-dark" element={<AfterDarkPage />} />
            <Route path="/after-dark" element={<AfterDarkPage />} />
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
