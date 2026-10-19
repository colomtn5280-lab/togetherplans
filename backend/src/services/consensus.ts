/**
 * Consensus evaluation — the single source of truth for deciding a proposal.
 *
 * Rule (approval voting): ALL group members have approved at least one option AND
 * at least one option has been approved by ALL members. Single-member groups never auto-decide.
 *
 * Used by:
 *  - POST /api/proposals/:id/vote        (member votes)
 *  - POST /api/auth/claim-guest-votes    (guest→member vote conversion)
 *  - POST /api/invitations/accept/:token (conversion at group join)
 */

import { prisma } from '@/services/db';
import { sendItsAMatchEmail } from '@/services/email';
import { checkHoldoutAndNotify } from '@/services/notification-triggers';
import { logger } from '@/services/logger';

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
  // Approval voting (Option B): consensus fires when ALL members have voted
  // on at least one option AND at least one option has no REJECT votes from
  // any member AND every member either APPROVE or MAYBE'd it.
  const winner = allOptions.find((o) => {
    const approveOrMaybe = o.votes.filter((v) => v.sentiment !== 'REJECT').length;
    const rejected = o.votes.filter((v) => v.sentiment === 'REJECT').length;
    return approveOrMaybe >= memberCount && rejected === 0;
  });
  let decided = false;

  // Require at least 2 members to trigger consensus — single-member groups stay OPEN
  if (memberCount >= 2 && allVoted && winner) {
    await prisma.proposal.update({ where: { id: proposalId }, data: { status: 'DECIDED', winnerId: winner.id } });
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

  // "You're the holdout" nudge — exactly one member's vote still missing.
  // Fire-and-forget: never let a notification failure break the vote flow.
  // Covers both member votes and converted guest votes (all callers of this
  // function share this path).
  if (!decided) {
    void checkHoldoutAndNotify(proposalId).catch((err) =>
      logger.error('Holdout notification check failed', { proposalId, err }),
    );
  }

  return { decided, winnerId: winner?.id, voteCount: winner ? winner.votes.length : 0, memberCount };
}
