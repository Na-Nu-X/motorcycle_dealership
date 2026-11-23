import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Icon } from './icon';

@Component({
  selector: 'app-pagination',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    nav { margin-top: var(--space-6); }
    ul { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
    button { min-width: 44px; height: 44px; padding: 0 var(--space-3); border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-sm); background: transparent; cursor: pointer; font-variant-numeric: tabular-nums; font-weight: 600; }
    button:hover:not(:disabled) { border-color: var(--color-steel); }
    button[aria-current='page'] { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-accent-contrast); }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    .gap { display: grid; place-items: center; min-width: 24px; color: var(--color-text-subtle); }
  `,
  template: `
    @if (pageCount() > 1) {
      <nav aria-label="Stránkovanie">
        <ul>
          <li>
            <button type="button" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)" aria-label="Predchádzajúca strana">
              <app-icon name="chevron-left" />
            </button>
          </li>
          @for (p of pages(); track $index) {
            <li>
              @if (p === null) {
                <span class="gap" aria-hidden="true">…</span>
              } @else {
                <button type="button" [attr.aria-current]="p === page() ? 'page' : null" (click)="pageChange.emit(p)" [attr.aria-label]="'Strana ' + p">{{ p }}</button>
              }
            </li>
          }
          <li>
            <button type="button" [disabled]="page() >= pageCount()" (click)="pageChange.emit(page() + 1)" aria-label="Ďalšia strana">
              <app-icon name="chevron" />
            </button>
          </li>
        </ul>
      </nav>
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageChange = output<number>();

  /** 1 … 4 5 6 … 12 */
  protected readonly pages = computed<(number | null)[]>(() => {
    const total = this.pageCount();
    const current = this.page();
    const result: (number | null)[] = [];
    for (let p = 1; p <= total; p++) {
      if (p === 1 || p === total || Math.abs(p - current) <= 1) {
        result.push(p);
      } else if (result[result.length - 1] !== null) {
        result.push(null);
      }
    }
    return result;
  });
}
