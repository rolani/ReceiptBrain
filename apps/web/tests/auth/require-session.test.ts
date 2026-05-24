import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => {
  return {
    auth: vi.fn(),
  };
});

import { auth } from '@/auth';
import { requireSession, UnauthorizedError, ForbiddenError, assertOwns } from '@/lib/require-session';

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe('requireSession', () => {
  beforeEach(() => {
    mockedAuth.mockReset();
  });

  it('returns the session when authenticated', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u_1', email: 'a@example.com' } });
    const s = await requireSession();
    expect(s.user.id).toBe('u_1');
  });

  it('throws UnauthorizedError when no session', async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(requireSession()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when session has no user id', async () => {
    mockedAuth.mockResolvedValue({ user: { email: 'a@example.com' } });
    await expect(requireSession()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('assertOwns', () => {
  it('returns the row when the session user owns it', () => {
    const row = { id: 'r_1', userId: 'u_1' };
    expect(assertOwns(row, 'u_1')).toBe(row);
  });

  it('throws ForbiddenError when userId mismatches', () => {
    const row = { id: 'r_1', userId: 'u_2' };
    expect(() => assertOwns(row, 'u_1')).toThrow(ForbiddenError);
  });

  it('throws ForbiddenError when row is null', () => {
    expect(() => assertOwns(null, 'u_1')).toThrow(ForbiddenError);
  });
});
