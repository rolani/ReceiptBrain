import { createHash } from 'node:crypto';
import { PrismaClient, type ItemCategory, type SubscriptionInterval } from '@prisma/client';

export interface SeedOptions {
  prisma?: PrismaClient;
  silent?: boolean;
}

interface MerchantSpec {
  canonicalName: string;
  rawMerchant: string;
  category: ItemCategory;
}

interface ReceiptSpec {
  merchant: MerchantSpec;
  daysAgo: number;
  amounts: { subtotal: string; tax: string; tip?: string; total: string };
  items: Array<{ name: string; unitPrice: string; quantity?: number; lineTotal: string; category?: ItemCategory }>;
}

const DEMO_USER = {
  email: 'demo@receiptbrain.app',
  name: 'Demo User',
};

const MERCHANTS: MerchantSpec[] = [
  { canonicalName: 'Starbucks', rawMerchant: 'STARBUCKS #1234', category: 'dining' },
  { canonicalName: 'Whole Foods', rawMerchant: 'WHOLE FOODS MKT 10402', category: 'groceries' },
  { canonicalName: 'Uber', rawMerchant: 'UBER *TRIP', category: 'transport' },
  { canonicalName: 'Netflix', rawMerchant: 'NETFLIX.COM', category: 'software' },
  { canonicalName: 'Spotify', rawMerchant: 'SPOTIFY USA', category: 'software' },
  { canonicalName: 'Chipotle', rawMerchant: 'CHIPOTLE 2841', category: 'dining' },
  { canonicalName: 'Shell', rawMerchant: 'SHELL OIL 5743', category: 'transport' },
];

function pickMerchant(name: string): MerchantSpec {
  const m = MERCHANTS.find((x) => x.canonicalName === name);
  if (!m) throw new Error(`unknown demo merchant: ${name}`);
  return m;
}

const RECEIPTS: ReceiptSpec[] = [
  // Starbucks coffee runs — frequent
  ...[2, 5, 9, 12, 16, 20, 23, 27].map((daysAgo) => ({
    merchant: pickMerchant('Starbucks'),
    daysAgo,
    amounts: { subtotal: '5.75', tax: '0.50', total: '6.25' },
    items: [{ name: 'Pike Place Grande', unitPrice: '4.25', lineTotal: '4.25', category: 'dining' as ItemCategory }, { name: 'Blueberry Muffin', unitPrice: '1.50', lineTotal: '1.50', category: 'dining' as ItemCategory }],
  })),
  // Weekly grocery runs
  ...[4, 11, 18, 25, 32].map((daysAgo) => ({
    merchant: pickMerchant('Whole Foods'),
    daysAgo,
    amounts: { subtotal: '84.30', tax: '0.00', total: '84.30' },
    items: [
      { name: 'Organic Eggs', unitPrice: '6.99', lineTotal: '6.99', category: 'groceries' as ItemCategory },
      { name: 'Sourdough Bread', unitPrice: '5.49', lineTotal: '5.49', category: 'groceries' as ItemCategory },
      { name: 'Chicken Breast 2lb', unitPrice: '17.82', lineTotal: '17.82', category: 'groceries' as ItemCategory },
      { name: 'Mixed Greens', unitPrice: '4.99', lineTotal: '4.99', category: 'groceries' as ItemCategory },
    ],
  })),
  // Uber rides
  ...[3, 14, 21].map((daysAgo) => ({
    merchant: pickMerchant('Uber'),
    daysAgo,
    amounts: { subtotal: '18.50', tax: '0.00', tip: '3.00', total: '21.50' },
    items: [{ name: 'UberX trip', unitPrice: '18.50', lineTotal: '18.50', category: 'transport' as ItemCategory }],
  })),
  // Chipotle lunch
  { merchant: pickMerchant('Chipotle'), daysAgo: 6, amounts: { subtotal: '13.25', tax: '1.15', total: '14.40' }, items: [{ name: 'Chicken Burrito Bowl', unitPrice: '11.25', lineTotal: '11.25', category: 'dining' }, { name: 'Chips & Guac', unitPrice: '2.00', lineTotal: '2.00', category: 'dining' }] },
  { merchant: pickMerchant('Chipotle'), daysAgo: 19, amounts: { subtotal: '13.25', tax: '1.15', total: '14.40' }, items: [{ name: 'Chicken Burrito Bowl', unitPrice: '11.25', lineTotal: '11.25', category: 'dining' }, { name: 'Chips & Guac', unitPrice: '2.00', lineTotal: '2.00', category: 'dining' }] },
  // Gas
  { merchant: pickMerchant('Shell'), daysAgo: 10, amounts: { subtotal: '52.10', tax: '0.00', total: '52.10' }, items: [{ name: 'Regular gasoline', unitPrice: '52.10', lineTotal: '52.10', category: 'transport' }] },
  { merchant: pickMerchant('Shell'), daysAgo: 28, amounts: { subtotal: '48.75', tax: '0.00', total: '48.75' }, items: [{ name: 'Regular gasoline', unitPrice: '48.75', lineTotal: '48.75', category: 'transport' }] },
  // Subscriptions (3 charges each so detection has signal)
  ...[7, 37, 67].map((daysAgo) => ({
    merchant: pickMerchant('Netflix'),
    daysAgo,
    amounts: { subtotal: '15.99', tax: '0.00', total: '15.99' },
    items: [{ name: 'Netflix Premium', unitPrice: '15.99', lineTotal: '15.99', category: 'software' as ItemCategory }],
  })),
  ...[1, 31, 61].map((daysAgo) => ({
    merchant: pickMerchant('Spotify'),
    daysAgo,
    amounts: { subtotal: '9.99', tax: '0.00', total: '9.99' },
    items: [{ name: 'Spotify Premium', unitPrice: '9.99', lineTotal: '9.99', category: 'software' as ItemCategory }],
  })),
];

