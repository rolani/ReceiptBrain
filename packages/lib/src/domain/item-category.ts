// Item category inference + dashboard bucketing when AI omits categories.

export const ITEM_CATEGORIES = [
  'groceries',
  'dining',
  'transport',
  'software',
  'entertainment',
  'utilities',
  'household',
  'health',
  'travel',
  'other',
] as const;

export type ItemCategoryValue = (typeof ITEM_CATEGORIES)[number];

export interface InferCategoryInput {
  merchantName?: string | null;
  itemName?: string | null;
  merchantCategory?: string | null;
}

type Rule = { category: ItemCategoryValue; patterns: RegExp[] };

const MERCHANT_RULES: Rule[] = [
  {
    category: 'groceries',
    patterns: [
      /\b(whole\s*foods|trader\s*joe|costco|walmart|target|kroger|safeway|loblaws|sobeys|metro|no\s*frills|superstore|grocery|market)\b/i,
    ],
  },
  {
    category: 'dining',
    patterns: [
      /\b(starbucks|coffee|cafe|café|restaurant|chipotle|mcdonald|tim\s*horton|pizza|doordash|uber\s*eats|skip\s*the\s*dishes|grubhub)\b/i,
    ],
  },
  {
    category: 'transport',
    patterns: [
      /\b(uber|lyft|shell|chevron|esso|petro|gas|fuel|parking|transit|taxi|cab)\b/i,
    ],
  },
  {
    category: 'software',
    patterns: [
      /\b(netflix|spotify|adobe|microsoft|google\s*one|icloud|github|openai|saas|software)\b/i,
    ],
  },
  {
    category: 'entertainment',
    patterns: [/\b(cinema|theatre|theater|concert|game|steam|playstation|xbox)\b/i],
  },
  {
    category: 'utilities',
    patterns: [/\b(hydro|electric|water|gas\s*utility|internet|rogers|bell|telus|fido)\b/i],
  },
  {
    category: 'health',
    patterns: [/\b(pharmacy|shoppers|drug|dental|clinic|hospital|medical|rx)\b/i],
  },
  {
    category: 'travel',
    patterns: [/\b(airline|air\s*canada|hotel|airbnb|expedia|booking\.com|flight)\b/i],
  },
  {
    category: 'household',
    patterns: [/\b(ikea|home\s*depot|canadian\s*tire|hardware|furniture)\b/i],
  },
];

const ITEM_RULES: Rule[] = [
  { category: 'groceries', patterns: [/\b(milk|egg|bread|produce|grocery|organic|chicken|beef)\b/i] },
  { category: 'dining', patterns: [/\b(latte|coffee|burrito|burger|meal|sandwich|tip)\b/i] },
  { category: 'transport', patterns: [/\b(gasoline|gas|fuel|trip|ride)\b/i] },
  { category: 'health', patterns: [/\b(vitamin|medicine|prescription|pharmacy)\b/i] },
];

function firstMatch(text: string, rules: Rule[]): ItemCategoryValue | null {
  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(text))) return rule.category;
  }
  return null;
}

export function normalizeItemCategory(value: unknown): ItemCategoryValue {
  if (typeof value === 'string' && (ITEM_CATEGORIES as readonly string[]).includes(value)) {
    return value as ItemCategoryValue;
  }
  return 'other';
}

export function inferItemCategory(input: InferCategoryInput): ItemCategoryValue {
  const merchantCategory = input.merchantCategory
    ? normalizeItemCategory(input.merchantCategory)
    : null;
  if (merchantCategory && merchantCategory !== 'other') {
    return merchantCategory;
  }

  const merchant = (input.merchantName ?? '').trim();
  if (merchant) {
    const fromMerchant = firstMatch(merchant, MERCHANT_RULES);
    if (fromMerchant) return fromMerchant;
  }

  const item = (input.itemName ?? '').trim();
  if (item) {
    const fromItem = firstMatch(item, ITEM_RULES);
    if (fromItem) return fromItem;
  }

  if (merchantCategory) return merchantCategory;
  return 'other';
}

export interface CategorySlice {
  label: string;
  value: number;
}

export interface ReceiptForCategorySlice {
  total: number | { toString(): string } | null;
  rawMerchant: string | null;
  merchant: { canonicalName: string; category: string | null } | null;
  items: Array<{
    name: string;
    lineTotal: number | { toString(): string };
    category: string | null;
  }>;
}

/** Aggregate last-30d spend by category with inference for missing AI categories. */
export function buildCategorySlicesFromReceipts(
  receipts: ReceiptForCategorySlice[],
): CategorySlice[] {
  const totals = new Map<ItemCategoryValue, number>();

  const add = (category: ItemCategoryValue, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    totals.set(category, (totals.get(category) ?? 0) + amount);
  };

  for (const r of receipts) {
    const merchantName = r.merchant?.canonicalName ?? r.rawMerchant ?? '';
    const merchantCategory = r.merchant?.category ?? null;

    if (r.items.length > 0) {
      for (const it of r.items) {
        const cat =
          it.category != null
            ? normalizeItemCategory(it.category)
            : inferItemCategory({
                merchantName,
                itemName: it.name,
                merchantCategory,
              });
        add(cat, Number(it.lineTotal));
      }
      continue;
    }

    const receiptTotal = Number(r.total ?? 0);
    if (receiptTotal > 0) {
      add(
        inferItemCategory({ merchantName, merchantCategory }),
        receiptTotal,
      );
    }
  }

  return [...totals.entries()]
    .map(([label, value]) => ({
      label,
      value: Math.round(value * 100) / 100,
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}
