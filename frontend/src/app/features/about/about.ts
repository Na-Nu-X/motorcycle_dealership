import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../../site.config';
import { PluralPipe } from '../../shared/pipes/plural.pipe';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-about',
  imports: [RouterLink, Icon, PluralPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.html',
  styles: `
    .story { display: grid; gap: var(--space-6); }
    @media (min-width: 1040px) { .story { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; } }
    .stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: var(--color-border); border: 1px solid var(--color-border); }
    .stats div { padding: var(--space-5); background: var(--color-surface); }
    .stats dd { font-family: var(--font-display); font-size: var(--fs-3xl); font-weight: 800; line-height: 1; color: var(--color-accent-text); }
    .stats dt { margin-top: var(--space-2); color: var(--color-text-muted); font-size: var(--fs-sm); }
    .stats div { display: flex; flex-direction: column-reverse; }
    .values { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); margin: 0; padding: 0; list-style: none; }
    .values li { padding: var(--space-5); border-left: 3px solid var(--color-accent); background: var(--color-surface); --icon-size: 30px; }
    .values app-icon { color: var(--color-accent-text); margin-bottom: var(--space-3); }
    .values p { margin: 0; color: var(--color-text-muted); }
    .timeline { margin: 0; padding: 0; list-style: none; border-left: 2px solid var(--color-border-strong); }
    .timeline li { position: relative; padding: 0 0 var(--space-5) var(--space-5); }
    .timeline li::before { content: ''; position: absolute; left: -7px; top: 6px; width: 12px; height: 12px; border-radius: 50%; background: var(--color-accent); }
    .timeline strong { display: block; font-family: var(--font-display); font-size: var(--fs-xl); }
    .timeline span { color: var(--color-text-muted); }
  `,
})
export default class About {
  protected readonly config = SITE_CONFIG;
  protected readonly years = new Date().getFullYear() - SITE_CONFIG.foundedYear;
}
