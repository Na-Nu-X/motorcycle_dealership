import { licenseAllows } from './license';

describe('licenseAllows', () => {
  it('mirrors the backend rules', () => {
    expect(licenseAllows('A', 'A')).toBe(true);
    expect(licenseAllows('A', 'A2')).toBe(false);
    expect(licenseAllows('A2', 'A2')).toBe(true);
    expect(licenseAllows('A2', 'A1')).toBe(false);
    expect(licenseAllows('A1', 'A2')).toBe(true);
    expect(licenseAllows('A', '')).toBe(false);
  });
});
