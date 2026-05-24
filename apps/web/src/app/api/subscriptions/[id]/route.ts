import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@receiptbrain/lib';
import { SubscriptionPatchSchema } from '@receiptbrain/contracts';
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

export async function PATCH(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const body = SubscriptionPatchSchema.parse(await req.json());
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError();
    assertOwns(existing, session.user.id);
    const updated = await prisma.subscription.update({
      where: { id: existing.id },
      data: { status: body.status },
    });
    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
