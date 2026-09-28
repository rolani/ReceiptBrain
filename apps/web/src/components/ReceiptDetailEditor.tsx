'use client';

import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@receiptbrain/ui';
import type { FieldConfidence } from '@receiptbrain/contracts';
import {
  fromDatetimeLocalValue,
  getReviewReasons,
  toDatetimeLocalValue,
} from '@receiptbrain/lib/domain';
import { isInFlightReceiptStatus } from '@/lib/receipt-status';

export interface ReceiptDetail {
  id: string;
  status: 'uploaded' | 'extracting' | 'extracted' | 'failed' | 'needs_review' | string;
  merchant: string | null;
  rawMerchant: string | null;
  total: string | null;
  currency: string | null;
  purchasedAt: string | null;
  fieldConfidence?: FieldConfidence | null;
  items: Array<{
    id: string;
    lineNumber: number;
    name: string;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
  }>;
}

async function reextract(id: string): Promise<void> {
  const res = await fetch(`/api/receipts/${id}/reextract`, { method: 'POST' });
  if (!res.ok) throw new Error(`Re-extract failed (${res.status})`);
}

interface FormValues {
  rawMerchant: string;
  total: string;
  purchasedAtLocal: string;
}

interface PatchBody {
  rawMerchant?: string;
  total?: string;
  purchasedAt?: string;
  status?: 'extracted';
}

async function patchReceipt(id: string, body: PatchBody): Promise<void> {
  const res = await fetch(`/api/receipts/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.message ?? `Failed (${res.status})`);
  }
}

function buildPatchPayload(values: FormValues, status?: 'extracted'): PatchBody {
  const payload: PatchBody = {
    rawMerchant: values.rawMerchant,
    total: values.total,
  };
  const purchasedAt = fromDatetimeLocalValue(values.purchasedAtLocal);
  if (purchasedAt) payload.purchasedAt = purchasedAt;
  if (status) payload.status = status;
  return payload;
}

function formValuesFromReceipt(receipt: ReceiptDetail): FormValues {
  return {
    rawMerchant: receipt.merchant ?? receipt.rawMerchant ?? '',
    total: receipt.total ?? '',
    purchasedAtLocal: toDatetimeLocalValue(receipt.purchasedAt),
  };
}

export function ReceiptDetailEditor({ receipt }: { receipt: ReceiptDetail }) {
  const router = useRouter();
  const qc = useQueryClient();
  const reviewReasons =
    receipt.status === 'needs_review'
      ? getReviewReasons({
          fieldConfidence: receipt.fieldConfidence,
          purchasedAt: receipt.purchasedAt,
        })
      : [];

  const form = useForm<FormValues>({
    defaultValues: formValuesFromReceipt(receipt),
  });

  // react-hook-form only applies defaultValues on mount. When the user opens the
  // detail page while extraction is in-flight, the poller refreshes server props
  // once items/merchant/total/date arrive — sync the editable fields then.
  useEffect(() => {
    if (isInFlightReceiptStatus(receipt.status)) return;
    form.reset(formValuesFromReceipt(receipt));
  }, [
    receipt.id,
    receipt.status,
    receipt.merchant,
    receipt.rawMerchant,
    receipt.total,
    receipt.purchasedAt,
    form,
  ]);

  const save = useMutation({
    mutationFn: (v: FormValues) => patchReceipt(receipt.id, buildPatchPayload(v)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['receipts'] });
      router.refresh();
    },
  });

  const markReviewed = useMutation({
    mutationFn: (v: FormValues) =>
      patchReceipt(receipt.id, buildPatchPayload(v, 'extracted')),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['receipts'] });
      router.refresh();
    },
  });

  const retry = useMutation({
    mutationFn: () => reextract(receipt.id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['receipts'] });
      router.refresh();
    },
  });

  const onSubmit = form.handleSubmit((v) => save.mutate(v));

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      {receipt.status === 'failed' ? (
        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <span>Extraction failed. Try again?</span>
          <Button type="button" variant="secondary" onClick={() => retry.mutate()} loading={retry.isPending}>
            Re-extract
          </Button>
        </div>
      ) : null}

      {receipt.status === 'needs_review' ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-medium">This receipt needs review</p>
          {reviewReasons.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900">
              {reviewReasons.map((r) => (
                <li key={r.field}>{r.message}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-amber-800">
            Fix any fields below, then mark as reviewed when the data looks correct.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              loading={markReviewed.isPending}
              onClick={form.handleSubmit((v) => markReviewed.mutate(v))}
            >
              Mark as reviewed
            </Button>
            <Button type="button" variant="secondary" onClick={() => retry.mutate()} loading={retry.isPending}>
              Re-extract
            </Button>
          </div>
          {markReviewed.isError ? (
            <p role="alert" className="mt-2 text-red-700">
              {String(markReviewed.error.message)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="rawMerchant" className="block text-sm font-medium">
          Merchant
        </label>
        <input
          id="rawMerchant"
          {...form.register('rawMerchant', { required: true })}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="total" className="block text-sm font-medium">
          Total
        </label>
        <input
          id="total"
          {...form.register('total', { pattern: /^\d+(\.\d{1,2})?$/ })}
          inputMode="decimal"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="purchasedAtLocal" className="block text-sm font-medium">
          Purchase date
        </label>
        <input
          id="purchasedAtLocal"
          type="datetime-local"
          {...form.register('purchasedAtLocal')}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-between">
        {save.isError ? (
          <p role="alert" className="text-sm text-red-700">
            {String(save.error.message)}
          </p>
        ) : (
          <span />
        )}
        <Button type="submit" loading={save.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
