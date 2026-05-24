import { createHash } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Security rule (security-auth.mdc): signed URLs MUST expire in ≤ 5 minutes.
export const MAX_SIGNED_URL_TTL_SECONDS = 300;

export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle?: boolean;
}

export interface PutMeta {
  bytes: number;
  key: string;
}

export interface Storage {
  putObject(key: string, body: Buffer, contentType: string): Promise<PutMeta>;
  getObject(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getSignedUrl(key: string, opts?: { expiresInSeconds?: number }): Promise<string>;
  contentHash(body: Buffer): string;
  readonly bucket: string;
}

export function createStorage(config: StorageConfig): Storage {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: config.forcePathStyle ?? true,
  });

  async function streamToBuffer(stream: unknown): Promise<Buffer> {
    if (stream instanceof Buffer) return stream;
    if (stream && typeof (stream as { transformToByteArray?: unknown }).transformToByteArray === 'function') {
      const bytes = await (stream as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
      return Buffer.from(bytes);
    }
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | Uint8Array>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  return {
    bucket: config.bucket,

    async putObject(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return { key, bytes: body.byteLength };
    },

    async getObject(key) {
      const res = await client.send(
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
      );
      if (!res.Body) throw new Error(`storage: empty body for ${key}`);
      return streamToBuffer(res.Body);
    },

    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    },

    async exists(key) {
      try {
        await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
        return true;
      } catch {
        return false;
      }
    },

    async getSignedUrl(key, opts) {
      const expires = opts?.expiresInSeconds ?? MAX_SIGNED_URL_TTL_SECONDS;
      if (expires <= 0 || expires > MAX_SIGNED_URL_TTL_SECONDS) {
        throw new Error(
          `storage: expiresInSeconds must be 1..${MAX_SIGNED_URL_TTL_SECONDS} (got ${expires})`,
        );
      }
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        { expiresIn: expires },
      );
    },

    contentHash(body) {
      return createHash('sha256').update(body).digest('hex');
    },
  };
}
