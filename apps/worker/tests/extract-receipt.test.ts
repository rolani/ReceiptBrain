import { describe, expect, it, vi } from 'vitest';

vi.mock('@receiptbrain/lib/image', () => ({
  preprocessImage: vi.fn(async (buf: Buffer) => ({
    buffer: buf,
    mime: 'image/jpeg' as const,
    bytes: buf.byteLength,
    width: 1024,
    height: 768,
  })),
}));

import {
  handleExtractReceipt,
  LOW_CONFIDENCE_THRESHOLD,
  type ExtractDeps,
} from '../src/handlers/extract-receipt.js';
import type { ExtractResult } from '../src/ai-client.js';

function buildExtracted(overrides: Partial<ExtractResult> = {}): ExtractResult {
  return {
    merchant: 'Starbucks',
    rawMerchant: 'STARBUCKS #1',
    currency: 'USD',
    subtotal: 5.0,
    tax: 0.5,
    tip: 0,
    total: 5.5,
    purchasedAt: '2026-05-22T10:00:00Z',
    paymentLast4: '4242',
    items: [
      { name: 'Latte', unitPrice: 5.0, quantity: 1, lineTotal: 5.0, category: 'dining', confidence: 0.95 },
    ],
    fieldConfidence: { merchant: 0.99, total: 0.97, purchasedAt: 0.95, items: 0.94 },
    model: 'gpt-4o-2024-11-20',
    promptVersion: 'extract-v1',
    usage: { promptTokens: 1200, completionTokens: 200, costUsdEstimate: 0.0042 },
    ...overrides,
  };
}

function makeDeps(): ExtractDeps & {
  prisma: ReturnType<typeof makePrismaMock>;
  storage: ReturnType<typeof makeStorageMock>;
  ai: { extract: ReturnType<typeof vi.fn> };
  insightsQueue: { getJob: ReturnType<typeof vi.fn>; add: ReturnType<typeof vi.fn> };
} {
  const prisma = makePrismaMock();
  const storage = makeStorageMock();
  const ai = { extract: vi.fn(async () => buildExtracted()) };
  const insightsQueue = {
    getJob: vi.fn(async () => undefined),
    add: vi.fn(async (_n: string, _d: unknown, opts: { jobId: string }) => ({ id: opts.jobId })),
  };
  return {
    prisma: prisma as never,
    storage: storage as never,
    ai: ai as never,
    insightsQueue: insightsQueue as never,
  } as never;
}

function makePrismaMock() {
  const receipt = {
    findUnique: vi.fn(async () => ({
      id: 'rcp_1',
      userId: 'u_1',
      imageUrl: 'receipts/u_1/hash',
      imageMime: 'image/jpeg',
    })),
    update: vi.fn(async (args: { data: Record<string, unknown> }) => ({ id: 'rcp_1', ...args.data })),
  };
  const merchant = {
    upsert: vi.fn(async () => ({ id: 'm_1', canonicalName: 'Starbucks' })),
  };
  const item = {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  };
  const extractionAttempt = { create: vi.fn() };
  return {
    receipt,
    merchant,
    item,
    extractionAttempt,
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
      fn({ receipt, merchant, item, extractionAttempt }),
    ),
  };
}

function makeStorageMock() {
  return {
    getObject: vi.fn(async () => Buffer.alloc(1024)),
    contentHash: vi.fn(() => 'h'),
    putObject: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    getSignedUrl: vi.fn(),
    bucket: 't',
  };
}

