import NextAuth, { type DefaultSession, type Session } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@receiptbrain/lib';
import { env } from '@/env';
import { isGoogleAuthEnabled } from '@/lib/google-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

// NextAuth.js v5 + Resend magic link + optional Google OAuth.
// Sessions are persisted to Postgres via @auth/prisma-adapter (no JWT-only mode)
// so worker processes can read the same Session table when needed.
//
// The `unknown`-typed `nextAuthResult` is a workaround for NextAuth v5's TS2742
// "inferred type cannot be named" portability error in monorepos. Public types
// are re-exposed below with explicit annotations.
const nextAuthResult = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: env.NEXTAUTH_SECRET,
  session: { strategy: 'database' },
  pages: {
    signIn: '/sign-in',
    verifyRequest: '/sign-in?state=sent',
  },
  providers: [
    ...(isGoogleAuthEnabled()
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID!,
            clientSecret: env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: env.AUTH_EMAIL_FROM,
      // Dev fallback: if RESEND_API_KEY is missing or the placeholder, skip
      // the live Resend call and log the magic-link URL so a developer can
      // sign in locally without an account. Production keys (re_<long>) hit
      // the default Resend provider implementation below.
      async sendVerificationRequest({ identifier, url, provider }) {
        const key = env.RESEND_API_KEY ?? '';
        const isPlaceholder = !key || key === 're_...' || key.length < 10;
        if (isPlaceholder) {
          console.log('\n[auth] DEV magic link (no real RESEND_API_KEY set):');
          console.log(`[auth] for: ${identifier}`);
          console.log(`[auth] url: ${url}\n`);
          return;
        }
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to: identifier,
            subject: 'Sign in to ReceiptBrain',
            html: `<p>Click <a href="${url}">here</a> to sign in.</p>`,
            text: `Sign in to ReceiptBrain: ${url}`,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Resend error: ${body}`);
        }
      },
    }),
  ] satisfies Provider[],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  trustHost: true,
});

interface NextAuthShape {
  auth: () => Promise<Session | null>;
  signIn: (provider?: string, formData?: FormData | Record<string, unknown>) => Promise<void>;
  signOut: (options?: { redirectTo?: string }) => Promise<void>;
  handlers: {
    GET: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
  };
}

const _na = nextAuthResult as unknown as NextAuthShape;
export const auth: NextAuthShape['auth'] = _na.auth;
export const signIn: NextAuthShape['signIn'] = _na.signIn;
export const signOut: NextAuthShape['signOut'] = _na.signOut;
export const authGET: NextAuthShape['handlers']['GET'] = _na.handlers.GET;
export const authPOST: NextAuthShape['handlers']['POST'] = _na.handlers.POST;
