import { Pipe, PipeTransform } from '@angular/core';

import { formatDate } from '../../core/utils/format';

@Pipe({ name: 'dateSk' })
export class DateSkPipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    return iso ? formatDate(iso) : '';
  }
}
