import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FieldTree, FormField, apply, form, max, maxLength, min, required, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { ApiService, apiUrl } from '../../core/api/api.service';
import { Availability, LicenseCategory, MotorcycleListItem, Paginated, TestRidePayload } from '../../core/api/models';
import { bookingDateBounds, bookingDateError } from '../../core/utils/booking-dates';
import { contactSchema, emptyContact } from '../../shared/forms/contact-schema';
import { FieldError, showInvalid } from '../../shared/forms/field-error';
import { FormAlert } from '../../shared/forms/form-alert';
import { Honeypot } from '../../shared/forms/honeypot';
import { focusFirstInvalid, rootErrors, submitToApi } from '../../shared/forms/submit';
import { DateSkPipe } from '../../shared/pipes/date-sk.pipe';
import { NumberPipe, PricePipe } from '../../shared/pipes/price.pipe';
import { Icon } from '../../shared/ui/icon';
import { SlotPicker } from '../../shared/ui/slot-picker';
import { licenseAllows } from './license';

const STEPS = ['Motocykel', 'Termín', 'Vodič', 'Kontakt'] as const;
type StepFields = (keyof TestRidePayload)[];
const STEP_FIELDS: StepFields[] = [
  ['motorcycle'],
  ['preferred_date', 'preferred_time'],
  ['license_category', 'license_confirmed', 'riding_experience_years'],
  ['first_name', 'last_name', 'email', 'phone', 'note', 'gdpr_consent', 'website'],
];

@Component({
  selector: 'app-test-ride',
  imports: [RouterLink, FormField, FieldError, FormAlert, Honeypot, Icon, SlotPicker, DateSkPipe, NumberPipe, PricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './test-ride.html',
  styleUrl: './test-ride.scss',
})
export default class TestRide {
  private readonly api = inject(ApiService);

  /** Pre-selected motorcycle from `?motocykel=<slug>` (component input binding). */
  readonly motocykel = input<string>();

  protected readonly steps = STEPS;
  protected readonly step = signal(0);
  protected readonly done = signal(false);
  protected readonly query = signal('');
  protected readonly bounds = bookingDateBounds();
  protected readonly licenses: LicenseCategory[] = ['A1', 'A2', 'A'];
  protected readonly showInvalid = showInvalid;
  protected readonly rootErrors = rootErrors;

  protected readonly bikesRes = httpResource<Paginated<MotorcycleListItem>>(() => ({
    url: apiUrl('motorcycles/'),
    params: { page_size: 48, ordering: 'price' },
  }));
  protected readonly bikes = computed(() =>
    this.bikesRes.hasValue() ? this.bikesRes.value().results.filter((b) => b.stock_status !== 'sold') : [],
  );
  protected readonly filteredBikes = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.bikes().filter((b) => `${b.brand} ${b.model}`.toLowerCase().includes(q)) : this.bikes();
  });

  protected readonly model = signal<TestRidePayload>({
    ...emptyContact(),
    motorcycle: '',
    preferred_date: '',
    preferred_time: '',
    license_category: '',
    license_confirmed: false,
    riding_experience_years: 0,
    note: '',
  });

  protected readonly selectedBike = computed(
    () => this.bikes().find((b) => b.slug === this.model().motorcycle) ?? null,
  );

  protected readonly f = form(this.model, (p) => {
    apply(p, contactSchema);
    required(p.motorcycle, { message: 'Vyberte motocykel.' });
    validate(p.preferred_date, ({ value }) => {
      const msg = bookingDateError(value());
      return msg ? { kind: 'date', message: msg } : undefined;
    });
    required(p.preferred_time, { message: 'Vyberte čas.' });
    required(p.license_category, { message: 'Vyberte skupinu vodičského oprávnenia.' });
    validate(p.license_category, ({ value }) => {
      const bike = this.selectedBike();
      return bike && value() && !licenseAllows(bike.license_category, value())
        ? { kind: 'license', message: `Na tento motocykel je potrebné oprávnenie skupiny ${bike.license_category}.` }
        : undefined;
    });
    validate(p.license_confirmed, ({ value }) =>
      value() ? undefined : { kind: 'license', message: 'Testovacia jazda je možná len s platným vodičským oprávnením.' },
    );
    min(p.riding_experience_years, 0, { message: 'Zadajte počet rokov.' });
    max(p.riding_experience_years, 80, { message: 'Zadajte počet rokov.' });
    maxLength(p.note, 2000, { message: 'Text je príliš dlhý.' });
  });

  private readonly validDate = computed(() => {
    const d = this.model().preferred_date;
    return d && !bookingDateError(d) ? d : null;
  });
  protected readonly availability = httpResource<Availability>(() => {
    const date = this.validDate();
    const motorcycle = this.model().motorcycle;
    return date && motorcycle
      ? { url: apiUrl('test-rides/availability/'), params: { date, motorcycle } }
      : undefined;
  });
  protected readonly slots = computed(() =>
    this.validDate() && this.availability.hasValue() ? this.availability.value().slots : null,
  );

  constructor() {
    // Apply the pre-selected motorcycle from the URL once the list is loaded.
    effect(() => {
      const slug = this.motocykel();
      if (slug && this.bikes().some((b) => b.slug === slug) && !this.model().motorcycle) {
        this.f.motorcycle().value.set(slug);
      }
    });
  }

  protected field(name: keyof TestRidePayload): FieldTree<unknown> {
    return (this.f as unknown as Record<string, FieldTree<unknown>>)[name];
  }

  protected selectBike(slug: string): void {
    this.f.motorcycle().value.set(slug);
    this.f.preferred_time().value.set('');
  }

  protected next(): void {
    const fields = STEP_FIELDS[this.step()].map((n) => this.field(n));
    fields.forEach((fld) => fld().markAsTouched());
    const invalid = fields.find((fld) => fld().invalid());
    if (invalid) {
      invalid().focusBoundControl();
      return;
    }
    this.goTo(this.step() + 1);
  }

  protected goTo(index: number): void {
    this.step.set(Math.min(Math.max(index, 0), STEPS.length - 1));
    setTimeout(() => document.getElementById('wizard-step')?.focus());
  }

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    if (this.step() < STEPS.length - 1) {
      this.next();
      return;
    }
    const ok = await submitToApi(this.f, (value) => this.api.createTestRide(value));
    if (ok) {
      this.done.set(true);
      window.scrollTo({ top: 0 });
      return;
    }
    // Jump back to the first step that contains an error (e.g. slot taken meanwhile).
    const stepWithError = STEP_FIELDS.findIndex((names) => names.some((n) => this.field(n)().invalid()));
    if (stepWithError >= 0 && stepWithError !== this.step()) {
      this.step.set(stepWithError);
      this.availability.reload();
      setTimeout(() => focusFirstInvalid(this.f));
    }
  }
}
