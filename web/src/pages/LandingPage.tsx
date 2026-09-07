import { Link, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import "./LandingPage.css";

export function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Authenticated users go straight to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <span className="landing-nav__logo">/DateNight</span>
        <div className="landing-nav__links">
          <Link to="/login" className="landing-nav__link">Log in</Link>
          <Link to="/signup" className="landing-nav__cta">Get started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero__badge">✨ Collaborative date planning</div>
        <h1 className="landing-hero__title">/DateNight</h1>
        <p className="landing-hero__tagline">Plan Together. Go Together.</p>
        <p className="landing-hero__desc">
          Stop the endless back-and-forth. /DateNight lets couples and groups
          suggest, vote, and lock in the perfect date night — together.
        </p>
        <div className="landing-hero__actions">
          <Link to="/signup" className="landing-btn landing-btn--primary">
            Get started free →
          </Link>
          <Link to="/login" className="landing-btn landing-btn--secondary">
            Log in
          </Link>
        </div>

        {/* Pure-CSS illustration */}
        <div className="landing-hero__visual" aria-hidden="true">
          <div className="landing-card">
            <div className="landing-card__header">📅 Friday Night</div>
            <div className="landing-card__votes">
              <div className="landing-vote landing-vote--win">🍕 Italian &nbsp;<span>✅ ✅</span></div>
              <div className="landing-vote">🎬 Movie &nbsp;<span>✅</span></div>
              <div className="landing-vote">🎳 Bowling &nbsp;<span>👍</span></div>
            </div>
            <div className="landing-card__lock">🔒 Locked in!</div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section">
        <h2 className="landing-section__title">Why /DateNight?</h2>
        <div className="landing-features">
          <div className="landing-feature">
            <div className="landing-feature__icon">🔄</div>
            <h3>Stop the "What should we do?" loop</h3>
            <p>
              No more decision paralysis. Everyone throws ideas into the mix
              and the group decides together — fast.
            </p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature__icon">💡</div>
            <h3>Suggest · Counter · Lock It In</h3>
            <p>
              Suggest what you want, counter with alternatives, and lock the
              plan once everyone agrees. Simple as that.
            </p>
          </div>
          <div className="landing-feature">
            <div className="landing-feature__icon">👫</div>
            <h3>Works for Couples and Groups</h3>
            <p>
              Date night for two or a big group hangout — /DateNight scales to
              any size without losing simplicity.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-section landing-section--alt">
        <h2 className="landing-section__title">How it works</h2>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step__num">1</div>
            <h3>Invite your partner or group</h3>
            <p>Share a link, QR code, or send an invite by email or SMS. They're in within seconds.</p>
          </div>
          <div className="landing-step__arrow" aria-hidden="true">→</div>
          <div className="landing-step">
            <div className="landing-step__num">2</div>
            <h3>Suggest activities</h3>
            <p>Everyone adds ideas — restaurants, movies, activities. Browse suggestions from Yelp, Google Maps, and more.</p>
          </div>
          <div className="landing-step__arrow" aria-hidden="true">→</div>
          <div className="landing-step">
            <div className="landing-step__num">3</div>
            <h3>Agree and lock it in</h3>
            <p>Vote on your favourites. Once everyone agrees, the plan is locked and you get a notification.</p>
          </div>
        </div>
      </section>

      {/* ── App Store ── */}
      <section className="landing-section">
        <h2 className="landing-section__title">Take it with you</h2>
        <p className="landing-section__sub">Available on iOS and Android</p>
        <div className="landing-store">
          {/* TODO add real store URLs when available */}
          <a href="#" className="landing-store__btn" aria-label="Download on the App Store">
            <span className="landing-store__icon">🍎</span>
            <span>
              <small>Download on the</small>
              <strong>App Store</strong>
            </span>
          </a>
          {/* TODO add real store URLs when available */}
          <a href="#" className="landing-store__btn" aria-label="Get it on Google Play">
            <span className="landing-store__icon">▶</span>
            <span>
              <small>Get it on</small>
              <strong>Google Play</strong>
            </span>
          </a>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="landing-cta">
        <h2>Ready to plan your next date night?</h2>
        <p>Join thousands of couples and groups already using /DateNight.</p>
        <Link to="/signup" className="landing-btn landing-btn--primary landing-btn--lg">
          Create your free account →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span>© 2026 /DateNight</span>
        <div className="landing-footer__links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support</Link>
        </div>
      </footer>
    </div>
  );
}
