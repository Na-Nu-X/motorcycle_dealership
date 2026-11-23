import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { SITE_CONFIG } from '../../../site.config';

/** Sets "<Page> | MotoVault" titles from the `title` property of routes. */
@Injectable({ providedIn: 'root' })
export class SiteTitleStrategy extends TitleStrategy {
  private readonly seo = inject(SeoService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.seo.setTitle(this.buildTitle(snapshot));
  }
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  setTitle(pageTitle?: string | null): void {
    this.title.setTitle(pageTitle ? `${pageTitle} | ${SITE_CONFIG.name}` : `${SITE_CONFIG.name} – ${SITE_CONFIG.tagline}`);
  }

  setDescription(description: string = SITE_CONFIG.description): void {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
  }

  setPage(pageTitle: string, description?: string, image?: string | null): void {
    this.setTitle(pageTitle);
    this.setDescription(description);
    this.meta.updateTag({ property: 'og:title', content: `${pageTitle} | ${SITE_CONFIG.name}` });
    if (image) {
      this.meta.updateTag({ property: 'og:image', content: image });
    }
    this.document.documentElement.lang = 'sk';
  }
}
