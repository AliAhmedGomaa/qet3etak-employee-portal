import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../core/cart/cart.service';
import { CatalogService } from '../../core/catalog/catalog.service';
import {
  CatalogProduct,
  resolveUnitPrice,
} from '../../core/catalog/catalog.models';
import { resolveMediaUrl } from '../../core/media/media-url';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogApi = inject(CatalogService);
  protected readonly cart = inject(CartService);
  protected readonly resolveMediaUrl = resolveMediaUrl;

  protected readonly product = signal<CatalogProduct | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly qty = signal(1);
  protected readonly added = signal(false);

  private readonly gradeLabels: Record<string, string> = {
    Original: 'أصلي',
    HighCopy: 'هاي كوبي',
    Copy: 'كوبي',
    Used: 'مستعمل',
  };

  protected readonly gradeLabel = computed(() => {
    const p = this.product();
    if (!p) return '';
    return this.gradeLabels[p.qualityGrade] ?? p.qualityGrade;
  });

  protected readonly stockLabelAr = computed(() => {
    const stock = this.product()?.stockQuantity ?? 0;
    if (stock <= 0) return 'غير متوفر';
    if (stock <= 5) return `متبقي ${stock} فقط`;
    return `متوفر · ${stock} قطعة`;
  });

  protected readonly stockClass = computed(() => {
    const stock = this.product()?.stockQuantity ?? 0;
    if (stock <= 0) return 'stock stock--out';
    if (stock <= 5) return 'stock stock--low';
    return 'stock stock--ok';
  });

  protected readonly pricing = computed(() => {
    const p = this.product();
    if (!p) return resolveUnitPrice(0, 0, []);
    return resolveUnitPrice(this.qty(), p.basePrice, p.tieredPricing ?? []);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.error.set('المنتج غير موجود');
      return;
    }
    this.catalogApi.product(id).subscribe({
      next: (p) => {
        this.product.set(p);
        const inCart = this.cart.quantityFor(p.id);
        this.qty.set(
          p.stockQuantity <= 0 ? 1 : Math.max(1, Math.min(inCart || 1, p.stockQuantity)),
        );
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('تعذر تحميل المنتج');
      },
    });
  }

  protected inc(): void {
    const max = this.product()?.stockQuantity ?? 0;
    if (max <= 0) return;
    this.qty.update((q) => Math.min(max, q + 1));
    this.added.set(false);
  }

  protected dec(): void {
    this.qty.update((q) => Math.max(1, q - 1));
    this.added.set(false);
  }

  protected addToCart(): void {
    const p = this.product();
    if (!p || p.stockQuantity <= 0) return;
    this.cart.setQuantity(p, this.qty());
    this.added.set(true);
  }
}
