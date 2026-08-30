import { Router, Request, Response } from 'express';

export const legalRouter = Router();

const EFFECTIVE_DATE = 'September 1, 2026';
const CONTACT_EMAIL = 'hello@togetherplans.app';
const APP_NAME = 'DateNight';
const COMPANY = 'TogetherPlans';
const DOMAIN = 'togetherplans.app';

// GET /privacy
legalRouter.get('/privacy', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy — ${APP_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           max-width: 760px; margin: 0 auto; padding: 40px 24px;
           color: #1a1a1a; line-height: 1.7; }
    h1 { font-size: 32px; color: #FF4081; margin-bottom: 4px; }
    h2 { font-size: 20px; margin-top: 36px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    p, li { font-size: 16px; color: #333; }
    a { color: #FF4081; }
    .meta { color: #888; font-size: 14px; margin-bottom: 32px; }
  </style>
</head>
<body>
  <h1>${APP_NAME} Privacy Policy</h1>
  <p class="meta">Effective Date: ${EFFECTIVE_DATE} &nbsp;|&nbsp; Last Updated: ${EFFECTIVE_DATE}</p>

  <p>${COMPANY} ("we," "us," or "our") operates the ${APP_NAME} mobile application and website
  at ${DOMAIN} (the "Service"). This Privacy Policy explains how we collect, use, disclose,
  and protect your information when you use our Service.</p>

  <h2>1. Information We Collect</h2>
  <p><strong>Account Information:</strong> When you register, we collect your email address,
  display name, and password (stored as a bcrypt hash — we never store plaintext passwords).</p>
  <p><strong>Location Data:</strong> If you choose to enable location-based suggestions, we collect
  your approximate latitude and longitude. This is optional and can be removed at any time.</p>
  <p><strong>Activity Data:</strong> We store groups you create or join, proposals, votes, and
  invitations you send or receive in order to provide the Service.</p>
  <p><strong>Usage Data:</strong> We collect server logs including IP address, request timestamps,
  and endpoint accessed for security and debugging purposes. Logs are retained for 30 days.</p>
  <p><strong>Device Information:</strong> We may collect device type and OS version for push
  notification delivery and crash diagnostics.</p>

  <h2>2. How We Use Your Information</h2>
  <ul>
    <li>To create and manage your account</li>
    <li>To facilitate group planning, proposals, and voting between users</li>
    <li>To send transactional emails (welcome, invitations, notifications)</li>
    <li>To provide location-based activity suggestions (only when enabled)</li>
    <li>To maintain the security and integrity of the Service</li>
    <li>To comply with legal obligations</li>
  </ul>
  <p>We do <strong>not</strong> sell your personal data. We do not use your data for advertising.</p>

  <h2>3. How We Share Your Information</h2>
  <p>We share your information only in the following limited circumstances:</p>
  <ul>
    <li><strong>Other users:</strong> Your display name is visible to members of groups you join.
    Your email is never visible to other users.</li>
    <li><strong>Service providers:</strong> We use Google Cloud Platform (hosting, database),
    Resend (transactional email), and Cloudflare (DNS, CDN). These providers process data
    only as necessary to deliver the Service.</li>
    <li><strong>Legal requirements:</strong> We may disclose data when required by law,
    court order, or to protect the rights and safety of users.</li>
  </ul>

  <h2>4. Data Retention &amp; Deletion</h2>
  <p>You may delete your account at any time via the app settings or by emailing
  <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
  <p>Upon account deletion:</p>
  <ul>
    <li>Your account is immediately soft-deleted and inaccessible</li>
    <li>All personal data is permanently and irreversibly deleted within <strong>30 days</strong>,
    in accordance with GDPR Article 17 (Right to Erasure) and CCPA</li>
    <li>Anonymized aggregate data (e.g. vote counts without user identifiers) may be retained</li>
  </ul>

  <h2>5. Your Rights</h2>
  <p>Depending on your location, you may have the following rights:</p>
  <ul>
    <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
    <li><strong>Correction:</strong> Request correction of inaccurate data</li>
    <li><strong>Deletion:</strong> Request deletion of your personal data (Right to Erasure)</li>
    <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
    <li><strong>Objection:</strong> Object to certain processing of your data</li>
  </ul>
  <p>To exercise any of these rights, contact us at
  <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. We will respond within 30 days.</p>

  <h2>6. Security</h2>
  <p>We implement industry-standard security measures including:</p>
  <ul>
    <li>TLS encryption for all data in transit</li>
    <li>Encryption at rest for database storage</li>
    <li>bcrypt password hashing (cost factor 12)</li>
    <li>Rate limiting and brute-force protection</li>
    <li>JWT-based authentication with expiry</li>
  </ul>

  <h2>7. Children's Privacy</h2>
  <p>The Service is not directed to individuals under the age of 13. We do not knowingly collect
  personal information from children under 13. If you believe a child has provided us information,
  contact us immediately at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>

  <h2>8. International Users</h2>
  <p>The Service is hosted in the United States (Google Cloud us-central1). If you access the
  Service from outside the US, your data is transferred to and processed in the US. By using
  the Service, you consent to this transfer. We comply with GDPR for users in the EEA and
  UK, and CCPA for California residents.</p>

  <h2>9. Changes to This Policy</h2>
  <p>We may update this Privacy Policy from time to time. We will notify you of material changes
  by email or via an in-app notice at least 7 days before the change takes effect. Continued
  use of the Service after changes constitutes acceptance.</p>

  <h2>10. Contact Us</h2>
  <p>For privacy questions or to exercise your rights:<br/>
  Email: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a><br/>
  Website: <a href="https://${DOMAIN}">https://${DOMAIN}</a></p>
</body>
</html>`);
});

// GET /terms
legalRouter.get('/terms', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Terms of Service — ${APP_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           max-width: 760px; margin: 0 auto; padding: 40px 24px;
           color: #1a1a1a; line-height: 1.7; }
    h1 { font-size: 32px; color: #FF4081; margin-bottom: 4px; }
    h2 { font-size: 20px; margin-top: 36px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    p, li { font-size: 16px; color: #333; }
    a { color: #FF4081; }
    .meta { color: #888; font-size: 14px; margin-bottom: 32px; }
  </style>
</head>
<body>
  <h1>${APP_NAME} Terms of Service</h1>
  <p class="meta">Effective Date: ${EFFECTIVE_DATE} &nbsp;|&nbsp; Last Updated: ${EFFECTIVE_DATE}</p>

  <p>Welcome to ${APP_NAME}, operated by ${COMPANY} ("we," "us," "our"). By downloading,
  accessing, or using our mobile application or website at ${DOMAIN} (the "Service"), you
  agree to be bound by these Terms of Service ("Terms"). Please read them carefully.</p>

  <h2>1. Acceptance of Terms</h2>
  <p>By creating an account or using the Service, you confirm that you are at least 13 years
  of age, have read and understood these Terms, and agree to be legally bound by them. If you
  do not agree, do not use the Service.</p>

  <h2>2. Description of Service</h2>
  <p>${APP_NAME} is a collaborative planning application that allows users to create groups,
  propose date and activity ideas, invite others, vote on proposals, and reach group consensus
  on plans. The Service may include location-based activity suggestions powered by third-party
  APIs.</p>

  <h2>3. User Accounts</h2>
  <ul>
    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
    <li>You are responsible for all activity that occurs under your account</li>
    <li>You must provide accurate and complete registration information</li>
    <li>You may not create accounts for others without their consent</li>
    <li>You may not transfer your account to another person</li>
    <li>Notify us immediately at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
    if you suspect unauthorized access to your account</li>
  </ul>

  <h2>4. Acceptable Use</h2>
  <p>You agree not to:</p>
  <ul>
    <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
    <li>Harass, threaten, or harm other users</li>
    <li>Post or transmit spam, unsolicited messages, or commercial solicitations</li>
    <li>Attempt to gain unauthorized access to other accounts or systems</li>
    <li>Scrape, crawl, or data-mine the Service without written permission</li>
    <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
    <li>Upload or transmit viruses or malicious code</li>
    <li>Impersonate another user or person</li>
  </ul>
  <p>We reserve the right to suspend or terminate accounts that violate these rules.</p>

  <h2>5. User Content</h2>
  <p>You retain ownership of any content you submit to the Service (group names, proposals,
  etc.). By submitting content, you grant ${COMPANY} a non-exclusive, worldwide, royalty-free
  license to use, store, and display that content solely to operate and improve the Service.</p>
  <p>You are solely responsible for content you submit. We do not endorse user-generated content.</p>

  <h2>6. Third-Party Services</h2>
  <p>The Service integrates with third-party APIs including Google Maps, Yelp, and others for
  activity suggestions. Use of those services is subject to their respective terms and privacy
  policies. We are not responsible for third-party content or availability.</p>

  <h2>7. Intellectual Property</h2>
  <p>All software, design, trademarks, logos, and content of the Service (excluding user
  content) are owned by ${COMPANY} or its licensors. Nothing in these Terms grants you
  a right to use our trademarks or branding without written permission.</p>

  <h2>8. Disclaimers</h2>
  <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
  FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL
  BE UNINTERRUPTED, ERROR-FREE, OR SECURE.</p>

  <h2>9. Limitation of Liability</h2>
  <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${COMPANY.toUpperCase()} SHALL NOT BE LIABLE
  FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF
  OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
  OUR TOTAL LIABILITY SHALL NOT EXCEED $100 USD OR THE AMOUNT YOU PAID US IN THE PAST
  12 MONTHS, WHICHEVER IS GREATER.</p>

  <h2>10. Indemnification</h2>
  <p>You agree to indemnify and hold harmless ${COMPANY} and its officers, directors,
  employees, and agents from any claims, damages, or expenses (including reasonable attorney's
  fees) arising from your use of the Service or violation of these Terms.</p>

  <h2>11. Termination</h2>
  <p>You may terminate your account at any time through the app. We may suspend or terminate
  your access for violations of these Terms, with or without notice. Upon termination, your
  right to use the Service ceases immediately. Sections 5, 7, 8, 9, 10, and 13 survive
  termination.</p>

  <h2>12. Changes to Terms</h2>
  <p>We may modify these Terms at any time. We will provide at least 7 days notice via email
  or in-app notification before material changes take effect. Continued use after the effective
  date constitutes acceptance of the updated Terms.</p>

  <h2>13. Governing Law &amp; Disputes</h2>
  <p>These Terms are governed by the laws of the State of Colorado, USA, without regard to
  conflict of law principles. Any disputes shall be resolved by binding arbitration in Denver,
  Colorado, except that either party may seek injunctive relief in court for intellectual
  property violations.</p>

  <h2>14. Contact Us</h2>
  <p>Questions about these Terms:<br/>
  Email: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a><br/>
  Website: <a href="https://${DOMAIN}">https://${DOMAIN}</a></p>
</body>
</html>`);
});
