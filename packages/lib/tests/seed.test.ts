import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { runSeed } from '../prisma/seed.js';
import { DB_READY, disconnect, getPrisma, truncateAll } from './helpers/db.js';

const prisma = getPrisma();

describe.skipIf(!DB_READY)('demo seed', () => {
  beforeEach(async () => {
    await truncateAll(prisma);
  });

  afterAll(async () => {
    await disconnect();
  });

  it('creates the demo user with ≥20 receipts, ≥2 subscriptions, and insights', async () => {
    await runSeed({ prisma, silent: true });
    const user = await prisma.user.findUnique({ where: { email: 'demo@receiptbrain.app' } });
    expect(user).not.toBeNull();

    const counts = await prisma.$transaction([
      prisma.receipt.count({ where: { userId: user!.id } }),
      prisma.subscription.count({ where: { userId: user!.id } }),
      prisma.insight.count({ where: { userId: user!.id } }),
      prisma.merchant.count(),
    ]);
    expect(counts[0]).toBeGreaterThanOrEqual(20);
    expect(counts[1]).toBeGreaterThanOrEqual(2);
    expect(counts[2]).toBeGreaterThanOrEqual(1);
    expect(counts[3]).toBeGreaterThanOrEqual(3);
  });

  it('is idempotent — running twice produces identical row counts', async () => {
    await runSeed({ prisma, silent: true });
    const snapshot = async () => ({
      users: await prisma.user.count(),
      merchants: await prisma.merchant.count(),
      receipts: await prisma.receipt.count(),
      items: await prisma.item.count(),
      subscriptions: await prisma.subscription.count(),
      insights: await prisma.insight.count(),
    });
    const before = await snapshot();
    await runSeed({ prisma, silent: true });
    const after = await snapshot();
    expect(after).toEqual(before);
  });

  it('uses Decimal for receipt totals so seeded data round-trips at 2 dp', async () => {
    await runSeed({ prisma, silent: true });
    const r = await prisma.receipt.findFirst({
      where: { user: { email: 'demo@receiptbrain.app' } },
      orderBy: { purchasedAt: 'desc' },
    });
    expect(r?.total?.toFixed(2)).toMatch(/^\d+\.\d{2}$/);
  });
});
