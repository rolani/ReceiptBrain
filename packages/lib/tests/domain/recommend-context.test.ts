import { describe, expect, it } from 'vitest';
import {
  buildRecommendLocation,
  extractMerchantLocationHints,
  resolveRecommendCurrency,
} from '../../src/domain/recommend-context.js';

describe('resolveRecommendCurrency', () => {
  it('defaults to CAD when no receipt currencies', () => {
    expect(resolveRecommendCurrency([])).toBe('CAD');
  });

  it('picks the most common ISO code in the window', () => {
    expect(resolveRecommendCurrency(['USD', 'CAD', 'CAD', null])).toBe('CAD');
  });
});

describe('extractMerchantLocationHints', () => {
  it('captures store numbers and Canadian postal codes from raw merchant', () => {
    const hints = extractMerchantLocationHints('WHOLE FOODS MKT 10402 TORONTO ON M4B1B3');
    expect(hints).toEqual(expect.arrayContaining(['10402', 'M4B1B3']));
  });
});

describe('buildRecommendLocation', () => {
  it('embeds default label plus deduped merchant hints', () => {
    const loc = buildRecommendLocation(
      ['STARBUCKS #4521', 'COSTCO WHSE #1234', 'STARBUCKS #4521'],
      { defaultLabel: 'Toronto, ON, Canada', country: 'CA' },
    );
    expect(loc.label).toBe('Toronto, ON, Canada');
    expect(loc.country).toBe('CA');
    expect(loc.merchantHints).toEqual(expect.arrayContaining(['4521', '1234']));
    expect(loc.merchantHints?.length).toBe(2);
  });
});
