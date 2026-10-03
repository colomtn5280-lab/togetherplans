import { Link } from "react-router-dom";
import { useState } from "react";
import "./LegalPages.css";

/* ─────────────────────────────────────────────────────────────
   Privacy Policy Page — GDPR + CCPA compliant
   TODO (Jake): Fill in legal entity name and registered address
   before launch. Search for "TODO_LEGAL_ENTITY" and
   "TODO_REGISTERED_ADDRESS" below.
   Effective date: August 2026
───────────────────────────────────────────────────────────── */
export function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <Link to="/" className="legal-page__back">← Back to home</Link>
        <h1>Privacy Policy</h1>
        <p className="legal-page__effective">Effective date: August 1, 2026</p>
        <p>
          This Privacy Policy explains how <strong>DateMeUp LLC</strong>{" "}
          (&ldquo;DateMeUp&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;)
          collects, uses, and protects your personal information when you use the
          DateMeUp application and related services.
        </p>

        <h2>1. Information We Collect</h2>
        <h3>Account information</h3>
        <ul>
          <li><strong>Email address</strong> — required to create an account and for authentication.</li>
          <li><strong>Name</strong> — used to personalise your experience and display to group members.</li>
          <li><strong>Phone number</strong> — optional; collected only if you choose to enable SMS notifications via Twilio.</li>
          <li><strong>Password</strong> — stored as a bcrypt hash; we never store plain-text passwords.</li>
        </ul>
        <h3>Activity and preference data</h3>
        <ul>
          <li>Activity suggestions you create or vote on.</li>
          <li>Categories and types of activities you prefer.</li>
          <li>Groups you belong to and proposals you participate in.</li>
        </ul>
        <h3>Usage data</h3>
        <ul>
          <li>Log data: IP address, browser type, pages visited, timestamps.</li>
          <li>Device information: operating system, device type.</li>
          <li>Error reports and performance metrics collected via Sentry (when enabled).</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide, operate, and improve the DateMeUp service.</li>
          <li>To authenticate you and keep your account secure.</li>
          <li>To send transactional notifications (e.g. proposal locked, group invite) via email or SMS.</li>
          <li>To personalise activity suggestions using your stated preferences.</li>
          <li>To comply with legal obligations and enforce our Terms of Service.</li>
          <li>To detect and prevent fraud, abuse, and security incidents.</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your personal data to third parties. We do not use your
          data to serve targeted advertising.
        </p>

        <h2>3. Third-Party Services</h2>
        <p>We integrate with the following third-party services to power features of the app:</p>
        <ul>
          <li><strong>Google Maps Platform</strong> — for location search and activity discovery. Subject to Google&rsquo;s Privacy Policy.</li>
          <li><strong>Yelp Fusion API</strong> — for restaurant and activity recommendations. Subject to Yelp&rsquo;s Privacy Policy.</li>
          <li><strong>TMDB (The Movie Database)</strong> — for movie and entertainment suggestions. Subject to TMDB&rsquo;s Privacy Policy.</li>
          <li><strong>Twilio</strong> — for SMS delivery when you opt in to phone notifications. Subject to Twilio&rsquo;s Privacy Policy.</li>
        </ul>
        <p>
          These services receive only the data necessary to fulfil their function (e.g. a location
          query for maps, a phone number for SMS). We encourage you to review their respective
          privacy policies.
        </p>

        <h2>4. Data Retention</h2>
        <ul>
          <li><strong>Activity and proposal history</strong> — retained for 12 months after the activity date, then automatically deleted.</li>
          <li><strong>Account deletion</strong> — when you delete your account, your personal data is removed within 30 days. Anonymised aggregate data (e.g. category popularity) may be retained indefinitely.</li>
          <li><strong>Log data</strong> — server logs are retained for 90 days.</li>
        </ul>

        <h2>5. Your Rights</h2>
        <h3>Under GDPR (EEA / UK residents)</h3>
        <ul>
          <li><strong>Right to access</strong> — request a copy of the personal data we hold about you.</li>
          <li><strong>Right to rectification</strong> — correct inaccurate or incomplete data.</li>
          <li><strong>Right to erasure</strong> — request deletion of your account and associated data.</li>
          <li><strong>Right to data portability</strong> — export your data via the API endpoint <code>GET /api/v1/users/me/export</code>.</li>
          <li><strong>Right to restrict processing</strong> — ask us to limit how we use your data.</li>
          <li><strong>Right to object</strong> — object to processing based on legitimate interests.</li>
        </ul>
        <h3>Under CCPA (California residents)</h3>
        <ul>
          <li><strong>Right to know</strong> — request disclosure of the categories and specific pieces of personal information we collect.</li>
          <li><strong>Right to delete</strong> — request deletion of your personal information.</li>
          <li><strong>Right to opt-out</strong> — we do not sell personal information, so no opt-out is required.</li>
          <li><strong>Right to non-discrimination</strong> — exercising your rights will not result in different service levels.</li>
        </ul>
        <p>
          To exercise any of these rights, email us at{" "}
          <a href="mailto:privacy@datemeup.app">privacy@datemeup.app</a> or use
          the in-app account settings.
        </p>

        <h2>6. Cookies and Local Storage</h2>
        <p>
          DateMeUp uses browser <code>localStorage</code> to store authentication tokens (JWT
          access token and refresh token). We do not use advertising cookies or third-party tracking
          cookies.
        </p>

        <h2>7. Data Security</h2>
        <p>
          We use industry-standard security measures including TLS encryption in transit, bcrypt
          password hashing, and rate limiting on API endpoints. However, no method of transmission
          over the internet is 100% secure.
        </p>

        <h2>8. Children&rsquo;s Privacy</h2>
        <p>
          DateMeUp is not directed at children under 13 (or 16 in the EEA). We do not knowingly
          collect personal data from children. If you believe a child has provided us data, contact
          us immediately.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes via email or in-app notification. Continued use of the service after changes
          constitutes acceptance.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          {/* TODO_REGISTERED_ADDRESS: Replace with full registered business address */}
          <strong>DateMeUp LLC</strong><br />
          [TODO_REGISTERED_ADDRESS]<br />
          Email: <a href="mailto:privacy@datemeup.app">privacy@datemeup.app</a>
        </p>

        <div className="legal-page__footer-links">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support</Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Terms of Service Page
   TODO (Jake): Fill in governing jurisdiction before launch.
