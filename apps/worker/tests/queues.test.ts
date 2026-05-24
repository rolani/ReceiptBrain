import { describe, expect, it } from 'vitest';
import { QUEUE_NAMES, defaultJobOpts, type QueueName } from '../src/queues.js';

describe('queue contracts', () => {
  it('exposes the two MVP queue names', () => {
    expect(QUEUE_NAMES.extractReceipt).toBe('extract_receipt');
    expect(QUEUE_NAMES.generateInsights).toBe('generate_insights');
  });

  it('queue names are stable identifiers', () => {
    const names: QueueName[] = Object.values(QUEUE_NAMES);
    expect(new Set(names).size).toBe(names.length);
  });

  it('default job opts enable retries and idempotency via jobId', () => {
    const opts = defaultJobOpts('receipt-123');
    expect(opts.jobId).toBe('receipt-123');
    expect(opts.attempts).toBeGreaterThanOrEqual(3);
    expect(opts.backoff).toMatchObject({ type: 'exponential' });
  });
});
