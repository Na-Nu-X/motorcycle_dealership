import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, apply, form, max, maxLength, min, required, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../../site.config';
import { ApiService, apiUrl } from '../../core/api/api.service';
import { Availability, ServiceBookingPayload, ServiceType } from '../../core/api/models';
import { bookingDateBounds, bookingDateError } from '../../core/utils/booking-dates';
import { contactSchema, emptyContact } from '../../shared/forms/contact-schema';
import { FieldError, showInvalid } from '../../shared/forms/field-error';
import { FormAlert } from '../../shared/forms/form-alert';
import { Honeypot } from '../../shared/forms/honeypot';
import { rootErrors, submitToApi } from '../../shared/forms/submit';
import { DateSkPipe } from '../../shared/pipes/date-sk.pipe';
import { Icon } from '../../shared/ui/icon';
import { SlotPicker } from '../../shared/ui/slot-picker';

export const SERVICES: { value: ServiceType; label: string; price: string; text: string; icon: string }[] = [
  { value: 'maintenance', label: 'Pravidelná údržba', price: 'od 89 €', icon: 'wrench',
    text: 'Servisná prehliadka podľa plánu výrobcu, výmena oleja a filtrov, kontrola bŕzd, reťaze a kvapalín.' },
  { value: 'tires', label: 'Výmena pneumatík', price: 'od 35 €', icon: 'speed',
    text: 'Prezutie a vyváženie kolies, kontrola ložísk. Pneumatiky najlepších značiek máme skladom.' },
  { value: 'diagnostics', label: 'Diagnostika', price: 'od 45 €', icon: 'engine',
    text: 'Počítačová diagnostika riadiacich jednotiek, čítanie chybových kódov, aktualizácie softvéru.' },
  { value: 'repair', label: 'Oprava', price: 'podľa rozsahu', icon: 'shield',
    text: 'Mechanické a elektrické opravy, opravy po nehode, poistné udalosti a montáž príslušenstva.' },
];

@Component({
  selector: 'app-service',
  imports: [RouterLink, FormField, FieldError, FormAlert, Honeypot, Icon, SlotPicker, DateSkPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service.html',
  styleUrl: './service.scss',
})
export default class Service {
  private readonly api = inject(ApiService);
  protected readonly config = SITE_CONFIG;
  protected readonly services = SERVICES;
  protected readonly bounds = bookingDateBounds();
  protected readonly currentYear = new Date().getFullYear();
  protected readonly showInvalid = showInvalid;
  protected readonly rootErrors = rootErrors;
  protected readonly done = signal<ServiceBookingPayload | null>(null);

  protected readonly model = signal<ServiceBookingPayload>(this.empty());
  protected readonly f = form(this.model, (p) => {
    apply(p, contactSchema);
    required(p.motorcycle_model, { message: 'Uveďte značku a model motocykla.' });
    maxLength(p.motorcycle_model, 120, { message: 'Maximálne 120 znakov.' });
    min(p.motorcycle_year, 1950, { message: 'Zadajte platný rok výroby.' });
    max(p.motorcycle_year, this.currentYear + 1, { message: 'Zadajte platný rok výroby.' });
    min(p.mileage_km, 0, { message: 'Stav tachometra nemôže byť záporný.' });
    maxLength(p.license_plate, 12, { message: 'Maximálne 12 znakov.' });
    required(p.service_type, { message: 'Vyberte typ servisu.' });
    validate(p.preferred_date, ({ value }) => {
      const msg = bookingDateError(value());
      return msg ? { kind: 'date', message: msg } : undefined;
    });
    required(p.preferred_time, { message: 'Vyberte čas.' });
    maxLength(p.note, 3000, { message: 'Text je príliš dlhý.' });
  });

  private readonly validDate = computed(() => {
    const d = this.model().preferred_date;
    return d && !bookingDateError(d) ? d : null;
  });
  protected readonly availability = httpResource<Availability>(() => {
    const date = this.validDate();
    return date ? { url: apiUrl('service-bookings/availability/'), params: { date } } : undefined;
  });
  protected readonly slots = computed(() =>
    this.validDate() && this.availability.hasValue() ? this.availability.value().slots : null,
  );

  protected chooseService(value: ServiceType): void {
    this.f.service_type().value.set(value);
    document.getElementById('rezervacia')?.scrollIntoView({ behavior: 'smooth' });
  }

  protected dateChanged(): void {
    this.f.preferred_time().value.set('');
  }

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    const ok = await submitToApi(this.f, (value) => this.api.createServiceBooking(value));
    if (ok) {
      this.done.set(this.model());
      this.model.set(this.empty());
      this.f().reset();
    } else {
      // A slot may have been taken meanwhile – refresh availability.
      this.availability.reload();
    }
  }

  protected serviceLabel(value: string): string {
    return SERVICES.find((s) => s.value === value)?.label ?? value;
  }

  private empty(): ServiceBookingPayload {
    return {
      ...emptyContact(),
      motorcycle_model: '',
      motorcycle_year: null,
      mileage_km: null,
      license_plate: '',
      service_type: '',
      preferred_date: '',
      preferred_time: '',
      note: '',
    };
  }
}

