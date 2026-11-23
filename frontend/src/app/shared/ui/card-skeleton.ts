import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .sk { display: flex; flex-direction: column; gap: var(--space-3); }
    .sk__img { aspect-ratio: 16 / 10; }
    .sk__line { height: 18px; }
    .sk__line--short { width: 50%; }
  `,
  template: `
    <div class="grid grid--cards" aria-hidden="true">
      @for (i of items(); track i) {
        <div class="sk">
          <div class="skeleton sk__img"></div>
          <div class="skeleton sk__line"></div>
          <div class="skeleton sk__line sk__line--short"></div>
        </div>
      }
    </div>
    <p class="visually-hidden" role="status">Načítavam…</p>
  `,
})
export class CardSkeleton {
  readonly count = input(6);
  protected readonly items = computed(() => Array.from({ length: this.count() }, (_, i) => i));
}
