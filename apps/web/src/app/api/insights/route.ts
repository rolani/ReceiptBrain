import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@receiptbrain/lib';
import {
  resolveInsightSourceReceiptIds,
  sanitizeInsightActionForResponse,
  type ReceiptForProvenance,
  type SubscriptionForProvenance,
} from '@receiptbrain/lib/domain';
import { InsightStatus, InsightType } from '@receiptbrain/contracts';
import { z } from 'zod';
import { requireSession, toApiErrorResponse } from '@/lib/require-session';

const INSIGHT_WINDOW_DAYS = 90;

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

    const since = new Date(Date.now() - INSIGHT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const [receiptRows, subRows] = await Promise.all([
      prisma.receipt.findMany({
        where: { userId: session.user.id, deletedAt: null, purchasedAt: { gte: since } },
        select: {
          id: true,
          rawMerchant: true,
          merchant: { select: { canonicalName: true } },
        },
      }),
      prisma.subscription.findMany({
        where: { userId: session.user.id, status: 'active' },
        select: {
          id: true,
          sourceReceiptIds: true,
          merchant: { select: { canonicalName: true } },
        },
      }),
    ]);

    const receiptsForProvenance: ReceiptForProvenance[] = receiptRows.map((r) => ({
      id: r.id,
      merchantName: r.merchant?.canonicalName ?? r.rawMerchant ?? 'Unknown',
    }));
    const subsForProvenance: SubscriptionForProvenance[] = subRows.map((s) => ({
      id: s.id,
      merchantName: s.merchant.canonicalName,
      sourceReceiptIds: s.sourceReceiptIds,
    }));

    const items = await Promise.all(
      rows.map(async (i) => {
        let sourceReceiptIds = i.sourceReceiptIds;
        if (sourceReceiptIds.length === 0 && receiptsForProvenance.length > 0) {
          sourceReceiptIds = resolveInsightSourceReceiptIds(
            {
              type: i.type,
              title: i.title,
              description: i.description,
              sourceReceiptIds: i.sourceReceiptIds,
              sourceSubscriptionId: i.sourceSubscriptionId,
            },
            receiptsForProvenance,
            subsForProvenance,
          );
          if (sourceReceiptIds.length > 0) {
            await prisma.insight.update({
              where: { id: i.id },
              data: { sourceReceiptIds },
            });
          }
        }

        return {
          id: i.id,
          type: i.type,
          title: i.title,
          description: i.description,
          estimatedSavings: i.estimatedSavings?.toFixed(2) ?? null,
          currency: i.currency,
          action: sanitizeInsightActionForResponse(
            i.action as { label: string; kind: 'external_link' | 'in_app' | 'dismiss'; target?: string } | null,
          ),
          status: i.status,
          sourceReceiptIds,
          sourceSubscriptionId: i.sourceSubscriptionId,
          modelVersion: i.modelVersion,
          promptVersion: i.promptVersion,
          createdAt: i.createdAt.toISOString(),
        };
      }),
    );

    return NextResponse.json({
      items,
      nextCursor,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
