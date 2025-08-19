-- CreateTable
CREATE TABLE "BuddyPreparationTaskProgress" (
    "id" TEXT NOT NULL,
    "preparationId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuddyPreparationTaskProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuddyPreparationTaskProgress_preparationId_taskId_key" ON "BuddyPreparationTaskProgress"("preparationId", "taskId");

-- RenameForeignKey
ALTER TABLE "BuddyPreparationBuddy" RENAME CONSTRAINT "BuddyPreparationBuddy_buddy_fkey" TO "BuddyPreparationBuddy_buddyId_fkey";

-- RenameForeignKey
ALTER TABLE "BuddyPreparationBuddy" RENAME CONSTRAINT "BuddyPreparationBuddy_preparation_fkey" TO "BuddyPreparationBuddy_buddyPreparationId_fkey";

-- AddForeignKey
ALTER TABLE "BuddyPreparationTaskProgress" ADD CONSTRAINT "BuddyPreparationTaskProgress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyPreparationTaskProgress" ADD CONSTRAINT "BuddyPreparationTaskProgress_preparationId_fkey" FOREIGN KEY ("preparationId") REFERENCES "BuddyPreparation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "BuddyPreparationBuddy_preparation_buddy_key" RENAME TO "BuddyPreparationBuddy_buddyPreparationId_buddyId_key";
