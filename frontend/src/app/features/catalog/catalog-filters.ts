import { Params } from '@angular/router';

import { MotorcycleCategory } from '../../core/api/models';

/**
 * Catalog filter state and its two serialisations:
 *  - URL query params (Slovak, shareable):  ?kategoria=sport,naked&cena_do=15000&stav=jazdene
 *  - API params (Django REST):              ?category=sport,naked&price_max=15000&condition=used
 */
export type Condition = 'new' | 'used';

export interface CatalogFilters {
  readonly categories: readonly MotorcycleCategory[];
  readonly brands: readonly string[];
  readonly priceMin: number | null;
  readonly priceMax: number | null;
  readonly ccMin: number | null;
  readonly ccMax: number | null;
  readonly condition: Condition | null;
  readonly a2Only: boolean;
  readonly q: string;
  readonly sort: SortKey;
  readonly page: number;
}

export const SORT_OPTIONS = [
  { value: 'odporucane', label: 'Odporúčané', api: '' },
  { value: 'cena-vzostupne', label: 'Cena: od najnižšej', api: 'price' },
  { value: 'cena-zostupne', label: 'Cena: od najvyššej', api: '-price' },
  { value: 'najnovsie', label: 'Rok výroby: najnovšie', api: '-year' },
  { value: 'vykon', label: 'Výkon: najvyšší', api: '-power_hp' },
  { value: 'objem', label: 'Objem: od najmenšieho', api: 'engine_cc' },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]['value'];

export const ENGINE_PRESETS = [
  { label: 'do 125 cm³', min: null, max: 125 },
  { label: '126 – 500 cm³', min: 126, max: 500 },
  { label: '501 – 900 cm³', min: 501, max: 900 },
  { label: '901 – 1 200 cm³', min: 901, max: 1200 },
  { label: 'nad 1 200 cm³', min: 1201, max: null },
] as const;

export const CATEGORY_VALUES: readonly MotorcycleCategory[] = ['adventure', 'cruiser', 'sport', 'naked', 'scooter'];

const CONDITION_TO_URL: Record<Condition, string> = { new: 'nove', used: 'jazdene' };
const URL_TO_CONDITION: Record<string, Condition> = { nove: 'new', jazdene: 'used' };

export const DEFAULT_FILTERS: CatalogFilters = {
  categories: [],
  brands: [],
  priceMin: null,
  priceMax: null,
  ccMin: null,
  ccMax: null,
  condition: null,
  a2Only: false,
  q: '',
  sort: 'odporucane',
  page: 1,
};

type ParamSource = Record<string, string | string[] | null | undefined>;

function str(params: ParamSource, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

function list(params: ParamSource, key: string): string[] {
  return str(params, key)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function positiveInt(params: ParamSource, key: string): number | null {
  const n = Number(str(params, key));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/** URL → filters. Unknown or malformed values are ignored, never throw. */
export function filtersFromParams(params: ParamSource): CatalogFilters {
  const sort = str(params, 'zoradit');
  return {
    categories: list(params, 'kategoria').filter((c): c is MotorcycleCategory =>
      CATEGORY_VALUES.includes(c as MotorcycleCategory),
    ),
    brands: list(params, 'znacka').filter((b) => /^[a-z0-9-]+$/.test(b)),
    priceMin: positiveInt(params, 'cena_od'),
    priceMax: positiveInt(params, 'cena_do'),
    ccMin: positiveInt(params, 'objem_od'),
    ccMax: positiveInt(params, 'objem_do'),
    condition: URL_TO_CONDITION[str(params, 'stav')] ?? null,
    a2Only: str(params, 'a2') === '1',
    q: str(params, 'hladat').trim().slice(0, 80),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortKey) : 'odporucane',
    page: positiveInt(params, 'strana') ?? 1,
  };
}

/** Filters → URL. Default values are set to `null` so Angular removes them from the URL. */
export function filtersToQueryParams(f: CatalogFilters): Params {
  return {
    kategoria: f.categories.length ? f.categories.join(',') : null,
    znacka: f.brands.length ? f.brands.join(',') : null,
    cena_od: f.priceMin,
    cena_do: f.priceMax,
    objem_od: f.ccMin,
    objem_do: f.ccMax,
    stav: f.condition ? CONDITION_TO_URL[f.condition] : null,
    a2: f.a2Only ? '1' : null,
    hladat: f.q || null,
    zoradit: f.sort === 'odporucane' ? null : f.sort,
    strana: f.page > 1 ? f.page : null,
  };
}

/** Filters → Django REST query params. */
export function filtersToApiParams(f: CatalogFilters, pageSize: number): Record<string, string | number> {
  const params: Record<string, string | number> = { page: f.page, page_size: pageSize };
  if (f.categories.length) params['category'] = f.categories.join(',');
  if (f.brands.length) params['brand'] = f.brands.join(',');
  if (f.priceMin !== null) params['price_min'] = f.priceMin;
  if (f.priceMax !== null) params['price_max'] = f.priceMax;
  if (f.ccMin !== null) params['cc_min'] = f.ccMin;
  if (f.ccMax !== null) params['cc_max'] = f.ccMax;
  if (f.condition) params['condition'] = f.condition;
  if (f.a2Only) params['license'] = 'AM,A1,A2';
  if (f.q) params['q'] = f.q;
  const ordering = SORT_OPTIONS.find((o) => o.value === f.sort)?.api;
  if (ordering) params['ordering'] = ordering;
  return params;
}

/** Number of active filters (sorting and paging are not filters). */
export function activeFilterCount(f: CatalogFilters): number {
  return (
    f.categories.length +
    f.brands.length +
    (f.priceMin !== null || f.priceMax !== null ? 1 : 0) +
    (f.ccMin !== null || f.ccMax !== null ? 1 : 0) +
    (f.condition ? 1 : 0) +
    (f.a2Only ? 1 : 0) +
    (f.q ? 1 : 0)
  );
}

export function toggle<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}
