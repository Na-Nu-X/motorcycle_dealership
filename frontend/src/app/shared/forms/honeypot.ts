import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

/** Invisible anti-spam field. Real users never see or fill it. */
@Component({
  selector: 'app-honeypot',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hp-field" aria-hidden="true">
      <label>
        Webová stránka (nevypĺňajte)
        <input type="text" [formField]="field()" tabindex="-1" autocomplete="off" />
      </label>
    </div>
  `,
})
export class Honeypot {
  readonly field = input.required<FieldTree<string>>();
}
