'use client';

import { useEffect, useState } from 'react';
import { BrainIcon, ReceiptIcon } from './ui/Icons';

const EXTRACTION_STEPS = [
  'Reading your receipt…',
  'Finding merchant…',
  'Extracting line items…',
  'Calculating totals…',
] as const;

const STEP_INTERVAL_MS = 2_800;

export function ReceiptExtractionLoader() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % EXTRACTION_STEPS.length);
    }, STEP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const stepLabel = EXTRACTION_STEPS[stepIndex];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="overflow-hidden rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/80 p-6 shadow-sm"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative mx-auto flex h-20 w-20 shrink-0 items-center justify-center sm:mx-0">
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl bg-emerald-100/80 ring-1 ring-emerald-200/60"
          />
          <ReceiptIcon size={34} className="relative text-emerald-700" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-2 top-2 h-0.5 animate-receipt-scan rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80"
          />
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-emerald-200">
            <BrainIcon size={16} className="text-emerald-600" />
          </span>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-base font-semibold text-slate-900">Extracting receipt details</p>
          <p className="mt-1 text-sm font-medium text-emerald-800 transition-opacity duration-300">
            {stepLabel}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            This page will update automatically when ready.
          </p>

          <div className="mt-4">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Extraction in progress"
              className="relative h-2 overflow-hidden rounded-full bg-slate-200/80"
            >
              <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" />
              <div
                aria-hidden
                className="absolute inset-y-0 w-1/2 animate-receipt-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden className="mt-6 space-y-3 border-t border-emerald-100/80 pt-5">
        <div className="h-3 w-28 animate-pulse rounded-md bg-slate-200/80" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
