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
import { PlanBuilderProvider } from "./contexts/PlanBuilderContext";
import { PlanBuilderDock } from "./components/PlanBuilderDock";
import LandingPage from "./pages/LandingPage";
import { PrivacyPolicyPage, TermsPage, SupportPage } from "./pages/LegalPages";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { JoinPage } from "./pages/JoinPage";
import { ShareCardPage, PublicSharePage } from "./pages/ShareCardPage";
import { GuestVotePage, getGuestId } from "./pages/GuestVotePage";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicShareApi } from "./api/client";
import { AfterDarkPage } from './pages/AfterDarkPage';
import { FacebookCallbackPage } from './pages/FacebookCallbackPage';
import { AppleCallbackPage } from './pages/AppleCallbackPage';
import BusinessLandingPage from './pages/business/BusinessLandingPage';
import { BusinessAuthPage } from './pages/business/BusinessAuthPage';
import { BusinessLayout } from './pages/business/BusinessLayout';
import { BusinessDashboardPage } from './pages/business/BusinessDashboardPage';
import { BusinessProfilePage } from './pages/business/BusinessProfilePage';
import { BusinessListingsPage } from './pages/business/BusinessListingsPage';
import { BusinessAnalyticsPage } from './pages/business/BusinessAnalyticsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// /share/:shareToken smart resolver — new guest-vote tokens render the guest
// voting experience; legacy 32-hex share-card tokens fall back to the old
// decided-proposal share card view.
function SmartSharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["share-resolve", shareToken],
    queryFn: async () => {
      try {
        await publicShareApi.get(shareToken!, getGuestId());
        return "guest" as const;
      } catch {
        return "legacy" as const;
      }
    },
    enabled: !!shareToken,
    retry: false,
    staleTime: 60_000,
  });
  if (isLoading) {
    return (
      <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--ink2)" }}>Loading…</p>
      </main>
    );
  }
  return data === "guest" ? <GuestVotePage /> : <PublicSharePage />;
}

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
      <PlanBuilderProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public pages — accessible to everyone ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/suggestions" element={<SuggestionsPage />} />

          {/* ── Public-only routes (redirect authenticated users to dashboard) ── */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* ── OAuth callback routes (public) ── */}
          <Route path="/auth/facebook/callback" element={<FacebookCallbackPage />} />
          <Route path="/auth/apple/callback" element={<AppleCallbackPage />} />

          {/* ── Password reset — public but not public-only ── */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ── Join via invite link — public ── */}
          <Route path="/join/:token" element={<JoinPage />} />

          {/* ── Public share card — no auth needed ── */}
          <Route path="/share/:shareToken" element={<SmartSharePage />} />
          <Route path="/vote/:shareToken" element={<GuestVotePage />} />

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
              path="/proposals/new"
              element={<NewProposalPage />}
            />
            <Route
              path="/proposals/:proposalId"
              element={<ProposalPage />}
            />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/proposals/:proposalId/share" element={<ShareCardPage />} />
            <Route path="/groups/:groupId/after-dark" element={<AfterDarkPage />} />
            <Route path="/after-dark" element={<AfterDarkPage />} />
          </Route>

          {/* ── Catch-all 404 ── */}
          <Route path="*" element={<NotFoundPage />} />

          {/* ── Business portal ── */}
          <Route path="/business" element={<BusinessLandingPage />} />
          <Route path="/business/login" element={<BusinessAuthPage mode="login" />} />
          <Route path="/business/register" element={<BusinessAuthPage mode="register" />} />
          <Route element={<BusinessLayout />}>
            <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
            <Route path="/business/profile" element={<BusinessProfilePage />} />
            <Route path="/business/listings" element={<BusinessListingsPage />} />
            <Route path="/business/analytics" element={<BusinessAnalyticsPage />} />
          </Route>
        </Routes>
        <PlanBuilderDock />
      </BrowserRouter>
      </PlanBuilderProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export { NotFoundPage };
