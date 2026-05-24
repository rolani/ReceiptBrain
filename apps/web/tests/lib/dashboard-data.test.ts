import { describe, expect, it } from 'vitest';
import {
  buildSpendSeries,
  receiptEffectiveDate,
  receiptInDateRange,
} from '@/lib/dashboard-data';

describe('receiptEffectiveDate', () => {
  it('prefers purchasedAt when present', () => {
    const purchased = new Date('2026-05-01T12:00:00Z');
    const created = new Date('2026-05-10T12:00:00Z');
    expect(receiptEffectiveDate(purchased, created)).toEqual(purchased);
  });

  it('falls back to createdAt when purchasedAt is null', () => {
    const created = new Date('2026-05-10T12:00:00Z');
    expect(receiptEffectiveDate(null, created)).toEqual(created);
  });
});

describe('receiptInDateRange', () => {
  const start = new Date('2026-05-01T00:00:00Z');
  const end = new Date('2026-05-31T23:59:59Z');

  it('includes a receipt dated by createdAt when purchasedAt is missing', () => {
    expect(
      receiptInDateRange(
        { purchasedAt: null, createdAt: new Date('2026-05-15T00:00:00Z') },
        start,
        end,
      ),
    ).toBe(true);
  });

  it('excludes receipts outside the window', () => {
    expect(
      receiptInDateRange(
        { purchasedAt: new Date('2026-04-01T00:00:00Z'), createdAt: new Date('2026-04-01T00:00:00Z') },
        start,
        end,
      ),
    ).toBe(false);
  });
});

describe('buildSpendSeries', () => {
  it('buckets spend by effective date including createdAt fallback', () => {
    const now = new Date('2026-05-20T12:00:00Z');
    const series = buildSpendSeries(
      [
        { total: 10, purchasedAt: null, createdAt: new Date('2026-05-18T00:00:00Z') },
        { total: 25, purchasedAt: new Date('2026-05-19T00:00:00Z'), createdAt: new Date('2026-05-19T00:00:00Z') },
      ],
      now,
    );
    const may18 = series.find((p) => p.date === '2026-05-18');
    const may19 = series.find((p) => p.date === '2026-05-19');
    expect(may18?.value).toBe(10);
    expect(may19?.value).toBe(25);
  });
});
