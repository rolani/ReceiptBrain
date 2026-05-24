'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@receiptbrain/ui';

export interface InsightCardProps {
  id: string;
  type: 'cheaper_alternative' | 'subscription_waste' | 'spending_spike' | 'optimization_tip';
  title: string;
  description: string;
  estimatedSavings: string | null;
  currency: string | null;
  status: 'new' | 'seen' | 'dismissed' | 'actioned';
  sourceReceiptIds: string[];
  action?: { label: string; kind: 'external_link' | 'in_app' | 'dismiss'; target?: string } | null;
}

const TYPE_LABEL: Record<InsightCardProps['type'], string> = {
  cheaper_alternative: 'Cheaper alternative',
  subscription_waste: 'Subscription waste',
  spending_spike: 'Spending spike',
  optimization_tip: 'Tip',
};

async function patchStatus(id: string, status: InsightCardProps['status']): Promise<void> {
  const res = await fetch(`/api/insights/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`PATCH /api/insights/${id} -> ${res.status}`);
}

export function InsightCard(p: InsightCardProps) {
  const qc = useQueryClient();
  const dismiss = useMutation({
    mutationFn: () => patchStatus(p.id, 'dismissed'),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['insights'] });
      const prev = qc.getQueryData(['insights']);
      qc.setQueryData(['insights'], (old: { items: InsightCardProps[] } | undefined) =>
        old ? { ...old, items: old.items.filter((i) => i.id !== p.id) } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['insights'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['insights'] }),
  });

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {TYPE_LABEL[p.type]}
        </span>
        {p.estimatedSavings ? (
          <span className="text-sm font-semibold text-emerald-700">
            Save ~${p.estimatedSavings} {p.currency}
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-base font-semibold text-slate-900">{p.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{p.description}</p>
      <p className="mt-3 text-xs text-slate-500">
        Based on {p.sourceReceiptIds.length} receipt{p.sourceReceiptIds.length === 1 ? '' : 's'}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => dismiss.mutate()} disabled={dismiss.isPending}>
          Dismiss
        </Button>
        {p.action && p.action.kind === 'external_link' && p.action.target ? (
          <a
            href={p.action.target}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {p.action.label}
          </a>
        ) : null}
      </div>
    </article>
  );
}
