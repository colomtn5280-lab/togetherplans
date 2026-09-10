import { Resend } from 'resend';
import { logger } from '@/services/logger';

const FROM_ADDRESS = 'DateNight <hello@togetherplans.app>';
const APP_URL = process.env.APP_URL || 'https://togetherplans.app';

let resend: Resend | null = null;

function getClient(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    logger.warn('RESEND_API_KEY not set — email sending disabled');
    return null;
  }
  resend = new Resend(key);
  return resend;
}

// ─── Shared Layout Helpers ────────────────────────────────────────────────────

function preheader(text: string): string {
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    <span style="display:inline-block;width:0;height:1px;overflow:hidden;opacity:0;">${text}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>
  </div>`;
}

const HEADER_HTML = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="background:linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%);">
    <tr>
      <td align="center" style="padding:32px 24px 28px;">
        <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          🌙 DateNight
        </div>
        <div style="font-size:13px;color:#ddd6fe;margin-top:4px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:0.3px;">
          Plan together. Date better.
        </div>
      </td>
    </tr>
  </table>`;

const FOOTER_HTML = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="background:#f8f7ff;border-top:1px solid #ede9fe;">
    <tr>
      <td align="center" style="padding:24px 24px 28px;">
        <p style="font-size:12px;color:#9ca3af;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0 0 8px;line-height:1.6;">
          &copy; ${new Date().getFullYear()} DateNight &mdash; togetherplans.app
        </p>
        <p style="font-size:12px;color:#9ca3af;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0 0 8px;line-height:1.6;">
          <a href="https://togetherplans.app/privacy" style="color:#7c3aed;text-decoration:none;">Privacy Policy</a>
          &nbsp;&middot;&nbsp;
          <a href="https://togetherplans.app/terms" style="color:#7c3aed;text-decoration:none;">Terms of Service</a>
        </p>
        <p style="font-size:11px;color:#d1d5db;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0;">
          You can <a href="https://togetherplans.app/unsubscribe" style="color:#d1d5db;">unsubscribe</a> from these emails at any time.
        </p>
      </td>
    </tr>
  </table>`;

function ctaButton(label: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:28px auto 0;">
    <tr>
      <td align="center" style="border-radius:8px;background:#FF4081;">
        <a href="${href}" target="_blank"
          style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:#ffffff;
            text-decoration:none;border-radius:8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
            letter-spacing:0.2px;mso-padding-alt:0;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function wrapEmail(preheaderHtml: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>DateNight</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f3f4f6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${preheaderHtml}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="background:#f3f4f6;min-width:320px;">
    <tr>
      <td align="center" style="padding:32px 16px 40px;">
        <!-- Email card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
          style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;
            box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr><td>${HEADER_HTML}</td></tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px 32px 36px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr><td>${FOOTER_HTML}</td></tr>
        </table>
        <!-- Mobile hint -->
        <p style="font-size:11px;color:#d1d5db;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
          margin:16px 0 0;text-align:center;">
          If this email looks odd, <a href="${APP_URL}" style="color:#7c3aed;">view it in your browser</a>.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  const safePreheader = preheader('You just joined the easiest way to plan dates and group activities together.');

  const body = `
    <h1 style="font-size:26px;font-weight:800;color:#1a1a2e;margin:0 0 16px;line-height:1.3;">
      Welcome, ${escapeHtml(name)}! 🎉
    </h1>
    <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 12px;">
      You just joined <strong style="color:#7c3aed;">DateNight</strong> — the easiest way to
      propose, vote on, and lock in dates and group activities without the endless back-and-forth.
      No more "I don't know, what do you want to do?"
    </p>
    <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 28px;">
      Here's how it works:
    </p>

    <!-- Feature rows -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
      style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background:#faf5ff;border-radius:8px;margin-bottom:8px;border-left:3px solid #7c3aed;">
          <span style="font-size:22px;vertical-align:middle;">📅</span>
          <span style="font-size:15px;color:#374151;font-weight:600;margin-left:10px;vertical-align:middle;">
            Propose activities together
          </span>
          <p style="font-size:14px;color:#6b7280;margin:6px 0 0 32px;line-height:1.5;">
            You and your group all add ideas to a shared list.
          </p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#fff7f9;border-radius:8px;margin-bottom:8px;border-left:3px solid #FF4081;">
          <span style="font-size:22px;vertical-align:middle;">🗳️</span>
          <span style="font-size:15px;color:#374151;font-weight:600;margin-left:10px;vertical-align:middle;">
            Everyone votes
          </span>
          <p style="font-size:14px;color:#6b7280;margin:6px 0 0 32px;line-height:1.5;">
            Swipe or tap to rank what sounds good — fast and fun.
          </p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#f0fdf4;border-radius:8px;border-left:3px solid #10b981;">
          <span style="font-size:22px;vertical-align:middle;">🔒</span>
          <span style="font-size:15px;color:#374151;font-weight:600;margin-left:10px;vertical-align:middle;">
            Lock in the plan
          </span>
          <p style="font-size:14px;color:#6b7280;margin:6px 0 0 32px;line-height:1.5;">
            The top pick wins. Date night sorted — everyone's happy.
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton('Open DateNight', APP_URL)}

    <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:28px 0 0;text-align:center;">
      Ready to start? Invite your partner or friends from the app and plan your first date night together. 💜
    </p>`;

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Welcome to DateNight! Let's plan something amazing 🎉",
      html: wrapEmail(safePreheader, body),
    });
    logger.info('Welcome email sent', { to });
  } catch (err) {
    logger.error('Failed to send welcome email', { to, err });
    // Non-fatal — don't throw, registration already succeeded
  }
}

// ─── Invitation Email ─────────────────────────────────────────────────────────

export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  groupName: string,
  inviteToken: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;

  const acceptUrl = `${APP_URL}/invite/${inviteToken}`;
  const safeInviter = escapeHtml(inviterName);
  const safeGroup = escapeHtml(groupName);

  const safePreheader = preheader("You've been invited to plan something together.");

  const body = `
    <h1 style="font-size:26px;font-weight:800;color:#1a1a2e;margin:0 0 8px;line-height:1.3;">
      You're invited! 🗓️
    </h1>
    <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 16px;">
      <strong style="color:#7c3aed;">${safeInviter}</strong> has invited you to join
      <strong style="color:#1a1a2e;">${safeGroup}</strong> on DateNight.
    </p>
    <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 8px;">
      DateNight makes it easy for couples and groups to propose activities, vote on favorites,
      and lock in plans — all without the back-and-forth.
    </p>

    ${ctaButton('Accept Invitation', acceptUrl)}

    <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:20px 0 0;text-align:center;">
      Or copy this link into your browser:<br>
      <a href="${acceptUrl}" style="color:#7c3aed;word-break:break-all;font-size:12px;">${acceptUrl}</a>
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
      style="margin-top:28px;border-top:1px solid #f3f4f6;">
      <tr>
        <td style="padding-top:20px;">
          <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0 0 6px;">
            ⏰ <strong>This invitation expires in 72 hours.</strong>
          </p>
          <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
            If you weren't expecting this invitation, you can safely ignore this email — no account will be created.
          </p>
        </td>
      </tr>
    </table>`;

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${inviterName} invited you to DateNight 🗓️`,
      html: wrapEmail(safePreheader, body),
    });
    logger.info('Invitation email sent', { to, inviteToken });
  } catch (err) {
    logger.error('Failed to send invitation email', { to, err });
    // Non-fatal — invitation record already created
  }
}

