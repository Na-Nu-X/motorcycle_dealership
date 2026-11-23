import { addDays, formatPrice, toIsoDate } from './format';

const normalise = (s: string) => s.replace(/\s/g, ' ');

describe('format helpers', () => {
  it('formats prices in Slovak style', () => {
    expect(normalise(formatPrice('10990.00'))).toBe('10 990 €');
    expect(normalise(formatPrice('64.90'))).toBe('64,90 €');
    expect(normalise(formatPrice(5, true))).toBe('5,00 €');
    expect(formatPrice(null)).toBe('');
  });

  it('produces local ISO dates', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDate(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
  });
});
