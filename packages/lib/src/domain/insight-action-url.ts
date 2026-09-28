import {
  FLYER_LINK_HOSTS,
  isRegistryFlyerUrl,
} from './flyer-links.js';

export type InsightActionLike = {
  label: string;
  kind: 'external_link' | 'in_app' | 'dismiss';
  target?: string | null;
};

export type UrlValidator = (url: string) => Promise<boolean>;

/** Common subscription / retailer hosts allowed on AI-generated insight links. */
const ALLOWED_INSIGHT_HOSTS = new Set<string>([
  ...FLYER_LINK_HOSTS,
  'www.netflix.com',
  'netflix.com',
  'www.spotify.com',
  'spotify.com',
  'www.amazon.ca',
  'www.amazon.com',
  'www.apple.com',
  'www.disneyplus.com',
  'www.crave.ca',
  'www.bell.ca',
  'www.rogers.com',
  'www.telus.com',
]);

export function isAllowedInsightUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local')) return false;
    return [...ALLOWED_INSIGHT_HOSTS].some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

export function isTrustedFlyerUrl(url: string): boolean {
  return isRegistryFlyerUrl(url);
}

export async function validateInsightUrlReachable(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (isTrustedFlyerUrl(url)) return true;
  if (!isAllowedInsightUrl(url)) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    let res = await fetcher(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    if (res.status >= 200 && res.status < 400) return true;
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetcher(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { Range: 'bytes=0-0' },
      });
      return res.status >= 200 && res.status < 400;
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sanitizeInsightAction(
  action: InsightActionLike | null | undefined,
  validateUrl: UrlValidator,
): Promise<InsightActionLike | null> {
  if (!action) return null;
  if (action.kind !== 'external_link') return action;

  const target = action.target?.trim();
  if (!target || !isAllowedInsightUrl(target)) return null;
  if (isTrustedFlyerUrl(target)) return { ...action, target };

  const ok = await validateUrl(target);
  if (!ok) return null;
  return { ...action, target };
}

/** Sync guard for API responses — format + allowlist only (no network). */
export function sanitizeInsightActionForResponse(
  action: InsightActionLike | null | undefined,
): InsightActionLike | null {
  if (!action) return null;
  if (action.kind !== 'external_link') return action;
  const target = action.target?.trim();
  if (!target || !isAllowedInsightUrl(target)) return null;
  return { ...action, target };
}
