// Job handler for `generate_insights` queue.
// Aggregates the user's last N days of spending, asks the AI service for
// recommendations, and upserts them as Insight rows.
//
// Idempotency: each AI-generated insight is hashed (type + title) into
// `contentFingerprint`. The `(userId, contentFingerprint)` unique constraint
// means re-running for the same input is a no-op.

import { createHash } from 'node:crypto';
import {
  buildRecommendLocation,
  DEFAULT_RECOMMEND_CURRENCY,
  DEFAULT_RECOMMEND_LOCATION,
  resolveRecommendCurrency,
  type RecommendLocation,
} from '@receiptbrain/lib/domain';
import type { PrismaClient, Prisma } from '@receiptbrain/lib/prisma';
import type { GenerateInsightsJob } from '@receiptbrain/lib/queue';
import type { AiClient, RecommendInsight } from '../ai-client.js';

export interface BuildAggregateOptions {
  defaultCurrency?: string;
  defaultLocation?: string;
  locationCountry?: string;
}

type LoggerLike = {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export interface InsightsDeps {
  prisma: PrismaClient;
  ai: AiClient;
  logger?: unknown;
}

export interface InsightsOutcome {
  insertedCount: number;
  totalCount: number;
}

function fingerprint(userId: string, insight: RecommendInsight): string {
  return createHash('sha256')
    .update(userId)
    .update('|')
    .update(insight.type)
    .update('|')
    .update(insight.title)
    .digest('hex');
}

export async function handleGenerateInsights(
  job: GenerateInsightsJob,
  deps: InsightsDeps,
): Promise<InsightsOutcome> {
  const windowDays = job.windowDays ?? 90;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const { prisma, ai, logger } = deps;

  const receipts = await prisma.receipt.findMany({
    where: { userId: job.userId, deletedAt: null, purchasedAt: { gte: since } },
    select: {
      total: true,
      currency: true,
      purchasedAt: true,
      rawMerchant: true,
      merchant: { select: { canonicalName: true } },
    },
  });

  const subs = await prisma.subscription.findMany({
    where: { userId: job.userId, status: 'active' },
    include: { merchant: true },
  });

  const aggregate = buildAggregate(receipts, subs, windowDays, readAggregateOptions());

  const result = await ai.recommend(aggregate as unknown as Record<string, unknown>);

  let inserted = 0;
  for (const i of result.items) {
    const fp = fingerprint(job.userId, i);
    try {
      await prisma.insight.create({
        data: {
          userId: job.userId,
          type: i.type,
          title: i.title,
          description: i.description,
          estimatedSavings: i.estimatedSavings?.toFixed(2),
          currency: i.currency ?? aggregate.currency,
          action: i.action as unknown as object,
          status: 'new',
          sourceReceiptIds: i.sourceReceiptIds,
          sourceSubscriptionId: i.sourceSubscriptionId ?? null,
          modelVersion: result.model,
          promptVersion: result.promptVersion,
          contentFingerprint: fp,
        },
      });
      inserted += 1;
    } catch (err) {
      // P2002 unique violation = already exists; everything else re-throws.
      if (!(err instanceof Error) || !/P2002|Unique/.test(err.message)) {
        throw err;
      }
    }
  }

  (logger as LoggerLike | undefined)?.info?.(
    { userId: job.userId, inserted, total: result.items.length },
    'generate_insights complete',
  );
  return { insertedCount: inserted, totalCount: result.items.length };
}

function readAggregateOptions(): BuildAggregateOptions {
  const country = process.env.DEFAULT_LOCATION_COUNTRY?.trim();
  return {
    defaultCurrency: process.env.DEFAULT_CURRENCY?.trim() || DEFAULT_RECOMMEND_CURRENCY,
    defaultLocation: process.env.DEFAULT_LOCATION?.trim() || DEFAULT_RECOMMEND_LOCATION,
    ...(country && country.length === 2 ? { locationCountry: country.toUpperCase() } : {}),
  };
}

interface MinimalReceipt {
  total: Prisma.Decimal | null;
  currency: string | null;
  purchasedAt: Date | null;
  rawMerchant: string | null;
  merchant: { canonicalName: string } | null;
}

interface MinimalSubscription {
  amount: Prisma.Decimal;
  currency: string;
  interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastCharge: Date;
  merchant: { canonicalName: string };
  sourceReceiptIds: string[];
}

export function buildAggregate(
  receipts: MinimalReceipt[],
  subs: MinimalSubscription[],
  windowDays: number,
  opts: BuildAggregateOptions = {},
): {
  windowDays: number;
  currency: string;
  location: RecommendLocation;
  summary: {
    topMerchants: Array<{ merchant: string; spend: number; visits: number }>;
    monthlyTotals: Array<{ month: string; total: number }>;
    recurringCandidates: Array<{
      merchant: string;
      amount: number;
      interval: string;
      lastCharge: string;
      occurrences: number;
    }>;
  };
} {
  const byMerchant = new Map<string, { spend: number; visits: number }>();
  const byMonth = new Map<string, number>();
  for (const r of receipts) {
    const total = Number(r.total ?? 0);
    const merchant = r.merchant?.canonicalName ?? 'Unknown';
    const slot = byMerchant.get(merchant) ?? { spend: 0, visits: 0 };
    slot.spend += total;
    slot.visits += 1;
    byMerchant.set(merchant, slot);
    if (r.purchasedAt) {
      const ym = r.purchasedAt.toISOString().slice(0, 7);
      byMonth.set(ym, (byMonth.get(ym) ?? 0) + total);
    }
  }
  const topMerchants = Array.from(byMerchant.entries())
    .map(([merchant, v]) => ({ merchant, spend: Number(v.spend.toFixed(2)), visits: v.visits }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);
  const monthlyTotals = Array.from(byMonth.entries())
    .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));
  const recurringCandidates = subs.map((s) => ({
    merchant: s.merchant.canonicalName,
    amount: Number(s.amount),
    interval: s.interval,
    lastCharge: s.lastCharge.toISOString(),
    occurrences: s.sourceReceiptIds.length,
  }));

  const defaultCurrency = opts.defaultCurrency ?? DEFAULT_RECOMMEND_CURRENCY;
  const currency = resolveRecommendCurrency(
    [...receipts.map((r) => r.currency), ...subs.map((s) => s.currency)],
    defaultCurrency,
  );
  const location = buildRecommendLocation(
    receipts.map((r) => r.rawMerchant),
    {
      defaultLabel: opts.defaultLocation ?? DEFAULT_RECOMMEND_LOCATION,
      country: opts.locationCountry,
    },
  );

  return {
    windowDays,
    currency,
    location,
    summary: { topMerchants, monthlyTotals, recurringCandidates },
  };
}
