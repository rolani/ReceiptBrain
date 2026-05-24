import { NextResponse } from 'next/server';
import { requireSession, toApiErrorResponse } from '@/lib/require-session';
import { loadDashboardData } from '@/lib/dashboard-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const payload = await loadDashboardData(session.user.id, {
      name: session.user.name,
      email: session.user.email,
    });
    return NextResponse.json(payload);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
