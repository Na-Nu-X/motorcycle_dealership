import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../site.config';
import { Icon } from '../shared/ui/icon';
import { NAV_LINKS } from './header';
import { Logo } from './logo';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Icon, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly config = SITE_CONFIG;
  protected readonly links = NAV_LINKS;
  protected readonly year = new Date().getFullYear();
}
