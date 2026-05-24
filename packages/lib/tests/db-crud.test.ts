import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Prisma } from '../src/prisma.js';
import { userOwned } from '../src/scoping.js';
import { DB_READY, disconnect, getPrisma, truncateAll } from './helpers/db.js';

const prisma = getPrisma();

describe.skipIf(!DB_READY)('Prisma CRUD round-trip', () => {
  beforeEach(async () => {
    await truncateAll(prisma);
  });

  afterAll(async () => {
    await disconnect();
  });

  it('persists a User → Receipt → Item graph and reads it back', async () => {
    const user = await prisma.user.create({
      data: { email: 'crud@example.com', name: 'Crud User' },
    });
    const merchant = await prisma.merchant.create({
      data: { canonicalName: 'Test Merchant', category: 'dining' },
    });

    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        merchantId: merchant.id,
        rawMerchant: 'TEST MERCHANT #1',
        imageUrl: 's3://bucket/test.jpg',
        imageHash: 'hash-1',
        imageMime: 'image/jpeg',
        imageBytes: 1234,
        currency: 'USD',
        total: '13.50',
        subtotal: '12.40',
        tax: '1.10',
        tip: '0.00',
        purchasedAt: new Date('2026-04-01T10:00:00Z'),
        items: {
          create: [
            { lineNumber: 1, name: 'Latte', unitPrice: '5.20', quantity: 1, lineTotal: '5.20' },
            { lineNumber: 2, name: 'Bagel', unitPrice: '7.20', quantity: 1, lineTotal: '7.20' },
          ],
        },
      },
      include: { items: true },
    });

    expect(receipt.items).toHaveLength(2);

    const readBack = await prisma.receipt.findUniqueOrThrow({
      where: { id: receipt.id },
      include: { items: { orderBy: { lineNumber: 'asc' } } },
    });

    expect(readBack.userId).toBe(user.id);
    expect(readBack.merchantId).toBe(merchant.id);
    expect(readBack.total).toBeInstanceOf(Prisma.Decimal);
    expect(readBack.total?.toFixed(2)).toBe('13.50');
    expect(readBack.subtotal?.toFixed(2)).toBe('12.40');
    expect(readBack.items[0]!.name).toBe('Latte');
    expect(readBack.items[0]!.unitPrice.toFixed(2)).toBe('5.20');
  });

  it('enforces dedup unique key on (userId, imageHash)', async () => {
    const user = await prisma.user.create({ data: { email: 'dedup@example.com' } });
    const data = {
      userId: user.id,
      imageUrl: 's3://bucket/dup.jpg',
      imageHash: 'dup-hash',
      imageMime: 'image/jpeg',
      imageBytes: 100,
    } as const;

    await prisma.receipt.create({ data });
    await expect(prisma.receipt.create({ data })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('persists ExtractionAttempt with token usage + cost', async () => {
    const user = await prisma.user.create({ data: { email: 'extract@example.com' } });
    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        imageUrl: 's3://bucket/x.jpg',
        imageHash: 'x',
        imageMime: 'image/jpeg',
        imageBytes: 1,
      },
    });
    const attempt = await prisma.extractionAttempt.create({
      data: {
        receiptId: receipt.id,
        modelName: 'gpt-4o-2024-11-20',
        promptVersion: 'extract-v1',
        rawJson: { merchant: 'Starbucks', total: 13.5 },
        status: 'success',
        promptTokens: 1820,
        completionTokens: 340,
        costUsdEstimate: '0.0091',
        durationMs: 980,
      },
    });
    expect(attempt.promptTokens).toBe(1820);
    expect(attempt.costUsdEstimate?.toFixed(4)).toBe('0.0091');
  });

  it('userOwned() scope prevents userA from reading userB receipts', async () => {
    const [a, b] = await Promise.all([
      prisma.user.create({ data: { email: 'a@example.com' } }),
      prisma.user.create({ data: { email: 'b@example.com' } }),
    ]);

    await prisma.receipt.create({
      data: {
        userId: b.id,
        imageUrl: 's3://bucket/b.jpg',
        imageHash: 'b-hash',
        imageMime: 'image/jpeg',
        imageBytes: 1,
      },
    });

    const aSees = await prisma.receipt.findMany({ where: userOwned(a.id) });
    const bSees = await prisma.receipt.findMany({ where: userOwned(b.id) });

    expect(aSees).toHaveLength(0);
    expect(bSees).toHaveLength(1);

    // Even if a caller passes userId in the where, userOwned overrides it.
    const aWithSpoofedScope = await prisma.receipt.findMany({
      where: userOwned(a.id, { userId: b.id }),
    });
    expect(aWithSpoofedScope).toHaveLength(0);
  });
});
