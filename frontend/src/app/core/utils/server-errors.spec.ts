import { HttpErrorResponse } from '@angular/common/http';

import { parseServerErrors } from './server-errors';

describe('parseServerErrors', () => {
  it('maps DRF field errors and non-field errors', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { email: ['Zlý e-mail.'], items: ['Košík je prázdny.'], website: ['spam'] },
    });
    const parsed = parseServerErrors(err, ['email', 'phone']);
    expect(parsed.fields).toEqual({ email: 'Zlý e-mail.' });
    expect(parsed.general).toEqual(['Košík je prázdny.', 'spam']);
  });

  it('handles nested list errors', () => {
    const err = new HttpErrorResponse({ status: 400, error: { items: [{}, { size: ['Vyberte veľkosť.'] }] } });
    expect(parseServerErrors(err, []).general).toEqual(['Vyberte veľkosť.']);
  });

  it('explains throttling and network failures', () => {
    expect(parseServerErrors(new HttpErrorResponse({ status: 429 }), []).general[0]).toContain('priveľa');
    expect(parseServerErrors(new HttpErrorResponse({ status: 0 }), []).general[0]).toContain('nedostupný');
    expect(parseServerErrors(new Error('x'), []).general.length).toBe(1);
  });
});
