import { TestBed } from '@angular/core/testing';

import { SITE_CONFIG } from '../../../site.config';
import { Accessory, MotorcycleListItem } from '../api/models';
import { CartService } from './cart.service';

const helmet = {
  id: 1, slug: 'prilba', name: 'Prilba', brand: 'Shoei', price: '100.00', stock: 3, sizes: ['M', 'L'], colors: [], image: null,
} as unknown as Accessory;
const bike = (slug: string) =>
  ({ slug, brand: 'KTM', model: slug, year: 2025, price: '6290.00', image: null }) as unknown as MotorcycleListItem;

describe('CartService', () => {
  let cart: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartService);
  });

  it('adds lines, merges variants and computes totals', () => {
    expect(cart.addAccessory(helmet, { size: 'M' })).toBe('added');
    expect(cart.addAccessory(helmet, { size: 'M' })).toBe('updated');
    expect(cart.addAccessory(helmet, { size: 'L' })).toBe('added');
    expect(cart.lines().length).toBe(2);
    expect(cart.itemCount()).toBe(3);
    expect(cart.subtotal()).toBe(300);
  });

  it('respects stock across variants', () => {
    cart.addAccessory(helmet, { size: 'M', quantity: 2 });
    expect(cart.addAccessory(helmet, { size: 'L', quantity: 2 })).toBe('limit');
    const key = cart.lines()[0].key;
    cart.setQuantity(key, 99);
    expect(cart.lines()[0].quantity).toBe(3);
    cart.setQuantity(key, 0);
    expect(cart.isEmpty()).toBe(true);
  });

  it('handles motorcycle reservations with a limit', () => {
    for (const s of ['a', 'b', 'c']) expect(cart.addMotorcycle(bike(s))).toBe('added');
    expect(cart.addMotorcycle(bike('a'))).toBe('updated');
    expect(cart.addMotorcycle(bike('d'))).toBe('limit');
    expect(cart.itemCount()).toBe(3);
    expect(cart.subtotal()).toBe(0);
    cart.removeMotorcycle('a');
    expect(cart.hasMotorcycle('a')).toBe(false);
  });

  it('persists to localStorage', () => {
    cart.addAccessory(helmet, { size: 'M' });
    TestBed.tick();
    const stored = JSON.parse(localStorage.getItem(SITE_CONFIG.cartStorageKey) ?? '{}');
    expect(stored.lines[0].name).toBe('Prilba');
  });

  it('survives corrupted storage', () => {
    localStorage.setItem(SITE_CONFIG.cartStorageKey, '{not json');
    TestBed.resetTestingModule();
    expect(TestBed.inject(CartService).isEmpty()).toBe(true);
  });
});
