import { describe, expect, it } from 'vitest';
import {
  isInFlightReceiptStatus,
  RECEIPT_STATUS_POLL_MS,
} from '@/lib/receipt-status';

describe('receipt status helpers', () => {
  it('treats uploaded and extracting as in-flight', () => {
    expect(isInFlightReceiptStatus('uploaded')).toBe(true);
    expect(isInFlightReceiptStatus('extracting')).toBe(true);
  });

  it('treats terminal statuses as not in-flight', () => {
    expect(isInFlightReceiptStatus('extracted')).toBe(false);
    expect(isInFlightReceiptStatus('needs_review')).toBe(false);
    expect(isInFlightReceiptStatus('failed')).toBe(false);
  });

  it('polls every 3 seconds while in-flight', () => {
    expect(RECEIPT_STATUS_POLL_MS).toBe(3000);
  });
});
