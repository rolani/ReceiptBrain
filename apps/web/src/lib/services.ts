// Centralizes the construction of storage + queue clients used by API routes.
// Lets tests `vi.mock('@/lib/services')` to swap in mocks per request without
// touching MinIO/Redis.

import {
  createExtractReceiptQueue,
  createGenerateInsightsQueue,
} from '@receiptbrain/lib/queue';
import { createStorage, type Storage } from '@receiptbrain/lib/storage';
import type { ExtractReceiptJob, GenerateInsightsJob } from '@receiptbrain/lib/queue';
import { env } from '@/env';

type ExtractQueue = ReturnType<typeof createExtractReceiptQueue>;
type InsightsQueue = ReturnType<typeof createGenerateInsightsQueue>;
export type { ExtractReceiptJob, GenerateInsightsJob };

let _storage: Storage | null = null;
export function storage(): Storage {
  if (!_storage) {
    _storage = createStorage({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    });
  }
  return _storage;
}

let _extract: ExtractQueue | null = null;
export function extractReceiptQueue(): ExtractQueue {
  if (!_extract) {
    _extract = createExtractReceiptQueue({ redisUrl: env.REDIS_URL });
  }
  return _extract;
}

let _insights: InsightsQueue | null = null;
export function generateInsightsQueue(): InsightsQueue {
  if (!_insights) {
    _insights = createGenerateInsightsQueue({ redisUrl: env.REDIS_URL });
  }
  return _insights;
}
