import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

export default function LandingPage() {
  const { t } = useTranslation();
  return (
    <div className="landing-root">
      <div className="page">
        <div className="blob b1" /><div className="blob b2" />
        <div className="wrap">
          <nav className="nav">
            <Link className="brand" to="/" aria-label="TogetherPlans home">
              <img src="/mark-teal.svg" alt="TogetherPlans mark" width={36} height={36} />
              <b>TogetherPlans</b>
            </Link>
            <div className="nav-links">
              <a href="#how">{t("landing.howItWorksNav")}</a>
              <a href="#groups">{t("landing.forGroups")}</a>
              <a href="/support">{t("landing.support")}</a>
            </div>
            <div className="nav-cta">
              <Link className="link" to="/login">{t("landing.logIn")}</Link>
              <Link className="btn sm" to="/signup">{t("landing.getStarted")}</Link>
            </div>
          </nav>

          <section className="hero">
            <div className="hero-inner">
              <div className="hero-text">
                <span className="sticker">{t("landing.forCouplesGroups")}</span>
                <h1>{t("landing.heroTitle")}<br />Go together<span className="dot">.</span></h1>
                <p>{t("landing.heroDesc")}</p>
                <div className="hero-ctas">
                  <Link className="btn lg" to="/signup">{t("landing.startPlanFree")}</Link>
                  <a className="btn lg ghost" href="#how">{t("landing.seeHowItWorks")}</a>
                </div>
                <div className="stores">
                  <a className="store" href="https://apps.apple.com/app/id6806890578">
                    <svg width="16" height="16" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4C46 382.8-.3 291.4-.3 195.9-.3 85.8 61.9 23 120.6 23c50.5 0 92.9 33.7 123.8 33.7 29.5 0 75.9-35.5 133.7-35.5 54.2 0 135.1 20.1 183.3 88.2zm-87.4-139.9c23.8-28.4 40.8-68.1 40.8-107.7 0-5.5-.5-11.1-1.5-16.5-38.3 1.4-84.2 25.6-111.6 57.7-22.1 25.7-41.8 65.9-41.8 106 0 6 1 12 1.5 13.9 2.5.4 5 .5 7.5.5 34.4 0 77.5-23.3 105.1-53.9z"/></svg>
                    {t("landing.appStore")}
                  </a>
                  <a className="store" href="https://play.google.com/store/apps/details?id=app.datemeup.datenight">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.18 23.76c.36.2.8.22 1.2 0l11.72-6.76-2.76-2.76-10.16 9.52zM.54 1.5C.2 1.86 0 2.4 0 3.08v17.84c0 .68.2 1.22.54 1.58l.08.08 9.98-9.98v-.24L.62 1.42.54 1.5zM20.54 10.4l-2.68-1.54-3.08 3.08 3.08 3.08 2.7-1.56c.76-.44.76-1.62-.02-2.06zM4.38.24L16.1 7 13.34 9.76 3.18.24C3.58.02 4.02.04 4.38.24z"/></svg>
                    {t("landing.googlePlay")}
                  </a>
                </div>
                <div className="fine">{t("landing.noAds")}</div>
              </div>
              <div className="hero-visual" aria-hidden={true} style={{
                overflow: 'hidden',
                borderRadius: '24px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                maxHeight: '560px',
              }}>
                <img
                  src="/screenshots/app-preview.png"
                  alt="TogetherPlans app — vote on date night activities with your partner"
                  style={{
                    width: '100%',
                    display: 'block',
                    borderRadius: '24px',
                  }}
                />
              </div>
            </div>
          </section>

          <section style={{
            padding: '3rem 1.5rem',
            background: 'var(--bg2)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink2)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t("landing.lovedByCouples")}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '800px', margin: '0 auto' }}>
              {[
                { quote: "Finally stopped arguing about where to go. We just vote and it decides!", name: "Sarah & Tom", emoji: "💑" },
                { quote: "The invite cards are so cute — we screenshot them every time.", name: "Alex & Jordan", emoji: "🎨" },
                { quote: "After Dark is... let's just say it's become our Friday tradition.", name: "Riley & Morgan", emoji: "🌙" },
              ].map((testimonial, i) => (
                <div key={i} className="dn-card" style={{ flex: '1 1 220px', padding: '1.5rem', textAlign: 'left', maxWidth: '280px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{testimonial.emoji}</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.5, marginBottom: '0.75rem' }}>'{testimonial.quote}'</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink2)', fontWeight: 600 }}>— {testimonial.name}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="cards" id="groups">
            <div className="card">
              <span className="ic" style={{background:'var(--primary-soft)',transform:'rotate(-6deg)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12z"/></svg>
              </span>
              <h3>{t("landing.stopLoop")}</h3>
              <p>{t("landing.stopLoopDesc")}</p>
            </div>
            <div className="card">
              <span className="ic" style={{background:'var(--lime-soft)',transform:'rotate(5deg)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 8.6c0 4.8-8.8 10.4-8.8 10.4S3.2 13.4 3.2 8.6a4.6 4.6 0 0 1 8.8-1.9 4.6 4.6 0 0 1 8.8 1.9z"/></svg>
              </span>
              <h3>{t("landing.suggestCounter")}</h3>
              <p>{t("landing.suggestCounterDesc")}</p>
            </div>
            <div className="card">
              <span className="ic" style={{background:'var(--warning-soft)',transform:'rotate(-4deg)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="3"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M14 20a5 5 0 0 1 7.5-4.3"/></svg>
              </span>
              <h3>{t("landing.worksForAll")}</h3>
              <p>{t("landing.worksForAllDesc")}</p>
            </div>
          </section>

          <section className="how" id="how">
            <h2>{t("landing.howItWorks")}</h2>
            <div className="steps">
              <div className="step"><span className="num">1</span><h3>{t("landing.invite")}</h3><p>{t("landing.inviteDesc")}</p></div>
              <div className="step"><span className="num">2</span><h3>{t("landing.propose")}</h3><p>{t("landing.proposeDesc")}</p></div>
              <div className="step"><span className="num">3</span><h3>{t("landing.agree")}</h3><p>{t("landing.agreeDesc")}</p></div>
            </div>
          </section>

          <section className="cta">
            <div className="cb" />
            <div style={{flex:1}}><h2>{t("landing.fridaySorted")}</h2><p>{t("landing.freeForGroups")}</p></div>
            <Link className="btn lg" to="/signup">{t("landing.getStarted")}</Link>
          </section>

          <footer className="landing-footer">
            <span>{t("landing.copyright")}</span>
            <div className="links">
              <a href="/privacy">{t("landing.privacy")}</a>
              <a href="/terms">{t("landing.terms")}</a>
              <a href="/support">{t("landing.support")}</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
