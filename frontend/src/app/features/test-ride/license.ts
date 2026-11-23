import { LicenseCategory } from '../../core/api/models';

/** Which driving licence groups may ride a motorcycle requiring `required`. Mirrors the backend. */
const ALLOWS: Record<LicenseCategory, readonly LicenseCategory[]> = {
  AM: ['A1', 'A2', 'A'],
  A1: ['A1', 'A2', 'A'],
  A2: ['A2', 'A'],
  A: ['A'],
};

export function licenseAllows(required: LicenseCategory, held: LicenseCategory | ''): boolean {
  return held !== '' && (ALLOWS[required] ?? ['A']).includes(held);
}
