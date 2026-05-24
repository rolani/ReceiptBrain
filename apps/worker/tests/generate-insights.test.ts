import { describe, expect, it, vi } from 'vitest';
import {
  buildAggregate,
  handleGenerateInsights,
  type InsightsDeps,
} from '../src/handlers/generate-insights.js';
import type { RecommendResult } from '../src/ai-client.js';

function recommendResult(): RecommendResult {
  return {
    items: [
      {
        type: 'subscription_waste',
        title: 'Cancel unused Netflix',
        description: 'No activity in 60 days.',
        estimatedSavings: 191.88,
        currency: 'CAD',
        action: { label: 'Cancel', kind: 'external_link', target: 'https://netflix.com' },
        sourceReceiptIds: ['r1', 'r2'],
        confidence: 0.86,
      },
    ],
    model: 'gpt-4o-mini-2024-11-20',
    promptVersion: 'recommend-v1',
    usage: { promptTokens: 800, completionTokens: 180, costUsdEstimate: 0.0042 },
  };
}

function makeDeps(): InsightsDeps & {
  prisma: {
    receipt: { findMany: ReturnType<typeof vi.fn> };
    subscription: { findMany: ReturnType<typeof vi.fn> };
    insight: { create: ReturnType<typeof vi.fn> };
  };
  ai: { recommend: ReturnType<typeof vi.fn>; extract: ReturnType<typeof vi.fn> };
} {
  const prisma = {
    receipt: { findMany: vi.fn(async () => []) },
    subscription: { findMany: vi.fn(async () => []) },
    insight: { create: vi.fn(async () => ({ id: 'ins_1' })) },
  };
  const ai = {
    recommend: vi.fn(async () => recommendResult()),
    extract: vi.fn(),
  };
  return { prisma, ai } as never;
}

describe('handleGenerateInsights', () => {
  it('creates one Insight row per item on first run', async () => {
    const deps = makeDeps();
    const out = await handleGenerateInsights({ userId: 'u_1' }, deps);
    expect(out.totalCount).toBe(1);
    expect(out.insertedCount).toBe(1);
    expect(deps.prisma.insight.create).toHaveBeenCalledTimes(1);
  });

  it('is idempotent — duplicate fingerprints are swallowed (P2002)', async () => {
    const deps = makeDeps();
    deps.prisma.insight.create.mockRejectedValueOnce(
      Object.assign(new Error('Unique constraint failed (P2002)'), { code: 'P2002' }),
    );
    const out = await handleGenerateInsights({ userId: 'u_1' }, deps);
    expect(out.insertedCount).toBe(0);
    expect(out.totalCount).toBe(1);
  });

  it('rethrows unexpected database errors', async () => {
    const deps = makeDeps();
    deps.prisma.insight.create.mockRejectedValueOnce(new Error('connection lost'));
    await expect(handleGenerateInsights({ userId: 'u_1' }, deps)).rejects.toThrow(/connection lost/);
  });
});

describe('buildAggregate', () => {
  it('rolls up topMerchants and monthlyTotals with CAD + embedded location', () => {
    const r = (date: string, merchant: string, total: number, rawMerchant?: string) => ({
      total: { toString: () => total.toString(), toFixed: () => total.toFixed(2) } as never,
      currency: 'CAD',
      purchasedAt: new Date(date),
      rawMerchant: rawMerchant ?? null,
      merchant: { canonicalName: merchant },
    });
    const agg = buildAggregate(
      [
        r('2026-04-01', 'Starbucks', 5, 'STARBUCKS #4521 TORONTO, ON'),
        r('2026-04-15', 'Starbucks', 7, 'STARBUCKS #4521'),
        r('2026-05-01', 'Other', 10),
      ],
      [],
      90,
      { defaultLocation: 'Toronto, ON, Canada', locationCountry: 'CA' },
    );
    expect(agg.currency).toBe('CAD');
    expect(agg.location.label).toBe('Toronto, ON, Canada');
    expect(agg.location.country).toBe('CA');
    expect(agg.location.merchantHints).toEqual(
      expect.arrayContaining(['4521', 'Toronto, ON']),
    );
    expect(agg.summary.topMerchants[0]).toMatchObject({ merchant: 'Starbucks', visits: 2 });
    expect(agg.summary.monthlyTotals).toHaveLength(2);
  });

  it('maps subscriptions into recurringCandidates', () => {
    const agg = buildAggregate(
      [],
      [
        {
          amount: { toString: () => '15.99' } as never,
          currency: 'CAD',
          interval: 'monthly',
          lastCharge: new Date('2026-05-01'),
          merchant: { canonicalName: 'Netflix' },
          sourceReceiptIds: ['r1', 'r2'],
        },
      ],
      90,
    );
    expect(agg.summary.recurringCandidates[0]).toMatchObject({
      merchant: 'Netflix',
      interval: 'monthly',
      occurrences: 2,
    });
  });
});
