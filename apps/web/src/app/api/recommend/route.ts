import { NextResponse } from 'next/server';
import { requireSession, toApiErrorResponse } from '@/lib/require-session';
import { assertRecommendWithinLimit } from '@/lib/rate-limit';
import { generateInsightsQueue } from '@/lib/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    await assertRecommendWithinLimit(session.user.id);
    const queue = generateInsightsQueue();
    const job = await queue.add(
      'gen',
      { userId: session.user.id },
      { jobId: session.user.id },
    );
    return NextResponse.json({ jobId: job.id, status: 'queued' }, { status: 202 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
