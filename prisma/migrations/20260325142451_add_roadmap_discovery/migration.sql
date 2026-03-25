-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'CUSTOM',
    "icon" TEXT,
    "color" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapSection" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoadmapSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'QUESTION',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoadmapItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "currentSection" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoadmapAnswer" (
    "id" TEXT NOT NULL,
    "userRoadmapId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRoadmapAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRoadmap_userId_roadmapId_key" ON "UserRoadmap"("userId", "roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoadmapAnswer_userRoadmapId_itemId_key" ON "UserRoadmapAnswer"("userRoadmapId", "itemId");

-- AddForeignKey
ALTER TABLE "RoadmapSection" ADD CONSTRAINT "RoadmapSection_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapItem" ADD CONSTRAINT "RoadmapItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "RoadmapSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoadmap" ADD CONSTRAINT "UserRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoadmap" ADD CONSTRAINT "UserRoadmap_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoadmapAnswer" ADD CONSTRAINT "UserRoadmapAnswer_userRoadmapId_fkey" FOREIGN KEY ("userRoadmapId") REFERENCES "UserRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoadmapAnswer" ADD CONSTRAINT "UserRoadmapAnswer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RoadmapItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
