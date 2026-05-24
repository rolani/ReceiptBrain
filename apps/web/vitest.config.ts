import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Playwright owns ./e2e
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    env: {
      // Defaults so env validation passes during tests
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      REDIS_URL: 'redis://localhost:6379',
      S3_ENDPOINT: 'http://localhost:9000',
      S3_REGION: 'us-east-1',
      S3_BUCKET: 'test',
      S3_ACCESS_KEY: 'test',
      S3_SECRET_KEY: 'test',
      AI_SERVICE_URL: 'http://localhost:8000',
      AI_SERVICE_TOKEN: 'test-token',
      OPENAI_API_KEY: 'sk-test',
      OPENAI_MODEL_EXTRACT: 'gpt-4o',
      OPENAI_MODEL_RECOMMEND: 'gpt-4o-mini',
      NEXTAUTH_SECRET: 'test-secret-must-be-32-chars-long-for-tests',
      NEXTAUTH_URL: 'http://localhost:3000',
      RESEND_API_KEY: 're_test',
      AUTH_EMAIL_FROM: 'test@example.com',
      MAX_UPLOAD_MB: '10',
    },
  },
});
