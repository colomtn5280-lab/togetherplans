-- CreateTable: InviteCard
CREATE TABLE "InviteCard" (
    "id"           TEXT NOT NULL,
    "proposalId"   TEXT NOT NULL,
    "templateId"   TEXT NOT NULL,
    "mode"         TEXT NOT NULL DEFAULT 'vote',
    "note"         TEXT,
    "photoUrl"     TEXT,
    "renderedPng"  TEXT,
    "renderedPdf"  TEXT,
    "skipped"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteCard_proposalId_key" ON "InviteCard"("proposalId");
CREATE INDEX "InviteCard_proposalId_idx" ON "InviteCard"("proposalId");

-- AddForeignKey
ALTER TABLE "InviteCard" ADD CONSTRAINT "InviteCard_proposalId_fkey"
    FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
