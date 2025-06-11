// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Förhindra att flera instanser skapas under utveckling med hot reload
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;