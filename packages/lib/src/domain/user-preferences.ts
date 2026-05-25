import {
  DEFAULT_RECOMMEND_CURRENCY,
  DEFAULT_RECOMMEND_LOCATION,
} from './recommend-context.js';

export interface UserPreferenceFields {
  defaultCurrency?: string | null;
  defaultLocation?: string | null;
  defaultLocationCountry?: string | null;
}

export interface RecommendDefaultsEnv {
  currency: string;
  location: string;
  locationCountry?: string | null;
}

export interface ResolvedRecommendDefaults {
  currency: string;
  location: string;
  locationCountry: string | null;
}

/** Merge per-user overrides with server env defaults (used by worker + settings UI). */
export function resolveRecommendDefaults(
  user: UserPreferenceFields | null | undefined,
  env: RecommendDefaultsEnv,
): ResolvedRecommendDefaults {
  const currency =
    user?.defaultCurrency?.trim() || env.currency.trim() || DEFAULT_RECOMMEND_CURRENCY;
  const location =
    user?.defaultLocation?.trim() || env.location.trim() || DEFAULT_RECOMMEND_LOCATION;
  const countryRaw = user?.defaultLocationCountry?.trim() || env.locationCountry?.trim();
  const locationCountry =
    countryRaw && countryRaw.length === 2 ? countryRaw.toUpperCase() : null;

  return { currency, location, locationCountry };
}
