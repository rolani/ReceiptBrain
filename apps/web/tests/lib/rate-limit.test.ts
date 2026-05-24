import { describe, expect, it, beforeEach } from 'vitest';
import { InMemoryRateLimiter } from '@/lib/rate-limit';

describe('InMemoryRateLimiter', () => {
  let limiter: InMemoryRateLimiter;
  beforeEach(() => {
    limiter = new InMemoryRateLimiter({ windowMs: 60_000 });
  });

  it('allows up to N requests inside the window', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await limiter.consume('user:1', 5);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(5 - i - 1);
    }
  });

  it('blocks the (N+1)th request with retryAfter > 0', async () => {
    for (let i = 0; i < 3; i++) {
      await limiter.consume('user:2', 3);
    }
    const r = await limiter.consume('user:2', 3);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('scopes counters per key (different users do not contend)', async () => {
    await limiter.consume('user:a', 1);
    const r = await limiter.consume('user:b', 1);
    expect(r.allowed).toBe(true);
  });

  it('resets after the window expires', async () => {
    const fast = new InMemoryRateLimiter({ windowMs: 20, now: makeClock() });
    await fast.consume('k', 1);
    const blocked = await fast.consume('k', 1);
    expect(blocked.allowed).toBe(false);
    fast.advance(25);
    const reopened = await fast.consume('k', 1);
    expect(reopened.allowed).toBe(true);
  });
});

function makeClock(): () => number {
  let t = 0;
  return () => t;
}
