import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EnvValidationError, parseEnv } from '../src/env.js';

describe('parseEnv', () => {
  const schema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().int().positive().default(3000),
  });

  it('returns parsed env when valid', () => {
    const out = parseEnv(schema, {
      DATABASE_URL: 'postgres://x:y@localhost:5432/db',
      PORT: '4000',
    } as unknown as NodeJS.ProcessEnv);
    expect(out.DATABASE_URL).toContain('localhost');
    expect(out.PORT).toBe(4000);
  });

  it('throws EnvValidationError with field path on bad input', () => {
    try {
      parseEnv(schema, { DATABASE_URL: 'not-a-url' } as unknown as NodeJS.ProcessEnv);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(EnvValidationError);
      const err = e as EnvValidationError;
      expect(err.issues[0]?.path).toBe('DATABASE_URL');
    }
  });
});
