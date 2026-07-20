import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { CatalogService } from '../../core/catalog/catalog.service';
import { CatalogFacets, CatalogProduct } from '../../core/catalog/catalog.models';
import { ProductCard } from './product-card';

type FilterKey = 'brand' | 'model' | 'category' | 'qualityGrade';

@Component({
  selector: 'app-catalog',
  imports: [FormsModule, RouterLink, ProductCard],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalog implements OnInit {
  private readonly catalogApi = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);

  protected readonly products = signal<CatalogProduct[]>([]);
  protected readonly facets = signal<CatalogFacets>({
    brand: [],
    model: [],
    category: [],
    qualityGrade: [],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);

  protected readonly selected: Record<FilterKey, string[]> = {
    brand: [],
    model: [],
    category: [],
    qualityGrade: [],
  };

  protected search = '';

  private readonly gradeLabels: Record<string, string> = {
    Original: 'أصلي',
    HighCopy: 'هاي كوبي',
    Copy: 'كوبي',
    Used: 'مستعمل',
  };

  protected readonly filterRows: Array<{
    key: FilterKey;
    label: string;
  }> = [
    { key: 'brand', label: 'الماركة' },
    { key: 'model', label: 'الموديل' },
    { key: 'category', label: 'الفئة' },
    { key: 'qualityGrade', label: 'الجودة' },
  ];

  protected facetValues(key: FilterKey): string[] {
    return this.facets()[key] ?? [];
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const brand = q.get('brand');
    const category = q.get('category');
    if (brand) this.selected.brand = [brand];
    if (category) this.selected.category = [category];
    this.reload();
  }

  protected labelFor(key: FilterKey, value: string): string {
    if (key === 'qualityGrade') return this.gradeLabels[value] ?? value;
    return value;
  }

  protected isSelected(key: FilterKey, value: string): boolean {
    return this.selected[key].includes(value);
  }

  protected toggle(key: FilterKey, value: string): void {
    const list = this.selected[key];
    const idx = list.indexOf(value);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(value);
    this.page.set(1);
    this.reload();
  }

  protected clearFilters(): void {
    this.selected.brand = [];
    this.selected.model = [];
    this.selected.category = [];
    this.selected.qualityGrade = [];
    this.search = '';
    this.page.set(1);
    this.reload();
  }

  protected onSearchSubmit(event: Event): void {
    event.preventDefault();
    this.page.set(1);
    this.reload();
  }

  protected goPage(delta: number): void {
    const next = Math.min(
      this.totalPages(),
      Math.max(1, this.page() + delta),
    );
    if (next === this.page()) return;
    this.page.set(next);
    this.reload();
  }

  protected cartQty(productId: string): number {
    return this.cart.quantityFor(productId);
  }

  protected reload(): void {
    this.loading.set(true);
    this.error.set(null);
    const filters = {
      q: this.search.trim() || undefined,
      brand: this.selected.brand,
      model: this.selected.model,
      category: this.selected.category,
      qualityGrade: this.selected.qualityGrade,
      page: this.page(),
      limit: 24,
    };

    this.catalogApi.facets(filters).subscribe({
      next: (f) => this.facets.set(f),
    });

    this.catalogApi.search(filters).subscribe({
      next: (res) => {
        this.products.set(res.items);
        this.total.set(res.total);
        this.page.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('تعذر تحميل الكتالوج');
      },
    });
  }

  protected onQtyChange(
    product: CatalogProduct,
    event: { productId: string; quantity: number },
  ): void {
    this.cart.setQuantity(product, event.quantity);
  }
}
