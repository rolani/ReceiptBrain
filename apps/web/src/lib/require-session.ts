import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/auth';

export class UnauthorizedError extends Error {
  constructor(message = 'unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'not_found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(
    public readonly retryAfterSeconds: number,
    message = 'rate_limited',
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export interface SessionLike {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
  };
}

/**
 * Resolves the current session and guarantees it has a user id.
 * Throws UnauthorizedError otherwise — handlers should funnel that
 * through `toApiErrorResponse` to produce a clean 401 body.
 */
export async function requireSession(): Promise<SessionLike> {
  const session = await auth();
  if (!session || !session.user || !(session.user as { id?: string }).id) {
    throw new UnauthorizedError();
  }
  return session as SessionLike;
}

export function assertOwns<T extends { userId: string } | null>(
  row: T,
  userId: string,
): NonNullable<T> {
  if (!row) throw new ForbiddenError();
  if (row.userId !== userId) throw new ForbiddenError();
  return row as NonNullable<T>;
}

export function toApiErrorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (err instanceof RateLimitError) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSeconds: err.retryAfterSeconds },
      { status: 429, headers: { 'retry-after': String(err.retryAfterSeconds) } },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'bad_request',
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 },
    );
  }
  // Never leak details of unknown failures.
  return NextResponse.json({ error: 'internal' }, { status: 500 });
}
