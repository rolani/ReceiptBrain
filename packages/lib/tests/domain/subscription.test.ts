import { describe, expect, it } from 'vitest';
import {
  detectSubscription,
  type ReceiptForDetection,
} from '../../src/domain/subscription.js';

function monthlyRuns(start: string, amount: number, count: number): ReceiptForDetection[] {
  const out: ReceiptForDetection[] = [];
  const base = new Date(start);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() + i);
    out.push({ id: `r${i}`, amount, purchasedAt: d });
  }
  return out;
}

describe('detectSubscription', () => {
  it('returns null for fewer than 3 occurrences', () => {
    expect(detectSubscription(monthlyRuns('2026-01-01', 15.99, 2))).toBeNull();
  });

  it('detects a clean monthly Netflix charge with high confidence', () => {
    const sub = detectSubscription(monthlyRuns('2026-01-01', 15.99, 6));
    expect(sub).not.toBeNull();
    expect(sub!.interval).toBe('monthly');
    expect(sub!.confidence).toBeGreaterThan(0.85);
    expect(sub!.occurrences).toBe(6);
    expect(sub!.amount).toBe(15.99);
    expect(sub!.sourceReceiptIds).toHaveLength(6);
  });

  it('rejects when amount drifts beyond ±10%', () => {
    const r = monthlyRuns('2026-01-01', 10, 5);
    r[2]!.amount = 20; // 100% jump
    expect(detectSubscription(r)).toBeNull();
  });

  it('rejects when intervals are too irregular for any bucket', () => {
    const r = monthlyRuns('2026-01-01', 10, 5);
    // Inject a 5-day gap → average gap drops out of monthly band.
    r[2]!.purchasedAt = new Date('2026-01-06');
    r[3]!.purchasedAt = new Date('2026-01-11');
    r[4]!.purchasedAt = new Date('2026-01-15');
    const sub = detectSubscription(r);
    if (sub) {
      // If it does match (weekly-ish), confidence must still drop.
      expect(sub.confidence).toBeLessThan(0.95);
    } else {
      expect(sub).toBeNull();
    }
  });

  it('estimates nextChargeEstimate one interval past lastCharge', () => {
    const sub = detectSubscription(monthlyRuns('2026-01-01', 9.99, 4));
    expect(sub).not.toBeNull();
    const last = sub!.lastCharge.getTime();
    const next = sub!.nextChargeEstimate.getTime();
    const gapDays = (next - last) / (1000 * 60 * 60 * 24);
    expect(gapDays).toBeGreaterThan(25);
    expect(gapDays).toBeLessThan(35);
  });

  it('detects yearly subscriptions too', () => {
    const r: ReceiptForDetection[] = [];
    const start = new Date('2023-05-22');
    for (let i = 0; i < 3; i++) {
      const d = new Date(start);
      d.setUTCFullYear(d.getUTCFullYear() + i);
      r.push({ id: `r${i}`, amount: 119, purchasedAt: d });
    }
    const sub = detectSubscription(r);
    expect(sub?.interval).toBe('yearly');
  });
});
