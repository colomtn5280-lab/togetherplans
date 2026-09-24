-- Guest voting via share link + lazily generated share tokens on proposals

-- Add nullable unique shareToken to Proposal
ALTER TABLE "Proposal" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "Proposal_shareToken_key" ON "Proposal"("shareToken");

-- GuestVote table
CREATE TABLE "GuestVote" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "guestName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestVote_proposalId_guestId_key" ON "GuestVote"("proposalId", "guestId");
CREATE INDEX "GuestVote_optionId_idx" ON "GuestVote"("optionId");

ALTER TABLE "GuestVote" ADD CONSTRAINT "GuestVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestVote" ADD CONSTRAINT "GuestVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
