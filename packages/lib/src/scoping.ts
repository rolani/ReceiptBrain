// Multi-tenancy guard: every Prisma query that touches user-owned data
// MUST go through `userOwned` so a caller can never widen the scope by
// supplying their own `userId` in the where clause.

export type WithUserId<T extends Record<string, unknown> = Record<string, unknown>> = T & {
  userId: string;
};

export function userOwned<T extends Record<string, unknown>>(
  userId: string,
  where?: T,
): WithUserId<T> {
  if (!userId) {
    throw new Error('userOwned: userId is required');
  }
  return { ...(where ?? ({} as T)), userId };
}
