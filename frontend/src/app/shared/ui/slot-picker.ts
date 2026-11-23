import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

import { Slot } from '../../core/api/models';
import { PluralPipe } from '../pipes/plural.pipe';

/** Grid of half-hour time slots. Taken slots are disabled. */
@Component({
  selector: 'app-slot-picker',
  imports: [PluralPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="group" [attr.aria-labelledby]="labelId()" [attr.aria-describedby]="describedBy()">
      @if (loading()) {
        <div class="skeleton" style="height: 100px" aria-hidden="true"></div>
        <p class="visually-hidden" role="status">Načítavam voľné termíny…</p>
      } @else if (!slots()) {
        <p class="muted">Najprv vyberte dátum.</p>
      } @else if (!freeCount()) {
        <p class="alert alert--warning">V tento deň už nie je voľný žiadny termín. Vyberte prosím iný deň.</p>
      } @else {
        <p class="muted" style="font-size: var(--fs-sm)" aria-live="polite">{{ freeCount() | plural: 'slot' }}</p>
        <div class="slot-grid">
          @for (slot of slots(); track slot.time) {
            <button
              type="button"
              [disabled]="!slot.available"
              [attr.aria-pressed]="slot.time === value()"
              [attr.aria-label]="slot.time + (slot.available ? '' : ' – obsadené')"
              (click)="value.set(slot.time)"
            >
              {{ slot.time }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class SlotPicker {
  readonly slots = input<readonly Slot[] | null>(null);
  readonly loading = input(false);
  readonly labelId = input.required<string>();
  readonly describedBy = input<string | null>(null);
  /** selected "HH:MM" */
  readonly value = model('');

  protected readonly freeCount = computed(() => (this.slots() ?? []).filter((s) => s.available).length);
}
