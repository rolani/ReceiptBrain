import { describe, expect, it, vi } from 'vitest';
import { enqueueExtractReceipt, type ExtractReceiptQueueLike } from '../src/queue.js';

function makeQueue(stubs: {
  existing?: { state: string; remove?: ReturnType<typeof vi.fn> };
  add?: ReturnType<typeof vi.fn>;
}): ExtractReceiptQueueLike {
  const remove = stubs.existing?.remove ?? vi.fn(async () => undefined);
  return {
    getJob: vi.fn(async () =>
      stubs.existing
        ? { getState: async () => stubs.existing!.state, remove }
        : undefined,
    ),
    add: stubs.add ?? vi.fn(async (_n, _d, opts) => ({ id: opts.jobId })),
  };
}

describe('enqueueExtractReceipt', () => {
  const payload = { receiptId: 'rcp_1', userId: 'u_1' };

  it('adds a new job when none exists', async () => {
    const add = vi.fn(async (_n, _d, opts) => ({ id: opts.jobId }));
    const queue = makeQueue({ add });
    const job = await enqueueExtractReceipt(queue, payload);
    expect(job.id).toBe('rcp_1');
    expect(add).toHaveBeenCalledOnce();
  });

  it('removes a completed job before re-adding', async () => {
    const remove = vi.fn(async () => undefined);
    const add = vi.fn(async (_n, _d, opts) => ({ id: opts.jobId }));
    const queue = makeQueue({ existing: { state: 'completed', remove }, add });
    await enqueueExtractReceipt(queue, payload);
    expect(remove).toHaveBeenCalledOnce();
    expect(add).toHaveBeenCalledOnce();
  });

  it('does not re-add while a job is active (coalesce concurrent clicks)', async () => {
    const remove = vi.fn();
    const add = vi.fn();
    const queue = makeQueue({ existing: { state: 'active', remove }, add });
    const job = await enqueueExtractReceipt(queue, payload);
    expect(job.id).toBe('rcp_1');
    expect(remove).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });
});
