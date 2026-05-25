import { describe, expect, it } from 'vitest';
import { resolveRecommendDefaults } from '../../src/domain/user-preferences.js';

describe('resolveRecommendDefaults', () => {
  const env = {
    currency: 'USD',
    location: 'United States',
    locationCountry: 'US',
  };

  it('uses env when user has no overrides', () => {
    expect(resolveRecommendDefaults(null, env)).toEqual({
      currency: 'USD',
      location: 'United States',
      locationCountry: 'US',
    });
  });

  it('prefers user overrides over env', () => {
    expect(
      resolveRecommendDefaults(
        {
          defaultCurrency: 'CAD',
          defaultLocation: 'Toronto, ON',
          defaultLocationCountry: 'CA',
        },
        env,
      ),
    ).toEqual({
      currency: 'CAD',
      location: 'Toronto, ON',
      locationCountry: 'CA',
    });
  });

  it('falls back per field when user override is null', () => {
    expect(
      resolveRecommendDefaults(
        {
          defaultCurrency: null,
          defaultLocation: 'Vancouver, BC',
          defaultLocationCountry: null,
        },
        env,
      ),
    ).toEqual({
      currency: 'USD',
      location: 'Vancouver, BC',
      locationCountry: 'US',
    });
  });
});
