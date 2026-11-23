import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .nf { padding-block: var(--space-9); text-align: center; }
    .nf__code { font-family: var(--font-display); font-size: clamp(6rem, 4rem + 10vw, 12rem); font-weight: 800; line-height: 0.9; color: var(--color-accent-text); }
    .nf .lead { margin-inline: auto; }
  `,
  template: `
    <div class="container nf">
      <p class="nf__code" aria-hidden="true">404</p>
      <h1>Tu cesta končí</h1>
      <p class="lead">Stránka, ktorú hľadáte, neexistuje alebo bola presunutá.</p>
      <div class="form-actions" style="justify-content: center">
        <a routerLink="/" class="btn btn--primary">Domov</a>
        <a routerLink="/motocykle" class="btn btn--ghost">Ponuka motocyklov</a>
      </div>
    </div>
  `,
})
export default class NotFound {}
