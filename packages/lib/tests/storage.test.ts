import { afterAll, describe, expect, it } from 'vitest';
import { createStorage, type Storage } from '../src/storage.js';

const TEST_BUCKET = 'receiptbrain';
const ENDPOINT = process.env.S3_ENDPOINT ?? 'http://localhost:9000';

async function pingMinio(): Promise<boolean> {
  try {
    const res = await fetch(`${ENDPOINT}/minio/health/live`);
    return res.ok;
  } catch {
    return false;
  }
}

const minioUp = await pingMinio();
const storage: Storage = minioUp
  ? createStorage({
      endpoint: ENDPOINT,
      region: 'us-east-1',
      bucket: TEST_BUCKET,
      accessKey: 'receiptbrain',
      secretKey: 'receiptbrain-secret',
      forcePathStyle: true,
    })
  : (undefined as unknown as Storage);

const writtenKeys: string[] = [];
function track(key: string): string {
  writtenKeys.push(key);
  return key;
}

afterAll(async () => {
  if (!minioUp) return;
  for (const key of writtenKeys) {
    try {
      await storage.delete(key);
    } catch {
      // best-effort cleanup
    }
  }
});

describe.skipIf(!minioUp)('Storage (MinIO)', () => {
  it('uploads a buffer, downloads it back, and reports byte size', async () => {
    const key = track(`tests/upload-${Date.now()}.txt`);
    const body = Buffer.from('hello receiptbrain');
    const meta = await storage.putObject(key, body, 'text/plain');
    expect(meta.bytes).toBe(body.byteLength);

    const downloaded = await storage.getObject(key);
    expect(downloaded.toString('utf8')).toBe('hello receiptbrain');
  });

  it('produces a signed URL with TTL ≤ 5 minutes and downloads work via HTTP', async () => {
    const key = track(`tests/signed-${Date.now()}.txt`);
    await storage.putObject(key, Buffer.from('signed-body'), 'text/plain');

    const url = await storage.getSignedUrl(key, { expiresInSeconds: 60 });
    expect(url).toContain(TEST_BUCKET);
    expect(url).toMatch(/X-Amz-Expires=60\b/);

    const res = await fetch(url);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('signed-body');
  });

  it('rejects expiresInSeconds > 300 to enforce the ≤ 5 min security rule', async () => {
    await expect(
      storage.getSignedUrl('any', { expiresInSeconds: 600 }),
    ).rejects.toThrow(/expires/i);
  });

  it('computes deterministic sha256 keys for dedup', () => {
    const a = storage.contentHash(Buffer.from('abc'));
    const b = storage.contentHash(Buffer.from('abc'));
    const c = storage.contentHash(Buffer.from('xyz'));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
