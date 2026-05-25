import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Globally stub `@/auth` so unit tests never have to load the real NextAuth
// runtime (which imports `next/server` in a way Vite can't always resolve).
// Individual tests that need to drive the session can `vi.mocked(auth)`.
vi.mock('@/auth', () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  authGET: vi.fn(),
  authPOST: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: () => '/',
  redirect: vi.fn(),
}));

// @t3-oss/env-nextjs blocks server-var reads when window is defined (jsdom).
// Provide a plain object that mirrors the production schema so route code can
// read env values without going through the runtime guard.
vi.mock('@/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    S3_ENDPOINT: 'http://localhost:9000',
    S3_REGION: 'us-east-1',
    S3_BUCKET: 'test',
    S3_ACCESS_KEY: 'test',
    S3_SECRET_KEY: 'test',
    S3_FORCE_PATH_STYLE: true,
    AI_SERVICE_URL: 'http://localhost:8000',
    AI_SERVICE_TOKEN: 'test-token',
    OPENAI_API_KEY: 'sk-test',
    OPENAI_MODEL_EXTRACT: 'gpt-4o',
    OPENAI_MODEL_RECOMMEND: 'gpt-4o-mini',
    NEXTAUTH_SECRET: 'test-secret-must-be-32-chars-long-for-tests',
    NEXTAUTH_URL: 'http://localhost:3000',
    RESEND_API_KEY: 're_test',
    AUTH_EMAIL_FROM: 'test@example.com',
    LOG_LEVEL: 'info',
    MAX_UPLOAD_MB: 10,
    DEFAULT_CURRENCY: 'CAD',
    DEFAULT_LOCATION: 'Canada',
    DEFAULT_LOCATION_COUNTRY: 'CA',
  },
}));
