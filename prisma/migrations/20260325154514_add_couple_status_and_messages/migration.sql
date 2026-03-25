-- AlterTable
ALTER TABLE "Couple" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedBy" TEXT,
ADD COLUMN     "invitedUserId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
