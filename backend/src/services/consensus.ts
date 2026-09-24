/**
 * Consensus evaluation — the single source of truth for deciding a proposal.
 *
 * Rule: ALL group members have voted AND one option has a strict majority
 * (votes > memberCount / 2). Single-member groups never auto-decide.
 *
 * Used by:
 *  - POST /api/proposals/:id/vote        (member votes)
 *  - POST /api/auth/claim-guest-votes    (guest→member vote conversion)
 *  - POST /api/invitations/accept/:token (conversion at group join)
 */

import { prisma } from '@/services/db';
import { sendItsAMatchEmail } from '@/services/email';

export interface ConsensusResult {
  decided: boolean;
  winnerId?: string;
  voteCount: number;
  memberCount: number;
}

/**
 * Re-evaluate consensus for a proposal after votes changed.
 * If consensus is reached, marks the proposal DECIDED and emails all members.
 */
export async function checkProposalConsensus(proposalId: string): Promise<ConsensusResult> {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal || proposal.status !== 'OPEN') {
    return { decided: false, voteCount: 0, memberCount: 0 };
  }

  const memberCount = await prisma.groupMember.count({ where: { groupId: proposal.groupId } });
  const allOptions = await prisma.option.findMany({
    where: { proposalId },
    include: { votes: true },
  });
  // Count distinct voters across all options on this proposal
  const distinctVoters = await prisma.vote.groupBy({
    by: ['userId'],
    where: { option: { proposalId } },
  });
  const allVoted = distinctVoters.length >= memberCount;
  const winner = allOptions.find((o) => o.votes.length > memberCount / 2);
  let decided = false;

  // Require at least 2 members to trigger consensus — single-member groups stay OPEN
  if (memberCount >= 2 && allVoted && winner) {
    await prisma.proposal.update({ where: { id: proposalId }, data: { status: 'DECIDED' } });
    decided = true;
    // Notify all group members of the match
    const matchMembers = await prisma.groupMember.findMany({
      where: { groupId: proposal.groupId },
      include: { user: { select: { email: true } } },
    });
    for (const m of matchMembers) {
      if (m.user.email) {
        void sendItsAMatchEmail(m.user.email, m.user.email, proposalId, proposal.title);
      }
    }
  }

  return { decided, winnerId: winner?.id, voteCount: winner ? winner.votes.length : 0, memberCount };
}
