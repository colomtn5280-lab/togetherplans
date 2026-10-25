/**
 * Invite Card Routes
 * POST /api/invite-cards/:proposalId        — create/update card selection
 * GET  /api/invite-cards/:proposalId        — get card for a proposal
 * POST /api/invite-cards/:proposalId/render — trigger PNG+PDF render
 * GET  /api/invite-cards/templates          — list all 36 templates
 * POST /api/invite-cards/:proposalId/photo  — upload user photo
 */

import { Router, Response } from 'express';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import { prisma } from '@/services/db';
import { requireAuth, AuthRequest } from '@/middleware/auth';
import { logger } from '@/services/logger';
import { getTemplateIndex, pickRandomTemplate, ALL_TEMPLATE_IDS } from './templates';
import { renderAfterDarkAndUpload } from './renderer';
import type { CardData } from './templates';
import type { AfterDarkCardData } from './renderer';

export const inviteCardsRouter = Router();
inviteCardsRouter.use(requireAuth);

const storage = new Storage();
const BUCKET = process.env.GCS_BUCKET || 'datemeup-business-assets';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/invite-cards/templates
inviteCardsRouter.get('/templates', (_req, res: Response) => {
  res.json(getTemplateIndex());
});

// GET /api/invite-cards/:proposalId
inviteCardsRouter.get('/:proposalId', async (req: AuthRequest, res: Response, next) => {
  try {
    const card = await prisma.inviteCard.findUnique({ where: { proposalId: req.params.proposalId } });
    if (!card) return res.status(404).json({ error: 'No invite card for this proposal' });
    return res.json(card);
  } catch (err) { return next(err); }
});

// POST /api/invite-cards/:proposalId — create or update
inviteCardsRouter.post('/:proposalId', async (req: AuthRequest, res: Response, next) => {
  try {
    const { proposalId } = req.params;
    const { templateId, skipped } = req.body as { templateId?: string; skipped?: boolean };

    // Verify proposer owns this proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { group: { include: { members: true } } },
    });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.creatorId !== req.userId) return res.status(403).json({ error: 'Only the proposer can set the invite card' });

    // Determine template — use provided, random on skip, or default
    const resolvedTemplateId = skipped
      ? pickRandomTemplate(proposalId)
      : templateId && ALL_TEMPLATE_IDS.includes(templateId)
        ? templateId
        : pickRandomTemplate(proposalId);

    const card = await prisma.inviteCard.upsert({
      where: { proposalId },
      create: {
        proposalId,
        templateId: resolvedTemplateId,
        skipped: skipped ?? false,
        mode: 'vote',
      },
      update: {
        templateId: resolvedTemplateId,
        skipped: skipped ?? false,
        renderedPng: null, // invalidate cached render on update
        renderedPdf: null,
      },
    });

    return res.status(201).json(card);
  } catch (err) { return next(err); }
});

// POST /api/invite-cards/:proposalId/photo — upload user photo
inviteCardsRouter.post('/:proposalId/photo', upload.single('photo'), async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { proposalId } = req.params;

    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.creatorId !== req.userId) return res.status(403).json({ error: 'Only the proposer can upload photos' });

    const ext = req.file.mimetype.split('/')[1] || 'jpg';
    const gcsPath = `invite-cards/${proposalId}/user-photo.${ext}`;
    const file = storage.bucket(BUCKET).file(gcsPath);
    await file.save(req.file.buffer, {
      contentType: req.file.mimetype,
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });
    // Do NOT call makePublic() — uniform bucket-level access blocks per-object ACLs.
    const photoUrl = `https://storage.googleapis.com/${BUCKET}/${gcsPath}`;

    // Update card record
    await prisma.inviteCard.updateMany({
      where: { proposalId },
      data: { photoUrl, renderedPng: null, renderedPdf: null },
    });

    return res.json({ photoUrl });
  } catch (err) { return next(err); }
});

