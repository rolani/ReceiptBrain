import Link from 'next/link';
import { formatReceiptAmount, formatReceiptDate } from '@/lib/format-money';

export interface ReceiptCardProps {
  id: string;
  merchant: string | null;
  total: string | null;
  currency: string | null;
  purchasedAt: string | null;
  status: 'uploaded' | 'extracting' | 'extracted' | 'failed' | 'needs_review';
  confidence?: number | null;
}

const STATUS_STYLE: Record<
  ReceiptCardProps['status'],
  { label: string; chip: string; dot: string }
> = {
  uploaded: {
    label: 'Uploaded',
    chip: 'bg-slate-100 text-slate-600 ring-slate-200/80',
    dot: 'bg-slate-400',
  },
  extracting: {
    label: 'Processing',
    chip: 'bg-amber-50 text-amber-800 ring-amber-200/80',
    dot: 'bg-amber-500 animate-pulse',
  },
  extracted: {
    label: 'Extracted',
    chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: 'Failed',
    chip: 'bg-red-50 text-red-800 ring-red-200/80',
    dot: 'bg-red-500',
  },
  needs_review: {
    label: 'Review',
    chip: 'bg-orange-50 text-orange-800 ring-orange-200/80',
    dot: 'bg-orange-500',
  },
};

export function ReceiptCard(p: ReceiptCardProps) {
  const status = STATUS_STYLE[p.status];

  return (
    <Link
      href={`/receipts/${p.id}`}
      className="receipt-card group flex h-full min-h-[7.5rem] flex-col p-3 transition hover:border-slate-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${status.chip}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden />
          {status.label}
        </span>
      </div>

      <div className="mt-2 min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-slate-950">
          {p.merchant ?? 'Unknown merchant'}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{formatReceiptDate(p.purchasedAt)}</p>
      </div>

      <div className="mt-2 flex items-end justify-between border-t border-slate-200 pt-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          Total
        </span>
        <span className="text-base font-semibold tabular-nums text-slate-900">
          {formatReceiptAmount(p.total, p.currency)}
        </span>
      </div>
    </Link>
  );
}
