import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

/**
 * Shows the first validation message of a field once it was touched.
 * Pair with `[attr.aria-describedby]` on the control using the same `id`.
 */
@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message(); as msg) {
      <p class="field-error" [id]="id()">{{ msg }}</p>
    }
  `,
})
export class FieldError {
  readonly field = input.required<FieldTree<unknown>>();
  readonly id = input.required<string>();

  readonly message = computed(() => {
    const state = this.field()();
    if (!state.touched()) {
      return null;
    }
    return state.errors()[0]?.message ?? null;
  });
}

/** Helper for templates: `[attr.aria-invalid]="invalid(f.email)"`. */
export function showInvalid(field: FieldTree<unknown>): 'true' | null {
  const state = field();
  return state.touched() && state.invalid() ? 'true' : null;
}
