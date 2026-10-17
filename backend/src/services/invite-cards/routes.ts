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
import { renderAndUploadCard } from './renderer';
import type { CardData } from './templates';

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
    const { templateId, note, skipped } = req.body as { templateId?: string; note?: string; skipped?: boolean };

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
        note: note || null,
        skipped: skipped ?? false,
        mode: 'vote',
      },
      update: {
        templateId: resolvedTemplateId,
        note: note !== undefined ? note : undefined,
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
    await file.save(req.file.buffer, { contentType: req.file.mimetype, resumable: false });
    await file.makePublic();
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
          group: { include: { members: true } },
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

    const data: CardData = {
      title: proposal.title,
      group: proposal.group.name,
      activity: options[0]?.name || proposal.title,
      address: (options[0] as any)?.address || '',
      date: dateStr,
      note: card.note || undefined,
      photoUrl: card.photoUrl || undefined,
      initiatorName: proposal.creator.displayName || 'Your host',
      memberCount: proposal.group.members.length,
      mode,
      kicker: mode === 'vote' ? 'Is it a date?' : "It's on.",
      cta: mode === 'vote' ? 'Vote now' : 'See the plan',
      ctaShort: mode === 'vote' ? 'Vote' : 'Open',
      result: mode === 'vote'
        ? `${options.length} option${options.length !== 1 ? 's' : ''} to vote on`
        : 'You both said yes',
      opt1: options[0]?.name,
      opt2: options[1]?.name,
      opt3: options[2]?.name,
    };

    const { pngUrl, pdfUrl } = await renderAndUploadCard(proposalId, card.templateId, data);

    const updated = await prisma.inviteCard.update({
      where: { proposalId },
      data: { renderedPng: pngUrl, renderedPdf: pdfUrl, mode },
    });

    logger.info(`Invite card rendered: proposal=${proposalId} mode=${mode}`);
    return res.json(updated);
  } catch (err) { return next(err); }
});
