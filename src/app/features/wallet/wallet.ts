import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersApiService, WalletView } from '../../core/orders/orders-api.service';

@Component({
  selector: 'app-wallet',
  imports: [CurrencyPipe, DatePipe, PercentPipe, RouterLink],
  templateUrl: './wallet.html',
  styleUrl: './wallet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletPage implements OnInit {
  private readonly api = inject(OrdersApiService);

  protected readonly wallet = signal<WalletView | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.wallet({ page: this.page(), limit: 20 }).subscribe({
      next: (w) => {
        this.wallet.set(w);
        this.page.set(w.transactionsMeta?.page ?? 1);
        this.totalPages.set(w.transactionsMeta?.totalPages ?? 1);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('تعذر تحميل المحفظة');
      },
    });
  }

  protected goPage(delta: number): void {
    const next = Math.min(
      this.totalPages(),
      Math.max(1, this.page() + delta),
    );
    if (next === this.page()) return;
    this.page.set(next);
    this.load();
  }

  protected txLabel(type: string): string {
    switch (type) {
      case 'CREDIT_PURCHASE':
        return 'شراء بالآجل';
      case 'PAYMENT':
        return 'سداد نقدي';
      case 'CREDIT_LIMIT_CHANGE':
        return 'تعديل الحد الائتماني';
      default:
        return type;
    }
  }
}
