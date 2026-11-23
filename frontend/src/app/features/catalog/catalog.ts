import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { SITE_CONFIG } from '../../../site.config';
import { apiUrl } from '../../core/api/api.service';
import { Facets, MotorcycleListItem, Paginated } from '../../core/api/models';
import { PluralPipe } from '../../shared/pipes/plural.pipe';
import { NumberPipe } from '../../shared/pipes/price.pipe';
import { BikeCard } from '../../shared/ui/bike-card';
import { CardSkeleton } from '../../shared/ui/card-skeleton';
import { Icon } from '../../shared/ui/icon';
import { Pagination } from '../../shared/ui/pagination';
import {
  CatalogFilters,
  DEFAULT_FILTERS,
  ENGINE_PRESETS,
  SORT_OPTIONS,
  SortKey,
  activeFilterCount,
  filtersFromParams,
  filtersToApiParams,
  filtersToQueryParams,
  toggle,
} from './catalog-filters';

interface ActiveChip {
  readonly label: string;
  readonly patch: Partial<CatalogFilters>;
}

@Component({
  selector: 'app-catalog',
  imports: [BikeCard, CardSkeleton, Icon, NumberPipe, Pagination, PluralPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
  host: { '(document:keydown.escape)': 'drawerOpen.set(false)' },
})
export default class Catalog {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly drawer = viewChild<ElementRef<HTMLElement>>('drawer');
  private searchTimer?: ReturnType<typeof setTimeout>;

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly enginePresets = ENGINE_PRESETS;
  protected readonly drawerOpen = signal(false);

  /** Filters are derived from the URL – the URL is the single source of truth. */
  protected readonly filters = toSignal(
    this.route.queryParams.pipe(map((params) => filtersFromParams(params))),
    { initialValue: DEFAULT_FILTERS },
  );
  protected readonly activeCount = computed(() => activeFilterCount(this.filters()));

  protected readonly facets = httpResource<Facets>(() => apiUrl('motorcycles/facets/'));
  protected readonly results = httpResource<Paginated<MotorcycleListItem>>(() => ({
    url: apiUrl('motorcycles/'),
    params: filtersToApiParams(this.filters(), SITE_CONFIG.catalogPageSize),
  }));

  protected readonly bikes = computed(() => (this.results.hasValue() ? this.results.value().results : []));
  protected readonly total = computed(() => (this.results.hasValue() ? this.results.value().count : 0));
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / SITE_CONFIG.catalogPageSize)));

  protected readonly chips = computed<ActiveChip[]>(() => {
    const f = this.filters();
    const facets = this.facets.hasValue() ? this.facets.value() : null;
    const chips: ActiveChip[] = [];
    for (const c of f.categories) {
      const label = facets?.categories.find((x) => x.value === c)?.label ?? c;
      chips.push({ label, patch: { categories: f.categories.filter((x) => x !== c) } });
    }
    for (const b of f.brands) {
      const label = facets?.brands.find((x) => x.slug === b)?.name ?? b;
      chips.push({ label, patch: { brands: f.brands.filter((x) => x !== b) } });
    }
    if (f.priceMin !== null || f.priceMax !== null) {
      chips.push({ label: `Cena ${rangeLabel(f.priceMin, f.priceMax, '€')}`, patch: { priceMin: null, priceMax: null } });
    }
    if (f.ccMin !== null || f.ccMax !== null) {
      chips.push({ label: `Objem ${rangeLabel(f.ccMin, f.ccMax, 'cm³')}`, patch: { ccMin: null, ccMax: null } });
    }
    if (f.condition) {
      chips.push({ label: f.condition === 'new' ? 'Nové' : 'Jazdené', patch: { condition: null } });
    }
    if (f.a2Only) {
      chips.push({ label: 'Pre A2', patch: { a2Only: false } });
    }
    if (f.q) {
      chips.push({ label: `„${f.q}“`, patch: { q: '' } });
    }
    return chips;
  });

  /** Writes a filter change into the URL (resets paging unless the page itself changes). */
  update(patch: Partial<CatalogFilters>): void {
    const next: CatalogFilters = { ...this.filters(), page: 1, ...patch };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: filtersToQueryParams(next),
    });
  }

  protected toggleCategory(value: CatalogFilters['categories'][number]): void {
    this.update({ categories: toggle(this.filters().categories, value) });
  }

  protected toggleBrand(slug: string): void {
    this.update({ brands: toggle(this.filters().brands, slug) });
  }

  protected setCondition(value: string): void {
    this.update({ condition: value === 'new' || value === 'used' ? value : null });
  }

  protected setPrice(which: 'priceMin' | 'priceMax', raw: string): void {
    const n = Number(raw);
    this.update({ [which]: raw && Number.isFinite(n) && n > 0 ? Math.round(n) : null });
  }

  protected isEnginePreset(preset: (typeof ENGINE_PRESETS)[number]): boolean {
    const f = this.filters();
    return f.ccMin === preset.min && f.ccMax === preset.max;
  }

  protected toggleEngine(preset: (typeof ENGINE_PRESETS)[number]): void {
    this.update(
      this.isEnginePreset(preset) ? { ccMin: null, ccMax: null } : { ccMin: preset.min, ccMax: preset.max },
    );
  }

  protected setSort(value: string): void {
    this.update({ sort: value as SortKey, page: this.filters().page });
  }

  protected search(value: string): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.update({ q: value.trim() }), 350);
  }

  protected goToPage(page: number): void {
    this.update({ page });
    document.getElementById('results')?.scrollIntoView({ block: 'start' });
  }

  protected reset(): void {
    this.update({ ...DEFAULT_FILTERS, sort: this.filters().sort });
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
    setTimeout(() => this.drawer()?.nativeElement.focus());
  }
}

function rangeLabel(min: number | null, max: number | null, unit: string): string {
  const fmt = (n: number) => n.toLocaleString('sk-SK');
  if (min !== null && max !== null) return `${fmt(min)} – ${fmt(max)} ${unit}`;
  if (min !== null) return `od ${fmt(min)} ${unit}`;
  return `do ${fmt(max ?? 0)} ${unit}`;
}
