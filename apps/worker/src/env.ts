import { z } from 'zod';
import { parseEnv } from '@receiptbrain/lib/env';

const WorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REDIS_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  AI_SERVICE_URL: z.string().url(),
  AI_SERVICE_TOKEN: z.string().min(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): WorkerEnv {
  return parseEnv(WorkerEnvSchema, source);
}
