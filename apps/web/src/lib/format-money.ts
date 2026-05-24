/** Display helper for receipt totals in list/detail views. */
export function formatReceiptAmount(total: string | null, currency: string | null): string {
  if (!total) return '—';
  if (currency === 'USD' || currency === 'CAD') return `$${total}`;
  if (currency) return `${currency} ${total}`;
  return total;
}

/** Fixed locale so SSR and client hydration produce identical strings. */
const DISPLAY_LOCALE = 'en-US';

export function formatReceiptDate(iso: string | null): string {
  if (!iso) return 'No date';
  return new Date(iso).toLocaleDateString(DISPLAY_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
