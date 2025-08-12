-- Create table for many-to-many buddy assignments between users
CREATE TABLE IF NOT EXISTS "BuddyAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "buddyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuddyAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BuddyAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BuddyAssignment_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Ensure uniqueness so same buddy cannot be added twice to same user
CREATE UNIQUE INDEX IF NOT EXISTS "BuddyAssignment_userId_buddyId_key" ON "BuddyAssignment" ("userId", "buddyId");

-- Create table for many-to-many buddies on buddy preparations
CREATE TABLE IF NOT EXISTS "BuddyPreparationBuddy" (
  "id" TEXT NOT NULL,
  "buddyPreparationId" TEXT NOT NULL,
  "buddyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuddyPreparationBuddy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BuddyPreparationBuddy_preparation_fkey" FOREIGN KEY ("buddyPreparationId") REFERENCES "BuddyPreparation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BuddyPreparationBuddy_buddy_fkey" FOREIGN KEY ("buddyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Ensure a buddy is not added twice to the same preparation
CREATE UNIQUE INDEX IF NOT EXISTS "BuddyPreparationBuddy_preparation_buddy_key" ON "BuddyPreparationBuddy" ("buddyPreparationId", "buddyId");

