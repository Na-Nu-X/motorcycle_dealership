import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Accessory } from '../../core/api/models';
import { PricePipe } from '../pipes/price.pipe';

@Component({
  selector: 'app-accessory-card',
  imports: [RouterLink, PricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .acc { height: 100%; transition: border-color var(--dur) var(--ease); }
    .acc:hover, .acc:focus-within { border-color: var(--color-border-strong); }
    .acc__media { aspect-ratio: 1; background: var(--color-surface-2); overflow: hidden; }
    .acc__media img { width: 100%; height: 100%; object-fit: cover; }
    .acc__body { display: flex; flex: 1; flex-direction: column; gap: var(--space-2); padding: var(--space-4); }
    .acc__brand { margin: 0; font-size: var(--fs-xs); font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-subtle); }
    h3 { margin: 0; font-size: 1.3rem; line-height: 1.1; }
    a { text-decoration: none; color: var(--color-text); }
    a::after { content: ''; position: absolute; inset: 0; }
    .acc__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); margin-top: auto; }
    .price { margin: 0; font-size: var(--fs-lg); }
    .stock { font-size: var(--fs-xs); font-weight: 600; color: var(--color-success); }
    .stock--out { color: var(--color-danger); }
  `,
  template: `
    @let a = item();
    <article class="card acc">
      <div class="acc__media">
        @if (a.image) {
          <img [src]="a.image" alt="" loading="lazy" decoding="async" width="450" height="450" />
        }
      </div>
      <div class="acc__body">
        <p class="acc__brand">{{ a.brand }} · {{ a.category_label }}</p>
        <h3><a [routerLink]="['/prislusenstvo', a.slug]">{{ a.name }}</a></h3>
        <div class="acc__foot">
          <p class="price">
            {{ a.price | price: true }}
            @if (a.previous_price) { <span class="price__old">{{ a.previous_price | price: true }}</span> }
          </p>
          <span class="stock" [class.stock--out]="!a.in_stock">{{ a.in_stock ? 'Skladom' : 'Vypredané' }}</span>
        </div>
      </div>
    </article>
  `,
})
export class AccessoryCard {
  readonly item = input.required<Accessory>();
}