function deterministicHash(...parts: string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex');
}

function isoDaysAgo(days: number, anchor: Date): Date {
  const d = new Date(anchor);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(15, 0, 0, 0);
  return d;
}

export async function runSeed(opts: SeedOptions = {}): Promise<void> {
  const prisma = opts.prisma ?? new PrismaClient();
  const log = opts.silent ? () => undefined : (msg: string) => console.log(`[seed] ${msg}`);
  const anchor = new Date('2026-05-22T00:00:00Z');

  try {
    const user = await prisma.user.upsert({
      where: { email: DEMO_USER.email },
      update: { name: DEMO_USER.name },
      create: DEMO_USER,
    });
    log(`user ready: ${user.email}`);

    const merchantMap = new Map<string, string>();
    for (const m of MERCHANTS) {
      const row = await prisma.merchant.upsert({
        where: { canonicalName: m.canonicalName },
        update: { category: m.category },
        create: { canonicalName: m.canonicalName, category: m.category },
      });
      merchantMap.set(m.canonicalName, row.id);
    }
    log(`${merchantMap.size} merchants ready`);

    const receiptIdsByMerchant = new Map<string, string[]>();
    for (const spec of RECEIPTS) {
      const purchasedAt = isoDaysAgo(spec.daysAgo, anchor);
      const imageHash = deterministicHash(
        DEMO_USER.email,
        spec.merchant.canonicalName,
        String(spec.daysAgo),
        spec.amounts.total,
      );
      const merchantId = merchantMap.get(spec.merchant.canonicalName)!;

      const receipt = await prisma.receipt.upsert({
        where: { userId_imageHash: { userId: user.id, imageHash } },
        update: {
          merchantId,
          status: 'extracted',
          total: spec.amounts.total,
          subtotal: spec.amounts.subtotal,
          tax: spec.amounts.tax,
          tip: spec.amounts.tip ?? '0.00',
          currency: 'USD',
          purchasedAt,
          rawMerchant: spec.merchant.rawMerchant,
          fieldConfidence: { merchant: 0.98, total: 0.99, purchasedAt: 0.95, items: 0.93 },
        },
        create: {
          userId: user.id,
          merchantId,
          rawMerchant: spec.merchant.rawMerchant,
          imageUrl: `s3://receiptbrain/demo/${imageHash}.jpg`,
          imageHash,
          imageMime: 'image/jpeg',
          imageBytes: 180_000,
          status: 'extracted',
          total: spec.amounts.total,
          subtotal: spec.amounts.subtotal,
          tax: spec.amounts.tax,
          tip: spec.amounts.tip ?? '0.00',
          currency: 'USD',
          purchasedAt,
          fieldConfidence: { merchant: 0.98, total: 0.99, purchasedAt: 0.95, items: 0.93 },
        },
      });

      // Items: idempotent via (receiptId, lineNumber) unique key.
      for (const [index, item] of spec.items.entries()) {
        const lineNumber = index + 1;
        await prisma.item.upsert({
          where: { receiptId_lineNumber: { receiptId: receipt.id, lineNumber } },
          update: {
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity ?? 1,
            lineTotal: item.lineTotal,
            category: item.category,
            confidence: 0.95,
          },
          create: {
            receiptId: receipt.id,
            lineNumber,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity ?? 1,
            lineTotal: item.lineTotal,
            category: item.category,
            confidence: 0.95,
          },
        });
      }

      const list = receiptIdsByMerchant.get(spec.merchant.canonicalName) ?? [];
      list.push(receipt.id);
      receiptIdsByMerchant.set(spec.merchant.canonicalName, list);
    }
    log(`${RECEIPTS.length} receipts upserted`);

    const subscriptions: Array<{
      merchant: string;
      amount: string;
      interval: SubscriptionInterval;
    }> = [
      { merchant: 'Netflix', amount: '15.99', interval: 'monthly' },
      { merchant: 'Spotify', amount: '9.99', interval: 'monthly' },
    ];

    const subRowsByMerchant = new Map<string, string>();
    for (const s of subscriptions) {
      const merchantId = merchantMap.get(s.merchant)!;
      const sourceReceiptIds = receiptIdsByMerchant.get(s.merchant) ?? [];
      const firstCharge = isoDaysAgo(67, anchor);
      const lastCharge = isoDaysAgo(7, anchor);
      const nextChargeEstimate = isoDaysAgo(-23, anchor);
      const row = await prisma.subscription.upsert({
        where: {
          userId_merchantId_interval: {
            userId: user.id,
            merchantId,
            interval: s.interval,
          },
        },
        update: {
          amount: s.amount,
          currency: 'USD',
          firstCharge,
          lastCharge,
          nextChargeEstimate,
          confidence: 0.92,
          status: 'active',
          sourceReceiptIds,
        },
        create: {
          userId: user.id,
          merchantId,
          amount: s.amount,
          currency: 'USD',
          interval: s.interval,
          firstCharge,
          lastCharge,
          nextChargeEstimate,
          confidence: 0.92,
          status: 'active',
          sourceReceiptIds,
        },
      });
      subRowsByMerchant.set(s.merchant, row.id);
    }
    log(`${subscriptions.length} subscriptions upserted`);

    const insights = [
      {
        type: 'subscription_waste' as const,
        title: 'Cancel underused Netflix',
        description:
          'You have been charged $15.99 monthly for 3 months and your last login was 60+ days ago.',
        estimatedSavings: '191.88',
        action: { label: 'Cancel subscription', kind: 'external_link' as const, target: 'https://netflix.com/cancel' },
        sourceReceiptIds: receiptIdsByMerchant.get('Netflix') ?? [],
        sourceSubscriptionId: subRowsByMerchant.get('Netflix') ?? null,
      },
      {
        type: 'cheaper_alternative' as const,
        title: 'Try home-brewed coffee',
        description:
          '8 Starbucks visits in the last 30 days totaled $50. A pour-over setup pays for itself in ~2 weeks.',
        estimatedSavings: '40.00',
        action: { label: 'See alternatives', kind: 'in_app' as const, target: '/insights/coffee' },
        sourceReceiptIds: receiptIdsByMerchant.get('Starbucks') ?? [],
        sourceSubscriptionId: null,
      },
      {
        type: 'optimization_tip' as const,
        title: 'Group grocery runs to save on delivery fees',
        description: 'Whole Foods runs are weekly; consolidating to bi-weekly trims gas and time.',
        estimatedSavings: '15.00',
        action: { label: 'Plan next trip', kind: 'in_app' as const, target: '/insights/groceries' },
        sourceReceiptIds: receiptIdsByMerchant.get('Whole Foods') ?? [],
        sourceSubscriptionId: null,
      },
    ];

    for (const i of insights) {
      const contentFingerprint = deterministicHash('insight', i.type, i.title);
      await prisma.insight.upsert({
        where: {
          userId_contentFingerprint: { userId: user.id, contentFingerprint },
        },
        update: {
          description: i.description,
          estimatedSavings: i.estimatedSavings,
          action: i.action,
          sourceReceiptIds: i.sourceReceiptIds,
          sourceSubscriptionId: i.sourceSubscriptionId,
        },
        create: {
          userId: user.id,
          type: i.type,
          title: i.title,
          description: i.description,
          estimatedSavings: i.estimatedSavings,
          currency: 'USD',
          action: i.action,
          status: 'new',
          sourceReceiptIds: i.sourceReceiptIds,
          sourceSubscriptionId: i.sourceSubscriptionId,
          modelVersion: 'seed',
          promptVersion: 'seed-v1',
          contentFingerprint,
        },
      });
    }
    log(`${insights.length} insights upserted`);
  } finally {
    if (!opts.prisma) {
      await prisma.$disconnect();
    }
  }
}

// Allow `tsx prisma/seed.ts` to run standalone.
const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === `file://${process.argv[1]?.replace(/\/$/, '')}`;
if (invokedDirectly) {
  runSeed().catch((err) => {
    console.error('[seed] failed', err);
    process.exit(1);
  });
}
