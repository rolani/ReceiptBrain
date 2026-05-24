// Spending-spike detector: flag any current-month category total that exceeds
// the rolling 90-day mean by more than two standard deviations.

export interface CategorySpend {
  category: string;
  /** Map of YYYY-MM → total spend for that category in that month. */
  monthlyTotals: Map<string, number>;
}

export interface SpikeFinding {
  category: string;
  month: string;
  total: number;
  mean: number;
  stdev: number;
  zScore: number;
}

export const SPIKE_Z_THRESHOLD = 2;

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const variance = xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

export function detectSpikes(
  data: CategorySpend[],
  currentMonth: string,
  threshold: number = SPIKE_Z_THRESHOLD,
): SpikeFinding[] {
  const out: SpikeFinding[] = [];
  for (const { category, monthlyTotals } of data) {
    const current = monthlyTotals.get(currentMonth);
    if (current === undefined) continue;
    const historical: number[] = [];
    for (const [m, total] of monthlyTotals) {
      if (m !== currentMonth) historical.push(total);
    }
    if (historical.length < 2) continue;
    const μ = mean(historical);
    const σ = stdev(historical);
    if (σ === 0) continue;
    const z = (current - μ) / σ;
    if (z >= threshold) {
      out.push({
        category,
        month: currentMonth,
        total: Number(current.toFixed(2)),
        mean: Number(μ.toFixed(2)),
        stdev: Number(σ.toFixed(2)),
        zScore: Number(z.toFixed(2)),
      });
    }
  }
  return out;
}
