/**
 * The 13 featured countries. Drives the quick stream check, the country chips and the coverage list.
 * Rule 2: must always include US, GB (United Kingdom), MX, RU, AR — enforced by tests/featured.test.ts.
 * Order = display order.
 */
export const REQUIRED_COUNTRIES = ['US', 'GB', 'MX', 'RU', 'AR'] as const;

export const FEATURED_COUNTRIES = [
  ...REQUIRED_COUNTRIES,
  'ES', // Spain
  'PT', // Portugal
  'IT', // Italy
  'BR', // Brazil
  'RO', // Romania
  'LT', // Lithuania
  'LV', // Latvia
  'HR', // Croatia
] as const;

export type FeaturedCountry = (typeof FEATURED_COUNTRIES)[number];
