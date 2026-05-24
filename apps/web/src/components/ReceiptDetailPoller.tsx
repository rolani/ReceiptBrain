'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  isInFlightReceiptStatus,
  RECEIPT_STATUS_POLL_MS,
} from '@/lib/receipt-status';

interface StatusPayload {
  status: string;
}

async function fetchReceiptStatus(receiptId: string): Promise<StatusPayload> {
  const res = await fetch(`/api/receipts/${receiptId}/status`);
  if (!res.ok) throw new Error(`status poll failed (${res.status})`);
  return res.json();
}

/** Refreshes the server-rendered detail page when extraction finishes. */
export function ReceiptDetailPoller({
  receiptId,
  status,
}: {
  receiptId: string;
  status: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isInFlightReceiptStatus(status)) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const body = await fetchReceiptStatus(receiptId);
        if (cancelled) return;
        if (!isInFlightReceiptStatus(body.status)) {
          router.refresh();
        }
      } catch {
        // ignore transient network errors; next tick retries
      }
    };

    void tick();
    const id = window.setInterval(tick, RECEIPT_STATUS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [receiptId, status, router]);

  return null;
}
