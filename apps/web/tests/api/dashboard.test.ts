import { describe, expect, it, beforeEach, vi } from 'vitest';
import { prismaMock, resetApiMocks, signedInAs, signedOut } from './_mocks';

vi.mock('@receiptbrain/lib', () => ({ prisma: prismaMock }));

import * as dashboard from '@/app/api/dashboard/route';

beforeEach(() => {
  resetApiMocks();
  prismaMock.subscription.count = vi.fn().mockResolvedValue(2);
  prismaMock.item.groupBy = vi.fn().mockResolvedValue([]);
});

describe('GET /api/dashboard', () => {
  it('401 when unauthed', async () => {
    await signedOut();
    const res = await dashboard.GET();
    expect(res.status).toBe(401);
  });

  it('returns dashboard stats scoped to the session user', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findMany
      .mockResolvedValueOnce([
        {
          total: { toString: () => '42.00' },
          currency: 'USD',
          purchasedAt: new Date('2026-05-10T00:00:00Z'),
          createdAt: new Date('2026-05-10T00:00:00Z'),
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'r1',
          status: 'extracting',
          total: null,
          currency: null,
          purchasedAt: null,
          createdAt: new Date('2026-05-20T00:00:00Z'),
          rawMerchant: 'Costco',
          merchant: null,
        },
      ]);
    prismaMock.receipt.count.mockResolvedValue(1);
    prismaMock.insight.findMany
      .mockResolvedValueOnce([{ estimatedSavings: { toString: () => '5.00' } }])
      .mockResolvedValueOnce([]);

    const res = await dashboard.GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.totalSpend).toBe('42.00');
    expect(body.summary.receiptsCount).toBe(1);
    expect(body.hasInFlightReceipts).toBe(true);
    expect(body.recent[0].merchant).toBe('Costco');
    expect(prismaMock.receipt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'u_1', deletedAt: null }),
      }),
    );
  });
});
