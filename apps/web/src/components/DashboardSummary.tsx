import type { ReactNode } from 'react';
import { Sparkline } from './charts/Sparkline';
import {
  PiggyBankIcon,
  ReceiptIcon,
  SubscriptionsIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from './ui/Icons';

export interface DashboardSummaryProps {
  totalSpend: string;
  subscriptionCount: number;
  potentialSavings: string;
  receiptsCount?: number;
  spendTrend?: number[];
  subsTrend?: number[];
  savingsTrend?: number[];
  spendDeltaPct?: number | null;
}

export function DashboardSummary({
  totalSpend,
  subscriptionCount,
  potentialSavings,
  receiptsCount,
  spendTrend,
  subsTrend,
  savingsTrend,
  spendDeltaPct,
}: DashboardSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Total spend (30d)"
        value={`$${totalSpend}`}
        icon={<ReceiptIcon size={18} className="text-slate-500" />}
        trendValues={spendTrend}
        deltaPct={spendDeltaPct}
        deltaGoodDirection="down"
      />
      <KpiCard
        title="Active subscriptions"
        value={String(subscriptionCount)}
        icon={<SubscriptionsIcon size={18} className="text-sky-600" />}
        trendValues={subsTrend}
        trendStroke="#0284c7"
        trendFill="rgba(2, 132, 199, 0.10)"
      />
      <KpiCard
        title="Potential savings"
        value={`$${potentialSavings}`}
        icon={<PiggyBankIcon size={18} className="text-emerald-600" />}
        valueClassName="text-emerald-700"
        trendValues={savingsTrend}
        trendStroke="#059669"
        trendFill="rgba(5, 150, 105, 0.10)"
      />
      <KpiCard
        title="Receipts captured"
        value={String(receiptsCount ?? 0)}
        icon={<ReceiptIcon size={18} className="text-violet-600" />}
        trendValues={spendTrend?.map((v) => (v > 0 ? 1 : 0))}
        trendStroke="#7c3aed"
        trendFill="rgba(124, 58, 237, 0.10)"
      />
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  valueClassName?: string;
  trendValues?: number[];
  trendStroke?: string;
  trendFill?: string;
  deltaPct?: number | null;
  deltaGoodDirection?: 'up' | 'down';
}

function KpiCard({
  title,
  value,
  icon,
  valueClassName,
  trendValues,
  trendStroke,
  trendFill,
  deltaPct,
  deltaGoodDirection = 'up',
}: KpiCardProps) {
  const hasDelta = typeof deltaPct === 'number' && Number.isFinite(deltaPct);
  const isUp = hasDelta && deltaPct! > 0;
  const isDown = hasDelta && deltaPct! < 0;
  const good = hasDelta
    ? (deltaGoodDirection === 'up' && isUp) || (deltaGoodDirection === 'down' && isDown)
    : false;
  const bad = hasDelta && !good && (isUp || isDown);
  const deltaColor = good ? 'text-emerald-700' : bad ? 'text-rose-700' : 'text-slate-500';
  const TrendIcon = isUp ? TrendingUpIcon : TrendingDownIcon;

  return (
    <div className="card-surface group p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-inset ring-slate-200">
          {icon}
        </span>
        {hasDelta ? (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${deltaColor}`}>
            <TrendIcon size={14} />
            {Math.abs(deltaPct!).toFixed(0)}%
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${valueClassName ?? 'text-slate-900'}`}
      >
        {value}
      </div>
      {trendValues && trendValues.length > 1 ? (
        <div className="mt-3">
          <Sparkline
            values={trendValues}
            height={32}
            width={220}
            stroke={trendStroke}
            fill={trendFill}
          />
        </div>
      ) : null}
    </div>
  );
}
