import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Prémiové motocykle, servis a výbava',
    loadComponent: () => import('./features/home/home'),
  },
  {
    path: 'motocykle',
    title: 'Katalóg motocyklov',
    loadComponent: () => import('./features/catalog/catalog'),
  },
  {
    path: 'motocykle/:slug',
    title: 'Detail motocykla',
    loadComponent: () => import('./features/vehicle-detail/vehicle-detail'),
  },
  {
    path: 'prislusenstvo',
    title: 'Príslušenstvo a oblečenie',
    loadComponent: () => import('./features/shop/shop'),
  },
  {
    path: 'prislusenstvo/:slug',
    title: 'Detail produktu',
    loadComponent: () => import('./features/shop/accessory-detail'),
  },
  {
    path: 'kosik',
    title: 'Košík',
    loadComponent: () => import('./features/cart/cart'),
  },
  {
    path: 'servis',
    title: 'Servis a údržba',
    loadComponent: () => import('./features/service/service'),
  },
  {
    path: 'testovacia-jazda',
    title: 'Rezervácia testovacej jazdy',
    loadComponent: () => import('./features/test-ride/test-ride'),
  },
  {
    path: 'o-nas',
    title: 'O nás',
    loadComponent: () => import('./features/about/about'),
  },
  {
    path: 'kontakt',
    title: 'Kontakt',
    loadComponent: () => import('./features/contact/contact'),
  },
  {
    path: 'ochrana-osobnych-udajov',
    title: 'Ochrana osobných údajov',
    loadComponent: () => import('./features/privacy/privacy'),
  },
  {
    path: '**',
    title: 'Stránka nenájdená',
    loadComponent: () => import('./features/not-found/not-found'),
  },
];