// POST /api/invite-cards/:proposalId/render — render PNG + PDF
inviteCardsRouter.post('/:proposalId/render', async (req: AuthRequest, res: Response, next) => {
  try {
    const { proposalId } = req.params;

    const [card, proposal] = await Promise.all([
      prisma.inviteCard.findUnique({ where: { proposalId } }),
      prisma.proposal.findUnique({
        where: { id: proposalId },
        include: {
          group: { include: { members: { include: { user: { select: { displayName: true } } } } } },
          creator: { select: { displayName: true } },
          options: { include: { votes: true } },
        },
      }),
    ]);

    if (!card) return res.status(404).json({ error: 'No invite card configured' });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const mode = proposal.status === 'DECIDED' ? 'official' : 'vote';
    const options = proposal.options || [];
    const dateStr = proposal.dateTime
      ? new Date(proposal.dateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'TBD';

    // Derive member first names (for 4E Library card, max 4)
    const memberNames = proposal.group.members
      .map((m: any) => (m.user?.displayName || '').split(' ')[0])
      .filter(Boolean)
      .slice(0, 4);

    const optionCount = options.length;
    const votedUserIds = new Set(options.flatMap((o: any) => (o.votes || []).map((v: any) => v.userId)));
    const votedCount = votedUserIds.size;

    const data: CardData = {
      title: proposal.title,
      group: proposal.group.name,
      groupDisplayName: proposal.group.name,
      activity: options[0]?.name || proposal.title,
      address: (options[0] as { address?: string })?.address || '',
      date: dateStr,
      city: '', // not stored per proposal — leave blank
      photoUrl: card.photoUrl || undefined,
      initiatorName: proposal.creator.displayName || 'Your host',
      memberCount: proposal.group.members.length,
      memberNames,
      optionCount,
      votedCount,
      mode,
      kicker: mode === 'vote' ? 'IS IT A DATE?' : "IT'S ON.",
      cta: mode === 'vote' ? 'Vote now →' : '',
      ctaShort: mode === 'vote' ? 'Vote' : '',
      result: mode === 'vote'
        ? `${options.length} idea${options.length !== 1 ? 's' : ''} on the table`
        : 'You both said yes 💛',
      opt1: options[0]?.name,
      opt2: options[1]?.name,
      opt3: options[2]?.name,
    };

    // Check for After Dark options
    const afterDarkOption = options.find((o: any) =>
      (o.category || '').toLowerCase().includes('after dark') ||
      (o.sourceName || '').includes('after-dark')
    );

    let afterDarkData: AfterDarkCardData | undefined;
    if (afterDarkOption) {
      const senderFirstName = (proposal.creator.displayName || '').split(' ')[0] || 'You';
      const otherMember = proposal.group.members.find((m: any) => m.userId !== proposal.creatorId);
      const partnerFirstName = (otherMember?.user?.displayName || '').split(' ')[0] || 'Partner';
      afterDarkData = {
        senderFirstName,
        partnerFirstName,
        ideaName: afterDarkOption.name,
        ideaDescription: afterDarkOption.description || undefined,
        slotDay: proposal.dateTime
          ? new Date(proposal.dateTime).toLocaleDateString('en-US', { weekday: 'short' })
          : undefined,
        slotTime: proposal.dateTime
          ? new Date(proposal.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : undefined,
      };
    }

    const { pngUrl, pdfUrl, afterDarkPngUrl } = await renderAfterDarkAndUpload(
      proposalId,
      card.templateId,
      data,
      afterDarkData,
    );

    const updated = await prisma.inviteCard.update({
      where: { proposalId },
      data: { renderedPng: pngUrl, renderedPdf: pdfUrl, mode },
    });

    logger.info(`Invite card rendered: proposal=${proposalId} mode=${mode}${afterDarkPngUrl ? ' +afterDark' : ''}`);
    return res.json({ ...updated, afterDarkPngUrl });
  } catch (err) { return next(err); }
});
