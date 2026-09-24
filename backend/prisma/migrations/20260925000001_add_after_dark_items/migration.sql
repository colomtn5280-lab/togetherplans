-- CreateTable for AfterDarkItem
CREATE TABLE IF NOT EXISTS "AfterDarkItem" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "description" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT NOT NULL,
    "createdBy" TEXT,
    "groupId" TEXT,
    "reportedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AfterDarkItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AfterDarkItem_groupId_idx" ON "AfterDarkItem"("groupId");
CREATE INDEX IF NOT EXISTS "AfterDarkItem_createdBy_idx" ON "AfterDarkItem"("createdBy");
CREATE INDEX IF NOT EXISTS "AfterDarkItem_tier_idx" ON "AfterDarkItem"("tier");
CREATE INDEX IF NOT EXISTS "AfterDarkItem_createdAt_idx" ON "AfterDarkItem"("createdAt");

-- AddForeignKey (optional, soft-link)
ALTER TABLE "AfterDarkItem" ADD CONSTRAINT "AfterDarkItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AfterDarkItem" ADD CONSTRAINT "AfterDarkItem_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
