---
name: api-route-tdd
description: Adds Next.js App Router API routes test-first with Zod, NextAuth session, ownership, and rate-limit tests. Use for upload, receipts, insights, recommend, subscriptions endpoints.
---

# API Route TDD

## Steps

1. **Define contract** — method, path, Zod schemas in `packages/contracts`, status codes
2. **Write tests** in `apps/web/app/api/.../__tests__/` or `apps/web/tests/api/`
3. **Run tests** — confirm RED for missing behavior
4. **Implement** route handler:
   - call `requireSession()` first (skip only on `/api/health`)
   - parse with Zod (`schema.safeParse(...)`)
   - run Prisma queries scoped to `session.user.id`
   - use helpers from `@receiptbrain/lib` (storage, queue)
5. **Run** `pnpm --filter @receiptbrain/web test` until GREEN

## Required test cases (every route)

- 401 when unauthed
- 403 when accessing another user's row
- 400 with `{error, details}` on invalid Zod input
- Happy path → expected status + body shape (matches contract)
- Side effects mocked: S3 upload, BullMQ enqueue, Prisma writes
- 429 if route is rate-limited (`/api/upload`, `/api/recommend`)

## Example

```typescript
describe('POST /api/upload', () => {
  it('returns 401 when no session', async () => {
    mockSession(null);
    const res = await POST(makeRequest({ file: mockFile }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when MIME not allowed', async () => {
    mockSession(user);
    const res = await POST(makeRequest({ file: textFile }));
    expect(res.status).toBe(400);
  });

  it('dedupes by imageHash', async () => {
    mockSession(user);
    db.receipt.findFirst.mockResolvedValue(existingReceipt);
    const res = await POST(makeRequest({ file: mockFile }));
    expect(await res.json()).toMatchObject({ receiptId: existingReceipt.id });
  });

  it('uploads and enqueues extract_receipt', async () => {
    mockSession(user);
    const res = await POST(makeRequest({ file: mockFile }));
    expect(res.status).toBe(201);
    expect(mockQueue.add).toHaveBeenCalledWith(
      'extract_receipt',
      expect.any(Object),
      expect.objectContaining({ jobId: expect.stringMatching(/^receipt-/) })
    );
  });
});
```

## Rules

- Schemas live in `packages/contracts` — never duplicate Zod between client/server
- Never skip the auth or ownership test
- Reuse fetch wrappers from `packages/lib` on the client side
