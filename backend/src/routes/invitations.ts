import { Router, Response } from 'express';
import { prisma } from '@/services/db';
import { requireAuth, AuthRequest } from '@/middleware/auth';
import { sendInvitationEmail } from '@/services/email';

export const invitationsRouter = Router();

const METHODS = ['LINK', 'EMAIL', 'SMS', 'QR', 'USERNAME'] as const;
type Method = (typeof METHODS)[number];

const INVITE_TTL_HOURS = 72;

invitationsRouter.use(requireAuth);

// POST /api/invitations — create an invitation to a group
invitationsRouter.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { groupId, method, target } = req.body || {};
    if (!groupId) return res.status(400).json({ error: 'groupId is required' });
    if (!method || !METHODS.includes(method as Method)) {
      return res.status(400).json({ error: `method must be one of ${METHODS.join(', ')}` });
    }
    if (['EMAIL', 'SMS', 'USERNAME'].includes(method) && !target) {
      return res.status(400).json({ error: `target is required for method ${method}` });
    }
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.userId },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const invitation = await prisma.invitation.create({
      data: {
        groupId,
        inviterId: req.userId as string,
        method: method as Method,
        target: target || null,
        expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 3600 * 1000),
      },
    });
    // If method is EMAIL and target is provided, send the invitation email
    if (method === 'EMAIL' && target) {
      const [inviter, group] = await Promise.all([
        prisma.user.findUnique({ where: { id: req.userId as string } }),
        prisma.group.findUnique({ where: { id: groupId } }),
      ]);
      if (inviter && group) {
        sendInvitationEmail(target, inviter.displayName, group.name, invitation.token).catch(() => {});
      }
    }
    return res.status(201).json({
      ...invitation,
      inviteUrl: `/api/invitations/accept/${invitation.token}`,
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/invitations/accept/:token — accept an invitation
invitationsRouter.post('/accept/:token', async (req: AuthRequest, res: Response, next) => {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token: req.params.token },
    });
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
    if (invitation.status !== 'PENDING') {
      return res.status(409).json({ error: `Invitation already ${invitation.status.toLowerCase()}` });
    }
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(410).json({ error: 'Invitation expired' });
    }
    const existing = await prisma.groupMember.findFirst({
      where: { groupId: invitation.groupId, userId: req.userId },
    });
    if (existing) return res.status(409).json({ error: 'Already a member of this group' });

    const [member] = await prisma.$transaction([
      prisma.groupMember.create({
        data: { groupId: invitation.groupId, userId: req.userId as string },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);
    return res.status(201).json(member);
  } catch (err) {
    return next(err);
  }
});
