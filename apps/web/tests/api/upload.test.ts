import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  prismaMock,
  resetApiMocks,
  signedInAs,
  signedOut,
  extractQueueMock,
  storageMock,
} from './_mocks';

vi.mock('@receiptbrain/lib', () => ({ prisma: prismaMock }));
vi.mock('@/lib/services', () => ({
  storage: () => storageMock,
  extractReceiptQueue: () => extractQueueMock,
  generateInsightsQueue: () => insightsQueueMock,
}));

import { insightsQueueMock } from './_mocks';
import { POST } from '@/app/api/upload/route';
import { _resetRateLimitersForTests } from '@/lib/rate-limit';

// jsdom's File lacks arrayBuffer/text. Build a synthetic file-like object that
// satisfies the route's checks (`instanceof File` and `.arrayBuffer()`).
class TestFile extends File {
  private readonly bytes: Uint8Array;
  constructor(bytes: Uint8Array, name: string, type: string) {
    super([bytes], name, { type });
    this.bytes = bytes;
    Object.defineProperty(this, 'size', { value: bytes.byteLength });
  }
  override async arrayBuffer(): Promise<ArrayBuffer> {
    return this.bytes.buffer.slice(
      this.bytes.byteOffset,
      this.bytes.byteOffset + this.bytes.byteLength,
    );
  }
}

function makeUploadRequest(file: File | null): { formData: () => Promise<FormData> } {
  const fd = new FormData();
  if (file) fd.set('file', file);
  return { formData: async () => fd };
}

function makeEmptyRequest(): { formData: () => Promise<FormData> } {
  const fd = new FormData();
  return { formData: async () => fd };
}

const jpeg = new TestFile(new Uint8Array([0xff, 0xd8, 0xff]), 'r.jpg', 'image/jpeg');

beforeEach(() => {
  resetApiMocks();
  _resetRateLimitersForTests();
});

describe('POST /api/upload', () => {
  it('returns 401 when unauthenticated', async () => {
    await signedOut();
    const res = await POST(makeUploadRequest(jpeg) as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 when the file field is missing', async () => {
    await signedInAs('u_1');
    const res = await POST(makeEmptyRequest() as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 for an unsupported MIME', async () => {
    await signedInAs('u_1');
    const bad = new TestFile(new Uint8Array([1, 2, 3]), 'r.txt', 'text/plain');
    const res = await POST(makeUploadRequest(bad) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.reason).toBe('unsupported_mime');
  });

  it.each([
    ['image/webp', 'r.webp'],
    ['image/avif', 'r.avif'],
    ['image/heic', 'r.heic'],
    ['image/tiff', 'r.tiff'],
    ['image/gif', 'r.gif'],
    ['application/pdf', 'r.pdf'],
  ])('accepts %s and enqueues extract_receipt', async (mime, name) => {
    await signedInAs('u_fmt');
    prismaMock.receipt.findUnique.mockResolvedValue(null);
    prismaMock.receipt.create.mockResolvedValue({ id: 'rcp_fmt', status: 'uploaded' });
    const f = new TestFile(new Uint8Array([1, 2, 3, 4]), name, mime);
    const res = await POST(makeUploadRequest(f) as never);
    expect(res.status).toBe(202);
    expect(storageMock.putObject).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(Buffer),
      mime,
    );
  });

  it('falls back to filename extension when File.type is empty (e.g. Safari HEIC)', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue(null);
    prismaMock.receipt.create.mockResolvedValue({ id: 'rcp_heic', status: 'uploaded' });
    const f = new TestFile(new Uint8Array([1, 2, 3, 4]), 'photo.heic', '');
    const res = await POST(makeUploadRequest(f) as never);
    expect(res.status).toBe(202);
    expect(storageMock.putObject).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(Buffer),
      'image/heic',
    );
  });

  it('returns 202 with receiptId on happy path and enqueues extract_receipt', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue(null);
    prismaMock.receipt.create.mockResolvedValue({ id: 'rcp_new', status: 'uploaded' });

    const res = await POST(makeUploadRequest(jpeg) as never);
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.receiptId).toBe('rcp_new');
    expect(body.deduped).toBe(false);

    expect(storageMock.putObject).toHaveBeenCalledOnce();
    expect(extractQueueMock.add).toHaveBeenCalledWith(
      'extract',
      { receiptId: 'rcp_new', userId: 'u_1' },
      { jobId: 'rcp_new' },
    );
  });

  it('dedupes when imageHash already exists for this user', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'rcp_existing',
      status: 'extracted',
      deletedAt: null,
    });
    const res = await POST(makeUploadRequest(jpeg) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deduped).toBe(true);
    expect(body.receiptId).toBe('rcp_existing');
    expect(extractQueueMock.add).not.toHaveBeenCalled();
    expect(storageMock.putObject).not.toHaveBeenCalled();
  });

  it('restores and re-extracts when the same image was soft-deleted', async () => {
    await signedInAs('u_1');
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'rcp_deleted',
      status: 'extracted',
      deletedAt: new Date('2026-01-01'),
    });
    prismaMock.receipt.update.mockResolvedValue({ id: 'rcp_deleted', status: 'uploaded' });

    const res = await POST(makeUploadRequest(jpeg) as never);
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.deduped).toBe(false);
    expect(body.restored).toBe(true);
    expect(body.receiptId).toBe('rcp_deleted');

    expect(storageMock.putObject).toHaveBeenCalledOnce();
    expect(prismaMock.receipt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rcp_deleted' },
        data: expect.objectContaining({ deletedAt: null, status: 'uploaded' }),
      }),
    );
    expect(extractQueueMock.getJob).toHaveBeenCalledWith('rcp_deleted');
    expect(extractQueueMock.add).toHaveBeenCalledWith(
      'extract',
      { receiptId: 'rcp_deleted', userId: 'u_1' },
      { jobId: 'rcp_deleted' },
    );
    expect(prismaMock.receipt.create).not.toHaveBeenCalled();
  });

  it('removes a completed queue job before re-enqueueing a restored receipt', async () => {
    await signedInAs('u_1');
    const remove = vi.fn();
    extractQueueMock.getJob.mockResolvedValue({
      getState: async () => 'completed',
      remove,
    });
    prismaMock.receipt.findUnique.mockResolvedValue({
      id: 'rcp_deleted',
      status: 'extracted',
      deletedAt: new Date('2026-01-01'),
    });
    prismaMock.receipt.update.mockResolvedValue({ id: 'rcp_deleted', status: 'uploaded' });

    await POST(makeUploadRequest(jpeg) as never);

    expect(remove).toHaveBeenCalledOnce();
    expect(extractQueueMock.add).toHaveBeenCalledOnce();
  });

  it('returns 429 after exceeding 30 uploads/hour', async () => {
    await signedInAs('u_rate');
    prismaMock.receipt.findUnique.mockResolvedValue(null);
    prismaMock.receipt.create.mockImplementation(async () => ({ id: 'r', status: 'uploaded' }));
    for (let i = 0; i < 30; i++) {
      const r = await POST(makeUploadRequest(jpeg) as never);
      expect(r.status).toBe(202);
    }
    const r = await POST(makeUploadRequest(jpeg) as never);
    expect(r.status).toBe(429);
    expect(r.headers.get('retry-after')).toBeTruthy();
  });
});
