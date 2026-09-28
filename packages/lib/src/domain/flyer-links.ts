/** Canadian weekly flyer deep links for insight actions. */

export type CanadianProvince =
  | 'AB'
  | 'BC'
  | 'MB'
  | 'NB'
  | 'NL'
  | 'NS'
  | 'NT'
  | 'NU'
  | 'ON'
  | 'PE'
  | 'QC'
  | 'SK'
  | 'YT';

const PROVINCE_RE =
  /\b(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/i;

export interface FlyerRetailerConfig {
  id: string;
  label: string;
  /** Substrings checked against normalized merchant name. */
  matchTerms: string[];
  circularsSlug: string;
  /** Official retailer flyer landing page (fallback). */
  retailerFlyerUrl: string;
}

export interface FlyerInsightCandidate {
  merchant: string;
  visits: number;
  spend: number;
  receiptIds: string[];
}

export interface FlyerInsightItem {
  type: 'optimization_tip';
  title: string;
  description: string;
  estimatedSavings: null;
  currency: string;
  action: {
    label: string;
    kind: 'external_link';
    target: string;
  };
  sourceReceiptIds: string[];
  sourceSubscriptionId: null;
  confidence: number;
}

export const FLYER_RETAILERS: FlyerRetailerConfig[] = [
  {
    id: 'walmart',
    label: 'Walmart',
    matchTerms: ['walmart'],
    circularsSlug: 'walmart',
    retailerFlyerUrl: 'https://www.walmart.ca/en/flyer',
  },
  {
    id: 'shoppers',
    label: 'Shoppers Drug Mart',
    matchTerms: ['shoppers drug mart', 'shoppers', 'pharmaprix'],
    circularsSlug: 'shoppers-drug-mart',
    retailerFlyerUrl: 'https://www.shoppersdrugmart.ca/flyer',
  },
  {
    id: 'superstore',
    label: 'Real Canadian Superstore',
    matchTerms: ['real canadian superstore', 'superstore', 'loblaws superstore'],
    circularsSlug: 'real-canadian-superstore',
    retailerFlyerUrl: 'https://www.realcanadiansuperstore.ca/flyer',
  },
  {
    id: 'nofrills',
    label: 'No Frills',
    matchTerms: ['no frills', 'nofrills'],
    circularsSlug: 'nofrills',
    retailerFlyerUrl: 'https://www.nofrills.ca/flyer',
  },
  {
    id: 'loblaws',
    label: 'Loblaws',
    matchTerms: ['loblaws'],
    circularsSlug: 'loblaws',
    retailerFlyerUrl: 'https://www.loblaws.ca/flyer',
  },
  {
    id: 'sobeys',
    label: 'Sobeys',
    matchTerms: ['sobeys', 'safeway'],
    circularsSlug: 'sobeys',
    retailerFlyerUrl: 'https://www.sobeys.com/en/flyer/',
  },
  {
    id: 'metro',
    label: 'Metro',
    matchTerms: ['metro'],
    circularsSlug: 'metro',
    retailerFlyerUrl: 'https://www.metro.ca/en/flyer',
  },
  {
    id: 'foodbasics',
    label: 'Food Basics',
    matchTerms: ['food basics'],
    circularsSlug: 'food-basics',
    retailerFlyerUrl: 'https://www.foodbasics.ca/flyer',
  },
  {
    id: 'freshco',
    label: 'FreshCo',
    matchTerms: ['freshco', 'fresh co'],
    circularsSlug: 'freshco',
    retailerFlyerUrl: 'https://www.freshco.com/flyer',
  },
  {
    id: 'gianttiger',
    label: 'Giant Tiger',
    matchTerms: ['giant tiger'],
    circularsSlug: 'tigre-geant',
    retailerFlyerUrl: 'https://www.gianttiger.com/collections/flyer',
  },
  {
    id: 'costco',
    label: 'Costco',
    matchTerms: ['costco'],
    circularsSlug: 'costco',
    retailerFlyerUrl: 'https://www.costco.ca/coupons.html',
  },
  {
    id: 'canadiantire',
    label: 'Canadian Tire',
    matchTerms: ['canadian tire'],
    circularsSlug: 'canadian-tire',
    retailerFlyerUrl: 'https://www.canadiantire.ca/en/flyer.html',
  },
];

const DEFAULT_PROVINCE: CanadianProvince = 'ON';
const MAX_FLYER_INSIGHTS = 3;

function normalizeMerchantName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferCanadianProvince(
  location: string | null | undefined,
  country: string | null | undefined,
): CanadianProvince {
  if (country && country.toUpperCase() !== 'CA') return DEFAULT_PROVINCE;
  const m = location?.match(PROVINCE_RE);
  const province = m?.[1];
  if (province) return province.toUpperCase() as CanadianProvince;
  return DEFAULT_PROVINCE;
}

export function matchFlyerRetailer(merchantName: string): FlyerRetailerConfig | null {
  const norm = normalizeMerchantName(merchantName);
  if (!norm) return null;
  for (const retailer of FLYER_RETAILERS) {
    if (retailer.matchTerms.some((term) => norm.includes(term))) return retailer;
  }
  return null;
}

export function buildFlyerUrl(retailer: FlyerRetailerConfig, province: CanadianProvince): string {
  return `https://www.circulars.ca/${retailer.circularsSlug}/?region=${province}`;
}

export function resolveFlyerUrl(merchantName: string, province: CanadianProvince): string | null {
  const retailer = matchFlyerRetailer(merchantName);
  if (!retailer) return null;
  return buildFlyerUrl(retailer, province);
}

export function getRegistryFlyerUrls(province: CanadianProvince): string[] {
  const urls = new Set<string>();
  for (const retailer of FLYER_RETAILERS) {
    urls.add(buildFlyerUrl(retailer, province));
    urls.add(retailer.retailerFlyerUrl);
  }
  return [...urls];
}

export function buildFlyerInsights(
  topMerchants: FlyerInsightCandidate[],
  province: CanadianProvince,
  currency: string,
  opts: { country?: string | null; maxItems?: number } = {},
): FlyerInsightItem[] {
  if (opts.country && opts.country.toUpperCase() !== 'CA') return [];

  const maxItems = opts.maxItems ?? MAX_FLYER_INSIGHTS;
  const items: FlyerInsightItem[] = [];

  for (const row of topMerchants) {
    if (items.length >= maxItems) break;
    const retailer = matchFlyerRetailer(row.merchant);
    if (!retailer) continue;
    if (row.visits < 1 || row.receiptIds.length === 0) continue;

    const target = buildFlyerUrl(retailer, province);
    items.push({
      type: 'optimization_tip',
      title: `Check ${retailer.label}'s weekly flyer`,
      description: `You shopped at ${retailer.label} ${row.visits} time${row.visits === 1 ? '' : 's'} recently. Browse this week's deals for ${province}.`,
      estimatedSavings: null,
      currency,
      action: {
        label: 'View weekly flyer',
        kind: 'external_link',
        target,
      },
      sourceReceiptIds: row.receiptIds,
      sourceSubscriptionId: null,
      confidence: 1,
    });
  }

  return items;
}

/** Hostnames we treat as safe flyer / retailer destinations. */
export const FLYER_LINK_HOSTS = [
  'www.circulars.ca',
  'circulars.ca',
  'www.walmart.ca',
  'www.shoppersdrugmart.ca',
  'www.nofrills.ca',
  'www.realcanadiansuperstore.ca',
  'www.loblaws.ca',
  'www.sobeys.com',
  'www.metro.ca',
  'www.foodbasics.ca',
  'www.freshco.com',
  'www.gianttiger.com',
  'www.costco.ca',
  'www.canadiantire.ca',
  'www.weeklyflyer.com',
  'weeklyflyer.com',
  'www.flyerca.com',
  'flyerca.com',
  'www.flyers-on-line.com',
  'flyers-on-line.com',
] as const;

export function isFlyerLinkHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return FLYER_LINK_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export function isRegistryFlyerUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!isFlyerLinkHost(parsed.hostname)) return false;
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname.includes('circulars.ca') && parsed.pathname.length > 1) return true;
    return FLYER_RETAILERS.some((r) => url.startsWith(r.retailerFlyerUrl));
  } catch {
    return false;
  }
}
