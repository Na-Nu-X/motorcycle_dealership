import { Injectable, computed, effect, signal } from '@angular/core';

import { SITE_CONFIG } from '../../../site.config';
import { Accessory, MotorcycleListItem } from '../api/models';
import { toNumber } from '../utils/format';
import { safeStorage } from './storage';

export interface CartLine {
  /** unique key: accessory id + variant */
  readonly key: string;
  readonly accessoryId: number;
  readonly slug: string;
  readonly name: string;
  readonly brand: string;
  readonly image: string | null;
  readonly unitPrice: number;
  readonly size: string;
  readonly color: string;
  readonly quantity: number;
  readonly maxQuantity: number;
}

export interface CartMotorcycle {
  readonly slug: string;
  readonly title: string;
  readonly year: number;
  readonly price: number;
  readonly image: string | null;
}

interface CartState {
  readonly lines: CartLine[];
  readonly motorcycles: CartMotorcycle[];
}

const EMPTY: CartState = { lines: [], motorcycles: [] };

export type AddResult = 'added' | 'updated' | 'limit';

/** Persistent cart for gear/accessories and motorcycle reservation requests. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly state = signal<CartState>(this.restore());

  readonly lines = computed(() => this.state().lines);
  readonly motorcycles = computed(() => this.state().motorcycles);
  readonly itemCount = computed(
    () => this.lines().reduce((sum, line) => sum + line.quantity, 0) + this.motorcycles().length,
  );
  readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => Math.round((sum + line.unitPrice * line.quantity) * 100) / 100, 0),
  );
  readonly isEmpty = computed(() => this.itemCount() === 0);

  constructor() {
    effect(() => safeStorage.set(SITE_CONFIG.cartStorageKey, this.state()));
  }

  static lineKey(accessoryId: number, size: string, color: string): string {
    return `${accessoryId}|${size}|${color}`;
  }

  addAccessory(accessory: Accessory, options: { size?: string; color?: string; quantity?: number } = {}): AddResult {
    const size = options.size ?? '';
    const color = options.color ?? '';
    const quantity = Math.max(1, options.quantity ?? 1);
    const maxQuantity = Math.min(accessory.stock, SITE_CONFIG.maxQuantityPerItem);
    const key = CartService.lineKey(accessory.id, size, color);
    const existing = this.lines().find((line) => line.key === key);
    const inCartForProduct = this.lines()
      .filter((line) => line.accessoryId === accessory.id)
      .reduce((sum, line) => sum + line.quantity, 0);

    if (maxQuantity <= 0 || inCartForProduct + quantity > maxQuantity) {
      return 'limit';
    }
    if (existing) {
      this.setQuantity(key, existing.quantity + quantity);
      return 'updated';
    }
    const line: CartLine = {
      key,
      accessoryId: accessory.id,
      slug: accessory.slug,
      name: accessory.name,
      brand: accessory.brand,
      image: accessory.image,
      unitPrice: toNumber(accessory.price) ?? 0,
      size,
      color,
      quantity,
      maxQuantity,
    };
    this.state.update((s) => ({ ...s, lines: [...s.lines, line] }));
    return 'added';
  }

  setQuantity(key: string, quantity: number): void {
    this.state.update((s) => ({
      ...s,
      lines: s.lines
        .map((line) =>
          line.key === key ? { ...line, quantity: Math.min(Math.max(0, Math.floor(quantity)), line.maxQuantity) } : line,
        )
        .filter((line) => line.quantity > 0),
    }));
  }

  removeLine(key: string): void {
    this.state.update((s) => ({ ...s, lines: s.lines.filter((line) => line.key !== key) }));
  }

  hasMotorcycle(slug: string): boolean {
    return this.motorcycles().some((m) => m.slug === slug);
  }

  canReserveMore(): boolean {
    return this.motorcycles().length < SITE_CONFIG.maxReservedMotorcycles;
  }

  addMotorcycle(bike: MotorcycleListItem): AddResult {
    if (this.hasMotorcycle(bike.slug)) {
      return 'updated';
    }
    if (!this.canReserveMore()) {
      return 'limit';
    }
    const item: CartMotorcycle = {
      slug: bike.slug,
      title: `${bike.brand} ${bike.model}`,
      year: bike.year,
      price: toNumber(bike.price) ?? 0,
      image: bike.image,
    };
    this.state.update((s) => ({ ...s, motorcycles: [...s.motorcycles, item] }));
    return 'added';
  }

  removeMotorcycle(slug: string): void {
    this.state.update((s) => ({ ...s, motorcycles: s.motorcycles.filter((m) => m.slug !== slug) }));
  }

  clear(): void {
    this.state.set(EMPTY);
  }

  private restore(): CartState {
    const stored = safeStorage.get<Partial<CartState>>(SITE_CONFIG.cartStorageKey, EMPTY);
    return {
      lines: Array.isArray(stored.lines) ? stored.lines.filter((l) => l && typeof l.key === 'string') : [],
      motorcycles: Array.isArray(stored.motorcycles) ? stored.motorcycles.filter((m) => m && !!m.slug) : [],
    };
  }
}
