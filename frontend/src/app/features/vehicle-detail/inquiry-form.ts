import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, signal } from '@angular/core';
import { FormField, apply, form, maxLength } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api/api.service';
import { InquiryPayload, InquiryType } from '../../core/api/models';
import { contactSchema, emptyContact } from '../../shared/forms/contact-schema';
import { FieldError, showInvalid } from '../../shared/forms/field-error';
import { FormAlert } from '../../shared/forms/form-alert';
import { Honeypot } from '../../shared/forms/honeypot';
import { rootErrors, submitToApi } from '../../shared/forms/submit';

export const INQUIRY_TYPES: { value: InquiryType; label: string }[] = [
  { value: 'interest', label: 'Mám záujem' },
  { value: 'reservation', label: 'Chcem rezervovať' },
  { value: 'financing', label: 'Financovanie / leasing' },
  { value: 'trade_in', label: 'Protiúčet môjho motocykla' },
];

@Component({
  selector: 'app-inquiry-form',
  imports: [FormField, FieldError, FormAlert, Honeypot, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inquiry-form.html',
})
export class InquiryForm {
  private readonly api = inject(ApiService);

  readonly motorcycle = input.required<string>();
  readonly motorcycleTitle = input.required<string>();
  readonly initialType = input<InquiryType>('interest');

  protected readonly types = INQUIRY_TYPES;
  protected readonly sent = signal(false);
  protected readonly showInvalid = showInvalid;
  protected readonly rootErrors = rootErrors;

  protected readonly model = linkedSignal<InquiryPayload>(() => ({
    ...emptyContact(),
    motorcycle: this.motorcycle(),
    inquiry_type: this.initialType(),
    message: '',
  }));
  protected readonly f = form(this.model, (p) => {
    apply(p, contactSchema);
    maxLength(p.message, 3000, { message: 'Správa je príliš dlhá.' });
  });

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    if (await submitToApi(this.f, (value) => this.api.createInquiry(value))) {
      this.sent.set(true);
    }
  }
}
