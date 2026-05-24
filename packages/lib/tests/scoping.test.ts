import { describe, expect, it } from 'vitest';
import { userOwned } from '../src/scoping.js';

describe('userOwned', () => {
  it('returns { userId } when no base where is supplied', () => {
    expect(userOwned('u_1')).toEqual({ userId: 'u_1' });
  });

  it('merges userId into an existing where filter without losing fields', () => {
    expect(userOwned('u_1', { status: 'extracted' })).toEqual({
      userId: 'u_1',
      status: 'extracted',
    });
  });

  it('overrides any caller-supplied userId so cross-tenant access is impossible', () => {
    const out = userOwned('u_1', {
      userId: 'u_2',
      status: 'extracted',
    } as { userId: string; status: string });
    expect(out.userId).toBe('u_1');
    expect(out.status).toBe('extracted');
  });

  it('does not mutate the input where', () => {
    const where = { status: 'extracted' as const };
    userOwned('u_1', where);
    expect(where).toEqual({ status: 'extracted' });
    expect(Object.hasOwn(where, 'userId')).toBe(false);
  });
});
