export const REVIEW_CONFIDENCE_THRESHOLD = 0.7;

export type ReviewReasonField = 'merchant' | 'total' | 'purchasedAt';

export interface ReviewReason {
  field: ReviewReasonField;
  message: string;
}

export interface ReviewReasonInput {
  fieldConfidence?: {
    merchant?: number | null;
    total?: number | null;
    purchasedAt?: number | null;
  } | null;
  purchasedAt?: Date | string | null;
  threshold?: number;
}

function hasPurchasedAt(value: ReviewReasonInput['purchasedAt']): boolean {
  if (value == null || value === '') return false;
  if (value instanceof Date) return Number.isFinite(value.getTime());
  const d = new Date(value);
  return Number.isFinite(d.getTime());
}

/** Human-readable reasons a receipt landed in `needs_review`. */
export function getReviewReasons(input: ReviewReasonInput): ReviewReason[] {
  const threshold = input.threshold ?? REVIEW_CONFIDENCE_THRESHOLD;
  const fc = input.fieldConfidence ?? {};
  const reasons: ReviewReason[] = [];

  const merchantConf = fc.merchant ?? 0;
  if (merchantConf < threshold) {
    reasons.push({
      field: 'merchant',
      message: `Merchant name confidence is low (${Math.round(merchantConf * 100)}%)`,
    });
  }

  const totalConf = fc.total ?? 0;
  if (totalConf < threshold) {
    reasons.push({
      field: 'total',
      message: `Total amount confidence is low (${Math.round(totalConf * 100)}%)`,
    });
  }

  if (!hasPurchasedAt(input.purchasedAt)) {
    reasons.push({
      field: 'purchasedAt',
      message: 'Purchase date is missing or could not be read from the receipt',
    });
  }

  return reasons;
}

/** Format an ISO timestamp for `<input type="datetime-local" />`. */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse a datetime-local value to ISO 8601 for API PATCH bodies. */
export function fromDatetimeLocalValue(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return undefined;
  return d.toISOString();
}
