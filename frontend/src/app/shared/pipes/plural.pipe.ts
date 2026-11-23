import { Pipe, PipeTransform } from '@angular/core';

import { NOUNS, Noun, PluralForms, skPlural } from '../../core/utils/plural';

/**
 * Slovak pluralisation.
 *
 *   {{ 5 | plural: 'motorcycle' }}           → "5 motocyklov"
 *   {{ n | plural: forms : false }}          → only the word, without the number
 */
@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(count: number | null | undefined, noun: Noun | PluralForms, withNumber = true): string {
    const n = count ?? 0;
    const forms = typeof noun === 'string' ? NOUNS[noun] : noun;
    const word = skPlural(n, forms);
    return withNumber ? `${n.toLocaleString('sk-SK')} ${word}` : word;
  }
}
