import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env.js';

const VALID = {
  REDIS_URL: 'redis://localhost:6379',
  DATABASE_URL: 'postgresql://x:y@localhost:5432/db',
  AI_SERVICE_URL: 'http://localhost:8000',
  AI_SERVICE_TOKEN: 'token',
} as unknown as NodeJS.ProcessEnv;

describe('worker env', () => {
  it('parses a valid env', () => {
    const env = loadEnv(VALID);
    expect(env.REDIS_URL).toContain('localhost');
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('throws when AI_SERVICE_TOKEN is missing', () => {
    const { AI_SERVICE_TOKEN: _omit, ...incomplete } = VALID as Record<string, string>;
    expect(() => loadEnv(incomplete as NodeJS.ProcessEnv)).toThrow();
  });
});
