/**
 * Guest-to-member vote carryover.
 *
 * A guest who voted via a /vote/<token> share link and then signs up should
 * not lose their vote. For every GuestVote by that guestId:
 *  - proposal in a group the user IS a member of → convert to a real Vote
 *    (unless the user already has a member vote on that proposal, in which
 *    case the member vote wins and the guest vote is simply dropped),
 *    then delete the GuestVote.
 *  - proposal in a group the user is NOT a member of → left alone ("pending");
 *    conversion for those happens when the user joins that group
 *    (invitation-accept flow calls this same function).
 *
 * Converted votes count exactly like normal votes — after conversion we
 * re-run the shared consensus check so a converted vote can complete a match.
 */

import { prisma } from '@/services/db';
import { checkProposalConsensus } from '@/services/consensus';
import { logger } from '@/services/logger';

export interface ClaimResult {
  converted: number;
  pending: number;
}

export async function claimGuestVotes(userId: string, guestId: string): Promise<ClaimResult> {
  const guestVotes = await prisma.guestVote.findMany({
    where: { guestId },
    include: { proposal: { select: { id: true, groupId: true, status: true } } },
  });
  if (guestVotes.length === 0) return { converted: 0, pending: 0 };

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  const memberGroupIds = new Set(memberships.map((m) => m.groupId));

  let converted = 0;
  let pending = 0;
  const proposalsToRecheck = new Set<string>();

  for (const gv of guestVotes) {
    if (!memberGroupIds.has(gv.proposal.groupId)) {
      pending++;
      continue; // leave for conversion at group join
    }

    // Does the user already have a member vote on this proposal?
    const existingVote = await prisma.vote.findFirst({
      where: { userId, option: { proposalId: gv.proposalId } },
    });

    if (!existingVote && gv.proposal.status === 'OPEN') {
      await prisma.vote.create({ data: { optionId: gv.optionId, userId } });
      proposalsToRecheck.add(gv.proposalId);
    }
    // Either way the guest vote is resolved: member identity supersedes it
    await prisma.guestVote.delete({ where: { id: gv.id } });
    converted++;
  }

  // Converted votes must count exactly like normal votes — including
  // consensus / match triggering. Reuse the shared consensus path.
  for (const proposalId of proposalsToRecheck) {
    try {
      await checkProposalConsensus(proposalId);
    } catch (err) {
      logger.error('Consensus re-check failed after guest vote conversion', { proposalId, err });
    }
  }

  return { converted, pending };
}
