import { describe, expect, it } from 'vitest';
import {
  REVIEW_CONFIDENCE_THRESHOLD,
  fromDatetimeLocalValue,
  getReviewReasons,
  toDatetimeLocalValue,
} from '../../src/domain/receipt-review.js';

describe('getReviewReasons', () => {
  it('flags low merchant and total confidence', () => {
    const reasons = getReviewReasons({
      fieldConfidence: { merchant: 0.5, total: 0.6, purchasedAt: 0.9 },
      purchasedAt: '2026-05-22T10:00:00Z',
    });
    expect(reasons.map((r) => r.field)).toEqual(['merchant', 'total']);
  });

  it('flags missing purchase date', () => {
    const reasons = getReviewReasons({
      fieldConfidence: { merchant: 0.99, total: 0.99 },
      purchasedAt: null,
    });
    expect(reasons).toHaveLength(1);
    expect(reasons[0]?.field).toBe('purchasedAt');
  });

  it('returns empty when all checks pass', () => {
    expect(
      getReviewReasons({
        fieldConfidence: { merchant: 0.9, total: 0.85 },
        purchasedAt: '2026-05-22T10:00:00Z',
        threshold: REVIEW_CONFIDENCE_THRESHOLD,
      }),
    ).toEqual([]);
  });
});

describe('datetime-local helpers', () => {
  it('round-trips through datetime-local input', () => {
    const iso = '2026-05-22T15:04:00.000Z';
    const local = toDatetimeLocalValue(iso);
    expect(local).toMatch(/^2026-05-22T/);
    expect(fromDatetimeLocalValue(local)).toBeTruthy();
  });

  it('returns empty string for invalid iso', () => {
    expect(toDatetimeLocalValue('not-a-date')).toBe('');
  });
});
