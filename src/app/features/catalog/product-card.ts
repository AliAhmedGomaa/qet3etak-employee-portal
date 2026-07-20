import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CatalogProduct, resolveUnitPrice } from '../../core/catalog/catalog.models';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<CatalogProduct>();
  /** Hydrate from cart when browsing (0 = show 1 for preview pricing). */
  readonly initialQuantity = input(0);
  readonly quantityChange = output<{
    productId: string;
    quantity: number;
    lineTotal: number;
  }>();

  protected readonly qty = signal(1);
  protected readonly matrixOpen = signal(false);

  constructor() {
    effect(() => {
      const fromCart = this.initialQuantity();
      const stock = this.product().stockQuantity;
      if (stock <= 0) {
        this.qty.set(1);
        return;
      }
      this.qty.set(fromCart > 0 ? Math.min(fromCart, stock) : 1);
    });
  }

  protected readonly pricing = computed(() => {
    const p = this.product();
    return resolveUnitPrice(this.qty(), p.basePrice, p.tieredPricing ?? []);
  });

  protected readonly stockClass = computed(() => {
    const stock = this.product().stockQuantity;
    if (stock <= 0) return 'stock stock--out';
    if (stock <= 5) return 'stock stock--low';
    return 'stock stock--ok';
  });

  protected readonly gradeLabel = computed(() => {
    const labels: Record<string, string> = {
      Original: 'أصلي',
      HighCopy: 'هاي كوبي',
      Copy: 'كوبي',
      Used: 'مستعمل',
    };
    return labels[this.product().qualityGrade] ?? this.product().qualityGrade;
  });

  protected readonly stockLabelAr = computed(() => {
    const stock = this.product().stockQuantity;
    if (stock <= 0) return 'غير متوفر';
    if (stock <= 5) return `متبقي ${stock} فقط`;
    return 'متوفر';
  });

  protected readonly gradeClass = computed(() => {
    const g = this.product().qualityGrade;
    if (g === 'Original') return 'grade grade--original';
    if (g === 'HighCopy') return 'grade grade--copy';
    if (g === 'Used') return 'grade grade--used';
    return 'grade grade--generic';
  });

  protected inc(): void {
    const max = this.product().stockQuantity;
    if (max <= 0) return;
    this.qty.update((q) => Math.min(max, q + 1));
    this.emitQty();
  }

  protected dec(): void {
    this.qty.update((q) => Math.max(1, q - 1));
    this.emitQty();
  }

  protected toggleMatrix(): void {
    this.matrixOpen.update((v) => !v);
  }

  private emitQty(): void {
    this.quantityChange.emit({
      productId: this.product().id,
      quantity: this.qty(),
      lineTotal: this.pricing().lineTotal,
    });
  }
}
