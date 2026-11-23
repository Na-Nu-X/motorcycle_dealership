import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_CONFIG } from '../../../site.config';
import { apiUrl } from '../../core/api/api.service';
import { Facets, MotorcycleListItem, Paginated } from '../../core/api/models';
import { PluralPipe } from '../../shared/pipes/plural.pipe';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { BikeCard } from '../../shared/ui/bike-card';
import { CardSkeleton } from '../../shared/ui/card-skeleton';
import { Icon } from '../../shared/ui/icon';

const CATEGORY_TAGLINES: Record<string, string> = {
  adventure: 'Asfalt, šotol aj diaľnice',
  cruiser: 'Pohoda a krútiaci moment',
  sport: 'Okruhová DNA',
  naked: 'Čistá radosť z jazdy',
  scooter: 'Mesto bez kompromisov',
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, BikeCard, CardSkeleton, Icon, PluralPipe, PricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export default class Home {
  protected readonly config = SITE_CONFIG;
  protected readonly taglines = CATEGORY_TAGLINES;
  protected readonly yearsInBusiness = new Date().getFullYear() - SITE_CONFIG.foundedYear;

  protected readonly featured = httpResource<Paginated<MotorcycleListItem>>(() => ({
    url: apiUrl('motorcycles/'),
    params: { featured: 'true', page_size: 6 },
  }));
  protected readonly newArrivals = httpResource<Paginated<MotorcycleListItem>>(() => ({
    url: apiUrl('motorcycles/'),
    params: { new_arrival: 'true', page_size: 3, ordering: '-created_at' },
  }));
  protected readonly facets = httpResource<Facets>(() => apiUrl('motorcycles/facets/'));

  protected readonly heroBike = computed(() =>
    this.featured.hasValue() ? (this.featured.value().results.find((b) => b.image) ?? null) : null,
  );
  protected readonly totalBikes = computed(() =>
    this.facets.hasValue() ? this.facets.value().conditions.new + this.facets.value().conditions.used : null,
  );
}
