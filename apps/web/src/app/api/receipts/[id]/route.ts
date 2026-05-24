import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@receiptbrain/lib';
import { ReceiptCorrectionSchema } from '@receiptbrain/contracts';
import {
  NotFoundError,
  assertOwns,
  requireSession,
  toApiErrorResponse,
} from '@/lib/require-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function loadOwnedReceipt(id: string, userId: string) {
  const row = await prisma.receipt.findUnique({
    where: { id },
    include: { items: { orderBy: { lineNumber: 'asc' } }, merchant: true },
  });
  if (!row || row.deletedAt) throw new NotFoundError();
  return assertOwns(row, userId);
}

export async function GET(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const row = await loadOwnedReceipt(id, session.user.id);
    return NextResponse.json({
      id: row.id,
      status: row.status,
      merchant: row.merchant?.canonicalName ?? row.rawMerchant ?? null,
      rawMerchant: row.rawMerchant,
      total: row.total?.toFixed(2) ?? null,
      subtotal: row.subtotal?.toFixed(2) ?? null,
      tax: row.tax?.toFixed(2) ?? null,
      tip: row.tip?.toFixed(2) ?? null,
      currency: row.currency,
      purchasedAt: row.purchasedAt?.toISOString() ?? null,
      paymentLast4: row.paymentLast4,
      fieldConfidence: row.fieldConfidence,
      items: row.items.map((i) => ({
        id: i.id,
        lineNumber: i.lineNumber,
        name: i.name,
        unitPrice: i.unitPrice.toFixed(2),
        quantity: i.quantity,
        lineTotal: i.lineTotal.toFixed(2),
        category: i.category,
        confidence: i.confidence,
      })),
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const body = ReceiptCorrectionSchema.parse(await req.json());
    const existing = await loadOwnedReceipt(id, session.user.id);

    const { items: itemsUpdate, purchasedAt: purchasedAtIso, ...scalar } = body;
    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.receipt.update({
        where: { id: existing.id },
        data: {
          ...scalar,
          ...(purchasedAtIso ? { purchasedAt: new Date(purchasedAtIso) } : {}),
        },
      });
      if (itemsUpdate) {
        await tx.item.deleteMany({ where: { receiptId: r.id } });
        await tx.item.createMany({
          data: itemsUpdate.map((i) => ({
            receiptId: r.id,
            lineNumber: i.lineNumber,
            name: i.name,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            lineTotal: i.lineTotal,
          })),
        });
      }
      return r;
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const existing = await loadOwnedReceipt(id, session.user.id);
    await prisma.receipt.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
