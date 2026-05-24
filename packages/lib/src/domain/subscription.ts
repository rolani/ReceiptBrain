// Subscription detection from receipt history.
// Pure functions only. The worker passes receipts grouped by merchant and
// receives back zero or more subscription candidates with confidence scores.

export type SubscriptionInterval = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ReceiptForDetection {
  id: string;
  amount: number;
  purchasedAt: Date;
}

export interface SubscriptionCandidate {
  amount: number;
  interval: SubscriptionInterval;
  firstCharge: Date;
  lastCharge: Date;
  nextChargeEstimate: Date;
  occurrences: number;
  confidence: number;
  sourceReceiptIds: string[];
}

// Day deltas (mid-point of each interval) used to map intervals → expected gap.
const INTERVAL_DAYS: Record<SubscriptionInterval, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  yearly: 365,
};

const INTERVAL_TOLERANCE = 0.15; // ±15% on gap
const AMOUNT_TOLERANCE = 0.1; // ±10% on amount
const MIN_OCCURRENCES = 3;

function classifyInterval(avgGapDays: number): SubscriptionInterval | null {
  for (const [interval, days] of Object.entries(INTERVAL_DAYS) as Array<
    [SubscriptionInterval, number]
  >) {
    const lo = days * (1 - INTERVAL_TOLERANCE);
    const hi = days * (1 + INTERVAL_TOLERANCE);
    if (avgGapDays >= lo && avgGapDays <= hi) return interval;
  }
  return null;
}

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function relativeStdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  if (m === 0) return 0;
  const variance =
    xs.reduce((sum, x) => sum + (x - m) * (x - m), 0) / (xs.length - 1);
  return Math.sqrt(variance) / m;
}

/**
 * Detect a subscription from a single merchant's chronological receipt list.
 * Returns null if fewer than MIN_OCCURRENCES receipts, or if gaps/amounts
 * are too noisy to be a subscription.
 */
export function detectSubscription(
  receipts: ReceiptForDetection[],
): SubscriptionCandidate | null {
  if (receipts.length < MIN_OCCURRENCES) return null;

  const sorted = [...receipts].sort(
    (a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime(),
  );

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const ms =
      sorted[i]!.purchasedAt.getTime() - sorted[i - 1]!.purchasedAt.getTime();
    gaps.push(ms / (1000 * 60 * 60 * 24));
  }

  const avgGap = mean(gaps);
  const interval = classifyInterval(avgGap);
  if (!interval) return null;

  const amounts = sorted.map((r) => r.amount);
  const avgAmount = mean(amounts);
  const amountRSD = relativeStdev(amounts);
  if (amountRSD > AMOUNT_TOLERANCE) return null;

  const gapRSD = relativeStdev(gaps);
  // Confidence drops as either signal deviates.
  const intervalScore = Math.max(0, 1 - gapRSD / INTERVAL_TOLERANCE);
  const amountScore = Math.max(0, 1 - amountRSD / AMOUNT_TOLERANCE);
  const occurrencesScore = Math.min(1, sorted.length / 4); // saturate fast at 4
  const confidence = Math.min(
    0.99,
    Math.max(
      0.5,
      0.5 * intervalScore + 0.3 * amountScore + 0.2 * occurrencesScore,
    ),
  );

  const lastCharge = sorted[sorted.length - 1]!.purchasedAt;
  const nextChargeEstimate = new Date(
    lastCharge.getTime() + INTERVAL_DAYS[interval] * 24 * 60 * 60 * 1000,
  );

  return {
    amount: Number(avgAmount.toFixed(2)),
    interval,
    firstCharge: sorted[0]!.purchasedAt,
    lastCharge,
    nextChargeEstimate,
    occurrences: sorted.length,
    confidence: Number(confidence.toFixed(2)),
    sourceReceiptIds: sorted.map((r) => r.id),
  };
}
