/** Resolve which receipt ids support an insight when the AI omits them. */

const STOP_WORDS = new Set([
  'shop',
  'store',
  'market',
  'mart',
  'food',
  'fresh',
  'local',
  'your',
  'the',
  'and',
]);

export interface ReceiptForProvenance {
  id: string;
  merchantName: string;
}

export interface SubscriptionForProvenance {
  id: string;
  merchantName: string;
  sourceReceiptIds: string[];
}

export interface InsightForProvenance {
  type: string;
  title: string;
  description: string;
  sourceReceiptIds: string[];
  sourceSubscriptionId?: string | null;
}

function normalizeMerchantName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesMerchantInText(merchantName: string, ...texts: string[]): boolean {
  const norm = normalizeMerchantName(merchantName);
  if (norm.length < 3) return false;
  const haystack = texts.join(' ').toLowerCase();

  if (haystack.includes(norm)) return true;

  const tokens = norm.split(' ').filter((t) => t.length > 3 && !STOP_WORDS.has(t));
  if (tokens.length === 0) return false;
  const hits = tokens.filter((t) => haystack.includes(t));
  return hits.length >= Math.min(2, tokens.length);
}

export function buildMerchantReceiptIndex(
  receipts: ReceiptForProvenance[],
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const r of receipts) {
    const list = index.get(r.merchantName) ?? [];
    list.push(r.id);
    index.set(r.merchantName, list);
  }
  return index;
}

export function resolveInsightSourceReceiptIds(
  insight: InsightForProvenance,
  receipts: ReceiptForProvenance[],
  subscriptions: SubscriptionForProvenance[],
): string[] {
  const valid = new Set(receipts.map((r) => r.id));

  const fromAi = insight.sourceReceiptIds.filter((id) => valid.has(id));
  if (fromAi.length > 0) return fromAi;

  if (insight.sourceSubscriptionId) {
    const sub = subscriptions.find((s) => s.id === insight.sourceSubscriptionId);
    if (sub) {
      const ids = sub.sourceReceiptIds.filter((id) => valid.has(id));
      if (ids.length > 0) return ids;
    }
  }

  if (insight.type === 'subscription_waste') {
    for (const sub of subscriptions) {
      if (matchesMerchantInText(sub.merchantName, insight.title, insight.description)) {
        const ids = sub.sourceReceiptIds.filter((id) => valid.has(id));
        if (ids.length > 0) return ids;
      }
    }
  }

  const matched = receipts
    .filter((r) => matchesMerchantInText(r.merchantName, insight.title, insight.description))
    .map((r) => r.id);
  if (matched.length > 0) return matched;

  if (receipts.length > 0) return receipts.map((r) => r.id);
  return [];
}
