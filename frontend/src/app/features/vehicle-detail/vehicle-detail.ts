import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../../site.config';
import { apiUrl } from '../../core/api/api.service';
import { InquiryType, MotorcycleDetail, MotorcycleListItem } from '../../core/api/models';
import { CartService } from '../../core/services/cart.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { formatNumber } from '../../core/utils/format';
import { NumberPipe, PricePipe } from '../../shared/pipes/price.pipe';
import { BikeCard } from '../../shared/ui/bike-card';
import { Icon } from '../../shared/ui/icon';
import { Lightbox } from '../../shared/ui/lightbox';
import { InquiryForm } from './inquiry-form';

interface SpecRow {
  readonly label: string;
  readonly value: string;
}

interface SpecGroup {
  readonly title: string;
  readonly rows: SpecRow[];
}

const yesNo = (v: boolean) => (v ? 'Áno' : 'Nie');

export function buildSpecGroups(b: MotorcycleDetail): SpecGroup[] {
  const unit = (v: string | number | null, u: string) => (v === null || v === '' ? null : `${formatNumber(v)} ${u}`);
  const groups: { title: string; rows: [string, string | null][] }[] = [
    {
      title: 'Motor a výkon',
      rows: [
        ['Typ motora', b.engine_type || null],
        ['Objem', unit(b.engine_cc, 'cm³')],
        ['Výkon', `${formatNumber(b.power_hp)} k (${formatNumber(b.power_kw)} kW)`],
        ['Krútiaci moment', unit(b.torque_nm, 'Nm')],
        ['Chladenie', b.cooling_label],
        ['Prevodovka', b.gears ? `${b.transmission_label}, ${b.gears} st.` : b.transmission_label],
        ['Max. rýchlosť', unit(b.top_speed_kmh, 'km/h')],
      ],
    },
    {
      title: 'Rozmery a hmotnosť',
      rows: [
        ['Pohotovostná hmotnosť', unit(b.weight_kg, 'kg')],
        ['Výška sedla', unit(b.seat_height_mm, 'mm')],
        ['Objem nádrže', unit(b.fuel_capacity_l, 'l')],
      ],
    },
    {
      title: 'Výbava a bezpečnosť',
      rows: [
        ['ABS', yesNo(b.abs)],
        ['Kontrola trakcie', yesNo(b.traction_control)],
        ['Jazdné režimy', yesNo(b.riding_modes)],
        ['Quickshifter', yesNo(b.quickshifter)],
        ['Tempomat', yesNo(b.cruise_control)],
      ],
    },
    {
      title: 'Ďalšie informácie',
      rows: [
        ['Rok výroby', String(b.year)],
        ['Stav', b.used ? 'Jazdený' : 'Nový'],
        ['Najazdené', b.used ? unit(b.mileage_km, 'km') : null],
        ['Farba', b.color || null],
        ['Vodičské oprávnenie', b.license_category],
        ...Object.entries(b.extra_specs ?? {}).map(([k, v]) => [k, String(v)] as [string, string]),
      ],
    },
  ];
  return groups
    .map((g) => ({ title: g.title, rows: g.rows.filter((r): r is [string, string] => !!r[1]).map(([label, value]) => ({ label, value })) }))
    .filter((g) => g.rows.length);
}

@Component({
  selector: 'app-vehicle-detail',
  imports: [RouterLink, BikeCard, Icon, InquiryForm, Lightbox, NumberPipe, PricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vehicle-detail.html',
  styleUrl: './vehicle-detail.scss',
})
export default class VehicleDetail {
  private readonly seo = inject(SeoService);
  private readonly toast = inject(ToastService);
  protected readonly cart = inject(CartService);
  protected readonly config = SITE_CONFIG;

  /** Route param (bound via `withComponentInputBinding`). */
  readonly slug = input.required<string>();

  protected readonly bike = httpResource<MotorcycleDetail>(() => apiUrl(`motorcycles/${this.slug()}/`));
  protected readonly similar = httpResource<MotorcycleListItem[]>(() => apiUrl(`motorcycles/${this.slug()}/similar/`));

  protected readonly activeImage = signal(0);
  protected readonly lightboxIndex = signal<number | null>(null);
  protected readonly inquiryType = signal<InquiryType>('interest');

  protected readonly notFound = computed(() => {
    const err = this.bike.error();
    return err instanceof HttpErrorResponse && err.status === 404;
  });
  protected readonly specs = computed(() => (this.bike.hasValue() ? buildSpecGroups(this.bike.value()) : []));
  protected readonly title = computed(() => (this.bike.hasValue() ? `${this.bike.value().brand} ${this.bike.value().model}` : ''));
  protected readonly canBook = computed(() => this.bike.hasValue() && this.bike.value().stock_status !== 'sold');

  constructor() {
    effect(() => {
      if (this.bike.hasValue()) {
        const b = this.bike.value();
        this.seo.setPage(`${b.brand} ${b.model} (${b.year})`, b.short_description || undefined, b.images[0]?.image);
      }
    });
    // Reset the gallery when navigating between bikes.
    effect(() => {
      this.slug();
      this.activeImage.set(0);
    });
  }

  protected interested(type: InquiryType): void {
    this.inquiryType.set(type);
    document.getElementById('dopyt')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('iq-first')?.focus({ preventScroll: true }), 400);
  }

  protected reserve(): void {
    if (!this.bike.hasValue()) return;
    const result = this.cart.addMotorcycle(this.bike.value());
    if (result === 'limit') {
      this.toast.show('Naraz môžete rezervovať najviac 3 motocykle.', 'error');
    } else {
      this.toast.show(`${this.title()} je v košíku ako žiadosť o rezerváciu.`, 'success', { label: 'Košík', url: '/kosik' });
    }
  }
}
