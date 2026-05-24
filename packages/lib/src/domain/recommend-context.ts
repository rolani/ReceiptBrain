// Currency + location context for AI /recommend (insights generation).

const ISO_CURRENCY = /^[A-Z]{3}$/;
const STORE_NUM_RE = /\s*#?(\d{2,})\b/g;
const POSTAL_CA_RE = /\b([A-Z]\d[A-Z])\s?(\d[A-Z]\d)\b/i;
const CITY_REGION_RE = /\b([A-Za-z][A-Za-z\s.'-]{2,}),\s*([A-Z]{2})\b/;

export const DEFAULT_RECOMMEND_CURRENCY = 'CAD';
export const DEFAULT_RECOMMEND_LOCATION = 'Canada';

export interface RecommendLocation {
  label: string;
  country?: string;
  merchantHints?: string[];
}

export interface RecommendLocationOptions {
  defaultLabel?: string;
  country?: string;
  maxHints?: number;
}

/** Dominant receipt currency in the aggregation window, else CAD. */
export function resolveRecommendCurrency(
  codes: Array<string | null | undefined>,
  defaultCurrency: string = DEFAULT_RECOMMEND_CURRENCY,
): string {
  const counts = new Map<string, number>();
  for (const c of codes) {
    if (!c || !ISO_CURRENCY.test(c)) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  if (counts.size === 0) return defaultCurrency;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Location fragments embedded in receipt `rawMerchant` before normalization strips them. */
export function extractMerchantLocationHints(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const hints = new Set<string>();

  for (const m of raw.matchAll(STORE_NUM_RE)) {
    const n = m[1]?.trim();
    if (n) hints.add(n);
  }

  const postal = raw.match(POSTAL_CA_RE);
  if (postal) hints.add(`${postal[1]}${postal[2]}`.toUpperCase());

  const city = raw.match(CITY_REGION_RE);
  if (city) {
    const place = city[1]
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    hints.add(`${place}, ${city[2].toUpperCase()}`);
  }

  return [...hints];
}

export function buildRecommendLocation(
  rawMerchants: Array<string | null | undefined>,
  opts: RecommendLocationOptions = {},
): RecommendLocation {
  const label = opts.defaultLabel?.trim() || DEFAULT_RECOMMEND_LOCATION;
  const maxHints = opts.maxHints ?? 12;
  const merchantHints: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawMerchants) {
    for (const hint of extractMerchantLocationHints(raw)) {
      if (seen.has(hint) || merchantHints.length >= maxHints) continue;
      seen.add(hint);
      merchantHints.push(hint);
    }
  }

  return {
    label,
    ...(opts.country ? { country: opts.country } : {}),
    ...(merchantHints.length > 0 ? { merchantHints } : {}),
  };
}
