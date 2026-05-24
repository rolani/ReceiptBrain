import { NextResponse } from 'next/server';
import { prisma } from '@receiptbrain/lib';
import { requireSession, toApiErrorResponse } from '@/lib/require-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const rows = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      include: { merchant: true },
      orderBy: { lastCharge: 'desc' },
    });
    return NextResponse.json({
      items: rows.map((s) => ({
        id: s.id,
        merchant: s.merchant.canonicalName,
        amount: s.amount.toFixed(2),
        currency: s.currency,
        interval: s.interval,
        firstCharge: s.firstCharge.toISOString(),
        lastCharge: s.lastCharge.toISOString(),
        nextChargeEstimate: s.nextChargeEstimate?.toISOString() ?? null,
        confidence: s.confidence,
        status: s.status,
        sourceReceiptIds: s.sourceReceiptIds,
      })),
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