───────────────────────────────────────────────────────────── */
export function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <Link to="/" className="legal-page__back">← Back to home</Link>
        <h1>Terms of Service</h1>
        <p className="legal-page__effective">Effective date: August 1, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the DateMeUp application and related services (the
          &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service
          (&ldquo;Terms&rdquo;). If you do not agree, do not use the Service. These Terms
          constitute a binding agreement between you and DateMeUp
          (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
        </p>

        <h2>2. Service Description</h2>
        <p>
          DateMeUp is a collaborative activity-planning platform that allows couples and
          groups to suggest, vote on, and agree upon activities including dining, entertainment,
          and outings. The Service integrates with third-party data providers (Google Maps, Yelp,
          TMDB) to surface activity suggestions.
        </p>

        <h2>3. User Accounts and Responsibilities</h2>
        <ul>
          <li>You must be at least 13 years old (or 16 in the EEA) to create an account.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
          <li>You agree to provide accurate and current information when creating your account.</li>
          <li>You must notify us immediately at <a href="mailto:legal@datemeup.app">legal@datemeup.app</a> if you suspect unauthorised access to your account.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
        </ul>

        <h2>4. Acceptable Use Policy</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations.</li>
          <li>Harass, abuse, threaten, or intimidate other users.</li>
          <li>Upload or transmit viruses, malware, or other harmful code.</li>
          <li>Attempt to gain unauthorised access to any part of the Service or its systems.</li>
          <li>Scrape, crawl, or systematically extract data from the Service without prior written consent.</li>
          <li>Impersonate another person or entity.</li>
          <li>Use the Service to send unsolicited communications (spam).</li>
          <li>Reverse engineer or attempt to derive the source code of the Service.</li>
        </ul>

        <h2>5. User Content</h2>
        <p>
          You retain ownership of any content you submit to the Service (&ldquo;User Content&rdquo;),
          including activity suggestions, names, and comments. By submitting User Content, you
          grant DateMeUp a non-exclusive, worldwide, royalty-free licence to use, display, and
          transmit that content solely for the purpose of providing the Service to you and your
          group members.
        </p>
        <p>
          You represent and warrant that your User Content does not violate the rights of any
          third party and complies with this Acceptable Use Policy.
        </p>

        <h2>6. Termination</h2>
        <p>
          You may terminate your account at any time via the account settings page. We may
          suspend or terminate your access to the Service immediately, without notice, if we
          determine you have violated these Terms. Upon termination, your right to use the
          Service ceases, and your data will be handled per our{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>

        <h2>7. Disclaimers of Warranty</h2>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
          WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
          ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DATEMEUP AND ITS OFFICERS,
          DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR
          GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF WE HAVE
          BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT
          YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM OR (B) USD $100.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          {/* TODO (Jake): Fill in the governing jurisdiction before launch, e.g.
              "These Terms shall be governed by the laws of the State of Delaware, USA." */}
          These Terms shall be governed by and construed in accordance with the laws of
          [TODO_JURISDICTION], without regard to its conflict of law provisions. Any disputes
          arising from these Terms shall be resolved exclusively in the courts of
          [TODO_JURISDICTION].
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of material
          changes via email or in-app notification at least 14 days before the changes take
          effect. Continued use of the Service after that date constitutes acceptance of the
          updated Terms.
        </p>

        <h2>11. Contact</h2>
        <p>
          For questions about these Terms, please contact us at{" "}
          <a href="mailto:legal@datemeup.app">legal@datemeup.app</a>.
        </p>

        <div className="legal-page__footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/support">Support</Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Support Page
───────────────────────────────────────────────────────────── */
export function SupportPage() {
  const faqs: { q: string; a: string }[] = [
    {
      q: "How do I invite someone to a group?",
      a: "Open your group, tap 'Invite Members', and choose your preferred method: share a link, display a QR code, or send an invite by email or SMS. Your friend simply taps the link or scans the QR code to join — no account required to accept the invite.",
    },
    {
      q: "How do I delete my account?",
      a: "Go to Settings → Account → Delete Account. You'll be asked to confirm. Your account and personal data will be permanently removed within 30 days. Any group proposals you locked in will remain visible to other group members in anonymised form.",
    },
    {
      q: "How do I export my data?",
      a: "You can request a full export of your data from Settings → Account → Export My Data. You'll receive a downloadable JSON file within 24 hours. You can also request an export via the API endpoint GET /api/v1/users/me/export (requires authentication).",
    },
    {
      q: "What happens when everyone in the group agrees?",
      a: "When all group members have voted and a proposal reaches consensus (everyone agrees on the same activity), the proposal is automatically locked in. All members receive a notification — via the app, email, or SMS depending on your settings — with the final plan details.",
    },
    {
      q: "Is DateMeUp free?",
      a: "Yes! DateMeUp is free to use for individuals and groups. We plan to offer optional premium features in the future (e.g. advanced activity filters, calendar integration) but the core collaborative planning experience will always be free.",
    },
    {
      q: "What platforms does DateMeUp support?",
      a: "The DateMeUp app is available on iOS (iPhone and iPad) and Android. There is also a full-featured web app at datemeup.app that works on any modern browser — Chrome, Firefox, Safari, and Edge are all supported. Your groups and proposals sync across all your devices in real time.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <Link to="/" className="legal-page__back">← Back to home</Link>
        <h1>Support</h1>
        <p className="legal-page__lead">
          Need help? We&rsquo;re here for you.
        </p>

        <div className="support-contact">
          <div className="support-contact__card">
            <div className="support-contact__icon">✉️</div>
            <h2>Email support</h2>
            <p>
              Our support team typically responds within 1 business day.
            </p>
            <a
              href="mailto:support@datemeup.app"
              className="support-contact__btn"
            >
              support@datemeup.app
            </a>
          </div>
        </div>

        <h2>Frequently asked questions</h2>
        <div className="support-faq">
          {faqs.map((faq, i) => (
            <div key={i} className="support-faq__item">
              <button
                type="button"
                className="support-faq__q"
                aria-expanded={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                {faq.q}
                <span aria-hidden="true" style={{ fontSize: 20, color: "var(--accent)", fontWeight: 400, flexShrink: 0 }}>
                  {openIndex === i ? "−" : "+"}
                </span>
              </button>
              {openIndex === i && (
                <p className="support-faq__a">{faq.a}</p>
              )}
            </div>
          ))}
        </div>

        <div className="support-legal-links">
          <p>Looking for our policies?</p>
          <div className="legal-page__footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
