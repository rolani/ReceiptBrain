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
  buildFlyerInsights,
  DEFAULT_RECOMMEND_CURRENCY,
  DEFAULT_RECOMMEND_LOCATION,
  inferCanadianProvince,
  resolveInsightSourceReceiptIds,
  resolveRecommendCurrency,
  resolveRecommendDefaults,
  sanitizeInsightAction,
  validateInsightUrlReachable,
  type ReceiptForProvenance,
  type RecommendLocation,
  type SubscriptionForProvenance,
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
  validateUrl?: (url: string) => Promise<boolean>;
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
      id: true,
      total: true,
      currency: true,
      purchasedAt: true,
      rawMerchant: true,
      merchant: { select: { canonicalName: true } },
    },
  });

  const [subs, user] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId: job.userId, status: 'active' },
      include: { merchant: true },
    }),
    prisma.user.findUnique({
      where: { id: job.userId },
      select: {
        defaultCurrency: true,
        defaultLocation: true,
        defaultLocationCountry: true,
      },
    }),
  ]);

  const aggregateOpts = readAggregateOptions(user);
  const aggregate = buildAggregate(receipts, subs, windowDays, aggregateOpts);

  const result = await ai.recommend(aggregate as unknown as Record<string, unknown>);

  const province = inferCanadianProvince(user?.defaultLocation, aggregateOpts.locationCountry ?? 'CA');
  const flyerItems = buildFlyerInsights(
    aggregate.summary.topMerchants,
    province,
    aggregate.currency,
    { country: aggregateOpts.locationCountry ?? 'CA' },
  );

  const validateUrl = deps.validateUrl ?? validateInsightUrlReachable;
  const aiItems: RecommendInsight[] = [];
  for (const item of result.items) {
    const action = await sanitizeInsightAction(item.action, validateUrl);
    aiItems.push({ ...item, action });
  }

  const allItems: RecommendInsight[] = [...aiItems, ...flyerItems];
  const flyerTitles = new Set(flyerItems.map((f) => f.title));

  const receiptsForProvenance: ReceiptForProvenance[] = receipts.map((r) => ({
    id: r.id,
    merchantName: r.merchant?.canonicalName ?? r.rawMerchant ?? 'Unknown',
  }));
  const subsForProvenance: SubscriptionForProvenance[] = subs.map((s) => ({
    id: s.id,
    merchantName: s.merchant.canonicalName,
    sourceReceiptIds: s.sourceReceiptIds,
  }));

  let inserted = 0;
  for (const i of allItems) {
    const fp = fingerprint(job.userId, i);
    const sourceReceiptIds = resolveInsightSourceReceiptIds(
      i,
      receiptsForProvenance,
      subsForProvenance,
    );
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
          sourceReceiptIds,
          sourceSubscriptionId: i.sourceSubscriptionId ?? null,
          modelVersion: flyerTitles.has(i.title) ? 'flyer-v1' : result.model,
          promptVersion: flyerTitles.has(i.title) ? 'flyer-v1' : result.promptVersion,
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
    { userId: job.userId, inserted, total: allItems.length },
    'generate_insights complete',
  );
  return { insertedCount: inserted, totalCount: allItems.length };
}

function readAggregateOptions(
  user: {
    defaultCurrency: string | null;
    defaultLocation: string | null;
    defaultLocationCountry: string | null;
  } | null,
): BuildAggregateOptions {
  const envCountry = process.env.DEFAULT_LOCATION_COUNTRY?.trim();
  const resolved = resolveRecommendDefaults(user, {
    currency: process.env.DEFAULT_CURRENCY?.trim() || DEFAULT_RECOMMEND_CURRENCY,
    location: process.env.DEFAULT_LOCATION?.trim() || DEFAULT_RECOMMEND_LOCATION,
    locationCountry:
      envCountry && envCountry.length === 2 ? envCountry.toUpperCase() : null,
  });
  return {
    defaultCurrency: resolved.currency,
    defaultLocation: resolved.location,
    ...(resolved.locationCountry ? { locationCountry: resolved.locationCountry } : {}),
  };
}

interface MinimalReceipt {
  id: string;
  total: Prisma.Decimal | null;
  currency: string | null;
  purchasedAt: Date | null;
  rawMerchant: string | null;
  merchant: { canonicalName: string } | null;
}

interface MinimalSubscription {
  id: string;
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
    topMerchants: Array<{ merchant: string; spend: number; visits: number; receiptIds: string[] }>;
    monthlyTotals: Array<{ month: string; total: number }>;
    recurringCandidates: Array<{
      subscriptionId: string;
      merchant: string;
      amount: number;
      interval: string;
      lastCharge: string;
      occurrences: number;
      sourceReceiptIds: string[];
    }>;
  };
} {
  const byMerchant = new Map<string, { spend: number; visits: number; receiptIds: string[] }>();
  const byMonth = new Map<string, number>();
  for (const r of receipts) {
    const total = Number(r.total ?? 0);
    const merchant = r.merchant?.canonicalName ?? 'Unknown';
    const slot = byMerchant.get(merchant) ?? { spend: 0, visits: 0, receiptIds: [] };
    slot.spend += total;
    slot.visits += 1;
    slot.receiptIds.push(r.id);
    byMerchant.set(merchant, slot);
    if (r.purchasedAt) {
      const ym = r.purchasedAt.toISOString().slice(0, 7);
      byMonth.set(ym, (byMonth.get(ym) ?? 0) + total);
    }
  }
  const topMerchants = Array.from(byMerchant.entries())
    .map(([merchant, v]) => ({
      merchant,
      spend: Number(v.spend.toFixed(2)),
      visits: v.visits,
      receiptIds: v.receiptIds,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);
  const monthlyTotals = Array.from(byMonth.entries())
    .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));
  const recurringCandidates = subs.map((s) => ({
    subscriptionId: s.id,
    merchant: s.merchant.canonicalName,
    amount: Number(s.amount),
    interval: s.interval,
    lastCharge: s.lastCharge.toISOString(),
    occurrences: s.sourceReceiptIds.length,
    sourceReceiptIds: s.sourceReceiptIds,
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
