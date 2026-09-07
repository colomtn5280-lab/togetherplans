-- AlterTable: make passwordHash optional, add OAuth fields
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "User" ADD COLUMN "provider" TEXT;
ALTER TABLE "User" ADD COLUMN "providerId" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- CreateIndex: unique constraint on (provider, providerId)
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");
