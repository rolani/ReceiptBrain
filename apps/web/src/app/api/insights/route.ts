import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@receiptbrain/lib';
import { InsightStatus, InsightType } from '@receiptbrain/contracts';
import { z } from 'zod';
import { requireSession, toApiErrorResponse } from '@/lib/require-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ListQuery = z.object({
  type: InsightType.optional(),
  status: InsightStatus.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const q = ListQuery.parse(Object.fromEntries(url.searchParams));

    const where: Record<string, unknown> = { userId: session.user.id };
    if (q.type) where.type = q.type;
    if (q.status) {
      where.status = q.status;
    } else {
      // Main feed hides dismissed cards; explicit ?status=dismissed still works.
      where.status = { not: 'dismissed' };
    }

    const rows = await prisma.insight.findMany({
      where,
      take: q.limit + 1,
      orderBy: { createdAt: 'desc' },
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (rows.length > q.limit) {
      const tail = rows.pop();
      nextCursor = tail?.id ?? null;
    }

    return NextResponse.json({
      items: rows.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        description: i.description,
        estimatedSavings: i.estimatedSavings?.toFixed(2) ?? null,
        currency: i.currency,
        action: i.action,
        status: i.status,
        sourceReceiptIds: i.sourceReceiptIds,
        sourceSubscriptionId: i.sourceSubscriptionId,
        modelVersion: i.modelVersion,
        promptVersion: i.promptVersion,
        createdAt: i.createdAt.toISOString(),
      })),
      nextCursor,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
