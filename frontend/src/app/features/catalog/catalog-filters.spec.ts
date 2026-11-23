import {
  DEFAULT_FILTERS,
  activeFilterCount,
  filtersFromParams,
  filtersToApiParams,
  filtersToQueryParams,
  toggle,
} from './catalog-filters';

describe('catalog filters', () => {
  it('parses Slovak URL params', () => {
    const f = filtersFromParams({
      kategoria: 'sport,naked,bogus',
      znacka: 'ducati,bmw-motorrad,<script>',
      cena_od: '5000',
      cena_do: '15000',
      objem_od: '501',
      stav: 'jazdene',
      a2: '1',
      hladat: ' monster ',
      zoradit: 'cena-vzostupne',
      strana: '2',
    });
    expect(f.categories).toEqual(['sport', 'naked']);
    expect(f.brands).toEqual(['ducati', 'bmw-motorrad']);
    expect([f.priceMin, f.priceMax, f.ccMin, f.ccMax]).toEqual([5000, 15000, 501, null]);
    expect(f.condition).toBe('used');
    expect(f.a2Only).toBe(true);
    expect(f.q).toBe('monster');
    expect(f.sort).toBe('cena-vzostupne');
    expect(f.page).toBe(2);
  });

  it('ignores malformed values', () => {
    const f = filtersFromParams({ cena_od: 'abc', strana: '-3', stav: 'broken', zoradit: 'x' });
    expect(f).toEqual(DEFAULT_FILTERS);
  });

  it('round-trips through the URL', () => {
    const f = { ...DEFAULT_FILTERS, categories: ['adventure' as const], priceMax: 20000, condition: 'new' as const, page: 3 };
    const params = filtersToQueryParams(f);
    expect(params['kategoria']).toBe('adventure');
    expect(params['stav']).toBe('nove');
    expect(params['zoradit']).toBeNull();
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null).map(([k, v]) => [k, String(v)]));
    expect(filtersFromParams(clean)).toEqual(f);
  });

  it('builds API params', () => {
    const api = filtersToApiParams(
      { ...DEFAULT_FILTERS, brands: ['ktm'], ccMin: 126, ccMax: 500, condition: 'used', a2Only: true, sort: 'cena-zostupne' },
      12,
    );
    expect(api).toEqual({
      page: 1, page_size: 12, brand: 'ktm', cc_min: 126, cc_max: 500, condition: 'used', license: 'AM,A1,A2', ordering: '-price',
    });
  });

  it('counts active filters and toggles values', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_FILTERS, categories: ['sport', 'naked'], priceMin: 1, priceMax: 2, q: 'x' })).toBe(4);
    expect(toggle(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggle(['a'], 'b')).toEqual(['a', 'b']);
  });
});
