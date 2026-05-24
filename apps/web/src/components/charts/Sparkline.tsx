export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
}

export function Sparkline({
  values,
  width = 120,
  height = 36,
  stroke = '#0f172a',
  fill = 'rgba(15, 23, 42, 0.08)',
}: SparklineProps) {
  if (values.length === 0) return null;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  const pts: Array<[number, number]> = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });

  const linePath = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${(values.length - 1) * stepX} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden
      className="block"
    >
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
