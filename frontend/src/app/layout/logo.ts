import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SITE_CONFIG } from '../../site.config';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 0.6rem; }
    svg { width: 34px; height: 34px; flex: none; }
    span {
      font-family: var(--font-display);
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      line-height: 1;
    }
    b { color: var(--color-accent-text); font-weight: 800; }
  `,
  template: `
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="38" height="38" rx="3" fill="var(--color-accent)" />
      <path d="M8 29 15 11h4l-4 10 7-10h4l-4 10 7-10h4l-8 18h-4l3-7-5 7h-4l3-7-5 7z" fill="#fff" />
    </svg>
    <span>{{ first }}<b>{{ second }}</b></span>
  `,
})
export class Logo {
  // "MotoVault" → "Moto" + "Vault" (accent). Works for any CamelCase brand name.
  private readonly parts = SITE_CONFIG.name.match(/^([A-Z][a-z]+)(.*)$/);
  protected readonly first = this.parts ? this.parts[1] : SITE_CONFIG.name;
  protected readonly second = this.parts ? this.parts[2] : '';
}
