import { Worker, type Processor } from 'bullmq';
import IORedis from 'ioredis';
import { createLogger } from '@receiptbrain/lib/logger';
import { prisma } from '@receiptbrain/lib/prisma';
import {
  QUEUE_NAMES,
  createGenerateInsightsQueue,
  type ExtractReceiptJob,
  type GenerateInsightsJob,
} from '@receiptbrain/lib/queue';
import { createStorage } from '@receiptbrain/lib/storage';
import { loadEnv } from './env.js';
import { AiClient } from './ai-client.js';
import { handleExtractReceipt } from './handlers/extract-receipt.js';
import { handleGenerateInsights } from './handlers/generate-insights.js';

const log = createLogger('worker');

async function main(): Promise<void> {
  const env = loadEnv();

  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const ai = new AiClient({ baseUrl: env.AI_SERVICE_URL, token: env.AI_SERVICE_TOKEN });

  // Storage config is required for extract; fall back to env so worker can boot.
  const storage = createStorage({
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'receiptbrain',
    accessKey: process.env.S3_ACCESS_KEY ?? 'receiptbrain',
    secretKey: process.env.S3_SECRET_KEY ?? 'receiptbrain-secret',
    forcePathStyle: true,
  });

  // Producer-side queue used to auto-enqueue insights regeneration after a
  // successful extract. We don't subscribe to it here; the insightsWorker
  // below consumes from the same queue name.
  const insightsProducerQueue = createGenerateInsightsQueue({ redisUrl: env.REDIS_URL });

  const extractProcessor: Processor<ExtractReceiptJob> = async (job) => {
    return handleExtractReceipt(job.data, {
      prisma,
      storage,
      ai,
      insightsQueue: insightsProducerQueue,
      logger: log,
    });
  };

  const insightsProcessor: Processor<GenerateInsightsJob> = async (job) => {
    return handleGenerateInsights(job.data, { prisma, ai, logger: log });
  };

  const extractWorker = new Worker<ExtractReceiptJob>(
    QUEUE_NAMES.extractReceipt,
    extractProcessor,
    { connection, concurrency: 4 },
  );

  const insightsWorker = new Worker<GenerateInsightsJob>(
    QUEUE_NAMES.generateInsights,
    insightsProcessor,
    { connection, concurrency: 2 },
  );

  for (const w of [extractWorker, insightsWorker]) {
    w.on('completed', (job) =>
      log.info({ jobId: job.id, queue: w.name, attempt: job.attemptsMade }, 'job:completed'),
    );
    w.on('failed', (job, err) =>
      log.error(
        { jobId: job?.id, queue: w.name, attempt: job?.attemptsMade, err: err.message },
        'job:failed',
      ),
    );
  }

  // Liveness heartbeat (rule: observability.mdc).
  const heartbeat = setInterval(() => {
    connection.set('worker:heartbeat', new Date().toISOString(), 'EX', 90).catch(() => undefined);
  }, 30_000);
  // Don't keep the process alive solely for the heartbeat.
  heartbeat.unref();

  log.info(
    { redis: env.REDIS_URL, queues: Object.values(QUEUE_NAMES) },
    'worker bootstrap complete',
  );

  const shutdown = async (signal: NodeJS.Signals) => {
    log.info({ signal }, 'shutdown requested');
    clearInterval(heartbeat);
    await Promise.allSettled([extractWorker.close(), insightsWorker.close()]);
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  log.error({ err }, 'worker failed to start');
  process.exit(1);
});
