'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@receiptbrain/ui';

async function requestInsights(): Promise<{ jobId: string; status: string }> {
  const res = await fetch('/api/recommend', { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? `Could not start insights generation (${res.status})`,
    );
  }
  return res.json();
}

/**
 * Manual trigger for cross-receipt insight generation.
 *
 * The worker-side auto-enqueue already runs after each receipt extraction
 * with a 5-minute debounce, so this button is the "I want it now" escape
 * hatch. It POSTs to `/api/recommend`, which enqueues `generate_insights`
 * with the user's id as the BullMQ jobId (idempotent within the debounce).
 */
export function InsightsGenerateButton() {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: requestInsights,
    onSuccess: () => {
      // Poll while the worker runs generate_insights (often 10–30s with OpenAI).
      const poll = () => qc.invalidateQueries({ queryKey: ['insights'] });
      poll();
      const t1 = setTimeout(poll, 5_000);
      const t2 = setTimeout(poll, 15_000);
      const t3 = setTimeout(poll, 30_000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    },
  });

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="primary"
        loading={mut.isPending}
        onClick={() => mut.mutate()}
      >
        Generate insights
      </Button>
      {mut.isSuccess ? (
        <p role="status" className="text-xs text-slate-500">
          Queued — new insights should appear shortly.
        </p>
      ) : null}
      {mut.isError ? (
        <p role="alert" className="text-xs text-red-700">
          {String(mut.error.message)}
        </p>
      ) : null}
    </div>
  );
}
