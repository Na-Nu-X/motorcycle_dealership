import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { apiUrl } from '../../core/api/api.service';
import { Accessory, AccessoryCategory, Paginated } from '../../core/api/models';
import { PluralPipe } from '../../shared/pipes/plural.pipe';
import { AccessoryCard } from '../../shared/ui/accessory-card';
import { CardSkeleton } from '../../shared/ui/card-skeleton';
import { Icon } from '../../shared/ui/icon';
import { Pagination } from '../../shared/ui/pagination';

export const ACCESSORY_CATEGORIES: { value: AccessoryCategory; label: string }[] = [
  { value: 'helmets', label: 'Prilby' },
  { value: 'jackets', label: 'Bundy a nohavice' },
  { value: 'gloves', label: 'Rukavice' },
  { value: 'boots', label: 'Topánky' },
  { value: 'parts', label: 'Diely a doplnky' },
  { value: 'maintenance', label: 'Údržba a chémia' },
];

const SORTS = [
  { value: '', label: 'Odporúčané', api: '' },
  { value: 'cena-vzostupne', label: 'Cena: od najnižšej', api: 'price' },
  { value: 'cena-zostupne', label: 'Cena: od najvyššej', api: '-price' },
  { value: 'nazov', label: 'Názov A–Z', api: 'name' },
];
const PAGE_SIZE = 12;

@Component({
  selector: 'app-shop',
  imports: [AccessoryCard, CardSkeleton, Icon, Pagination, PluralPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop.html',
  styles: `
    .shop { padding-block: var(--space-6); }
    .shop__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); margin-bottom: var(--space-5); }
    .shop__cats { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: 0 0 var(--space-5); padding: 0; list-style: none; }
    .shop__search { position: relative; flex: 1 1 240px; }
    .shop__search app-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-subtle); }
    .shop__search .input { padding-left: 2.6rem; }
    .shop__sort { width: auto; max-width: 100%; }
    .shop__count { margin: 0 0 var(--space-4); font-weight: 600; color: var(--color-text-muted); }
  `,
})
export default class Shop {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private searchTimer?: ReturnType<typeof setTimeout>;

  protected readonly categories = ACCESSORY_CATEGORIES;
  protected readonly sorts = SORTS;

  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly state = computed(() => {
    const p = this.params();
    const category = p.get('kategoria') ?? '';
    const sort = p.get('zoradit') ?? '';
    return {
      category: ACCESSORY_CATEGORIES.some((c) => c.value === category) ? category : '',
      q: (p.get('hladat') ?? '').slice(0, 80),
      inStock: p.get('skladom') === '1',
      sort: SORTS.some((s) => s.value === sort) ? sort : '',
      page: Math.max(1, Number(p.get('strana')) || 1),
    };
  });

  protected readonly results = httpResource<Paginated<Accessory>>(() => {
    const s = this.state();
    const params: Record<string, string | number> = { page: s.page, page_size: PAGE_SIZE };
    if (s.category) params['category'] = s.category;
    if (s.q) params['q'] = s.q;
    if (s.inStock) params['in_stock'] = 'true';
    const ordering = SORTS.find((x) => x.value === s.sort)?.api;
    if (ordering) params['ordering'] = ordering;
    return { url: apiUrl('accessories/'), params };
  });
  protected readonly items = computed(() => (this.results.hasValue() ? this.results.value().results : []));
  protected readonly total = computed(() => (this.results.hasValue() ? this.results.value().count : 0));
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  protected update(patch: Partial<{ category: string; q: string; inStock: boolean; sort: string; page: number }>): void {
    const next = { ...this.state(), page: 1, ...patch };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        kategoria: next.category || null,
        hladat: next.q || null,
        skladom: next.inStock ? '1' : null,
        zoradit: next.sort || null,
        strana: next.page > 1 ? next.page : null,
      },
    });
  }

  protected search(value: string): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.update({ q: value.trim() }), 350);
  }
}
