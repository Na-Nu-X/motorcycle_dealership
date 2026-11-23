import { bookingDateBounds, bookingDateError } from './booking-dates';

describe('booking date rules', () => {
  // Wednesday 2 December 2026
  const today = new Date(2026, 11, 2);

  it('computes min/max bounds', () => {
    expect(bookingDateBounds(today)).toEqual({ min: '2026-12-03', max: '2027-03-02' });
  });

  it('accepts a weekday in range', () => {
    expect(bookingDateError('2026-12-04', today)).toBeNull();
  });

  it('rejects today, past, far future, Sundays and garbage', () => {
    expect(bookingDateError('2026-12-02', today)).toContain('vopred');
    expect(bookingDateError('2026-11-30', today)).toContain('vopred');
    expect(bookingDateError('2027-06-01', today)).toContain('maximálne');
    expect(bookingDateError('2026-12-06', today)).toContain('nedeľu');
    expect(bookingDateError('', today)).toBe('Vyberte dátum.');
  });
});
