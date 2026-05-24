import { describe, expect, it } from 'vitest';
import {
  CurrencyCodeSchema,
  ExtractResponseSchema,
  InsightSchema,
  InsightType,
  MoneySchema,
  PaginationCursorSchema,
  ReceiptStatus,
  RecommendInputSchema,
  UploadResponseSchema,
} from '../src/index.js';

describe('enums', () => {
  it('parses every ReceiptStatus value', () => {
    for (const v of ['uploaded', 'extracting', 'extracted', 'failed', 'needs_review']) {
      expect(ReceiptStatus.parse(v)).toBe(v);
    }
  });

  it('rejects an unknown InsightType', () => {
    expect(() => InsightType.parse('made_up')).toThrow();
  });
});

describe('primitives', () => {
  it('coerces numeric money to a 2-decimal string', () => {
    expect(MoneySchema.parse(12.4)).toBe('12.40');
  });

  it('accepts string money with one or two decimals', () => {
    expect(MoneySchema.parse('13.5')).toBe('13.5');
    expect(MoneySchema.parse('0.99')).toBe('0.99');
  });

  it('rejects money with too many decimals', () => {
    expect(() => MoneySchema.parse('1.234')).toThrow();
  });

  it('requires ISO-4217 currency', () => {
    expect(CurrencyCodeSchema.parse('USD')).toBe('USD');
    expect(() => CurrencyCodeSchema.parse('usd')).toThrow();
    expect(() => CurrencyCodeSchema.parse('US')).toThrow();
  });

  it('defaults pagination limit', () => {
    const out = PaginationCursorSchema.parse({});
    expect(out.limit).toBe(20);
  });
});

describe('ExtractResponse', () => {
  const valid = {
    merchant: 'Starbucks',
    rawMerchant: 'STARBUCKS #1234',
    currency: 'USD',
    subtotal: 12.4,
    tax: 1.1,
    tip: 0,
    total: 13.5,
    purchasedAt: '2026-05-22T15:04:00Z',
    paymentLast4: '1234',
    items: [
      {
        name: 'Latte',
        unitPrice: 5.2,
        quantity: 1,
        lineTotal: 5.2,
        category: 'dining',
        confidence: 0.96,
      },
    ],
    fieldConfidence: { merchant: 0.98, total: 0.99, items: 0.93 },
    model: 'gpt-4o-2024-11-20',
    promptVersion: 'extract-v3',
    usage: { promptTokens: 1820, completionTokens: 340, costUsdEstimate: 0.0091 },
  };

  it('round-trips a valid extract payload', () => {
    expect(() => ExtractResponseSchema.parse(valid)).not.toThrow();
  });

  it('rejects when total is missing', () => {
    const { total: _t, ...invalid } = valid;
    expect(() => ExtractResponseSchema.parse(invalid)).toThrow();
  });

  it('rejects payment_last4 that is not 4 digits', () => {
    expect(() => ExtractResponseSchema.parse({ ...valid, paymentLast4: '12' })).toThrow();
  });
});

describe('RecommendInput', () => {
  it('requires currency and embedded location for /recommend', () => {
    const out = RecommendInputSchema.parse({
      windowDays: 90,
      currency: 'CAD',
      location: { label: 'Toronto, ON, Canada', country: 'CA', merchantHints: ['4521'] },
      summary: {
        topMerchants: [],
        monthlyTotals: [],
        recurringCandidates: [],
      },
    });
    expect(out.currency).toBe('CAD');
    expect(out.location.label).toContain('Toronto');
  });
});

describe('UploadResponse + Insight', () => {
  it('parses a typical upload response with deduped default', () => {
    const out = UploadResponseSchema.parse({
      receiptId: 'r_123',
      status: 'uploaded',
      jobId: 'job_456',
    });
    expect(out.deduped).toBe(false);
  });

  it('parses an Insight with explainability fields', () => {
    const out = InsightSchema.parse({
      id: 'ins_1',
      type: 'subscription_waste',
      title: 'Cancel unused Netflix',
      description: '6 charges, no activity.',
      estimatedSavings: 191.88,
      currency: 'USD',
      action: { label: 'Cancel', kind: 'external_link', target: 'https://example.com' },
      status: 'new',
      sourceReceiptIds: ['r1', 'r2'],
      sourceSubscriptionId: 's1',
      modelVersion: 'gpt-4o',
      promptVersion: 'recommend-v2',
      createdAt: '2026-05-22T15:04:00Z',
    });
    expect(out.sourceReceiptIds).toHaveLength(2);
  });
});
