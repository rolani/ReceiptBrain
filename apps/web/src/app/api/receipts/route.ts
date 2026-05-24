import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@receiptbrain/lib';
import { ReceiptListQuerySchema } from '@receiptbrain/contracts';
import { requireSession, toApiErrorResponse } from '@/lib/require-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const parsed = ReceiptListQuerySchema.parse(Object.fromEntries(url.searchParams));

    const where: Record<string, unknown> = {
      userId: session.user.id,
      deletedAt: null,
    };
    if (parsed.merchant) {
      where.merchant = { canonicalName: { contains: parsed.merchant, mode: 'insensitive' } };
    }
    if (parsed.from || parsed.to) {
      where.purchasedAt = {
        ...(parsed.from ? { gte: new Date(parsed.from) } : {}),
        ...(parsed.to ? { lte: new Date(parsed.to) } : {}),
      };
    }

    const rows = await prisma.receipt.findMany({
      where,
      take: parsed.limit + 1,
      orderBy: { createdAt: 'desc' },
      ...(parsed.cursor ? { cursor: { id: parsed.cursor }, skip: 1 } : {}),
      include: { merchant: true },
    });

    let nextCursor: string | null = null;
    if (rows.length > parsed.limit) {
      const tail = rows.pop();
      nextCursor = tail?.id ?? null;
    }

    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        status: r.status,
        merchant: r.merchant?.canonicalName ?? r.rawMerchant ?? null,
        total: r.total ? r.total.toFixed(2) : null,
        currency: r.currency,
        purchasedAt: r.purchasedAt ? r.purchasedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
      nextCursor,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
