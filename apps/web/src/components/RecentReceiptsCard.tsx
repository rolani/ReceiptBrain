import Link from 'next/link';
import { formatReceiptAmount, formatReceiptDate } from '@/lib/format-money';
import { ArrowRightIcon, ReceiptIcon } from './ui/Icons';

export interface RecentReceiptRow {
  id: string;
  merchant: string | null;
  total: string | null;
  currency: string | null;
  purchasedAt: string | null;
  status: 'uploaded' | 'extracting' | 'extracted' | 'failed' | 'needs_review';
}

const STATUS_DOT: Record<RecentReceiptRow['status'], string> = {
  uploaded: 'bg-slate-400',
  extracting: 'bg-amber-500 animate-pulse',
  extracted: 'bg-emerald-500',
  failed: 'bg-red-500',
  needs_review: 'bg-orange-500',
};

export function RecentReceiptsCard({ rows }: { rows: RecentReceiptRow[] }) {
  return (
    <section className="card-surface flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <ReceiptIcon size={18} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">Recent receipts</h2>
        </div>
        <Link
          href="/receipts"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          View all <ArrowRightIcon size={14} />
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-5 py-10 text-center text-sm text-slate-400">
          <div>
            <p>No receipts yet.</p>
            <Link
              href="/upload"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
            >
              Upload your first <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/receipts/${r.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[r.status]}`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {r.merchant ?? 'Unknown merchant'}
                    </p>
                    <p className="text-xs text-slate-500">{formatReceiptDate(r.purchasedAt)}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                  {formatReceiptAmount(r.total, r.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
