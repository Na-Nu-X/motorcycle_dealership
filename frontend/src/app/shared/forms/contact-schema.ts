import { email, maxLength, pattern, required, schema, validate } from '@angular/forms/signals';

import { ContactFields } from '../../core/api/models';

export const PHONE_PATTERN = /^\+?[0-9 ()/-]{7,20}$/;

export const MSG = {
  required: 'Toto pole je povinné.',
  email: 'Zadajte platnú e-mailovú adresu.',
  phone: 'Zadajte platné telefónne číslo, napr. +421 900 123 456.',
  gdpr: 'Pre odoslanie je potrebný súhlas so spracovaním osobných údajov.',
} as const;

export function emptyContact(): ContactFields {
  return { first_name: '', last_name: '', email: '', phone: '', gdpr_consent: false, website: '' };
}

/** Shared validation for name / e-mail / phone / GDPR consent – use with `apply(p, contactSchema)`. */
export const contactSchema = schema<ContactFields>((p) => {
  required(p.first_name, { message: MSG.required });
  maxLength(p.first_name, 80, { message: 'Maximálne 80 znakov.' });
  required(p.last_name, { message: MSG.required });
  maxLength(p.last_name, 80, { message: 'Maximálne 80 znakov.' });
  required(p.email, { message: MSG.required });
  email(p.email, { message: MSG.email });
  required(p.phone, { message: MSG.required });
  pattern(p.phone, PHONE_PATTERN, { message: MSG.phone });
  validate(p.gdpr_consent, ({ value }) => (value() ? undefined : { kind: 'gdpr', message: MSG.gdpr }));
});
