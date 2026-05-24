import { formatReceiptDate } from '@/lib/format-money';

export interface SubscriptionCardProps {
  id: string;
  merchant: string;
  amount: string;
  currency: string;
  interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextChargeEstimate: string | null;
  confidence: number;
  status: 'active' | 'paused' | 'cancelled' | 'unconfirmed';
  sourceReceiptIds: string[];
}

const STATUS_CLASS: Record<SubscriptionCardProps['status'], string> = {
  active: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-slate-200 text-slate-700',
  unconfirmed: 'bg-blue-100 text-blue-800',
};

export function SubscriptionCard(p: SubscriptionCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{p.merchant}</h3>
          <p className="mt-1 text-sm text-slate-600">
            ${p.amount} {p.currency} · {p.interval}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[p.status]}`}>
          {p.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          {p.nextChargeEstimate
            ? `Next charge ~${formatReceiptDate(p.nextChargeEstimate)}`
            : 'No next charge estimated'}
        </span>
        <span>Confidence {Math.round(p.confidence * 100)}%</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Based on {p.sourceReceiptIds.length} receipt{p.sourceReceiptIds.length === 1 ? '' : 's'}
      </p>
    </article>
  );
}
