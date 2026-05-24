'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@receiptbrain/ui';
import { InsightCard, type InsightCardProps } from '@/components/InsightCard';
import { InsightsGenerateButton } from '@/components/InsightsGenerateButton';
import { PageHeader } from '@/components/ui/PageHeader';

interface InsightsResponse {
  items: InsightCardProps[];
  nextCursor: string | null;
}

async function fetchInsights(): Promise<InsightsResponse> {
  const res = await fetch('/api/insights?limit=50');
  if (!res.ok) throw new Error(`Failed (${res.status})`);
  return res.json();
}

export default function InsightsPage() {
  const q = useQuery({ queryKey: ['insights'], queryFn: fetchInsights });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Insights"
        description="Subscriptions, spending spikes, and optimization tips from your receipts."
        action={<InsightsGenerateButton />}
      />
      {q.isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
      ) : !q.data || q.data.items.length === 0 ? (
        <EmptyState
          title="No insights yet"
          description="Upload a few receipts, then click Generate insights — or wait a few minutes and they'll appear automatically."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {q.data.items.map((i) => (
            <InsightCard key={i.id} {...i} />
          ))}
        </div>
      )}
    </div>
  );
}
