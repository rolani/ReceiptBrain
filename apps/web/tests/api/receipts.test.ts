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

import * as list from '@/app/api/receipts/route';
import * as detail from '@/app/api/receipts/[id]/route';
import * as image from '@/app/api/receipts/[id]/image/route';
import * as statusRoute from '@/app/api/receipts/[id]/status/route';

beforeEach(() => resetApiMocks());

function req(url: string, init?: RequestInit): Request {
  return new Request(`http://localhost${url}`, init);
}

describe('GET /api/receipts', () => {
  it('401 when unauthed', async () => {
    await signedOut();
    const res = await list.GET(req('/api/receipts') as never);
    expect(res.status).toBe(401);
  });

  it('returns paginated items scoped to the session user', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findMany.mockResolvedValue([
      {
        id: 'r1',
        status: 'extracted',
        merchant: { canonicalName: 'Starbucks' },
        rawMerchant: 'STARBUCKS #1',
        total: { toFixed: () => '5.00' },
        currency: 'USD',
        purchasedAt: new Date('2026-05-01T00:00:00Z'),
        createdAt: new Date('2026-05-01T00:00:00Z'),
      },
    ]);
    const res = await list.GET(req('/api/receipts?limit=10') as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items[0].id).toBe('r1');
    expect(body.items[0].merchant).toBe('Starbucks');
    expect(prismaMock.receipt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'u_1', deletedAt: null }) }),
    );
  });
});

describe('GET /api/receipts/:id', () => {
  it('403 when receipt belongs to another user', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u_2',
      deletedAt: null,
      status: 'extracted',
      merchant: null,
      rawMerchant: 'X',
      total: null,
      subtotal: null,
      tax: null,
      tip: null,
      currency: 'USD',
      purchasedAt: null,
      paymentLast4: null,
      fieldConfidence: null,
      items: [],
      createdAt: new Date(),
    });
    const res = await detail.GET(req('/api/receipts/r1') as never, { params: Promise.resolve({ id: 'r1' }) });
    expect(res.status).toBe(403);
  });

  it('happy path returns body with items', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u_1',
      deletedAt: null,
      status: 'extracted',
      merchant: { canonicalName: 'Whole Foods' },
      rawMerchant: 'WF',
      total: { toFixed: () => '12.00' },
      subtotal: null,
      tax: null,
      tip: null,
      currency: 'USD',
      purchasedAt: new Date('2026-04-01'),
      paymentLast4: null,
      fieldConfidence: { merchant: 0.9 },
      items: [
        {
          id: 'i1',
          lineNumber: 1,
          name: 'Eggs',
          unitPrice: { toFixed: () => '6.99' },
          quantity: 1,
          lineTotal: { toFixed: () => '6.99' },
          category: 'groceries',
          confidence: 0.95,
        },
      ],
      createdAt: new Date('2026-04-01'),
    });
    const res = await detail.GET(req('/api/receipts/r1') as never, { params: Promise.resolve({ id: 'r1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.merchant).toBe('Whole Foods');
    expect(body.items).toHaveLength(1);
    expect(body.total).toBe('12.00');
  });
});

describe('PATCH /api/receipts/:id', () => {
  it('400 when body is invalid', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u_1',
      deletedAt: null,
      items: [],
      merchant: null,
      rawMerchant: null,
      total: null,
      subtotal: null,
      tax: null,
      tip: null,
      currency: 'USD',
      purchasedAt: null,
      paymentLast4: null,
      fieldConfidence: null,
      status: 'extracted',
      createdAt: new Date(),
    });
    const res = await detail.PATCH(
      req('/api/receipts/r1', { method: 'PATCH', body: JSON.stringify({ total: 'not-money' }) }) as never,
      { params: Promise.resolve({ id: 'r1' }) },
    );
    expect(res.status).toBe(400);
  });

  it('happy path updates merchant', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u_1',
      deletedAt: null,
      items: [],
      merchant: null,
      rawMerchant: null,
      total: null,
      subtotal: null,
      tax: null,
      tip: null,
      currency: 'USD',
      purchasedAt: null,
      paymentLast4: null,
      fieldConfidence: null,
      status: 'extracted',
      createdAt: new Date(),
    });
    prismaMock.receipt.update.mockResolvedValue({ id: 'r1', status: 'extracted' });
    const res = await detail.PATCH(
      req('/api/receipts/r1', { method: 'PATCH', body: JSON.stringify({ rawMerchant: 'Updated' }) }) as never,
      { params: Promise.resolve({ id: 'r1' }) },
    );
    expect(res.status).toBe(200);
    expect(prismaMock.receipt.update).toHaveBeenCalled();
  });

  it('allows marking needs_review as extracted', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u_1',
      deletedAt: null,
      items: [],
      merchant: null,
      rawMerchant: 'Costco',
      total: { toFixed: () => '43.97' },
      subtotal: null,
      tax: null,
      tip: null,
      currency: 'USD',
      purchasedAt: null,
      paymentLast4: null,
      fieldConfidence: { merchant: 0.9, total: 0.8 },
      status: 'needs_review',
      createdAt: new Date(),
    });
    prismaMock.receipt.update.mockResolvedValue({ id: 'r1', status: 'extracted' });
    const res = await detail.PATCH(
      req('/api/receipts/r1', {
        method: 'PATCH',
        body: JSON.stringify({
          rawMerchant: 'Costco',
          total: '43.97',
          purchasedAt: '2026-05-22T10:00:00.000Z',
          status: 'extracted',
        }),
      }) as never,
      { params: Promise.resolve({ id: 'r1' }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('extracted');
  });
});

describe('DELETE /api/receipts/:id', () => {
  it('soft-deletes and returns 204', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u_1',
      deletedAt: null,
      items: [],
      merchant: null,
      rawMerchant: null,
      total: null,
      subtotal: null,
      tax: null,
      tip: null,
      currency: 'USD',
      purchasedAt: null,
      paymentLast4: null,
      fieldConfidence: null,
      status: 'extracted',
      createdAt: new Date(),
    });
    prismaMock.receipt.update.mockResolvedValue({ id: 'r1' });
    const res = await detail.DELETE(req('/api/receipts/r1', { method: 'DELETE' }) as never, { params: Promise.resolve({ id: 'r1' }) });
    expect(res.status).toBe(204);
    expect(prismaMock.receipt.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
    );
  });
});

describe('GET /api/receipts/:id/image', () => {
  it('returns a signed URL', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u_1',
      deletedAt: null,
      imageUrl: 'receipts/u_1/abc',
    });
    const res = await image.GET(req('/api/receipts/r1/image') as never, { params: Promise.resolve({ id: 'r1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain('signed.example');
    expect(storageMock.getSignedUrl).toHaveBeenCalledWith('receipts/u_1/abc', { expiresInSeconds: 60 });
  });
});

describe('GET /api/receipts/:id/status', () => {
  it('returns status payload', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u_1',
      deletedAt: null,
      status: 'extracting',
      updatedAt: new Date('2026-05-01T00:00:00Z'),
    });
    const res = await statusRoute.GET(req('/api/receipts/r1/status') as never, { params: Promise.resolve({ id: 'r1' }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'r1', status: 'extracting' });
  });
});
