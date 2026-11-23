import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, maxLength, minLength, pattern, required, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../../site.config';
import { ApiService } from '../../core/api/api.service';
import { ContactMessagePayload } from '../../core/api/models';
import { MSG, PHONE_PATTERN } from '../../shared/forms/contact-schema';
import { FieldError, showInvalid } from '../../shared/forms/field-error';
import { FormAlert } from '../../shared/forms/form-alert';
import { Honeypot } from '../../shared/forms/honeypot';
import { rootErrors, submitToApi } from '../../shared/forms/submit';
import { Icon } from '../../shared/ui/icon';
import { OsmMap } from '../../shared/ui/osm-map';

const EMPTY: ContactMessagePayload = { name: '', email: '', phone: '', subject: '', message: '', gdpr_consent: false, website: '' };

@Component({
  selector: 'app-contact',
  imports: [RouterLink, FormField, FieldError, FormAlert, Honeypot, Icon, OsmMap],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.html',
  styles: `
    .contact { display: grid; gap: var(--space-6); padding-block: var(--space-6); }
    @media (min-width: 1040px) { .contact { grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); align-items: start; } }
    .cards { display: grid; gap: var(--space-3); grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); margin: 0 0 var(--space-5); padding: 0; list-style: none; }
    .cards li { padding: var(--space-4); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
    .cards app-icon { color: var(--color-accent-text); margin-bottom: var(--space-2); }
    .cards p { margin: 0; overflow-wrap: anywhere; }
    .cards strong { display: block; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.06em; }
    .hours div { display: flex; justify-content: space-between; gap: var(--space-3); padding-block: var(--space-1); border-bottom: 1px solid var(--color-border); }
    .hours dt { color: var(--color-text-muted); }
  `,
})
export default class Contact {
  private readonly api = inject(ApiService);
  protected readonly config = SITE_CONFIG;
  protected readonly sent = signal(false);
  protected readonly showInvalid = showInvalid;
  protected readonly rootErrors = rootErrors;

  protected readonly model = signal<ContactMessagePayload>({ ...EMPTY });
  protected readonly f = form(this.model, (p) => {
    required(p.name, { message: MSG.required });
    maxLength(p.name, 160, { message: 'Maximálne 160 znakov.' });
    required(p.email, { message: MSG.required });
    email(p.email, { message: MSG.email });
    pattern(p.phone, PHONE_PATTERN, { message: MSG.phone, when: ({ value }) => value() !== '' });
    required(p.subject, { message: MSG.required });
    maxLength(p.subject, 160, { message: 'Maximálne 160 znakov.' });
    required(p.message, { message: MSG.required });
    minLength(p.message, 10, { message: 'Správa musí mať aspoň 10 znakov.' });
    maxLength(p.message, 5000, { message: 'Správa je príliš dlhá.' });
    validate(p.gdpr_consent, ({ value }) => (value() ? undefined : { kind: 'gdpr', message: MSG.gdpr }));
  });

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    if (await submitToApi(this.f, (value) => this.api.sendContactMessage(value))) {
      this.sent.set(true);
      this.model.set({ ...EMPTY });
      this.f().reset();
    }
  }
}
