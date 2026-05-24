import { describe, expect, it, vi } from 'vitest';
import {
  enqueueGenerateInsights,
  GENERATE_INSIGHTS_DEBOUNCE_MS,
  type GenerateInsightsQueueLike,
} from '../src/queue.js';

function makeQueueMock(overrides: Partial<GenerateInsightsQueueLike> = {}): {
  queue: GenerateInsightsQueueLike;
  add: ReturnType<typeof vi.fn>;
  getJob: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
} {
  const remove = vi.fn(async () => undefined);
  const getJob = vi.fn(async () => undefined as unknown);
  const add = vi.fn(async (_n: string, _d: unknown, opts: { jobId: string }) => ({
    id: opts.jobId,
  }));
  const queue: GenerateInsightsQueueLike = {
    getJob: getJob as GenerateInsightsQueueLike['getJob'],
    add: add as GenerateInsightsQueueLike['add'],
    ...overrides,
  };
  return { queue, add, getJob, remove };
}

describe('enqueueGenerateInsights', () => {
  it('exposes a debounce window of at least 1 minute', () => {
    expect(GENERATE_INSIGHTS_DEBOUNCE_MS).toBeGreaterThanOrEqual(60_000);
  });

  it('uses userId as jobId so duplicate calls dedupe', async () => {
    const { queue, add } = makeQueueMock();
    await enqueueGenerateInsights(queue, { userId: 'u_1' });
    expect(add).toHaveBeenCalledWith(
      'gen',
      { userId: 'u_1' },
      expect.objectContaining({ jobId: 'u_1', delay: GENERATE_INSIGHTS_DEBOUNCE_MS }),
    );
  });

  it('skips enqueue when a delayed/waiting job for the user already exists', async () => {
    const remove = vi.fn();
    const getJob = vi.fn(async () => ({
      getState: vi.fn(async () => 'delayed'),
      remove,
    }));
    const add = vi.fn();
    const queue = { getJob, add } as unknown as GenerateInsightsQueueLike;
    const result = await enqueueGenerateInsights(queue, { userId: 'u_2' });
    expect(result.debounced).toBe(true);
    expect(add).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('removes a completed/failed job before re-enqueueing so future runs are not blocked', async () => {
    const remove = vi.fn(async () => undefined);
    const states = ['completed'];
    const getJob = vi.fn(async () => ({
      getState: vi.fn(async () => states.shift() ?? 'unknown'),
      remove,
    }));
    const add = vi.fn(async (_n: string, _d: unknown, opts: { jobId: string }) => ({
      id: opts.jobId,
    }));
    const queue = { getJob, add } as unknown as GenerateInsightsQueueLike;
    const result = await enqueueGenerateInsights(queue, { userId: 'u_3' });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledTimes(1);
    expect(result.debounced).toBe(false);
  });

  it('respects override delay (e.g. for immediate "Generate now" button)', async () => {
    const { queue, add } = makeQueueMock();
    await enqueueGenerateInsights(queue, { userId: 'u_4' }, { delayMs: 0 });
    expect(add).toHaveBeenCalledWith(
      'gen',
      { userId: 'u_4' },
      expect.objectContaining({ delay: 0 }),
    );
  });
});
