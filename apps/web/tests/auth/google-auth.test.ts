import { describe, expect, it, vi } from 'vitest';

const envMock = vi.hoisted(() => ({
  AUTH_GOOGLE_ID: undefined as string | undefined,
  AUTH_GOOGLE_SECRET: undefined as string | undefined,
}));

vi.mock('@/env', () => ({
  env: envMock,
}));

import { isGoogleAuthEnabled } from '@/lib/google-auth';

describe('isGoogleAuthEnabled', () => {
  it('returns false when Google credentials are missing', () => {
    envMock.AUTH_GOOGLE_ID = undefined;
    envMock.AUTH_GOOGLE_SECRET = undefined;
    expect(isGoogleAuthEnabled()).toBe(false);
  });

  it('returns false when only client id is set', () => {
    envMock.AUTH_GOOGLE_ID = 'google-client-id';
    envMock.AUTH_GOOGLE_SECRET = undefined;
    expect(isGoogleAuthEnabled()).toBe(false);
  });

  it('returns true when both Google credentials are set', () => {
    envMock.AUTH_GOOGLE_ID = 'google-client-id';
    envMock.AUTH_GOOGLE_SECRET = 'google-client-secret';
    expect(isGoogleAuthEnabled()).toBe(true);
  });
});
