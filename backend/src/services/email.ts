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

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: 'Welcome to DateNight!',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px;">
          <h1 style="font-size:28px;color:#1a1a1a;margin-bottom:8px;">Welcome, ${name}! 🎉</h1>
          <p style="font-size:16px;color:#444;line-height:1.6;">
            Thanks for joining <strong>DateNight</strong> — the easiest way to plan dates and
            group activities without the endless back-and-forth.
          </p>
          <p style="font-size:16px;color:#444;line-height:1.6;">
            Get started by creating a group and inviting your partner or friends.
          </p>
          <a href="${APP_URL}" style="display:inline-block;margin-top:24px;padding:14px 28px;
            background:#FF4081;color:#fff;border-radius:8px;text-decoration:none;
            font-size:16px;font-weight:600;">
            Open DateNight
          </a>
          <p style="font-size:13px;color:#999;margin-top:32px;">
            You're receiving this because you created an account at togetherplans.app.
          </p>
        </div>
      `,
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

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${inviterName} invited you to join ${groupName} on DateNight`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px;">
          <h1 style="font-size:26px;color:#1a1a1a;margin-bottom:8px;">You're invited! 🗓️</h1>
          <p style="font-size:16px;color:#444;line-height:1.6;">
            <strong>${inviterName}</strong> has invited you to join
            <strong>${groupName}</strong> on DateNight — a collaborative planning app
            for dates and group activities.
          </p>
          <p style="font-size:16px;color:#444;line-height:1.6;">
            Click below to accept the invitation and join the group.
          </p>
          <a href="${acceptUrl}" style="display:inline-block;margin-top:24px;padding:14px 28px;
            background:#FF4081;color:#fff;border-radius:8px;text-decoration:none;
            font-size:16px;font-weight:600;">
            Accept Invitation
          </a>
          <p style="font-size:13px;color:#999;margin-top:24px;">
            Or copy this link: ${acceptUrl}
          </p>
          <p style="font-size:13px;color:#999;margin-top:16px;">
            This invitation expires in 72 hours. If you didn't expect this, you can ignore it.
          </p>
        </div>
      `,
    });
    logger.info('Invitation email sent', { to, inviteToken });
  } catch (err) {
    logger.error('Failed to send invitation email', { to, err });
    // Non-fatal — invitation record already created
  }
}
