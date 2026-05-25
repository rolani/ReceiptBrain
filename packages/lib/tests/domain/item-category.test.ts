import { describe, expect, it } from 'vitest';
import {
  buildCategorySlicesFromReceipts,
  inferItemCategory,
  normalizeItemCategory,
} from '../../src/domain/item-category.js';

describe('inferItemCategory', () => {
  it('uses merchant table category when set', () => {
    expect(
      inferItemCategory({
        merchantName: 'Unknown Shop',
        merchantCategory: 'groceries',
      }),
    ).toBe('groceries');
  });

  it('infers dining from coffee merchants', () => {
    expect(inferItemCategory({ merchantName: 'Starbucks' })).toBe('dining');
  });

  it('infers groceries from grocery merchants', () => {
    expect(inferItemCategory({ merchantName: 'Whole Foods Market' })).toBe('groceries');
  });

  it('infers transport from ride-share and gas', () => {
    expect(inferItemCategory({ merchantName: 'UBER *TRIP' })).toBe('transport');
    expect(inferItemCategory({ merchantName: 'Shell Oil' })).toBe('transport');
  });

  it('infers from line item name when merchant is ambiguous', () => {
    expect(
      inferItemCategory({
        merchantName: 'AMZN Mktp',
        itemName: 'Organic milk gallon',
      }),
    ).toBe('groceries');
  });
});

describe('normalizeItemCategory', () => {
  it('accepts valid enum values', () => {
    expect(normalizeItemCategory('dining')).toBe('dining');
  });

  it('maps unknown strings to other', () => {
    expect(normalizeItemCategory('misc')).toBe('other');
  });
});

describe('buildCategorySlicesFromReceipts', () => {
  it('splits spend across inferred categories instead of one other bucket', () => {
    const slices = buildCategorySlicesFromReceipts([
      {
        total: null,
        rawMerchant: 'STARBUCKS',
        merchant: { canonicalName: 'Starbucks', category: null },
        items: [
          { name: 'Latte', lineTotal: 5, category: null },
          { name: 'Muffin', lineTotal: 3, category: null },
        ],
      },
      {
        total: null,
        rawMerchant: 'WHOLE FOODS',
        merchant: { canonicalName: 'Whole Foods', category: 'groceries' },
        items: [{ name: 'Eggs', lineTotal: 12, category: null }],
      },
      {
        total: 45,
        rawMerchant: 'SHELL',
        merchant: { canonicalName: 'Shell', category: null },
        items: [],
      },
    ]);

    const labels = slices.map((s) => s.label);
    expect(labels).toContain('dining');
    expect(labels).toContain('groceries');
    expect(labels).toContain('transport');
    expect(labels).not.toEqual(['other']);
  });
});
