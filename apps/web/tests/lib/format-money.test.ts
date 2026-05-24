import { describe, expect, it } from 'vitest';
import { formatReceiptAmount, formatReceiptDate } from '@/lib/format-money';

describe('formatReceiptAmount', () => {
  it('prefixes USD with dollar sign', () => {
    expect(formatReceiptAmount('12.50', 'USD')).toBe('$12.50');
  });

  it('returns em dash when total missing', () => {
    expect(formatReceiptAmount(null, 'USD')).toBe('—');
  });
});

describe('formatReceiptDate', () => {
  it('returns No date for null', () => {
    expect(formatReceiptDate(null)).toBe('No date');
  });
});
