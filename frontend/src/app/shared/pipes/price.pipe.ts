import { Pipe, PipeTransform } from '@angular/core';

import { formatNumber, formatPrice } from '../../core/utils/format';

/** `{{ bike.price | price }}` → "10 990 €"; `{{ x | price: true }}` → "64,90 €". */
@Pipe({ name: 'price' })
export class PricePipe implements PipeTransform {
  transform(value: string | number | null | undefined, precise?: boolean): string {
    return formatPrice(value, precise);
  }
}

/** `{{ 18500 | num }}` → "18 500". */
@Pipe({ name: 'num' })
export class NumberPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    return formatNumber(value);
  }
}
