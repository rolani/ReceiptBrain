import { describe, expect, it } from 'vitest';
import {
  MERCHANT_MATCH_THRESHOLD,
  jaroWinkler,
  matchMerchant,
  normalizeMerchant,
} from '../../src/domain/merchant.js';

describe('normalizeMerchant', () => {
  it('strips store numbers, suffixes and punctuation', () => {
    expect(normalizeMerchant('STARBUCKS #1234')).toBe('starbucks');
    expect(normalizeMerchant('Whole Foods Mkt **8821**')).toBe('whole foods mkt');
    expect(normalizeMerchant('ACME, INC.')).toBe('acme');
    expect(normalizeMerchant('  TARGET   01284 ')).toBe('target');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeMerchant('')).toBe('');
  });
});

describe('jaroWinkler', () => {
  it('returns 1 for identical strings', () => {
    expect(jaroWinkler('starbucks', 'starbucks')).toBe(1);
  });
  it('returns 0 for completely different strings', () => {
    expect(jaroWinkler('apple', 'zzzzz')).toBe(0);
  });
  it('rewards shared prefixes (Winkler boost)', () => {
    const a = jaroWinkler('starbucks', 'starbuxs'); // shared "starbu"
    const b = jaroWinkler('starbucks', 'xxxbucks');
    expect(a).toBeGreaterThan(b);
    expect(a).toBeGreaterThan(0.9);
  });
});

describe('matchMerchant', () => {
  const candidates = [
    { id: 'm1', canonicalName: 'Starbucks' },
    { id: 'm2', canonicalName: 'Whole Foods' },
    { id: 'm3', canonicalName: 'Netflix' },
  ];

  it('matches the same merchant via fuzzy similarity', () => {
    const r = matchMerchant('STARBUCKS #1234', candidates);
    expect(r.matched?.id).toBe('m1');
    expect(r.similarity).toBeGreaterThanOrEqual(MERCHANT_MATCH_THRESHOLD);
  });

  it('returns null when no candidate clears the threshold', () => {
    const r = matchMerchant('Brand New Coffee Shop', candidates);
    expect(r.matched).toBeNull();
  });

  it('exposes the normalized merchant string for storage', () => {
    expect(matchMerchant('NETFLIX.COM', candidates).normalized).toContain('netflix');
  });
});
