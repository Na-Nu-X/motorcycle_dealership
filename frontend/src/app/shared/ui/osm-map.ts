import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { SITE_CONFIG } from '../../../site.config';
import { safeStorage } from '../../core/services/storage';
import { Icon } from './icon';

/**
 * OpenStreetMap embed that is loaded only after explicit consent (GDPR):
 * no request to a third-party server is made before the visitor clicks.
 * The choice can be remembered in localStorage.
 */
@Component({
  selector: 'app-osm-map',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .map { position: relative; aspect-ratio: 4 / 3; min-height: 280px; border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; background:
      repeating-linear-gradient(45deg, var(--color-surface) 0 14px, var(--color-surface-2) 14px 28px); }
    iframe { width: 100%; height: 100%; border: 0; filter: grayscale(0.2) contrast(1.05); }
    .consent { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3);
      padding: var(--space-5); text-align: center; background: rgb(13 13 15 / 75%); }
    .consent p { max-width: 42ch; margin: 0; font-size: var(--fs-sm); color: var(--color-text-muted); }
    .consent app-icon { --icon-size: 40px; color: var(--color-accent-text); }
    .links { display: flex; flex-wrap: wrap; gap: var(--space-4); margin-top: var(--space-2); font-size: var(--fs-sm); }
  `,
  template: `
    <div class="map">
      @if (loaded()) {
        <iframe [src]="src()" [title]="'Mapa – ' + label()" loading="lazy" referrerpolicy="no-referrer"></iframe>
      } @else {
        <div class="consent">
          <app-icon name="pin" />
          <strong>{{ label() }}</strong>
          <p>Mapa sa načíta zo serverov OpenStreetMap. Kliknutím súhlasíte s prenosom vašej IP adresy na tieto servery.</p>
          <button type="button" class="btn btn--primary btn--sm" (click)="load()">Načítať mapu</button>
          <label class="check" style="font-size: var(--fs-xs)">
            <input type="checkbox" [checked]="remember()" (change)="remember.set(!remember())" />
            <span>Zapamätať si moju voľbu</span>
          </label>
        </div>
      }
    </div>
    <div class="links">
      <a [href]="osmLink()" target="_blank" rel="noopener">Otvoriť v OpenStreetMap</a>
      <a [href]="navLink()" target="_blank" rel="noopener">Navigovať</a>
      @if (loaded()) {
        <button type="button" class="btn btn--link" (click)="forget()">Zrušiť súhlas s mapou</button>
      }
    </div>
  `,
})
export class OsmMap {
  private readonly sanitizer = inject(DomSanitizer);
  readonly label = input('Naša predajňa');

  protected readonly remember = signal(false);
  protected readonly loaded = signal(safeStorage.get<boolean>(SITE_CONFIG.mapConsentStorageKey, false));

  private readonly cfg = SITE_CONFIG.map;
  protected readonly src = computed<SafeResourceUrl>(() => {
    const { lat, lon, span } = this.cfg;
    const bbox = [lon - span, lat - span / 2, lon + span, lat + span / 2].map((n) => n.toFixed(5)).join('%2C');
    // Static, trusted URL built from site config – safe to bypass.
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`,
    );
  });
  protected readonly osmLink = computed(
    () => `https://www.openstreetmap.org/?mlat=${this.cfg.lat}&mlon=${this.cfg.lon}#map=17/${this.cfg.lat}/${this.cfg.lon}`,
  );
  protected readonly navLink = computed(
    () => `https://www.openstreetmap.org/directions?route=%3B${this.cfg.lat}%2C${this.cfg.lon}`,
  );

  protected load(): void {
    this.loaded.set(true);
    if (this.remember()) {
      safeStorage.set(SITE_CONFIG.mapConsentStorageKey, true);
    }
  }

  protected forget(): void {
    safeStorage.remove(SITE_CONFIG.mapConsentStorageKey);
    this.loaded.set(false);
  }
}
