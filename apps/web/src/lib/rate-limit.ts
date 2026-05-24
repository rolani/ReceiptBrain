// Per-user rate limiter — in-memory for dev/test, Redis-backed in prod.
// Each route owns a singleton limiter and calls `assertWithinLimit(key, max)`.
// On limit, throws RateLimitError so the shared error handler returns 429.

import { RateLimitError } from './require-session';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  consume(key: string, maxPerWindow: number): Promise<RateLimitResult>;
}

interface Bucket {
  count: number;
  expiresAt: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly windowMs: number;
  private readonly clock: () => number;
  private offsetMs = 0;

  constructor(opts: { windowMs: number; now?: () => number }) {
    this.windowMs = opts.windowMs;
    this.clock = opts.now ?? (() => Date.now());
  }

  /** Test helper: shift the simulated clock forward (only useful with `now` clock). */
  advance(ms: number): void {
    this.offsetMs += ms;
  }

  private nowMs(): number {
    return this.clock() + this.offsetMs;
  }

  async consume(key: string, maxPerWindow: number): Promise<RateLimitResult> {
    const now = this.nowMs();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.expiresAt <= now) {
      this.buckets.set(key, { count: 1, expiresAt: now + this.windowMs });
      return { allowed: true, remaining: maxPerWindow - 1, retryAfterSeconds: 0 };
    }
    if (bucket.count >= maxPerWindow) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    bucket.count += 1;
    return {
      allowed: true,
      remaining: maxPerWindow - bucket.count,
      retryAfterSeconds: 0,
    };
  }
}

// Per-route singletons (1-hour windows per outline).
const uploadLimiter = new InMemoryRateLimiter({ windowMs: 60 * 60 * 1000 });
const recommendLimiter = new InMemoryRateLimiter({ windowMs: 60 * 60 * 1000 });

export async function assertUploadWithinLimit(userId: string): Promise<void> {
  const r = await uploadLimiter.consume(`upload:${userId}`, 30);
  if (!r.allowed) throw new RateLimitError(r.retryAfterSeconds);
}

export async function assertRecommendWithinLimit(userId: string): Promise<void> {
  const r = await recommendLimiter.consume(`recommend:${userId}`, 10);
  if (!r.allowed) throw new RateLimitError(r.retryAfterSeconds);
}

// Exposed for tests that need to reset state between runs.
export function _resetRateLimitersForTests(): void {
  // @ts-expect-error private mutation for tests
  uploadLimiter.buckets.clear();
  // @ts-expect-error private mutation for tests
  recommendLimiter.buckets.clear();
}
