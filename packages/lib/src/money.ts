const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, locale: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`;
  let f = CURRENCY_FORMATTERS.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, { style: 'currency', currency });
    CURRENCY_FORMATTERS.set(key, f);
  }
  return f;
}

export function formatMoney(
  amount: number | string,
  currency: string,
  locale = 'en-US',
): string {
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) {
    throw new TypeError(`formatMoney: amount "${amount}" is not a finite number`);
  }
  return formatter(currency, locale).format(n);
}

export function toCents(amount: number | string): number {
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(n)) {
    throw new TypeError(`toCents: amount "${amount}" is not finite`);
  }
  return Math.round(n * 100);
}

export function fromCents(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError(`fromCents: cents "${cents}" must be an integer`);
  }
  return (cents / 100).toFixed(2);
}
