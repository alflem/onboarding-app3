// lib/prisma.ts
import { PrismaClient } from '../prisma/generated/client';

// Prevent multiple instances from being created during development with hot reload
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Export types for convenience
export type { Role } from '../prisma/generated/client';
export { PrismaClient } from '../prisma/generated/client';