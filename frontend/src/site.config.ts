/**
 * Central site configuration – edit this file to re-brand the website.
 *
 * Colours, fonts and spacing live in `src/styles/_tokens.scss` (CSS custom properties).
 * Everything that is text/data (name, contacts, opening hours, map position, API URL)
 * lives here so it can be changed without touching components.
 */
export interface OpeningHours {
  readonly days: string;
  readonly hours: string;
}

export const SITE_CONFIG = {
  /** Brand */
  name: 'MotoVault',
  tagline: 'Prémiové motocykle, servis a výbava',
  description:
    'MotoVault – predajňa nových a jazdených motocyklov, autorizovaný servis, testovacie jazdy a prémiové motorkárske oblečenie v Bratislave.',
  legalName: 'MotoVault s.r.o.',
  companyId: 'IČO: 12 345 678',
  vatId: 'IČ DPH: SK2023456789',
  foundedYear: 2009,

  /** Backend – relative by default (Angular dev-server proxies /api and /media to Django). */
  apiBaseUrl: '/api',

  /** Localisation */
  locale: 'sk-SK',
  currency: 'EUR',

  /** Contact */
  contact: {
    phone: '+421 2 123 456 78',
    phoneHref: 'tel:+421212345678',
    servicePhone: '+421 905 123 456',
    servicePhoneHref: 'tel:+421905123456',
    email: 'info@motovault.sk',
    serviceEmail: 'servis@motovault.sk',
    street: 'Galvaniho 7',
    city: 'Bratislava',
    postalCode: '821 04',
    country: 'Slovensko',
  },

  /** Map (OpenStreetMap, loaded only after the visitor's consent) */
  map: {
    lat: 48.1702,
    lon: 17.1873,
    /** half-size of the bounding box in degrees */
    span: 0.006,
  },

  openingHours: [
    { days: 'Pondelok – Piatok', hours: '8:00 – 17:00' },
    { days: 'Sobota', hours: '8:00 – 12:00' },
    { days: 'Nedeľa', hours: 'Zatvorené' },
  ] satisfies OpeningHours[],

  social: {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    youtube: 'https://www.youtube.com/',
  },

  /** Shop */
  cartStorageKey: 'motovault.cart.v1',
  mapConsentStorageKey: 'motovault.map-consent',
  maxReservedMotorcycles: 3,
  maxQuantityPerItem: 20,
  catalogPageSize: 12,
} as const;

export type SiteConfig = typeof SITE_CONFIG;
