import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@receiptbrain/lib';
import { UserSettingsPatchSchema } from '@receiptbrain/contracts';
import { requireSession, toApiErrorResponse } from '@/lib/require-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const body = UserSettingsPatchSchema.parse(await req.json());

    const data: {
      name?: string;
      defaultCurrency?: string | null;
      defaultLocation?: string | null;
      defaultLocationCountry?: string | null;
    } = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.defaultCurrency !== undefined) data.defaultCurrency = body.defaultCurrency;
    if (body.defaultLocation !== undefined) data.defaultLocation = body.defaultLocation;
    if (body.defaultLocationCountry !== undefined) {
      data.defaultLocationCountry = body.defaultLocationCountry;
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        name: true,
        defaultCurrency: true,
        defaultLocation: true,
        defaultLocationCountry: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
