import { Link, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { AppNav } from "../components/AppNav";
import "./LandingPage.css";

export function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      {/* Nav override for landing — full-width, no max-width constraint */}
      <div className="landing__nav-wrap">
        <AppNav />
      </div>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero__left">
          <span className="dn-sticker dn-sticker--lime landing-hero__badge">Plan Together</span>
          <h1 className="landing-hero__title">Plan together.<br />Go together.</h1>
          <p className="landing-hero__desc">
            47 messages later, still no plan. TogetherPlans ends it in three taps.
          </p>
          <div className="landing-hero__actions">
            <Link to="/signup" className="dn-btn">Get started free →</Link>
            <Link to="/login" className="dn-btn dn-btn--secondary">Log in</Link>
          </div>
          <div className="landing-hero__badges">
            <div className="landing-store-badge">
              <span className="landing-store-badge__icon">🍎</span>
              <div>
                <div className="landing-store-badge__small">Download on the</div>
                <div className="landing-store-badge__big">App Store</div>
              </div>
            </div>
            <div className="landing-store-badge">
              <span className="landing-store-badge__icon">▶</span>
              <div>
                <div className="landing-store-badge__small">Get it on</div>
                <div className="landing-store-badge__big">Google Play</div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-hero__right" aria-hidden="true">
          {/* Card 1 */}
          <div className="landing-product-card landing-product-card--1">
            <div className="landing-product-card__header">
              <span>Friday Night</span>
              <span className="dn-sticker">Open</span>
            </div>
            <div className="landing-product-card__options">
              <div className="landing-option">
                <span className="landing-option__heart">♥</span>
                <span className="landing-option__name">Italian Restaurant</span>
                <span className="landing-option__votes landing-option__votes--lime">♥ ♥</span>
              </div>
              <div className="landing-option">
                <span className="landing-option__heart">♡</span>
                <span className="landing-option__name">Movie Night</span>
                <span className="landing-option__votes">♥</span>
              </div>
              <div className="landing-option">
                <span className="landing-option__heart">♡</span>
                <span className="landing-option__name">Bowling</span>
                <span className="landing-option__votes"></span>
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="landing-product-card landing-product-card--2">
            <div className="landing-product-card__header">
              <span>Saturday Night</span>
              <span className="dn-sticker dn-sticker--lime">Locked In 🎉</span>
            </div>
            <div className="landing-product-card__options">
              <div className="landing-option landing-option--winner">
                <span className="landing-option__heart">♥</span>
                <span className="landing-option__name">Italian Restaurant</span>
                <span className="landing-option__votes landing-option__votes--lime">♥ ♥ ♥</span>
              </div>
              <div className="landing-option" style={{ opacity: 0.5 }}>
                <span className="landing-option__heart">♡</span>
                <span className="landing-option__name">Bowling</span>
                <span className="landing-option__votes">♥</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section">
        <h2 className="landing-section__title">Why TogetherPlans?</h2>
        <div className="landing-features">
          {[
            { icon: "🔄", title: "Stop the loop", desc: "No more 'what do you want to do?' — everyone submits ideas and the group decides fast." },
            { icon: "♥", title: "Tap a heart", desc: "Vote on favourites with a single tap. Instant, visual, and actually fun." },
            { icon: "👫", title: "Works for everyone", desc: "Perfect for couples, friend groups, or family nights. Scales to any size." },
          ].map((f, i) => (
            <div key={i} className={`dn-card landing-feature dn-card--alt${i % 3}`}>
              <div className="landing-feature__icon-blob" aria-hidden="true">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-section landing-section--alt">
        <h2 className="landing-section__title">Three taps. Done.</h2>
        <div className="landing-steps">
          {[
            { num: "1", color: "var(--primary)", title: "Invite your people", desc: "Share a link, QR code, or send an invite by email. They're in within seconds." },
            { num: "2", color: "var(--lime)", title: "Tap a heart", desc: "Everyone votes on their favourites from a curated list of local activities." },
            { num: "3", color: "var(--ink)", title: "Lock it in", desc: "Once there's consensus, the plan locks and you get a notification. Go." },
          ].map((s, i) => (
            <div key={i} className="landing-step">
              <div className="landing-step__num" style={{ background: s.color, color: s.color === "var(--lime)" ? "var(--on-lime)" : "var(--on-primary)" }}>
                {s.num}
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Band ── */}
      <section className="landing-cta-band">
        <div className="landing-cta-band__blob" aria-hidden="true" />
        <h2>Ready for your next date night?</h2>
        <p>Join thousands of couples already using TogetherPlans.</p>
        <Link to="/signup" className="dn-btn">Create free account →</Link>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer__logo">
          <div className="landing-footer__logo-blob" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="var(--primary,#0E8C8C)" strokeWidth="2" />
              <line x1="3" y1="9" x2="21" y2="9" stroke="var(--primary,#0E8C8C)" strokeWidth="2" />
              <line x1="8" y1="2" x2="8" y2="7" stroke="var(--primary,#0E8C8C)" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="2" x2="16" y2="7" stroke="var(--primary,#0E8C8C)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span>TogetherPlans</span>
        </div>
        <div className="landing-footer__links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/support">Support</Link>
        </div>
        <p className="landing-footer__copy">Made with ❤️ for date nights</p>
      </footer>
    </div>
  );
}
