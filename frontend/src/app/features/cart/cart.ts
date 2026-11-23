import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, apply, applyWhen, form, maxLength, pattern, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { tap } from 'rxjs';

import { ApiService, apiUrl } from '../../core/api/api.service';
import { OrderPayload, OrderResult, SiteMeta } from '../../core/api/models';
import { CartService } from '../../core/services/cart.service';
import { toNumber } from '../../core/utils/format';
import { MSG, contactSchema, emptyContact } from '../../shared/forms/contact-schema';
import { FieldError, showInvalid } from '../../shared/forms/field-error';
import { FormAlert } from '../../shared/forms/form-alert';
import { Honeypot } from '../../shared/forms/honeypot';
import { rootErrors, submitToApi } from '../../shared/forms/submit';
import { PluralPipe } from '../../shared/pipes/plural.pipe';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Icon } from '../../shared/ui/icon';

type CheckoutModel = Omit<OrderPayload, 'items' | 'motorcycles'>;

/** Fallback when /api/meta/ is unavailable – must match the backend defaults. */
const DEFAULT_SHIPPING = { courier: 6.9, freeFrom: 150 };

@Component({
  selector: 'app-cart',
  imports: [RouterLink, FormField, FieldError, FormAlert, Honeypot, Icon, PluralPipe, PricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export default class Cart {
  private readonly api = inject(ApiService);
  protected readonly cart = inject(CartService);
  protected readonly showInvalid = showInvalid;
  protected readonly rootErrors = rootErrors;

  private readonly meta = httpResource<SiteMeta>(() => apiUrl('meta/'));
  protected readonly order = signal<OrderResult | null>(null);

  protected readonly model = signal<CheckoutModel>({
    ...emptyContact(),
    delivery_method: 'pickup',
    street: '',
    city: '',
    postal_code: '',
    note: '',
  });
  protected readonly f = form(this.model, (p) => {
    apply(p, contactSchema);
    maxLength(p.note, 2000, { message: 'Poznámka je príliš dlhá.' });
    applyWhen(p, ({ value }) => value().delivery_method === 'courier', (courier) => {
      required(courier.street, { message: MSG.required });
      required(courier.city, { message: MSG.required });
      required(courier.postal_code, { message: MSG.required });
      pattern(courier.postal_code, /^\d{3} ?\d{2}$/, { message: 'Zadajte PSČ v tvare 821 04.' });
    });
  });

  protected readonly hasGear = computed(() => this.cart.lines().length > 0);
  protected readonly courier = computed(() => this.hasGear() && this.model().delivery_method === 'courier');
  private readonly shippingRules = computed(() => {
    if (!this.meta.hasValue()) return DEFAULT_SHIPPING;
    const s = this.meta.value().shipping;
    return { courier: toNumber(s.courier_price) ?? DEFAULT_SHIPPING.courier, freeFrom: toNumber(s.free_from) ?? DEFAULT_SHIPPING.freeFrom };
  });
  protected readonly shipping = computed(() =>
    !this.courier() || this.cart.subtotal() >= this.shippingRules().freeFrom ? 0 : this.shippingRules().courier,
  );
  protected readonly freeShippingFrom = computed(() => this.shippingRules().freeFrom);
  protected readonly courierPrice = computed(() => this.shippingRules().courier);
  protected readonly total = computed(() => Math.round((this.cart.subtotal() + this.shipping()) * 100) / 100);

  protected async checkout(event: Event): Promise<void> {
    event.preventDefault();
    await submitToApi(this.f, (value) =>
      this.api
        .createOrder({
          ...value,
          delivery_method: this.hasGear() ? value.delivery_method : 'pickup',
          items: this.cart.lines().map((l) => ({ accessory: l.accessoryId, quantity: l.quantity, size: l.size, color: l.color })),
          motorcycles: this.cart.motorcycles().map((m) => m.slug),
        })
        .pipe(
          tap((result) => {
            this.order.set(result);
            this.cart.clear();
            window.scrollTo({ top: 0 });
          }),
        ),
    );
  }
}
