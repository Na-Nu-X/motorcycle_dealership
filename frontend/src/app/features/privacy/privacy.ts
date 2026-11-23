import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SITE_CONFIG } from '../../../site.config';

@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `.prose { max-width: 75ch; padding-block: var(--space-6); } .prose h2 { margin-top: var(--space-6); font-size: var(--fs-xl); } .prose p, .prose li { color: var(--color-text-muted); }`,
  template: `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">GDPR</span>
        <h1>Ochrana osobných údajov</h1>
      </div>
    </section>
    <div class="container prose">
      <p>Prevádzkovateľom osobných údajov je {{ c.legalName }}, {{ c.contact.street }}, {{ c.contact.postalCode }} {{ c.contact.city }}, {{ c.companyId }}.
        Kontakt: <a [href]="'mailto:' + c.contact.email">{{ c.contact.email }}</a>.</p>
      <h2>Aké údaje spracúvame</h2>
      <p>Meno, priezvisko, e-mail, telefón, prípadne doručovaciu adresu a údaje o vašom motocykli – výlučne v rozsahu, ktorý vyplníte vo formulári.</p>
      <h2>Účel a právny základ</h2>
      <ul>
        <li>vybavenie objednávky a rezervácie motocykla – plnenie zmluvy (čl. 6 ods. 1 písm. b GDPR),</li>
        <li>rezervácia servisu a testovacej jazdy – predzmluvné vzťahy (čl. 6 ods. 1 písm. b GDPR),</li>
        <li>odpoveď na dopyt a kontaktnú správu – váš súhlas (čl. 6 ods. 1 písm. a GDPR).</li>
      </ul>
      <h2>Doba uchovávania</h2>
      <p>Údaje z dopytov uchovávame najviac 2 roky, údaje z objednávok po dobu stanovenú účtovnými a daňovými predpismi.</p>
      <h2>Cookies a tretie strany</h2>
      <p>Web nepoužíva analytické ani marketingové cookies. Košík sa ukladá iba vo vašom prehliadači (localStorage).
        Mapa OpenStreetMap sa načíta až po vašom kliknutí – dovtedy sa na servery tretích strán neodosielajú žiadne údaje.
        Písma sú hosťované priamo na našom serveri.</p>
      <h2>Vaše práva</h2>
      <p>Máte právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania, prenosnosť, odvolanie súhlasu a podanie sťažnosti na Úrad na ochranu osobných údajov SR.</p>
    </div>
  `,
})
export default class Privacy {
  protected readonly c = SITE_CONFIG;
}
