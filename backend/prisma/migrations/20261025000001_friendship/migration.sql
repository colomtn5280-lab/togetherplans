-- CreateTable: Friendship
CREATE TABLE "Friendship" (
    "id"         TEXT         NOT NULL,
    "senderId"   TEXT         NOT NULL,
    "receiverId" TEXT         NOT NULL,
    "status"     TEXT         NOT NULL DEFAULT 'PENDING',
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_senderId_receiverId_key" ON "Friendship"("senderId", "receiverId");
CREATE INDEX "Friendship_receiverId_idx" ON "Friendship"("receiverId");
CREATE INDEX "Friendship_status_idx"     ON "Friendship"("status");

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_receiverId_fkey"
    FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
