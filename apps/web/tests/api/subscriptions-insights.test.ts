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

import * as subList from '@/app/api/subscriptions/route';
import * as subPatch from '@/app/api/subscriptions/[id]/route';
import * as insList from '@/app/api/insights/route';
import * as insPatch from '@/app/api/insights/[id]/route';

beforeEach(() => resetApiMocks());

function req(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost${path}`, init);
}

describe('Subscriptions API', () => {
  it('GET /api/subscriptions 401 unauthed', async () => {
    await signedOut();
    const res = await subList.GET();
    expect(res.status).toBe(401);
  });

  it('GET /api/subscriptions returns items scoped to user', async () => {
    await signedInAs('u_1');
    prismaMock.subscription.findMany.mockResolvedValue([
      {
        id: 's1',
        merchant: { canonicalName: 'Netflix' },
        amount: { toFixed: () => '15.99' },
        currency: 'USD',
        interval: 'monthly',
        firstCharge: new Date('2026-01-01'),
        lastCharge: new Date('2026-05-01'),
        nextChargeEstimate: new Date('2026-06-01'),
        confidence: 0.95,
        status: 'active',
        sourceReceiptIds: ['r1', 'r2'],
      },
    ]);
    const res = await subList.GET();
    const body = await res.json();
    expect(body.items[0].merchant).toBe('Netflix');
    expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u_1' } }),
    );
  });

  it('PATCH 403 when subscription belongs to another user', async () => {
    await signedInAs('u_1');
    prismaMock.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'u_2' });
    const res = await subPatch.PATCH(
      req('/api/subscriptions/s1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      }) as never,
      { params: Promise.resolve({ id: 's1' }) },
    );
    expect(res.status).toBe(403);
  });

  it('PATCH happy path updates status', async () => {
    await signedInAs('u_1');
    prismaMock.subscription.findUnique.mockResolvedValue({ id: 's1', userId: 'u_1' });
    prismaMock.subscription.update.mockResolvedValue({ id: 's1', status: 'cancelled' });
    const res = await subPatch.PATCH(
      req('/api/subscriptions/s1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      }) as never,
      { params: Promise.resolve({ id: 's1' }) },
    );
    expect(res.status).toBe(200);
  });
});

describe('Insights API', () => {
  it('GET /api/insights excludes dismissed by default', async () => {
    await signedInAs('u_1');
    prismaMock.insight.findMany.mockResolvedValue([]);
    const res = await insList.GET(req('/api/insights?limit=50') as never);
    expect(res.status).toBe(200);
    expect(prismaMock.insight.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u_1', status: { not: 'dismissed' } },
      }),
    );
  });

  it('GET /api/insights filters by type+status', async () => {
    await signedInAs('u_1');
    prismaMock.insight.findMany.mockResolvedValue([]);
    const res = await insList.GET(req('/api/insights?type=subscription_waste&status=new') as never);
    expect(res.status).toBe(200);
    expect(prismaMock.insight.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u_1', type: 'subscription_waste', status: 'new' },
      }),
    );
  });

  it('PATCH /api/insights/:id 400 on bad status', async () => {
    await signedInAs('u_1');
    const res = await insPatch.PATCH(
      req('/api/insights/i1', { method: 'PATCH', body: JSON.stringify({ status: 'bogus' }) }) as never,
      { params: Promise.resolve({ id: 'i1' }) },
    );
    expect(res.status).toBe(400);
  });

  it('PATCH /api/insights/:id 403 cross-user', async () => {
    await signedInAs('u_1');
    prismaMock.insight.findUnique.mockResolvedValue({ id: 'i1', userId: 'u_2' });
    const res = await insPatch.PATCH(
      req('/api/insights/i1', { method: 'PATCH', body: JSON.stringify({ status: 'seen' }) }) as never,
      { params: Promise.resolve({ id: 'i1' }) },
    );
    expect(res.status).toBe(403);
  });

  it('PATCH happy path', async () => {
    await signedInAs('u_1');
    prismaMock.insight.findUnique.mockResolvedValue({ id: 'i1', userId: 'u_1' });
    prismaMock.insight.update.mockResolvedValue({ id: 'i1', status: 'seen' });
    const res = await insPatch.PATCH(
      req('/api/insights/i1', { method: 'PATCH', body: JSON.stringify({ status: 'seen' }) }) as never,
      { params: Promise.resolve({ id: 'i1' }) },
    );
    expect(res.status).toBe(200);
  });
});
