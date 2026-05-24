import { PrismaClient } from '@prisma/client';

declare global {
  var __receiptbrainPrisma__: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['warn', 'error'],
  });
}

// Reuse the client across hot-reloads in dev/test; avoid leaking pool clients.
export const prisma: PrismaClient = globalThis.__receiptbrainPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__receiptbrainPrisma__ = prisma;
}

export { Prisma, PrismaClient } from '@prisma/client';
export type {
  User,
  Merchant,
  Receipt,
  Item,
  Subscription,
  Insight,
  ExtractionAttempt,
} from '@prisma/client';
