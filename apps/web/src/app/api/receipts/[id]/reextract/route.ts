// Retry UX endpoint: re-enqueue extract_receipt for receipts that ended up in
// `failed` or `needs_review`. The queue uses jobId=receiptId so concurrent
// re-extract clicks coalesce into one job.

import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@receiptbrain/lib';
import {
  NotFoundError,
  assertOwns,
  requireSession,
  toApiErrorResponse,
} from '@/lib/require-session';
import { extractReceiptQueue } from '@/lib/services';
import { enqueueExtractReceipt } from '@receiptbrain/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const row = await prisma.receipt.findUnique({ where: { id } });
    if (!row || row.deletedAt) throw new NotFoundError();
    assertOwns(row, session.user.id);

    await prisma.receipt.update({
      where: { id: row.id },
      data: { status: 'extracting' },
    });

    const job = await enqueueExtractReceipt(extractReceiptQueue(), {
      receiptId: row.id,
      userId: session.user.id,
    });

    return NextResponse.json({ jobId: job.id, status: 'extracting' }, { status: 202 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
