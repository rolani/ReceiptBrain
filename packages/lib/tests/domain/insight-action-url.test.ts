import { describe, expect, it, vi } from 'vitest';
import {
  isAllowedInsightUrl,
  isTrustedFlyerUrl,
  sanitizeInsightAction,
  validateInsightUrlReachable,
} from '../../src/domain/insight-action-url.js';

describe('isAllowedInsightUrl', () => {
  it('allows https URLs on known hosts', () => {
    expect(isAllowedInsightUrl('https://www.circulars.ca/walmart/?region=ON')).toBe(true);
    expect(isAllowedInsightUrl('https://www.netflix.com/cancel')).toBe(true);
  });

  it('rejects non-http schemes and malformed URLs', () => {
    expect(isAllowedInsightUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedInsightUrl('http://evil.example/phish')).toBe(false);
    expect(isAllowedInsightUrl('not-a-url')).toBe(false);
  });
});

describe('isTrustedFlyerUrl', () => {
  it('trusts registry circulars links', () => {
    expect(isTrustedFlyerUrl('https://www.circulars.ca/walmart/?region=ON')).toBe(true);
  });
});

describe('sanitizeInsightAction', () => {
  it('strips external_link when target is not allowed', async () => {
    const out = await sanitizeInsightAction(
      { label: 'Go', kind: 'external_link', target: 'javascript:void(0)' },
      async () => true,
    );
    expect(out).toBeNull();
  });

  it('keeps trusted flyer URLs without network check', async () => {
    const validate = vi.fn(async () => false);
    const out = await sanitizeInsightAction(
      {
        label: 'View flyer',
        kind: 'external_link',
        target: 'https://www.circulars.ca/walmart/?region=ON',
      },
      validate,
    );
    expect(out?.target).toBe('https://www.circulars.ca/walmart/?region=ON');
    expect(validate).not.toHaveBeenCalled();
  });

  it('drops link when network validation fails', async () => {
    const out = await sanitizeInsightAction(
      { label: 'Go', kind: 'external_link', target: 'https://www.netflix.com/cancel' },
      async () => false,
    );
    expect(out).toBeNull();
  });
});

describe('validateInsightUrlReachable', () => {
  it('returns true for trusted flyer URLs', async () => {
    await expect(
      validateInsightUrlReachable('https://www.circulars.ca/walmart/?region=ON'),
    ).resolves.toBe(true);
  });
});
