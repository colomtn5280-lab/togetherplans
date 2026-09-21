import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="page">
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="wrap">
        <nav className="nav">
          <a className="brand" href="/" aria-label="TogetherPlans home">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <g transform="rotate(6 34 62)">
                <circle cx="33" cy="28" r="11" fill="#0E8C8C"/>
                <path d="M15 84V62a18 18 0 0 1 36 0v22z" fill="#0E8C8C"/>
              </g>
              <g transform="rotate(-6 66 66)">
                <circle cx="67" cy="32" r="11" fill="#7CB518"/>
                <path d="M49 84V66a18 18 0 0 1 36 0v18z" fill="#7CB518"/>
              </g>
            </svg>
            TogetherPlans
          </a>
          <div className="nav-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="/support">Support</a>
            <a href="/login" className="btn btn-primary btn-sm">Sign in</a>
          </div>
        </nav>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-eyebrow">🎉 Now on iOS &amp; Android</div>
          <h1>Stop texting<br/><span>"I don't know,<br/>what do you want to do?"</span></h1>
          <p className="hero-sub">Propose options, vote together, lock it in. TogetherPlans turns indecision into plans in minutes.</p>
          <div className="hero-cta">
            <a href="https://apps.apple.com/app/togetherplans/id6806890578" className="btn btn-primary">
              🍎 App Store
            </a>
            <a href="https://play.google.com/store/apps/details?id=togetherplans.app" className="btn btn-outline">
              🤖 Google Play
            </a>
            <a href="/signup" className="btn btn-lime">Try on web →</a>
          </div>
          <div className="hero-badge">
            <span className="badge"><span className="badge-dot"/>Free forever</span>
            <span className="badge"><span className="badge-dot"/>iOS &amp; Android</span>
            <span className="badge"><span className="badge-dot"/>No ads</span>
          </div>

          {/* Phone mockup */}
          <div className="phone-mockup">
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="screen-inner">
                  <div className="screen-status">
                    <span>9:41</span><span>●●● 100%</span>
                  </div>
                  <div className="screen-card">
                    <div className="screen-card-top">
                      <span className="card-title">Friday Night Out 🌙</span>
                      <span className="card-chip">OPEN</span>
                    </div>
                    <div className="card-sub">Vote for your favorite option</div>
                    <div className="vote-row">
                      <div className="vote-opt voted">🍽 Nobu</div>
                      <div className="vote-opt">🎵 Jazz</div>
                      <div className="vote-opt">😂 Comedy</div>
                    </div>
                  </div>
                  <div className="match-card">
                    <div className="match-emoji">🎉</div>
                    <div className="match-title">It's a Match!</div>
                    <div className="match-sub">You both chose Jazz at Blue Room</div>
                    <span className="match-btn">Add to Calendar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how" id="how">
        <div className="wrap">
          <div className="section-label">How it works</div>
          <h2 className="section-title">Three steps to a locked-in plan</h2>
          <p className="section-sub">No more endless back-and-forth. Just options, votes, and a plan.</p>
          <div className="steps">
            <div className="step">
              <div className="step-icon">📋</div>
              <h3>Propose options</h3>
              <p>Add 2–5 things you'd both enjoy. Restaurants, activities, anything.</p>
            </div>
            <div className="step">
              <div className="step-icon lime">❤️</div>
              <h3>Everyone votes</h3>
              <p>Each person votes independently. No influence, no awkward negotiations.</p>
            </div>
            <div className="step">
              <div className="step-icon">🎉</div>
              <h3>It's a match</h3>
              <p>When you agree, it locks in automatically and goes straight to your calendar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="wrap">
          <div className="section-label">Features</div>
          <h2 className="section-title">Everything you need, nothing you don't</h2>
          <p className="section-sub">Built for couples and friend groups who want to spend time together, not planning time together.</p>
          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">🗳️</div>
              <h3>Group voting</h3>
              <p>Everyone in the group votes. Consensus auto-detected. Plan locked in instantly.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🌙</div>
              <h3>After Dark mode</h3>
              <p>Late-night suggestions ranked by your mood. Adventurous, romantic, chill — you pick the vibe.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📍</div>
              <h3>Smart suggestions</h3>
              <p>Activities, restaurants, and events near you. Powered by location, curated by taste.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📅</div>
              <h3>Calendar sync</h3>
              <p>Matched plans drop straight into your calendar. No copy-paste, no forgetting.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📤</div>
              <h3>Share Cards</h3>
              <p>Share your matched plans with a beautiful card. Let everyone know what you decided.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🔒</div>
              <h3>Private by default</h3>
              <p>Groups are invite-only. Your plans stay between the people you invite.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="social-proof">
        <div className="wrap">
          <div className="section-label">Early users</div>
          <h2 className="section-title">People are planning again</h2>
          <div className="reviews">
            <div className="review">
              <div className="review-stars">★★★★★</div>
              <p className="review-text">"We used to spend 30 minutes deciding where to eat. Now we spend 2. This app is stupid simple and I love it."</p>
              <div className="reviewer">
                <div className="reviewer-avatar">👩</div>
                <div>
                  <div className="reviewer-name">Sarah M.</div>
                  <div className="reviewer-meta">Denver, CO</div>
                </div>
              </div>
            </div>
            <div className="review">
              <div className="review-stars">★★★★★</div>
              <p className="review-text">"My boyfriend and I have completely different tastes. TogetherPlans found the overlap we didn't know we had."</p>
              <div className="reviewer">
                <div className="reviewer-avatar">👱</div>
                <div>
                  <div className="reviewer-name">Priya K.</div>
                  <div className="reviewer-meta">San Francisco, CA</div>
                </div>
              </div>
            </div>
            <div className="review">
              <div className="review-stars">★★★★★</div>
              <p className="review-text">"Our friend group of 6 used to never agree on anything. Last week we had 3 plans locked in 10 minutes."</p>
              <div className="reviewer">
                <div className="reviewer-avatar">🧑</div>
                <div>
                  <div className="reviewer-name">Marcus T.</div>
                  <div className="reviewer-meta">Austin, TX</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="wrap">
          <div className="cta-box">
            <h2>Ready to make a plan?</h2>
            <p>Free on iOS, Android, and web. No credit card. No nonsense.</p>
            <div className="cta-buttons">
              <a href="https://apps.apple.com/app/togetherplans/id6806890578" className="btn btn-white">
                🍎 Download for iOS
              </a>
              <a href="https://play.google.com/store/apps/details?id=togetherplans.app" className="btn btn-ghost">
                🤖 Get it on Android
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* B2B CTA */}
      <section style={{padding:'48px 0',background:'var(--surface)',borderTop:'1px solid var(--line)'}}>
        <div className="wrap" style={{textAlign:'center'}}>
          <p style={{fontSize:'14px',color:'var(--ink2)',marginBottom:'12px'}}>Are you a venue, restaurant, or experience provider?</p>
          <a href="/business" className="btn btn-outline">
            🏢 Feature Your Business With Us
          </a>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="footer-inner">
            <a className="brand" href="/" style={{fontSize:'16px'}}>
              <svg viewBox="0 0 100 100" style={{width:28,height:28}}>
                <g transform="rotate(6 34 62)">
                  <circle cx="33" cy="28" r="11" fill="#0E8C8C"/>
                  <path d="M15 84V62a18 18 0 0 1 36 0v22z" fill="#0E8C8C"/>
                </g>
                <g transform="rotate(-6 66 66)">
                  <circle cx="67" cy="32" r="11" fill="#7CB518"/>
                  <path d="M49 84V66a18 18 0 0 1 36 0v18z" fill="#7CB518"/>
                </g>
              </svg>
              TogetherPlans
            </a>
            <div className="footer-links">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/support">Support</a>
            </div>
            <span className="footer-copy">© 2026 TogetherPlans LLC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
# redeploy Mon Sep 21 04:42:47 CEST 2026
