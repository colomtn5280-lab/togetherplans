import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-root">
      <div className="page">
        <div className="blob b1" /><div className="blob b2" />
        <div className="wrap">
          <nav className="nav">
            <Link className="brand" to="/" aria-label="DateMeUp home">
              <img src="/mark-teal.svg" alt="DateMeUp mark" width={36} height={36} />
              <b>DateMeUp</b>
            </Link>
            <div className="nav-links">
              <a href="#how">How it works</a>
              <a href="#groups">For groups</a>
              <a href="/support">Support</a>
            </div>
            <div className="nav-cta">
              <Link className="link" to="/login">Log in</Link>
              <Link className="btn sm" to="/signup">Get started</Link>
            </div>
          </nav>

          <section className="hero">
            <div>
              <span className="sticker">FOR COUPLES &amp; GROUPS</span>
              <h1>Plan together.<br />Go together<span className="dot">.</span></h1>
              <p>47 messages later, still no plan? Propose a few options, everyone votes, and DateMeUp locks in the winner.</p>
              <div className="hero-ctas">
                <Link className="btn lg" to="/signup">Start a plan, free</Link>
                <a className="btn lg ghost" href="#how">See how it works</a>
              </div>
              <div className="stores">
                <a className="store" href="https://apps.apple.com/app/id6806890578"> App Store</a>
                <a className="store" href="https://play.google.com/store/apps/details?id=app.datemeup.datenight">&#9654; Google Play</a>
              </div>
              <div className="fine">No ads. Friends can vote from a text without installing anything.</div>
            </div>
            <div className="stage" aria-hidden={true}>
              <div className="phone">
                <h3>Friday<br />night <span className="dot" style={{display:'inline-block',transform:'rotate(8deg)',color:'var(--primary)'}}>!</span></h3>
                <div className="sub">Priya voted · waiting on you</div>
                <div className="opts">
                  <div className="opt"><span className="tag">Priya ♥</span><div className="t"><b>Jazz at the Blue Room</b><span>Nightlife</span></div><span className="heart">♡</span></div>
                  <div className="opt"><div className="t"><b>Noodle Bar Kōji</b><span>Dining</span></div><span className="heart on">♥</span></div>
                  <div className="opt"><div className="t"><b>Sunset hike</b><span>Outdoors</span></div><span className="heart">♡</span></div>
                </div>
              </div>
              <div className="locked">
                <span className="badge">LOCKED IN</span>
                <div className="big">🎉</div>
                <h3>You both said yes to</h3>
                <div className="win">Jazz at the Blue Room</div>
                <div className="cal">Add to calendar</div>
              </div>
            </div>
          </section>

          <section className="cards" id="groups">
            <div className="card">
              <span className="ic" style={{background:'var(--primary-soft)',transform:'rotate(-6deg)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12z"/></svg>
              </span>
              <h3>Stop the &ldquo;What should we do?&rdquo; loop</h3>
              <p>One proposal, three to five options, one clear answer. No 47-message thread.</p>
            </div>
            <div className="card">
              <span className="ic" style={{background:'var(--lime-soft)',transform:'rotate(5deg)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 8.6c0 4.8-8.8 10.4-8.8 10.4S3.2 13.4 3.2 8.6a4.6 4.6 0 0 1 8.8-1.9 4.6 4.6 0 0 1 8.8 1.9z"/></svg>
              </span>
              <h3>Suggest. Counter. Lock it in.</h3>
              <p>Everyone votes on their phone. Nobody&rsquo;s happy? Counter-propose in one tap.</p>
            </div>
            <div className="card">
              <span className="ic" style={{background:'var(--warning-soft)',transform:'rotate(-4deg)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="3"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M14 20a5 5 0 0 1 7.5-4.3"/></svg>
              </span>
              <h3>Works for couples &amp; groups</h3>
              <p>Two people or twelve. Invite by link, text, email, QR or username.</p>
            </div>
          </section>

          <section className="how" id="how">
            <h2>How it works</h2>
            <div className="steps">
              <div className="step"><span className="num">1</span><h3>Invite</h3><p>Make a group and send a link. They&rsquo;re in before the kettle boils.</p></div>
              <div className="step"><span className="num">2</span><h3>Propose</h3><p>Pick a night, add 3&ndash;5 options, or pull them straight from Discover.</p></div>
              <div className="step"><span className="num">3</span><h3>Agree</h3><p>Everyone votes. Consensus locks it in and adds it to your calendar.</p></div>
            </div>
          </section>

          <section className="cta">
            <div className="cb" />
            <div style={{flex:1}}><h2>Friday&rsquo;s sorted<br />by Tuesday.</h2><p>Free for couples and groups. iOS, Android, web.</p></div>
            <Link className="btn lg" to="/signup">Get started</Link>
          </section>

          <footer className="landing-footer">
            <span>© 2026 DateMeUp · datemeup.app</span>
            <div className="links">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/support">Support</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
