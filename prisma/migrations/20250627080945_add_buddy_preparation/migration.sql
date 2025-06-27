-- CreateTable
CREATE TABLE "BuddyPreparation" (
    "id" TEXT NOT NULL,
    "buddyId" TEXT NOT NULL,
    "upcomingEmployeeName" TEXT NOT NULL,
    "upcomingEmployeeEmail" TEXT,
    "organizationId" TEXT NOT NULL,
    "linkedUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuddyPreparation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuddyPreparation_linkedUserId_key" ON "BuddyPreparation"("linkedUserId");

-- AddForeignKey
ALTER TABLE "BuddyPreparation" ADD CONSTRAINT "BuddyPreparation_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyPreparation" ADD CONSTRAINT "BuddyPreparation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyPreparation" ADD CONSTRAINT "BuddyPreparation_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
