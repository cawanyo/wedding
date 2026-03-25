-- CreateTable
CREATE TABLE "CoupleRoadmap" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "currentSection" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CoupleRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoupleRoadmapAnswer" (
    "id" TEXT NOT NULL,
    "coupleRoadmapId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleRoadmapAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoupleRoadmap_coupleId_roadmapId_key" ON "CoupleRoadmap"("coupleId", "roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "CoupleRoadmapAnswer_coupleRoadmapId_userId_itemId_key" ON "CoupleRoadmapAnswer"("coupleRoadmapId", "userId", "itemId");

-- AddForeignKey
ALTER TABLE "CoupleRoadmap" ADD CONSTRAINT "CoupleRoadmap_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleRoadmap" ADD CONSTRAINT "CoupleRoadmap_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleRoadmapAnswer" ADD CONSTRAINT "CoupleRoadmapAnswer_coupleRoadmapId_fkey" FOREIGN KEY ("coupleRoadmapId") REFERENCES "CoupleRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleRoadmapAnswer" ADD CONSTRAINT "CoupleRoadmapAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleRoadmapAnswer" ADD CONSTRAINT "CoupleRoadmapAnswer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RoadmapItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
