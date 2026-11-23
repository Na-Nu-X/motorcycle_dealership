import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { SITE_CONFIG } from '../../site.config';
import { CartService } from '../core/services/cart.service';
import { PluralPipe } from '../shared/pipes/plural.pipe';
import { Icon } from '../shared/ui/icon';
import { Logo } from './logo';

export const NAV_LINKS = [
  { label: 'Motocykle', url: '/motocykle' },
  { label: 'Príslušenstvo', url: '/prislusenstvo' },
  { label: 'Servis', url: '/servis' },
  { label: 'Testovacia jazda', url: '/testovacia-jazda' },
  { label: 'O nás', url: '/o-nas' },
  { label: 'Kontakt', url: '/kontakt' },
] as const;

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icon, Logo, PluralPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'menuOpen.set(false)' },
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly cart = inject(CartService);
  protected readonly links = NAV_LINKS;
  protected readonly config = SITE_CONFIG;
  protected readonly menuOpen = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }
}
