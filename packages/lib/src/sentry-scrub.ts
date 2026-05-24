// Pure functions for scrubbing PII / secrets before they hit Sentry.
// Used in `Sentry.init({ beforeSend, beforeBreadcrumb })` across web, worker, and AI.

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const S3_URL_RE = /https?:\/\/[^\s"']*?\/receipts\/[^\s"']+/g;
const SIGNED_PARAM_RE = /([?&](?:X-Amz-Signature|X-Amz-Credential)=)[^&"\s]+/gi;

export const REDACTION = '[REDACTED]';

export function scrubString(value: string): string {
  if (!value) return value;
  return value
    .replace(EMAIL_RE, REDACTION)
    .replace(S3_URL_RE, REDACTION)
    .replace(SIGNED_PARAM_RE, `$1${REDACTION}`);
}

export function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6) return value;
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/^(receipt|image|imageUrl|rawJson|body)$/i.test(k) && typeof v === 'string') {
        out[k] = REDACTION;
      } else {
        out[k] = scrub(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

interface SentryEventLike {
  message?: string;
  request?: { url?: string; data?: unknown };
  extra?: Record<string, unknown>;
  breadcrumbs?: Array<{ message?: string; data?: unknown }>;
}

export function scrubSentryEvent<E extends SentryEventLike>(event: E): E {
  const next = { ...event } as SentryEventLike;
  if (next.message) next.message = scrubString(next.message);
  if (next.request) {
    next.request = {
      ...next.request,
      url: next.request.url ? scrubString(next.request.url) : undefined,
      data: scrub(next.request.data),
    };
  }
  if (next.extra) next.extra = scrub(next.extra) as Record<string, unknown>;
  if (next.breadcrumbs) {
    next.breadcrumbs = next.breadcrumbs.map((b) => ({
      ...b,
      message: b.message ? scrubString(b.message) : undefined,
      data: scrub(b.data),
    }));
  }
  return next as E;
}
