import { buildCategorySlicesFromReceipts } from '@receiptbrain/lib/domain';
import { prisma } from '@receiptbrain/lib';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DashboardSummaryPayload {
  totalSpend: string;
  subscriptionCount: number;
  potentialSavings: string;
  receiptsCount: number;
  spendTrend: number[];
  spendDeltaPct: number | null;
}

export interface SpendPoint {
  date: string;
  label: string;
  value: number;
}

export interface CategorySlice {
  label: string;
  value: number;
}

export interface RecentReceiptRow {
  id: string;
  merchant: string | null;
  total: string | null;
  currency: string | null;
  purchasedAt: string | null;
  status: 'uploaded' | 'extracting' | 'extracted' | 'failed' | 'needs_review';
}

export interface TopInsightRow {
  id: string;
  type: 'cheaper_alternative' | 'subscription_waste' | 'spending_spike' | 'optimization_tip';
  title: string;
  estimatedSavings: string | null;
  currency: string | null;
}

export interface DashboardPayload {
  greeting: string;
  hasInFlightReceipts: boolean;
  summary: DashboardSummaryPayload;
  spendSeries: SpendPoint[];
  categorySlices: CategorySlice[];
  recent: RecentReceiptRow[];
  topInsights: TopInsightRow[];
}

type ReceiptDateFields = {
  purchasedAt: Date | null;
  createdAt: Date;
};

type ReceiptSpendFields = ReceiptDateFields & {
  total: number | { toString(): string } | null;
};

/** Date used for dashboard bucketing — falls back to upload time before extraction. */
export function receiptEffectiveDate(purchasedAt: Date | null, createdAt: Date): Date {
  return purchasedAt ?? createdAt;
}

export function receiptInDateRange(
  receipt: ReceiptDateFields,
  start: Date,
  end?: Date,
): boolean {
  const effective = receiptEffectiveDate(receipt.purchasedAt, receipt.createdAt);
  if (effective < start) return false;
  if (end && effective >= end) return false;
  return true;
}

function last30DayWindow(now = new Date()) {
  const start = new Date(now.getTime() - 30 * DAY_MS);
  const prevStart = new Date(now.getTime() - 60 * DAY_MS);
  return { now, start, prevStart };
}

function receiptWindowWhere(userId: string, start: Date, end?: Date) {
  const range = end
    ? { gte: start, lt: end }
    : { gte: start };
  return {
    userId,
    deletedAt: null,
    OR: [
      { purchasedAt: range },
      { purchasedAt: null, createdAt: range },
    ],
  };
}

export function buildSpendSeries(
  receipts: ReceiptSpendFields[],
  now = new Date(),
): SpendPoint[] {
  const { start } = last30DayWindow(now);
  const dailyMap = new Map<string, number>();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    dailyMap.set(dateKey(d), 0);
  }

  for (const r of receipts) {
    if (!receiptInDateRange(r, start)) continue;
    const key = dateKey(receiptEffectiveDate(r.purchasedAt, r.createdAt));
    if (!dailyMap.has(key)) continue;
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + Number(r.total ?? 0));
  }

  return Array.from(dailyMap.entries()).map(([key, value]) => ({
    date: key,
    label: shortLabel(key),
    value: Math.round(value * 100) / 100,
  }));
}

export async function loadDashboardData(
  userId: string,
  profile?: { name?: string | null; email?: string | null },
): Promise<DashboardPayload> {
  const { now, start, prevStart } = last30DayWindow();

  const [
    receiptsLast30,
    receiptsPrev30,
    subscriptionCount,
    insights,
    recentReceipts,
    topInsights,
    receiptsForCategories,
    inFlightCount,
  ] = await Promise.all([
    prisma.receipt.findMany({
      where: receiptWindowWhere(userId, start),
      select: { total: true, currency: true, purchasedAt: true, createdAt: true },
    }),
    prisma.receipt.findMany({
      where: receiptWindowWhere(userId, prevStart, start),
      select: { total: true, purchasedAt: true, createdAt: true },
    }),
    prisma.subscription.count({ where: { userId, status: 'active' } }),
    prisma.insight.findMany({
      where: { userId, status: 'new' },
      select: { estimatedSavings: true },
    }),
    prisma.receipt.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ purchasedAt: 'desc' }, { createdAt: 'desc' }],
      take: 6,
      select: {
        id: true,
        status: true,
        total: true,
        currency: true,
        purchasedAt: true,
        createdAt: true,
        rawMerchant: true,
        merchant: { select: { canonicalName: true } },
      },
    }),
    prisma.insight.findMany({
      where: { userId, status: 'new' },
      orderBy: [{ estimatedSavings: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        estimatedSavings: true,
        currency: true,
      },
    }),
    prisma.receipt.findMany({
      where: receiptWindowWhere(userId, start),
      select: {
        total: true,
        rawMerchant: true,
        merchant: { select: { canonicalName: true, category: true } },
        items: { select: { name: true, lineTotal: true, category: true } },
      },
    }),
    prisma.receipt.count({
      where: {
        userId,
        deletedAt: null,
        status: { in: ['uploaded', 'extracting'] },
      },
    }),
  ]);

  const totalSpendNum = receiptsLast30.reduce((sum, r) => sum + Number(r.total ?? 0), 0);
  const prevSpendNum = receiptsPrev30.reduce((sum, r) => sum + Number(r.total ?? 0), 0);
  const spendSeries = buildSpendSeries(receiptsLast30, now);

  const firstName = (profile?.name ?? profile?.email ?? '').split(/[\s@]/)[0] ?? '';
  const greeting = firstName ? `Welcome back, ${firstName}` : 'Welcome back';

  return {
    greeting,
    hasInFlightReceipts: inFlightCount > 0,
    summary: {
      totalSpend: totalSpendNum.toFixed(2),
      subscriptionCount,
      potentialSavings: insights
        .reduce((sum, i) => sum + Number(i.estimatedSavings ?? 0), 0)
        .toFixed(2),
      receiptsCount: receiptsLast30.length,
      spendTrend: spendSeries.map((p) => p.value),
      spendDeltaPct:
        prevSpendNum > 0 ? ((totalSpendNum - prevSpendNum) / prevSpendNum) * 100 : null,
    },
    spendSeries,
    categorySlices: buildCategorySlicesFromReceipts(receiptsForCategories),
    recent: recentReceipts.map((r) => ({
      id: r.id,
      merchant: r.merchant?.canonicalName ?? r.rawMerchant ?? null,
      total: r.total ? r.total.toFixed(2) : null,
      currency: r.currency ?? null,
      purchasedAt: r.purchasedAt
        ? r.purchasedAt.toISOString()
        : r.createdAt.toISOString(),
      status: r.status,
    })),
    topInsights: topInsights.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      estimatedSavings: i.estimatedSavings ? i.estimatedSavings.toFixed(2) : null,
      currency: i.currency ?? null,
    })),
  };
}

function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shortLabel(key: string): string {
  const [, m, d] = key.split('-');
  return `${Number(m)}/${Number(d)}`;
}
