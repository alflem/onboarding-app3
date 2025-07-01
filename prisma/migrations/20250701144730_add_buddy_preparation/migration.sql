-- CreateTable
CREATE TABLE "BuddyPreparation" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "buddyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuddyPreparation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuddyPreparation_userId_key" ON "BuddyPreparation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BuddyPreparation_email_organizationId_key" ON "BuddyPreparation"("email", "organizationId");

-- AddForeignKey
ALTER TABLE "BuddyPreparation" ADD CONSTRAINT "BuddyPreparation_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyPreparation" ADD CONSTRAINT "BuddyPreparation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyPreparation" ADD CONSTRAINT "BuddyPreparation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
