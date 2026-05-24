'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DashboardSummary } from '@/components/DashboardSummary';
import { SpendAreaChart } from '@/components/charts/SpendAreaChart';
import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { RecentReceiptsCard } from '@/components/RecentReceiptsCard';
import { TopInsightsCard } from '@/components/TopInsightsCard';
import { PageHeader, PrimaryLinkButton } from '@/components/ui/PageHeader';
import { CameraIcon, SparklesIcon } from '@/components/ui/Icons';
import type { DashboardPayload } from '@/lib/dashboard-data';
import { RECEIPT_STATUS_POLL_MS } from '@/lib/receipt-status';

async function fetchDashboard(): Promise<DashboardPayload> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
  return res.json();
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card-surface h-36 animate-pulse bg-slate-50" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card-surface h-72 animate-pulse bg-slate-50 xl:col-span-2" />
        <div className="card-surface h-72 animate-pulse bg-slate-50" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const q = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: (query) =>
      query.state.data?.hasInFlightReceipts ? RECEIPT_STATUS_POLL_MS : false,
  });

  if (q.isLoading) return <DashboardSkeleton />;

  if (q.isError || !q.data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        Could not load dashboard — {String(q.error?.message ?? 'unknown error')}
      </div>
    );
  }

  const data = q.data;
  const spendSeries = data.spendSeries;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.greeting}
        description={
          data.hasInFlightReceipts
            ? 'Updating as receipts finish processing…'
            : "Here's what's happening with your spending in the last 30 days."
        }
        action={<PrimaryLinkButton href="/upload">Upload receipt</PrimaryLinkButton>}
      />

      <DashboardSummary
        totalSpend={data.summary.totalSpend}
        subscriptionCount={data.summary.subscriptionCount}
        potentialSavings={data.summary.potentialSavings}
        receiptsCount={data.summary.receiptsCount}
        spendTrend={data.summary.spendTrend}
        spendDeltaPct={data.summary.spendDeltaPct}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="card-surface p-5 xl:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Spending — last 30 days</h2>
              <p className="text-xs text-slate-500">Total receipts over the trailing 30 days</p>
            </div>
            {spendSeries.length > 0 ? (
              <span className="hidden text-xs text-slate-400 sm:inline">
                {spendSeries[0]?.label} – {spendSeries[spendSeries.length - 1]?.label}
              </span>
            ) : null}
          </header>
          <SpendAreaChart data={spendSeries} />
        </section>

        <section className="card-surface p-5">
          <header className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">By category</h2>
            <p className="text-xs text-slate-500">Where your dollars went</p>
          </header>
          <CategoryDonut data={data.categorySlices} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentReceiptsCard rows={data.recent} />
        <TopInsightsCard rows={data.topInsights} />
      </div>

      <section className="card-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <QuickAction
            href="/upload"
            icon={<CameraIcon size={18} className="text-slate-700" />}
            title="Upload a receipt"
            description="Snap or drop an image and we'll handle the rest."
          />
          <QuickAction
            href="/insights"
            icon={<SparklesIcon size={18} className="text-emerald-600" />}
            title="Generate insights"
            description="Find subscriptions, spikes, and savings."
          />
          <QuickAction
            href="/subscriptions"
            icon={<SparklesIcon size={18} className="text-sky-600" />}
            title="Review subscriptions"
            description="Spot what you forgot to cancel."
          />
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-inset ring-slate-200">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-950">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  );
}
