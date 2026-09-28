import { describe, expect, it } from 'vitest';
import { getRegistryFlyerUrls } from '../../src/domain/flyer-links.js';
import { validateInsightUrlReachable } from '../../src/domain/insight-action-url.js';

const verifyLive = process.env.VERIFY_FLYER_LINKS === '1';

describe.skipIf(!verifyLive)('live flyer registry links', () => {
  it(
    'circulars.ca registry URLs are reachable',
    async () => {
      const urls = getRegistryFlyerUrls('ON').filter((u) => u.includes('circulars.ca'));
      for (const url of urls) {
        await expect(validateInsightUrlReachable(url)).resolves.toBe(true);
      }
    },
    120_000,
  );
});
