import { env } from '@/env';

/** True when both Google OAuth env vars are set (provider is registered in auth.ts). */
export function isGoogleAuthEnabled(): boolean {
  return Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
}
