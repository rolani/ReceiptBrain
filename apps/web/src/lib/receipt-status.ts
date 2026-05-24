export const IN_FLIGHT_RECEIPT_STATUSES = ['uploaded', 'extracting'] as const;

export type InFlightReceiptStatus = (typeof IN_FLIGHT_RECEIPT_STATUSES)[number];

export function isInFlightReceiptStatus(
  status: string,
): status is InFlightReceiptStatus {
  return (IN_FLIGHT_RECEIPT_STATUSES as readonly string[]).includes(status);
}

/** Poll every 3s while any receipt is still being extracted. */
export const RECEIPT_STATUS_POLL_MS = 3_000;
