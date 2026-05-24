export interface SpendPoint {
  label: string;
  date: string;
  value: number;
}

export interface SpendAreaChartProps {
  data: SpendPoint[];
  height?: number;
  currency?: string;
}

const W = 720;
const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;

function formatMoney(v: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: v >= 100 ? 0 : 2,
    }).format(v);
  } catch {
    return `$${v.toFixed(0)}`;
  }
}

export function SpendAreaChart({ data, height = 220, currency = 'USD' }: SpendAreaChartProps) {
  const h = height;
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        No spending data yet
      </div>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = niceCeiling(max);
  const innerW = W - PAD_L - PAD_R;
  const innerH = h - PAD_T - PAD_B;

  const xFor = (i: number) =>
    data.length === 1 ? PAD_L + innerW / 2 : PAD_L + (i * innerW) / (data.length - 1);
  const yFor = (v: number) => PAD_T + innerH - (v / niceMax) * innerH;

  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(d.value).toFixed(2)}`)
    .join(' ');
  const areaD = `${pathD} L ${xFor(data.length - 1).toFixed(2)} ${PAD_T + innerH} L ${xFor(0).toFixed(
    2,
  )} ${PAD_T + innerH} Z`;

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (niceMax * i) / yTicks);

  const xTickEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${h}`}
        role="img"
        aria-label="Spending over time"
        className="h-auto w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="spendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {tickValues.map((t, i) => {
          const y = yFor(t);
          return (
            <g key={i}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={i === 0 ? '' : '3 3'}
              />
              <text
                x={PAD_L - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="ui-sans-serif, system-ui"
              >
                {formatMoney(t, currency)}
              </text>
            </g>
          );
        })}

        <path d={areaD} fill="url(#spendArea)" />
        <path d={pathD} fill="none" stroke="#0f172a" strokeWidth={2} strokeLinejoin="round" />

        {data.map((d, i) => (
          <circle key={i} cx={xFor(i)} cy={yFor(d.value)} r={2.5} fill="#0f172a">
            <title>{`${d.label}: ${formatMoney(d.value, currency)}`}</title>
          </circle>
        ))}

        {data.map((d, i) =>
          i % xTickEvery === 0 || i === data.length - 1 ? (
            <text
              key={`xl-${i}`}
              x={xFor(i)}
              y={h - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
              fontFamily="ui-sans-serif, system-ui"
            >
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}

function niceCeiling(v: number): number {
  if (v <= 1) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  let nice: number;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * mag;
}
