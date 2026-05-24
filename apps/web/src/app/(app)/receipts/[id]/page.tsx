import { notFound, redirect } from 'next/navigation';
import { prisma } from '@receiptbrain/lib';
import { auth } from '@/auth';
import { ReceiptDetailEditor, type ReceiptDetail } from '@/components/ReceiptDetailEditor';
import { ReceiptDetailPoller } from '@/components/ReceiptDetailPoller';
import { ReceiptDeleteButton } from '@/components/ReceiptDeleteButton';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const { id } = await params;
  const row = await prisma.receipt.findUnique({
    where: { id },
    include: {
      merchant: true,
      items: { orderBy: { lineNumber: 'asc' } },
    },
  });
  if (!row || row.deletedAt || row.userId !== session.user.id) {
    notFound();
  }

  const detail: ReceiptDetail = {
    id: row.id,
    status: row.status,
    merchant: row.merchant?.canonicalName ?? null,
    rawMerchant: row.rawMerchant,
    total: row.total?.toFixed(2) ?? null,
    currency: row.currency,
    purchasedAt: row.purchasedAt?.toISOString() ?? null,
    fieldConfidence:
      row.fieldConfidence && typeof row.fieldConfidence === 'object'
        ? (row.fieldConfidence as ReceiptDetail['fieldConfidence'])
        : null,
    items: row.items.map((i) => ({
      id: i.id,
      lineNumber: i.lineNumber,
      name: i.name,
      unitPrice: i.unitPrice.toFixed(2),
      quantity: i.quantity,
      lineTotal: i.lineTotal.toFixed(2),
    })),
  };

  return (
    <div className="space-y-6">
      <ReceiptDetailPoller receiptId={detail.id} status={detail.status} />
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Receipt</h1>
        <ReceiptDeleteButton
          receiptId={detail.id}
          label={detail.merchant ?? detail.rawMerchant}
        />
      </div>
      <ReceiptDetailEditor receipt={detail} />
      {detail.items.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Items</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {detail.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {i.name} {i.quantity > 1 ? `× ${i.quantity}` : ''}
                </span>
                <span className="tabular-nums">${i.lineTotal}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
