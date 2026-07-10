import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient singleton for Cloud Functions.
 * Uses globalThis so hot-reload / multiple module evaluations don't open
 * extra connection pools.
 */
const globalForPrisma = globalThis as typeof globalThis & {
  __prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.__prisma ?? new PrismaClient();

globalForPrisma.__prisma = prisma;
