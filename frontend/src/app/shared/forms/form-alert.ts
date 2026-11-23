import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Root-level error list announced to screen readers. */
@Component({
  selector: 'app-form-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="alert" aria-live="assertive">
      @if (messages().length) {
        <div class="alert alert--error">
          @for (msg of messages(); track msg) {
            <p>{{ msg }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class FormAlert {
  readonly messages = input<string[]>([]);
}
