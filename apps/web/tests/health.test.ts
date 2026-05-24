import { describe, expect, it, vi } from 'vitest';

vi.mock('@receiptbrain/lib/prisma', () => ({
  prisma: { $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) },
}));
vi.mock('@receiptbrain/lib/queue', () => ({
  pingRedis: vi.fn().mockResolvedValue(true),
}));
vi.stubGlobal(
  'fetch',
  vi.fn(async () => new Response('{}', { status: 200 })),
);

import { GET } from '../src/app/api/health/route.js';

describe('GET /api/health', () => {
  it('returns 200 with ok=true and service identifier', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('web');
  });

  it('exposes a checks object with db/redis/ai sub-results', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.checks).toEqual(
      expect.objectContaining({
        db: expect.objectContaining({ ok: true }),
        redis: expect.objectContaining({ ok: true }),
        ai: expect.objectContaining({ ok: true }),
      }),
    );
  });
});
