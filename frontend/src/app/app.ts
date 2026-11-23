import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { Footer } from './layout/footer';
import { Header } from './layout/header';
import { Toasts } from './layout/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Toasts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main" (click)="focusMain($event)">Preskočiť na obsah</a>
    <app-header />
    <main id="main" #main tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
    <app-toasts />
  `,
  styles: `
    main { display: block; min-height: 60vh; outline: none; }
  `,
})
export class App {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private lastPath: string | null = null;

  constructor() {
    // Scroll to top & move focus only when the *path* changes – filter changes
    // in the query string keep the scroll position (catalog, shop).
    inject(Router)
      .events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const path = e.urlAfterRedirects.split(/[?#]/)[0];
        if (this.lastPath !== null && path !== this.lastPath) {
          window.scrollTo({ top: 0 });
          this.main().nativeElement.focus({ preventScroll: true });
        }
        this.lastPath = path;
      });
  }

  protected focusMain(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
