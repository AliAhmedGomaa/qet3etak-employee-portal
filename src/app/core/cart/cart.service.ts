import { Injectable, computed, signal } from '@angular/core';
import { CatalogProduct, resolveUnitPrice } from '../catalog/catalog.models';

export type CartLine = {
  productId: string;
  title: string;
  imageUrl: string;
  basePrice: number;
  tieredPricing: CatalogProduct['tieredPricing'];
  stockQuantity: number;
  quantity: number;
};

const CART_KEY = 'qet3etak.shop.cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly linesSignal = signal<CartLine[]>(this.read());

  readonly lines = this.linesSignal.asReadonly();
  readonly itemCount = computed(() =>
    this.linesSignal().reduce((n, l) => n + l.quantity, 0),
  );
  readonly subtotal = computed(() =>
    Number(
      this.linesSignal()
        .reduce((sum, l) => {
          const p = resolveUnitPrice(l.quantity, l.basePrice, l.tieredPricing);
          return sum + p.lineTotal;
        }, 0)
        .toFixed(2),
    ),
  );

  setQuantity(product: CatalogProduct, quantity: number): void {
    const qty = Math.max(0, Math.min(product.stockQuantity, Math.floor(quantity)));
    this.linesSignal.update((lines) => {
      const rest = lines.filter((l) => l.productId !== product.id);
      if (qty <= 0) return this.persist(rest);
      return this.persist([
        ...rest,
        {
          productId: product.id,
          title: product.title,
          imageUrl: product.imageUrl,
          basePrice: product.basePrice,
          tieredPricing: product.tieredPricing ?? [],
          stockQuantity: product.stockQuantity,
          quantity: qty,
        },
      ]);
    });
  }

  updateQty(productId: string, quantity: number): void {
    this.linesSignal.update((lines) =>
      this.persist(
        lines
          .map((l) => {
            if (l.productId !== productId) return l;
            const qty = Math.max(0, Math.min(l.stockQuantity, Math.floor(quantity)));
            return { ...l, quantity: qty };
          })
          .filter((l) => l.quantity > 0),
      ),
    );
  }

  remove(productId: string): void {
    this.linesSignal.update((lines) =>
      this.persist(lines.filter((l) => l.productId !== productId)),
    );
  }

  clear(): void {
    this.linesSignal.set(this.persist([]));
  }

  quantityFor(productId: string): number {
    return this.linesSignal().find((l) => l.productId === productId)?.quantity ?? 0;
  }

  checkoutPayload() {
    return this.linesSignal().map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));
  }

  private persist(lines: CartLine[]): CartLine[] {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
    return lines;
  }

  private read(): CartLine[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  }
}
