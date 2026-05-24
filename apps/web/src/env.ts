import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    S3_ENDPOINT: z.string().url(),
    S3_REGION: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_FORCE_PATH_STYLE: z
      .union([z.literal('true'), z.literal('false')])
      .default('true')
      .transform((v) => v === 'true'),
    AI_SERVICE_URL: z.string().url(),
    AI_SERVICE_TOKEN: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_MODEL_EXTRACT: z.string().default('gpt-4o'),
    OPENAI_MODEL_RECOMMEND: z.string().default('gpt-4o-mini'),
    NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 chars'),
    NEXTAUTH_URL: z.string().url(),
    RESEND_API_KEY: z.string().min(1),
    AUTH_EMAIL_FROM: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    SENTRY_DSN: z.string().url().optional(),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),
  },
  client: {},
  runtimeEnv: process.env as Record<string, string | undefined>,
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
  emptyStringAsUndefined: true,
});
