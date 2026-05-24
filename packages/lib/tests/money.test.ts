import { describe, expect, it } from 'vitest';
import { formatMoney, fromCents, toCents } from '../src/money.js';

describe('formatMoney', () => {
  it('formats USD with the dollar sign and 2 decimals', () => {
    expect(formatMoney(12.4, 'USD')).toBe('$12.40');
  });

  it('formats EUR with the locale-appropriate symbol', () => {
    const out = formatMoney(12.4, 'EUR', 'de-DE');
    expect(out).toContain('12,40');
    expect(out).toContain('€');
  });

  it('accepts a string amount', () => {
    expect(formatMoney('13.5', 'USD')).toBe('$13.50');
  });

  it('throws on NaN', () => {
    expect(() => formatMoney('not-a-number', 'USD')).toThrow(TypeError);
  });
});

describe('cents conversion', () => {
  it('rounds to the nearest cent', () => {
    expect(toCents(13.555)).toBe(1356);
    expect(toCents('0.1')).toBe(10);
  });

  it('round-trips via fromCents', () => {
    expect(fromCents(toCents(13.5))).toBe('13.50');
  });

  it('rejects non-integer cents', () => {
    expect(() => fromCents(13.5)).toThrow(TypeError);
  });
});
