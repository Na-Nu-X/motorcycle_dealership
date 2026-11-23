import { addDays, toIsoDate } from './format';

/** Mirrors the backend rules in `apps/core/validators.py`. */
export const BOOKING_RULES = {
  minLeadDays: 1,
  maxDaysAhead: 90,
} as const;

export function bookingDateBounds(today = new Date()): { min: string; max: string } {
  return {
    min: toIsoDate(addDays(today, BOOKING_RULES.minLeadDays)),
    max: toIsoDate(addDays(today, BOOKING_RULES.maxDaysAhead)),
  };
}

/** Returns a Slovak error message for an invalid booking date, or `null` when valid. */
export function bookingDateError(iso: string, today = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return 'Vyberte dátum.';
  }
  const { min, max } = bookingDateBounds(today);
  if (iso < min) {
    return 'Termín je potrebné rezervovať aspoň 1 deň vopred.';
  }
  if (iso > max) {
    return `Termín môžete rezervovať maximálne ${BOOKING_RULES.maxDaysAhead} dní vopred.`;
  }
  const [y, m, d] = iso.split('-').map(Number);
  if (new Date(y, m - 1, d).getDay() === 0) {
    return 'V nedeľu máme zatvorené. Vyberte iný deň.';
  }
  return null;
}
