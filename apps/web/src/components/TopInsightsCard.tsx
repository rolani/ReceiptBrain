import Link from 'next/link';
import { ArrowRightIcon, InsightsIcon, SparklesIcon } from './ui/Icons';

export interface TopInsightRow {
  id: string;
  type: 'cheaper_alternative' | 'subscription_waste' | 'spending_spike' | 'optimization_tip';
  title: string;
  estimatedSavings: string | null;
  currency: string | null;
}

const TYPE_LABEL: Record<TopInsightRow['type'], string> = {
  cheaper_alternative: 'Cheaper alternative',
  subscription_waste: 'Subscription waste',
  spending_spike: 'Spending spike',
  optimization_tip: 'Tip',
};

const TYPE_TONE: Record<TopInsightRow['type'], string> = {
  cheaper_alternative: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  subscription_waste: 'bg-rose-50 text-rose-700 ring-rose-200/80',
  spending_spike: 'bg-amber-50 text-amber-700 ring-amber-200/80',
  optimization_tip: 'bg-sky-50 text-sky-700 ring-sky-200/80',
};

export function TopInsightsCard({ rows }: { rows: TopInsightRow[] }) {
  return (
    <section className="card-surface flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <InsightsIcon size={18} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">Top insights</h2>
        </div>
        <Link
          href="/insights"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          View all <ArrowRightIcon size={14} />
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-5 py-10 text-center text-sm text-slate-400">
          <div>
            <SparklesIcon size={22} className="mx-auto mb-2 text-slate-300" />
            <p>No insights yet — upload a few receipts to start.</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((i) => (
            <li key={i.id}>
              <Link
                href="/insights"
                className="flex items-start justify-between gap-3 px-5 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${TYPE_TONE[i.type]}`}
                  >
                    {TYPE_LABEL[i.type]}
                  </span>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium text-slate-900">
                    {i.title}
                  </p>
                </div>
                {i.estimatedSavings ? (
                  <span className="shrink-0 text-right text-sm font-semibold text-emerald-700">
                    Save ${i.estimatedSavings}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
