import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@receiptbrain/lib';
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

export async function GET(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const row = await prisma.receipt.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, deletedAt: true, updatedAt: true },
    });
    if (!row || row.deletedAt) throw new NotFoundError();
    assertOwns(row, session.user.id);
    return NextResponse.json({ id: row.id, status: row.status, updatedAt: row.updatedAt.toISOString() });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
