-- AlterTable: add winnerId to Proposal (nullable, no FK — stores winning Option id)
ALTER TABLE "Proposal" ADD COLUMN "winnerId" TEXT;
