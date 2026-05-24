import { PrismaClient } from '@prisma/client';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://receiptbrain:receiptbrain@localhost:5432/receiptbrain_test?schema=public';

// Marker set by tests/helpers/global-setup.ts when `prisma db push` succeeded.
export const DB_READY = process.env.RECEIPTBRAIN_TEST_DB_READY === '1';

let _prisma: PrismaClient | null = null;
export function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient({
      datasources: { db: { url: TEST_DATABASE_URL } },
      // Silence query/error logs in tests — the unique-constraint test
      // intentionally triggers a P2002 and we assert on the thrown error.
      log: [],
    });
  }
  return _prisma;
}

const TABLES = [
  'ExtractionAttempt',
  'Item',
  'Receipt',
  'Subscription',
  'Insight',
  'Merchant',
  'User',
] as const;

export async function truncateAll(prisma: PrismaClient = getPrisma()): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
}

export async function disconnect(): Promise<void> {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}
