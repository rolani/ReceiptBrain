import { enqueueGenerateInsights } from '@receiptbrain/lib/queue';
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
    const { id, debounced } = await enqueueGenerateInsights(
      queue,
      { userId: session.user.id },
      { delayMs: 0 },
    );
    return NextResponse.json(
      { jobId: id, status: debounced ? 'already_queued' : 'queued' },
      { status: 202 },
    );
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