// ─── Password Reset Email ─────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  const safePreheader = preheader('Click the link to reset your password. Expires in 1 hour.');

  const body = `
    <h1 style="font-size:26px;font-weight:800;color:#1a1a2e;margin:0 0 16px;line-height:1.3;">
      Reset your password 🔑
    </h1>
    <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 16px;">
      We received a request to reset the password for your DateNight account. Click the button
      below to choose a new password.
    </p>

    ${ctaButton('Reset Password', resetUrl)}

    <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:20px 0 0;text-align:center;">
      Or copy this link into your browser:<br>
      <a href="${resetUrl}" style="color:#7c3aed;word-break:break-all;font-size:12px;">${resetUrl}</a>
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
      style="margin-top:28px;border-top:1px solid #f3f4f6;">
      <tr>
        <td style="padding-top:20px;">
          <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0 0 6px;">
            ⏰ <strong>This link expires in 1 hour</strong> for your security.
          </p>
          <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
            🔒 If you did not request a password reset, you can safely ignore this email — your
            password will remain unchanged and your account is secure.
          </p>
        </td>
      </tr>
    </table>`;

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: 'Reset your DateNight password',
      html: wrapEmail(safePreheader, body),
    });
    logger.info('Password reset email sent', { to });
  } catch (err) {
    logger.error('Failed to send password reset email', { to, err });
    // Non-fatal — let the caller surface a generic error
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
