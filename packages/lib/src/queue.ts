import { Queue, type QueueOptions, type RedisOptions } from 'bullmq';
import IORedis, { type Redis } from 'ioredis';

export const QUEUE_NAMES = {
  extractReceipt: 'extract_receipt',
  generateInsights: 'generate_insights',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface ExtractReceiptJob {
  receiptId: string;
  userId: string;
}

export interface GenerateInsightsJob {
  userId: string;
  // Optional window override; defaults to last 90 days in the worker.
  windowDays?: number;
}

export interface QueueConnectionOpts {
  redisUrl?: string;
  prefix?: string;
}

const _registry: Queue[] = [];
const _connections: Redis[] = [];

function makeConnection(opts: QueueConnectionOpts): Redis {
  const url = opts.redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
  // BullMQ requires maxRetriesPerRequest: null on the IORedis instance.
  const redis = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  } satisfies RedisOptions);
  _connections.push(redis);
  return redis;
}

const defaultJobOptions = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 2_000 },
  removeOnComplete: { age: 60 * 60, count: 1_000 },
  removeOnFail: { age: 24 * 60 * 60, count: 5_000 },
};

function createQueue<T>(name: QueueName, opts: QueueConnectionOpts): Queue<T> {
  const queueOpts: QueueOptions = {
    connection: makeConnection(opts),
    defaultJobOptions,
  };
  if (opts.prefix) queueOpts.prefix = opts.prefix;
  const q = new Queue<T>(name, queueOpts);
  _registry.push(q as unknown as Queue);
  return q;
}

export function createExtractReceiptQueue(
  opts: QueueConnectionOpts = {},
): Queue<ExtractReceiptJob> {
  return createQueue<ExtractReceiptJob>(QUEUE_NAMES.extractReceipt, opts);
}

export function createGenerateInsightsQueue(
  opts: QueueConnectionOpts = {},
): Queue<GenerateInsightsJob> {
  return createQueue<GenerateInsightsJob>(QUEUE_NAMES.generateInsights, opts);
}

/** Minimal queue surface used by enqueueExtractReceipt (easy to mock in tests). */
export interface ExtractReceiptQueueLike {
  getJob(id: string): Promise<{ getState(): Promise<string>; remove(): Promise<void> } | undefined>;
  add(
    name: string,
    data: ExtractReceiptJob,
    opts: { jobId: string },
  ): Promise<{ id?: string }>;
}

/**
 * Enqueue (or re-enqueue) extract_receipt for a receipt.
 *
 * BullMQ deduplicates on `jobId`. A previously completed/failed job with the
 * same id blocks re-runs — which breaks restore-after-delete and manual
 * re-extract. We remove stale jobs first; concurrent clicks while `active`
 * coalesce onto the in-flight job.
 */
export async function enqueueExtractReceipt(
  queue: ExtractReceiptQueueLike,
  payload: ExtractReceiptJob,
): Promise<{ id?: string }> {
  const existing = await queue.getJob(payload.receiptId);
  if (existing) {
    const state = await existing.getState();
    if (state === 'active') return { id: payload.receiptId };
    await existing.remove();
  }
  return queue.add('extract', payload, { jobId: payload.receiptId });
}

/**
 * Debounce window for auto-enqueued insight generation.
 *
 * After a receipt is extracted we enqueue `generate_insights` with `delay`
 * = this value. While that delayed job sits in the queue, additional
 * upload-triggered enqueues for the same user are no-ops (BullMQ rejects
 * duplicate jobIds). So a flurry of N uploads collapses to a single
 * insights run that sees all of them.
 */
export const GENERATE_INSIGHTS_DEBOUNCE_MS = 5 * 60 * 1000;

export interface GenerateInsightsQueueLike {
  getJob(
    id: string,
  ): Promise<{ getState(): Promise<string>; remove(): Promise<void> } | undefined>;
  add(
    name: string,
    data: GenerateInsightsJob,
    opts: { jobId: string; delay?: number },
  ): Promise<{ id?: string }>;
}

export interface EnqueueGenerateInsightsResult {
  id?: string;
  /** true when a pending job already exists and we deliberately skipped. */
  debounced: boolean;
}

/**
 * Enqueue (with debounce) a `generate_insights` job for a user.
 *
 * - If a `waiting`, `delayed`, or `active` job exists for this user, no-op.
 * - If a `completed`/`failed` job lingers under the same jobId, remove it
 *   and enqueue fresh.
 * - Pass `{ delayMs: 0 }` to bypass the debounce (e.g. "Generate now" button).
 */
export async function enqueueGenerateInsights(
  queue: GenerateInsightsQueueLike,
  payload: GenerateInsightsJob,
  opts: { delayMs?: number } = {},
): Promise<EnqueueGenerateInsightsResult> {
  const delay = opts.delayMs ?? GENERATE_INSIGHTS_DEBOUNCE_MS;
  const existing = await queue.getJob(payload.userId);
  if (existing) {
    const state = await existing.getState();
    if (state === 'waiting' || state === 'delayed' || state === 'active') {
      return { id: payload.userId, debounced: true };
    }
    await existing.remove();
  }
  const job = await queue.add('gen', payload, { jobId: payload.userId, delay });
  return { id: job.id, debounced: false };
}

export async function pingRedis(url: string, timeoutMs = 1500): Promise<boolean> {
  const r = new IORedis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: timeoutMs,
  });
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

export async function closeQueues(): Promise<void> {
  await Promise.allSettled(_registry.map((q) => q.close()));
  _registry.length = 0;
  await Promise.allSettled(_connections.map((c) => c.quit()));
  _connections.length = 0;
}
