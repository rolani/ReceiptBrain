import { afterAll, describe, expect, it } from 'vitest';
import IORedis from 'ioredis';
import {
  QUEUE_NAMES,
  closeQueues,
  createExtractReceiptQueue,
  createGenerateInsightsQueue,
  type ExtractReceiptJob,
  type GenerateInsightsJob,
} from '../src/queue.js';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

async function pingRedis(): Promise<boolean> {
  const r = new IORedis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  try {
    await r.connect();
    await r.ping();
    return true;
  } catch {
    return false;
  } finally {
    r.disconnect();
  }
}

const redisUp = await pingRedis();

afterAll(async () => {
  await closeQueues();
});

describe.skipIf(!redisUp)('Queues', () => {
  it('exposes canonical queue names', () => {
    expect(QUEUE_NAMES.extractReceipt).toBe('extract_receipt');
    expect(QUEUE_NAMES.generateInsights).toBe('generate_insights');
  });

  it('extract_receipt queue accepts a typed job and round-trips the payload', async () => {
    const queue = createExtractReceiptQueue({ redisUrl: REDIS_URL, prefix: 'rb-test' });
    const payload: ExtractReceiptJob = { receiptId: 'rcp_test1', userId: 'u_1' };
    const job = await queue.add('extract', payload, { jobId: 'rcp_test1' });
    expect(job.id).toBe('rcp_test1');
    const fetched = await queue.getJob('rcp_test1');
    expect(fetched?.data).toEqual(payload);
    await queue.obliterate({ force: true });
  });

  it('generate_insights queue dedups by jobId so a debounced enqueue is idempotent', async () => {
    const queue = createGenerateInsightsQueue({ redisUrl: REDIS_URL, prefix: 'rb-test' });
    const payload: GenerateInsightsJob = { userId: 'u_42' };
    const a = await queue.add('gen', payload, { jobId: 'u_42' });
    const b = await queue.add('gen', payload, { jobId: 'u_42' });
    expect(a.id).toBe('u_42');
    expect(b.id).toBe('u_42');
    const count = await queue.getJobCounts('waiting', 'delayed', 'active');
    expect((count.waiting ?? 0) + (count.delayed ?? 0) + (count.active ?? 0)).toBe(1);
    await queue.obliterate({ force: true });
  });

  it('queues are configured for retry with exponential backoff (max 5)', () => {
    const queue = createExtractReceiptQueue({ redisUrl: REDIS_URL, prefix: 'rb-test' });
    expect(queue.defaultJobOptions).toMatchObject({
      attempts: 5,
      backoff: { type: 'exponential' },
      removeOnComplete: expect.any(Object),
      removeOnFail: expect.any(Object),
    });
  });
});
