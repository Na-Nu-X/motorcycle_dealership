import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../../site.config';
import { apiUrl } from '../../core/api/api.service';
import { Accessory } from '../../core/api/models';
import { CartService } from '../../core/services/cart.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { PluralPipe } from '../../shared/pipes/plural.pipe';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-accessory-detail',
  imports: [RouterLink, Icon, PricePipe, PluralPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accessory-detail.html',
  styleUrl: './accessory-detail.scss',
})
export default class AccessoryDetail {
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly seo = inject(SeoService);

  readonly slug = input.required<string>();
  protected readonly item = httpResource<Accessory>(() => apiUrl(`accessories/${this.slug()}/`));

  protected readonly size = linkedSignal(() => (this.item.hasValue() && this.item.value().sizes.length === 1 ? this.item.value().sizes[0] : ''));
  protected readonly color = linkedSignal(() => (this.item.hasValue() ? (this.item.value().colors[0] ?? '') : ''));
  protected readonly quantity = linkedSignal(() => {
    this.slug();
    return 1;
  });
  protected readonly attempted = signal(false);

  protected readonly maxQty = computed(() =>
    this.item.hasValue() ? Math.min(this.item.value().stock, SITE_CONFIG.maxQuantityPerItem) : 1,
  );
  protected readonly sizeMissing = computed(
    () => this.item.hasValue() && this.item.value().sizes.length > 0 && !this.size(),
  );
  protected readonly notFound = computed(() => {
    const err = this.item.error();
    return err instanceof HttpErrorResponse && err.status === 404;
  });

  constructor() {
    effect(() => {
      if (this.item.hasValue()) {
        const a = this.item.value();
        this.seo.setPage(a.name, a.short_description || undefined, a.image);
      }
    });
  }

  protected setQuantity(raw: number): void {
    this.quantity.set(Math.min(Math.max(1, Math.floor(raw) || 1), this.maxQty()));
  }

  protected add(): void {
    if (!this.item.hasValue()) return;
    this.attempted.set(true);
    if (this.sizeMissing()) {
      document.getElementById('size-group')?.querySelector('input')?.focus();
      return;
    }
    const a = this.item.value();
    const result = this.cart.addAccessory(a, { size: this.size(), color: this.color(), quantity: this.quantity() });
    if (result === 'limit') {
      this.toast.show(`Viac kusov nie je skladom (max. ${this.maxQty()}).`, 'error');
      return;
    }
    this.attempted.set(false);
    this.toast.show(`${a.name} pridané do košíka.`, 'success', { label: 'Zobraziť košík', url: '/kosik' });
  }
}
