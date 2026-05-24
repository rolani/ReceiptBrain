import { vi } from 'vitest';

export const prismaMock = {
  receipt: {
    create: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  },
  item: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  subscription: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  },
  insight: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(async (fn: (tx: typeof prismaMock) => unknown) => {
    if (typeof fn === 'function') return fn(prismaMock);
    return fn;
  }),
};

export const storageMock = {
  contentHash: vi.fn((b: Buffer) => `hash-${b.byteLength}`),
  putObject: vi.fn(async (key: string, b: Buffer) => ({ key, bytes: b.byteLength })),
  getObject: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn().mockResolvedValue(true),
  getSignedUrl: vi.fn(async (key: string) => `https://signed.example/${key}?sig=x`),
  bucket: 'test-bucket',
};

export const extractQueueMock = {
  getJob: vi.fn().mockResolvedValue(null),
  add: vi.fn(async (_n: string, _data: unknown, opts?: { jobId?: string }) => ({
    id: opts?.jobId ?? 'job-1',
  })),
};

export const insightsQueueMock = {
  getJob: vi.fn().mockResolvedValue(null),
  add: vi.fn(async (_n: string, _data: unknown, opts?: { jobId?: string }) => ({
    id: opts?.jobId ?? 'job-i',
  })),
};

export function resetApiMocks(): void {
  for (const obj of [
    prismaMock.receipt,
    prismaMock.item,
    prismaMock.subscription,
    prismaMock.insight,
    storageMock,
    extractQueueMock,
    insightsQueueMock,
  ]) {
    for (const key of Object.keys(obj as object)) {
      const fn = (obj as Record<string, unknown>)[key];
      if (typeof fn === 'function' && 'mockReset' in (fn as object)) {
        (fn as ReturnType<typeof vi.fn>).mockReset();
      }
    }
  }
  prismaMock.receipt.findMany.mockResolvedValue([]);
  prismaMock.receipt.count.mockResolvedValue(0);
  prismaMock.subscription.findMany.mockResolvedValue([]);
  prismaMock.subscription.count.mockResolvedValue(0);
  prismaMock.insight.findMany.mockResolvedValue([]);
  prismaMock.item.groupBy.mockResolvedValue([]);
  prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => unknown) => {
    if (typeof fn === 'function') return fn(prismaMock);
    return fn;
  });
  storageMock.contentHash.mockImplementation((b: Buffer) => `hash-${b.byteLength}`);
  storageMock.putObject.mockImplementation(async (key: string, b: Buffer) => ({ key, bytes: b.byteLength }));
  storageMock.getSignedUrl.mockImplementation(async (key: string) => `https://signed.example/${key}?sig=x`);
  extractQueueMock.getJob.mockResolvedValue(null);
  extractQueueMock.add.mockImplementation(async (_n: string, _d: unknown, opts?: { jobId?: string }) => ({ id: opts?.jobId ?? 'job-1' }));
  insightsQueueMock.add.mockImplementation(async (_n: string, _d: unknown, opts?: { jobId?: string }) => ({ id: opts?.jobId ?? 'job-i' }));
}

export async function signedInAs(userId: string): Promise<void> {
  const mod = await import('@/auth');
  vi.mocked(mod.auth).mockResolvedValue({
    user: { id: userId, email: `${userId}@example.com` },
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  } as Awaited<ReturnType<typeof mod.auth>>);
}

export async function signedOut(): Promise<void> {
  const mod = await import('@/auth');
  vi.mocked(mod.auth).mockResolvedValue(null);
}
