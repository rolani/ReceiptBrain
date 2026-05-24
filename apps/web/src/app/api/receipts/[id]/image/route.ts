import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@receiptbrain/lib';
import {
  NotFoundError,
  assertOwns,
  requireSession,
  toApiErrorResponse,
} from '@/lib/require-session';
import { storage } from '@/lib/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;

    const row = await prisma.receipt.findUnique({ where: { id } });
    if (!row || row.deletedAt) throw new NotFoundError();
    assertOwns(row, session.user.id);

    const url = await storage().getSignedUrl(row.imageUrl, { expiresInSeconds: 60 });
    return NextResponse.json({ url, expiresInSeconds: 60 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
