export interface CategorySlice {
  label: string;
  value: number;
}

export interface CategoryDonutProps {
  data: CategorySlice[];
  currency?: string;
}

const COLORS = [
  '#0f172a',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

function fmt(v: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: v >= 100 ? 0 : 2,
    }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

export function CategoryDonut({ data, currency = 'USD' }: CategoryDonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        No categorized spend yet
      </div>
    );
  }

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const rInner = 46;

  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const portion = d.value / total;
    const start = angle;
    const end = angle + portion * Math.PI * 2;
    angle = end;
    return { ...d, start, end, color: COLORS[i % COLORS.length], portion };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-40 w-40 shrink-0" role="img" aria-label="Spending by category">
        {slices.map((s, i) => (
          <path
            key={i}
            d={arcPath(cx, cy, r, rInner, s.start, s.end)}
            fill={s.color}
            stroke="#fff"
            strokeWidth={1.5}
          >
            <title>{`${s.label}: ${fmt(s.value, currency)} (${(s.portion * 100).toFixed(0)}%)`}</title>
          </path>
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="9"
          fill="#94a3b8"
          fontFamily="ui-sans-serif, system-ui"
        >
          TOTAL
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize="13"
          fontWeight={600}
          fill="#0f172a"
          fontFamily="ui-sans-serif, system-ui"
        >
          {fmt(total, currency)}
        </text>
      </svg>

      <ul className="flex w-full flex-col gap-1.5">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span className="truncate font-medium capitalize text-slate-700">
                {s.label.replaceAll('_', ' ')}
              </span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-500">
              {(s.portion * 100).toFixed(0)}% &middot; {fmt(s.value, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
): string {
  const epsilon = 0.0001;
  if (Math.abs(end - start - Math.PI * 2) < epsilon) {
    return [
      `M ${cx + rOuter} ${cy}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${cx - rOuter} ${cy}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${cx + rOuter} ${cy}`,
      `M ${cx + rInner} ${cy}`,
      `A ${rInner} ${rInner} 0 1 0 ${cx - rInner} ${cy}`,
      `A ${rInner} ${rInner} 0 1 0 ${cx + rInner} ${cy}`,
      'Z',
    ].join(' ');
  }
  const largeArc = end - start > Math.PI ? 1 : 0;
  const x0 = cx + rOuter * Math.cos(start);
  const y0 = cy + rOuter * Math.sin(start);
  const x1 = cx + rOuter * Math.cos(end);
  const y1 = cy + rOuter * Math.sin(end);
  const xi0 = cx + rInner * Math.cos(end);
  const yi0 = cy + rInner * Math.sin(end);
  const xi1 = cx + rInner * Math.cos(start);
  const yi1 = cy + rInner * Math.sin(start);
  return [
    `M ${x0} ${y0}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1} ${y1}`,
    `L ${xi0} ${yi0}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${xi1} ${yi1}`,
    'Z',
  ].join(' ');
}
