'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@receiptbrain/ui';
import { ReceiptCard, type ReceiptCardProps } from './ReceiptCard';
import { ReceiptDeleteButton } from './ReceiptDeleteButton';
import {
  isInFlightReceiptStatus,
  RECEIPT_STATUS_POLL_MS,
} from '@/lib/receipt-status';

interface ReceiptListResponse {
  items: ReceiptCardProps[];
  nextCursor: string | null;
}

async function fetchReceipts(): Promise<ReceiptListResponse> {
  const res = await fetch('/api/receipts?limit=50');
  if (!res.ok) throw new Error(`Failed to load receipts (${res.status})`);
  return res.json();
}

function ReceiptGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="receipt-card h-[7.5rem] animate-pulse bg-slate-50 p-3">
          <div className="h-4 w-16 rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function ReceiptList() {
  const q = useQuery({
    queryKey: ['receipts'],
    queryFn: fetchReceipts,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      return items.some((r) => isInFlightReceiptStatus(r.status))
        ? RECEIPT_STATUS_POLL_MS
        : false;
    },
  });

  if (q.isLoading) return <ReceiptGridSkeleton />;

  if (q.isError) {
    return (
      <EmptyState
        title="Could not load receipts"
        description={String(q.error.message)}
      />
    );
  }

  if (!q.data || q.data.items.length === 0) {
    return (
      <EmptyState
        title="No receipts yet"
        description="Upload your first receipt to get extraction and insights."
      />
    );
  }

  const items = q.data.items;
  const inFlight = items.filter((r) => isInFlightReceiptStatus(r.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
        <p>
          <span className="font-medium text-slate-700">{items.length}</span> receipt
          {items.length === 1 ? '' : 's'}
          {inFlight > 0 ? (
            <span className="ml-2 text-amber-700">· {inFlight} processing</span>
          ) : null}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((r) => (
          <li key={r.id} className="group relative list-none">
            <ReceiptCard {...r} />
            <div className="absolute right-2 top-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <ReceiptDeleteButton
                receiptId={r.id}
                label={r.merchant}
                redirectTo={null}
                variant="icon"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
