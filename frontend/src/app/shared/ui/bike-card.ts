import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MotorcycleListItem } from '../../core/api/models';
import { NumberPipe, PricePipe } from '../pipes/price.pipe';

@Component({
  selector: 'app-bike-card',
  imports: [RouterLink, PricePipe, NumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './bike-card.scss',
  template: `
    @let b = bike();
    <article class="card bike">
      <div class="bike__media">
        @if (b.image) {
          <img [src]="b.image" [alt]="''" loading="lazy" decoding="async" width="800" height="500" />
        } @else {
          <div class="bike__noimg" aria-hidden="true">{{ b.brand }}</div>
        }
        <div class="bike__badges">
          @if (b.new_arrival) { <span class="badge badge--accent">Novinka</span> }
          @if (b.used) { <span class="badge">Jazdený</span> }
          @if (discount()) { <span class="badge badge--outline">-{{ discount() }} %</span> }
        </div>
      </div>
      <div class="bike__body">
        <p class="bike__meta">{{ b.category_label }} · {{ b.year }}</p>
        <h3 class="bike__title">
          <a [routerLink]="['/motocykle', b.slug]" class="bike__link">
            <span class="bike__brand">{{ b.brand }}</span> {{ b.model }}
          </a>
        </h3>
        <dl class="bike__specs num">
          <div><dt>Objem</dt><dd>{{ b.engine_cc | num }} cm³</dd></div>
          <div><dt>Výkon</dt><dd>{{ b.power_hp | num }} k</dd></div>
          @if (b.used) {
            <div><dt>Najazdené</dt><dd>{{ b.mileage_km | num }} km</dd></div>
          } @else {
            <div><dt>Oprávnenie</dt><dd>{{ b.license_category }}</dd></div>
          }
        </dl>
        <div class="bike__footer">
          <p class="price">
            {{ b.price | price }}
            @if (b.previous_price) { <span class="price__old">{{ b.previous_price | price }}</span> }
          </p>
          <span class="bike__stock" [class]="'bike__stock bike__stock--' + b.stock_status">{{ b.stock_status_label }}</span>
        </div>
      </div>
    </article>
  `,
})
export class BikeCard {
  readonly bike = input.required<MotorcycleListItem>();

  protected readonly discount = computed(() => {
    const { price, previous_price } = this.bike();
    if (!previous_price) {
      return 0;
    }
    const pct = Math.round((1 - Number(price) / Number(previous_price)) * 100);
    return pct > 0 ? pct : 0;
  });
}
