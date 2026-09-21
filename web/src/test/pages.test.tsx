/**
 * React Testing Library tests for new pages (W5)
 * Tests: LandingPage, PrivacyPolicyPage, TermsPage, SupportPage, NotFoundPage
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Mock zustand auth store so LandingPage renders without redirect ───────────
vi.mock("../store/auth.store", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: false }),
}));

// ── Suppress React Router warnings in test output ─────────────────────────────
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// ─────────────────────────────────────────────────────────────────────────────
// LandingPage
// ─────────────────────────────────────────────────────────────────────────────
import LandingPage from "../pages/LandingPage";

describe("LandingPage", () => {
  function renderLanding() {
    return render(
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>
    );
  }

  it("renders the /DateNight app name in the hero section", () => {
    renderLanding();
    // The hero h1 contains /DateNight
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("/DateNight");
  });

  it("renders the tagline 'Plan Together. Go Together.'", () => {
    renderLanding();
    expect(screen.getByText(/Plan Together\. Go Together\./i)).toBeInTheDocument();
  });

  it("renders a primary CTA link to /signup", () => {
    renderLanding();
    const links = screen.getAllByRole("link");
    const signupLinks = links.filter(
      (l) => l.getAttribute("href") === "/signup"
    );
    expect(signupLinks.length).toBeGreaterThan(0);
  });

  it("renders the App Store download button", () => {
    renderLanding();
    expect(
      screen.getByRole("link", { name: /Download on the App Store/i })
    ).toBeInTheDocument();
  });

  it("renders the Google Play download button", () => {
    renderLanding();
    expect(
      screen.getByRole("link", { name: /Get it on Google Play/i })
    ).toBeInTheDocument();
  });

  it("renders all three feature highlights", () => {
    renderLanding();
    expect(screen.getByText(/Stop the.*what should we do/i)).toBeInTheDocument();
    expect(screen.getByText(/Suggest.*Counter.*Lock It In/i)).toBeInTheDocument();
    expect(screen.getByText(/Works for Couples and Groups/i)).toBeInTheDocument();
  });

  it("renders three numbered how-it-works steps", () => {
    renderLanding();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/Invite your partner or group/i)).toBeInTheDocument();
    expect(screen.getByText(/Suggest activities/i)).toBeInTheDocument();
    expect(screen.getByText(/Agree and lock it in/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PrivacyPolicyPage
// ─────────────────────────────────────────────────────────────────────────────
import { PrivacyPolicyPage } from "../pages/LegalPages";

describe("PrivacyPolicyPage", () => {
  function renderPrivacy() {
    return render(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>
    );
  }

  it("renders the Privacy Policy heading", () => {
    renderPrivacy();
    expect(
      screen.getByRole("heading", { name: /Privacy Policy/i })
    ).toBeInTheDocument();
  });

  it("mentions GDPR rights section", () => {
    renderPrivacy();
    expect(screen.getByText(/Right to access/i)).toBeInTheDocument();
  });

  it("mentions CCPA rights section", () => {
    renderPrivacy();
    expect(screen.getByText(/CCPA.*California residents/i)).toBeInTheDocument();
  });

  it("shows the privacy contact email", () => {
    renderPrivacy();
    const links = screen.getAllByRole("link", { name: /privacy@datenight\.io/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it("mentions all third-party services", () => {
    renderPrivacy();
    expect(screen.getAllByText(/Google Maps/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Yelp/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TMDB/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Twilio/i).length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TermsPage
// ─────────────────────────────────────────────────────────────────────────────
import { TermsPage } from "../pages/LegalPages";

describe("TermsPage", () => {
  function renderTerms() {
    return render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>
    );
  }

  it("renders the Terms of Service heading", () => {
    renderTerms();
    expect(
      screen.getByRole("heading", { name: /Terms of Service/i })
    ).toBeInTheDocument();
  });

  it("has an Acceptance of Terms section", () => {
    renderTerms();
    expect(screen.getByText(/Acceptance of Terms/i)).toBeInTheDocument();
  });

  it("has a Limitation of Liability section", () => {
    renderTerms();
    expect(screen.getByText(/Limitation of Liability/i)).toBeInTheDocument();
  });

  it("shows the legal contact email", () => {
    renderTerms();
    const links = screen.getAllByRole("link", { name: /legal@datenight\.io/i });
    expect(links.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SupportPage
// ─────────────────────────────────────────────────────────────────────────────
import { SupportPage } from "../pages/LegalPages";

describe("SupportPage", () => {
  function renderSupport() {
    return render(
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>
    );
  }

  it("renders the Support heading", () => {
    renderSupport();
    expect(
      screen.getByRole("heading", { level: 1, name: /Support/i })
    ).toBeInTheDocument();
  });

  it("shows the support email link", () => {
    renderSupport();
    expect(
      screen.getByRole("link", { name: /support@datenight\.io/i })
    ).toBeInTheDocument();
  });

  it("renders 6 FAQ questions", () => {
    renderSupport();
    const faqs = screen.getAllByRole("group"); // <details> elements
    expect(faqs.length).toBe(6);
  });

  it("links to Privacy Policy and Terms pages", () => {
    renderSupport();
    expect(screen.getByRole("link", { name: /Privacy Policy/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Terms of Service/i })).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NotFoundPage (imported from App)
// ─────────────────────────────────────────────────────────────────────────────
import { NotFoundPage } from "../App";

describe("NotFoundPage", () => {
  function renderNotFound() {
    return render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
  }

  it("renders 404 text", () => {
    renderNotFound();
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders 'Page not found' message", () => {
    renderNotFound();
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
  });

  it("has a link back to home /", () => {
    renderNotFound();
    const homeLink = screen.getByRole("link", { name: /Back to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.getAttribute("href")).toBe("/");
  });
});