describe('handleExtractReceipt', () => {
  it('happy path sets status=extracted and writes items + attempt', async () => {
    const deps = makeDeps();
    const out = await handleExtractReceipt({ receiptId: 'rcp_1', userId: 'u_1' }, deps);
    expect(out.status).toBe('extracted');
    expect(deps.prisma.merchant.upsert).toHaveBeenCalled();
    expect(deps.prisma.item.createMany).toHaveBeenCalled();
    expect(deps.prisma.extractionAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelName: 'gpt-4o-2024-11-20',
          promptTokens: 1200,
          completionTokens: 200,
          status: 'success',
        }),
      }),
    );
  });

  it('sets status=needs_review when merchant confidence is below threshold', async () => {
    const deps = makeDeps();
    deps.ai.extract.mockResolvedValueOnce(
      buildExtracted({
        fieldConfidence: { merchant: 0.4, total: 0.99, purchasedAt: 0.9, items: 0.9 },
      }),
    );
    const out = await handleExtractReceipt({ receiptId: 'rcp_1', userId: 'u_1' }, deps);
    expect(out.status).toBe('needs_review');
    expect(deps.prisma.extractionAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'partial' }) }),
    );
  });

  it('records a failed ExtractionAttempt and re-throws when AI errors', async () => {
    const deps = makeDeps();
    deps.ai.extract.mockRejectedValueOnce(new Error('upstream down'));
    await expect(
      handleExtractReceipt({ receiptId: 'rcp_1', userId: 'u_1' }, deps),
    ).rejects.toThrow(/upstream down/);
    expect(deps.prisma.extractionAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'failed' }) }),
    );
    // Receipt should be left in failed state for retry/visibility.
    expect(deps.prisma.receipt.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'failed' }) }),
    );
  });

  it('refuses to process a receipt that belongs to a different user', async () => {
    const deps = makeDeps();
    deps.prisma.receipt.findUnique.mockResolvedValueOnce({
      id: 'rcp_1',
      userId: 'u_OTHER',
      imageUrl: 'k',
      imageMime: 'image/jpeg',
    });
    await expect(
      handleExtractReceipt({ receiptId: 'rcp_1', userId: 'u_1' }, deps),
    ).rejects.toThrow(/cross-tenant/);
  });

  it('flags needs_review and stores null purchasedAt when AI returns invalid date', async () => {
    const deps = makeDeps();
    deps.ai.extract.mockResolvedValueOnce(buildExtracted({ purchasedAt: 'Unknown' }));
    const out = await handleExtractReceipt({ receiptId: 'rcp_1', userId: 'u_1' }, deps);
    expect(out.status).toBe('needs_review');
    const updateCalls = deps.prisma.receipt.update.mock.calls;
    const finalCall = updateCalls.at(-1);
    expect(finalCall).toBeDefined();
    const finalUpdate = finalCall![0] as { data: { purchasedAt: Date | null } };
    expect(finalUpdate.data.purchasedAt).toBeNull();
  });

  it('sets status=failed when persistence transaction throws (no stuck extracting)', async () => {
    const deps = makeDeps();
    deps.prisma.$transaction.mockRejectedValueOnce(new Error('db write failed'));
    await expect(
      handleExtractReceipt({ receiptId: 'rcp_1', userId: 'u_1' }, deps),
    ).rejects.toThrow(/db write failed/);
    expect(deps.prisma.receipt.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'failed' }) }),
    );
    expect(deps.prisma.extractionAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'failed' }) }),
    );
  });

  it('exports a sensible default low-confidence threshold', () => {
    expect(LOW_CONFIDENCE_THRESHOLD).toBeGreaterThan(0.5);
    expect(LOW_CONFIDENCE_THRESHOLD).toBeLessThan(1);
  });

  it('auto-enqueues generate_insights (debounced) after a successful extract', async () => {
    const deps = makeDeps();
    await handleExtractReceipt({ receiptId: 'rcp_1', userId: 'u_1' }, deps);
    expect(deps.insightsQueue.add).toHaveBeenCalledWith(
      'gen',
      { userId: 'u_1' },
      expect.objectContaining({ jobId: 'u_1', delay: expect.any(Number) }),
    );
  });

  it('auto-enqueues generate_insights even on needs_review status', async () => {
    const deps = makeDeps();
    deps.ai.extract.mockResolvedValueOnce(
      buildExtracted({
        fieldConfidence: { merchant: 0.4, total: 0.99, purchasedAt: 0.9, items: 0.9 },
      }),
    );
    await handleExtractReceipt({ receiptId: 'rcp_1', userId: 'u_1' }, deps);
    expect(deps.insightsQueue.add).toHaveBeenCalled();
  });

  it('does NOT enqueue insights when extraction failed', async () => {
    const deps = makeDeps();
    deps.ai.extract.mockRejectedValueOnce(new Error('upstream down'));
    await expect(
      handleExtractReceipt({ receiptId: 'rcp_1', userId: 'u_1' }, deps),
    ).rejects.toThrow();
    expect(deps.insightsQueue.add).not.toHaveBeenCalled();
  });

  it('works without an insightsQueue (back-compat: optional dependency)', async () => {
    const deps = makeDeps();
    const { insightsQueue: _ignored, ...slimDeps } = deps;
    const out = await handleExtractReceipt(
      { receiptId: 'rcp_1', userId: 'u_1' },
      slimDeps as never,
    );
    expect(out.status).toBe('extracted');
  });
});
