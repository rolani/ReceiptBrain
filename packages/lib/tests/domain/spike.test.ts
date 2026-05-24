import { describe, expect, it } from 'vitest';
import { detectSpikes, type CategorySpend } from '../../src/domain/spike.js';

function spend(values: Record<string, number>): Map<string, number> {
  return new Map(Object.entries(values));
}

describe('detectSpikes', () => {
  it('flags a category with >2σ current-month spend', () => {
    const data: CategorySpend[] = [
      {
        category: 'dining',
        monthlyTotals: spend({
          '2026-01': 50,
          '2026-02': 60,
          '2026-03': 55,
          '2026-04': 700, // current
        }),
      },
    ];
    const out = detectSpikes(data, '2026-04');
    expect(out).toHaveLength(1);
    expect(out[0]!.zScore).toBeGreaterThan(2);
    expect(out[0]!.category).toBe('dining');
  });

  it('ignores categories with insufficient history', () => {
    const data: CategorySpend[] = [
      { category: 'travel', monthlyTotals: spend({ '2026-04': 1000 }) },
    ];
    expect(detectSpikes(data, '2026-04')).toHaveLength(0);
  });

  it('does not flag stable spending (within 2σ)', () => {
    // Historical months span 350–470 so σ ≈ 50; current 460 → z < 2.
    const data: CategorySpend[] = [
      {
        category: 'groceries',
        monthlyTotals: spend({
          '2026-01': 350,
          '2026-02': 470,
          '2026-03': 400,
          '2026-04': 460,
        }),
      },
    ];
    expect(detectSpikes(data, '2026-04')).toHaveLength(0);
  });

  it('skips categories with zero historical variance', () => {
    const data: CategorySpend[] = [
      {
        category: 'utilities',
        monthlyTotals: spend({
          '2026-01': 100,
          '2026-02': 100,
          '2026-03': 100,
          '2026-04': 999, // big jump but stdev=0
        }),
      },
    ];
    expect(detectSpikes(data, '2026-04')).toHaveLength(0);
  });
});
