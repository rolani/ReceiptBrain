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

import { POST } from '@/app/api/receipts/[id]/reextract/route';

beforeEach(() => resetApiMocks());

function req(): Request {
  return new Request('http://localhost/api/receipts/r1/reextract', { method: 'POST' });
}

describe('POST /api/receipts/:id/reextract', () => {
  it('401 unauthed', async () => {
    await signedOut();
    const res = await POST(req() as never, { params: Promise.resolve({ id: 'r1' }) });
    expect(res.status).toBe(401);
  });

  it('403 cross-user', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({ id: 'r1', userId: 'u_2', deletedAt: null });
    const res = await POST(req() as never, { params: Promise.resolve({ id: 'r1' }) });
    expect(res.status).toBe(403);
  });

  it('enqueues with jobId=receiptId for coalescing', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({ id: 'r1', userId: 'u_1', deletedAt: null });
    prismaMock.receipt.update.mockResolvedValue({ id: 'r1', status: 'extracting' });
    const res = await POST(req() as never, { params: Promise.resolve({ id: 'r1' }) });
    expect(res.status).toBe(202);
    expect(extractQueueMock.add).toHaveBeenCalledWith(
      'extract',
      { receiptId: 'r1', userId: 'u_1' },
      { jobId: 'r1' },
    );
  });
});
