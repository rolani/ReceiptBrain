import { describe, expect, it } from 'vitest';
import {
  buildFlyerInsights,
  getRegistryFlyerUrls,
  inferCanadianProvince,
  isFlyerLinkHost,
  matchFlyerRetailer,
  resolveFlyerUrl,
} from '../../src/domain/flyer-links.js';

describe('inferCanadianProvince', () => {
  it('parses province from location label', () => {
    expect(inferCanadianProvince('Toronto, ON', 'CA')).toBe('ON');
    expect(inferCanadianProvince('Montréal, QC', 'CA')).toBe('QC');
    expect(inferCanadianProvince('Calgary, AB', 'CA')).toBe('AB');
  });

  it('defaults to ON for Canada when province missing', () => {
    expect(inferCanadianProvince('Canada', 'CA')).toBe('ON');
  });
});

describe('matchFlyerRetailer', () => {
  it('matches common grocery and pharmacy names', () => {
    expect(matchFlyerRetailer('Walmart')?.id).toBe('walmart');
    expect(matchFlyerRetailer('Shoppers Drug Mart')?.id).toBe('shoppers');
    expect(matchFlyerRetailer('Real Canadian Superstore')?.id).toBe('superstore');
    expect(matchFlyerRetailer('No Frills')?.id).toBe('nofrills');
  });

  it('returns null for unknown merchants', () => {
    expect(matchFlyerRetailer('HubSpot')).toBeNull();
  });
});

describe('resolveFlyerUrl', () => {
  it('builds province-aware circulars.ca links', () => {
    const url = resolveFlyerUrl('Walmart', 'QC');
    expect(url).toBe('https://www.circulars.ca/walmart/?region=QC');
  });
});

describe('buildFlyerInsights', () => {
  it('creates optimization tips for top matched merchants with receipt ids', () => {
    const items = buildFlyerInsights(
      [
        { merchant: 'Walmart', visits: 4, spend: 120, receiptIds: ['r1', 'r2'] },
        { merchant: 'Starbucks', visits: 10, spend: 50, receiptIds: ['r3'] },
      ],
      'ON',
      'CAD',
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'optimization_tip',
      title: expect.stringContaining('Walmart'),
      action: {
        kind: 'external_link',
        target: 'https://www.circulars.ca/walmart/?region=ON',
      },
      sourceReceiptIds: ['r1', 'r2'],
      currency: 'CAD',
    });
  });

  it('returns empty for non-Canadian users', () => {
    expect(
      buildFlyerInsights(
        [{ merchant: 'Walmart', visits: 2, spend: 10, receiptIds: ['r1'] }],
        'ON',
        'CAD',
        { country: 'US' },
      ),
    ).toEqual([]);
  });
});

describe('registry flyer URLs', () => {
  it('uses https on known flyer hosts for every registry entry', () => {
    for (const url of getRegistryFlyerUrls('ON')) {
      const parsed = new URL(url);
      expect(parsed.protocol).toBe('https:');
      expect(isFlyerLinkHost(parsed.hostname)).toBe(true);
    }
  });
});
