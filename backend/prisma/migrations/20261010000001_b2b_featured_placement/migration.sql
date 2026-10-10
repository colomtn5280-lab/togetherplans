ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "featuredCategory" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "featuredRadius" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "featuredSlot" INTEGER;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "platformIds" JSONB;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'inactive';

CREATE TABLE IF NOT EXISTS "BusinessDirectListing" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "address" TEXT,
  "imageUrl" TEXT,
  "eventDate" TIMESTAMP(3),
  "price" TEXT,
  "ticketUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "BusinessDirectListing_businessId_idx" ON "BusinessDirectListing"("businessId");
CREATE INDEX IF NOT EXISTS "BusinessDirectListing_category_active_idx" ON "BusinessDirectListing"("category", "active");
