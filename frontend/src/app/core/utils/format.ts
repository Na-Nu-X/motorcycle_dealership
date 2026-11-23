import { SITE_CONFIG } from '../../../site.config';

const priceFormatter = new Intl.NumberFormat(SITE_CONFIG.locale, {
  style: 'currency',
  currency: SITE_CONFIG.currency,
  maximumFractionDigits: 0,
});
const preciseFormatter = new Intl.NumberFormat(SITE_CONFIG.locale, {
  style: 'currency',
  currency: SITE_CONFIG.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat(SITE_CONFIG.locale, { maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat(SITE_CONFIG.locale, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** "10 990 €" (whole euros) or "64,90 €" when `precise` (or the value has cents). */
export function formatPrice(value: string | number | null | undefined, precise?: boolean): string {
  const n = toNumber(value);
  if (n === null) {
    return '';
  }
  const usePrecise = precise ?? !Number.isInteger(n);
  return (usePrecise ? preciseFormatter : priceFormatter).format(n);
}

/** "18 500" with Slovak grouping (narrow no-break space). */
export function formatNumber(value: string | number | null | undefined): string {
  const n = toNumber(value);
  return n === null ? '' : numberFormatter.format(n);
}

/** "pondelok 1. decembra 2026" from an ISO date (YYYY-MM-DD) without timezone shifts. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) {
    return iso;
  }
  return dateFormatter.format(new Date(y, m - 1, d));
}

/** Local ISO date (YYYY-MM-DD) – avoids the UTC shift of `toISOString()`. */
export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
