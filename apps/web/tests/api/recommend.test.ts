import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  extractQueueMock,
  insightsQueueMock,
  prismaMock,
  resetApiMocks,
  signedInAs,
  signedOut,
  storageMock,
} from './_mocks';

vi.mock('@receiptbrain/lib', () => ({ prisma: prismaMock }));
vi.mock('@/lib/services', () => ({
  storage: () => storageMock,
  extractReceiptQueue: () => extractQueueMock,
  generateInsightsQueue: () => insightsQueueMock,
}));

import { POST } from '@/app/api/recommend/route';
import { _resetRateLimitersForTests } from '@/lib/rate-limit';

beforeEach(() => {
  resetApiMocks();
  _resetRateLimitersForTests();
});

describe('POST /api/recommend', () => {
  it('401 when unauthed', async () => {
    await signedOut();
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('queues generate_insights with userId as jobId', async () => {
    await signedInAs('u_42');
    const res = await POST();
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.jobId).toBe('u_42');
    expect(insightsQueueMock.add).toHaveBeenCalledWith(
      'gen',
      { userId: 'u_42' },
      { jobId: 'u_42' },
    );
  });

  it('429 after 10 calls/hour', async () => {
    await signedInAs('u_rl');
    for (let i = 0; i < 10; i++) {
      const r = await POST();
      expect(r.status).toBe(202);
    }
    const r = await POST();
    expect(r.status).toBe(429);
  });
});
