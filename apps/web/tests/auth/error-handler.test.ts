import { describe, expect, it } from 'vitest';
import { toApiErrorResponse, ForbiddenError, UnauthorizedError } from '@/lib/require-session';
import { ZodError, z } from 'zod';

describe('toApiErrorResponse', () => {
  it('maps UnauthorizedError → 401', async () => {
    const res = toApiErrorResponse(new UnauthorizedError('nope'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('unauthorized');
  });

  it('maps ForbiddenError → 403', async () => {
    const res = toApiErrorResponse(new ForbiddenError('not yours'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('forbidden');
  });

  it('maps ZodError → 400 with issues', async () => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse({ email: 'not-an-email' });
    expect(parsed.success).toBe(false);
    const res = toApiErrorResponse(parsed.error as ZodError);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('bad_request');
    expect(Array.isArray(body.issues)).toBe(true);
  });

  it('maps unknown errors → 500 without leaking details', async () => {
    const res = toApiErrorResponse(new Error('boom'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('internal');
    expect(body.message).toBeUndefined();
  });
});
