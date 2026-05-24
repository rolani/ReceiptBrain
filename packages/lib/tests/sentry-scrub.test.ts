import { describe, expect, it } from 'vitest';
import { scrub, scrubSentryEvent, scrubString } from '../src/sentry-scrub.js';

describe('scrubString', () => {
  it('redacts email addresses', () => {
    expect(scrubString('contact alice@example.com please')).toBe('contact [REDACTED] please');
  });
  it('redacts S3 receipt URLs', () => {
    const url = 'https://bucket.s3.us-east-1.amazonaws.com/receipts/u_1/abc.jpg';
    expect(scrubString(`failed to load ${url}`)).toContain('[REDACTED]');
  });
  it('strips Amz signature query params', () => {
    const url =
      'https://x/receipts/y?X-Amz-Signature=deadbeef&X-Amz-Credential=AKIA&other=ok';
    const out = scrubString(url);
    expect(out).not.toContain('deadbeef');
    expect(out).not.toContain('AKIA');
  });
});

describe('scrub (deep)', () => {
  it('redacts fields named receipt/image/imageUrl/rawJson', () => {
    const out = scrub({
      receipt: 'big blob',
      imageUrl: 'https://s3/receipts/x',
      ok: 1,
    }) as Record<string, unknown>;
    expect(out.receipt).toBe('[REDACTED]');
    expect(out.imageUrl).toBe('[REDACTED]');
    expect(out.ok).toBe(1);
  });

  it('recurses into nested objects and arrays', () => {
    const out = scrub({
      user: { email: 'a@b.com' },
      items: [{ email: 'c@d.com' }],
    }) as { user: { email: string }; items: Array<{ email: string }> };
    expect(out.user.email).toBe('[REDACTED]');
    expect(out.items[0]!.email).toBe('[REDACTED]');
  });
});

describe('scrubSentryEvent', () => {
  it('scrubs message + request.url + extra + breadcrumbs', () => {
    const event = scrubSentryEvent({
      message: 'failed for alice@example.com',
      request: {
        url: 'https://x/receipts/y?X-Amz-Signature=ABC',
        data: { receipt: 'blob', other: 'ok' },
      },
      extra: { email: 'b@c.com' },
      breadcrumbs: [{ message: 'fetched alice@example.com', data: { receipt: 'x' } }],
    });
    expect(event.message).toContain('[REDACTED]');
    expect(event.request?.url).not.toContain('ABC');
    expect((event.request?.data as { receipt: string }).receipt).toBe('[REDACTED]');
    expect((event.extra as { email: string }).email).toBe('[REDACTED]');
    expect(event.breadcrumbs?.[0]?.message).toContain('[REDACTED]');
  });
});
