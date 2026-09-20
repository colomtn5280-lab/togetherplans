import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';
import { logger } from '@/services/logger';

const FROM_ADDRESS = 'TogetherPlans <hello@togetherplans.app>';

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

// ─── Load templates at module load ───────────────────────────────────────────

const t01 = fs.readFileSync(path.join(__dirname, '../emails/01-verify-email.html'), 'utf-8');
const t02 = fs.readFileSync(path.join(__dirname, '../emails/02-welcome.html'), 'utf-8');
const t03 = fs.readFileSync(path.join(__dirname, '../emails/03-reset-password.html'), 'utf-8');
const t04 = fs.readFileSync(path.join(__dirname, '../emails/04-group-invite.html'), 'utf-8');
const t05 = fs.readFileSync(path.join(__dirname, '../emails/05-new-proposal.html'), 'utf-8');
const t06 = fs.readFileSync(path.join(__dirname, '../emails/06-status-update.html'), 'utf-8');
const t07 = fs.readFileSync(path.join(__dirname, '../emails/07-reminder-24h.html'), 'utf-8');
const t08 = fs.readFileSync(path.join(__dirname, '../emails/08-its-a-match.html'), 'utf-8');
const t09 = fs.readFileSync(path.join(__dirname, '../emails/09-take-2.html'), 'utf-8');
const t10 = fs.readFileSync(path.join(__dirname, '../emails/10-plan-changed.html'), 'utf-8');
const t11 = fs.readFileSync(path.join(__dirname, '../emails/11-share-card-received.html'), 'utf-8');
const t12 = fs.readFileSync(path.join(__dirname, '../emails/12-account-deleted.html'), 'utf-8');

// ─── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function renderTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{([a-z_]+)\}\}/g, (_match, key) => {
    const val = vars[key];
    return val !== undefined ? escapeHtml(val) : '';
  });
}

// ─── 01: Verify Email ─────────────────────────────────────────────────────────

export async function sendVerifyEmail(
  to: string,
  firstName: string,
  email: string,
  token: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t01, { first_name: firstName, email, token });
  try {
    await client.emails.send({ from: FROM_ADDRESS, to, subject: 'Confirm your email', html });
    logger.info('Verify email sent', { to });
  } catch (err) {
    logger.error('Failed to send verify email', { to, err });
  }
}

// ─── 02: Welcome ──────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, email: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t02, { email });
  try {
    await client.emails.send({ from: FROM_ADDRESS, to, subject: 'Welcome. Now invite one person.', html });
    logger.info('Welcome email sent', { to });
  } catch (err) {
    logger.error('Failed to send welcome email', { to, err });
  }
}

// ─── 03: Password Reset ───────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string,
  email: string,
  token: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t03, { email, token });
  try {
    await client.emails.send({ from: FROM_ADDRESS, to, subject: 'Reset your password', html });
    logger.info('Password reset email sent', { to });
  } catch (err) {
    logger.error('Failed to send password reset email', { to, err });
  }
}

// ─── 04: Group Invite ─────────────────────────────────────────────────────────

export async function sendGroupInviteEmail(
  to: string,
  inviter: string,
  groupName: string,
  token: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t04, { inviter, group_name: groupName, token });
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${inviter} invited you to ${groupName}`,
      html,
    });
    logger.info('Group invite email sent', { to });
  } catch (err) {
    logger.error('Failed to send group invite email', { to, err });
  }
}

// ─── 05: New Proposal ─────────────────────────────────────────────────────────

export async function sendNewProposalEmail(
  to: string,
  proposer: string,
  proposalTitle: string,
  proposalId: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t05, { proposer, proposal_title: proposalTitle, proposal_id: proposalId });
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${proposer} proposed for ${proposalTitle}`,
      html,
    });
    logger.info('New proposal email sent', { to });
  } catch (err) {
    logger.error('Failed to send new proposal email', { to, err });
  }
}

// ─── 06: Status Update ────────────────────────────────────────────────────────

export async function sendStatusUpdateEmail(
  to: string,
  voterName: string,
  proposalId: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t06, { proposer: voterName, proposal_id: proposalId });
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${voterName} voted`,
      html,
    });
    logger.info('Status update email sent', { to });
  } catch (err) {
    logger.error('Failed to send status update email', { to, err });
  }
}

// ─── 07: Vote Reminder ────────────────────────────────────────────────────────

export async function sendVoteReminderEmail(
  to: string,
  email: string,
  proposalId: string,
  proposalTitle: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t07, { email, proposal_id: proposalId, proposal_title: proposalTitle });
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${proposalTitle} needs your vote`,
      html,
    });
    logger.info('Vote reminder email sent', { to });
  } catch (err) {
    logger.error('Failed to send vote reminder email', { to, err });
  }
}

// ─── 08: It's a Match ────────────────────────────────────────────────────────

export async function sendItsAMatchEmail(
  to: string,
  email: string,
  proposalId: string,
  proposalTitle: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t08, { email, proposal_id: proposalId, proposal_title: proposalTitle });
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `It's a match: ${proposalTitle}`,
      html,
    });
    logger.info("It's a match email sent", { to });
  } catch (err) {
    logger.error("Failed to send it's a match email", { to, err });
  }
}

// ─── 09: Take 2 ───────────────────────────────────────────────────────────────

export async function sendTake2Email(
  to: string,
  email: string,
  proposalId: string,
  proposalTitle: string,
  proposerName: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t09, {
    email,
    proposal_id: proposalId,
    proposal_title: proposalTitle,
    proposer: proposerName,
  });
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `No match on ${proposalTitle}. ${proposerName} sent take 2`,
      html,
    });
    logger.info('Take 2 email sent', { to });
  } catch (err) {
    logger.error('Failed to send take 2 email', { to, err });
  }
}

// ─── 10: Plan Changed ────────────────────────────────────────────────────────

export async function sendPlanChangedEmail(
  to: string,
  email: string,
  proposalId: string,
  proposalTitle: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t10, { email, proposal_id: proposalId, proposal_title: proposalTitle });
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Change to ${proposalTitle}`,
      html,
    });
    logger.info('Plan changed email sent', { to });
  } catch (err) {
    logger.error('Failed to send plan changed email', { to, err });
  }
}

// ─── 11: Share Card ───────────────────────────────────────────────────────────

export async function sendShareCardEmail(
  to: string,
  email: string,
  proposalId: string,
  cardId: string,
  senderName: string,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const html = renderTemplate(t11, {
    email,
    proposal_id: proposalId,
    card_id: cardId,
    inviter: senderName,
  });
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${senderName} made it official`,
      html,
    });
    logger.info('Share card email sent', { to });
  } catch (err) {
    logger.error('Failed to send share card email', { to, err });
  }
}

// ─── 12: Account Deleted ─────────────────────────────────────────────────────

export async function sendAccountDeletedEmail(to: string, email: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  const date = new Date().toDateString();
  const html = renderTemplate(t12, { email, date });
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: 'Your TogetherPlans account is deleted',
      html,
    });
    logger.info('Account deleted email sent', { to });
  } catch (err) {
    logger.error('Failed to send account deleted email', { to, err });
  }
}
