/**
 * Slovak plural forms.
 *
 *   1      → one   ("1 motocykel")
 *   2 – 4  → few   ("3 motocykle")
 *   0, 5+  → many  ("0 motocyklov", "5 motocyklov")
 *   decimals → few form is customary ("1,5 litra") – we use `many` unless provided.
 */
export interface PluralForms {
  readonly one: string;
  readonly few: string;
  readonly many: string;
  readonly decimal?: string;
}

export function skPluralCategory(count: number): keyof PluralForms {
  if (!Number.isInteger(count)) {
    return 'decimal';
  }
  const n = Math.abs(count);
  if (n === 1) {
    return 'one';
  }
  if (n >= 2 && n <= 4) {
    return 'few';
  }
  return 'many';
}

export function skPlural(count: number, forms: PluralForms): string {
  const category = skPluralCategory(count);
  return forms[category] ?? forms.many;
}

/** Commonly used nouns so templates stay short: `count | plural: 'motorcycle'`. */
export const NOUNS = {
  motorcycle: { one: 'motocykel', few: 'motocykle', many: 'motocyklov' },
  product: { one: 'produkt', few: 'produkty', many: 'produktov' },
  item: { one: 'položka', few: 'položky', many: 'položiek' },
  piece: { one: 'kus', few: 'kusy', many: 'kusov' },
  year: { one: 'rok', few: 'roky', many: 'rokov' },
  result: { one: 'výsledok', few: 'výsledky', many: 'výsledkov' },
  filter: { one: 'filter', few: 'filtre', many: 'filtrov' },
  brand: { one: 'značka', few: 'značky', many: 'značiek' },
  slot: { one: 'voľný termín', few: 'voľné termíny', many: 'voľných termínov' },
} as const satisfies Record<string, PluralForms>;

export type Noun = keyof typeof NOUNS;
