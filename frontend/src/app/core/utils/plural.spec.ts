import { NOUNS, skPlural, skPluralCategory } from './plural';
import { PluralPipe } from '../../shared/pipes/plural.pipe';

describe('Slovak pluralisation', () => {
  it('picks the right category', () => {
    expect([0, 1, 2, 3, 4, 5, 11, 21, 22, 100].map(skPluralCategory)).toEqual([
      'many', 'one', 'few', 'few', 'few', 'many', 'many', 'many', 'many', 'many',
    ]);
    expect(skPluralCategory(-1)).toBe('one');
    expect(skPluralCategory(1.5)).toBe('decimal');
  });

  it('formats motorcycles correctly', () => {
    expect(skPlural(1, NOUNS.motorcycle)).toBe('motocykel');
    expect(skPlural(2, NOUNS.motorcycle)).toBe('motocykle');
    expect(skPlural(5, NOUNS.motorcycle)).toBe('motocyklov');
    expect(skPlural(0, NOUNS.motorcycle)).toBe('motocyklov');
  });

  it('falls back to the "many" form for decimals without an explicit form', () => {
    expect(skPlural(2.5, NOUNS.piece)).toBe('kusov');
  });

  it('pipe renders number + word', () => {
    const pipe = new PluralPipe();
    expect(pipe.transform(1, 'motorcycle')).toBe('1 motocykel');
    expect(pipe.transform(3, 'motorcycle')).toBe('3 motocykle');
    expect(pipe.transform(28, 'motorcycle')).toBe('28 motocyklov');
    expect(pipe.transform(4, 'item', false)).toBe('položky');
    expect(pipe.transform(null, 'product')).toBe('0 produktov');
  });
});
