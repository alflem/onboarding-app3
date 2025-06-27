import { PrismaClient } from "@prisma/client";

// Type guard to check if BuddyPreparation model exists
export function hasBuddyPreparationModel(prisma: PrismaClient): boolean {
  return 'buddyPreparation' in prisma && typeof (prisma as any).buddyPreparation !== 'undefined';
}