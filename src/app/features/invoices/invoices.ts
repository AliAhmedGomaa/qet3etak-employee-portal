import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  InvoicesApiService,
  ShopInvoice,
} from '../../core/invoices/invoices-api.service';

@Component({
  selector: 'app-invoices',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './invoices.html',
  styleUrl: './invoices.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesPage implements OnInit {
  private readonly api = inject(InvoicesApiService);
  protected readonly invoices = signal<ShopInvoice[]>([]);
  protected readonly loading = signal(true);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly searchQuery = signal('');
  protected searchDraft = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api
      .list({
        page: this.page(),
        limit: 20,
        q: this.searchQuery() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.invoices.set(res.items);
          this.page.set(res.page);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected onSearchInput(value: string): void {
    this.searchDraft = value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      const next = value.trim();
      if (next === this.searchQuery()) return;
      this.searchQuery.set(next);
      this.page.set(1);
      this.load();
    }, 320);
  }

  protected statusLabel(status: string): string {
    const map: Record<string, string> = {
      ISSUED: 'صادرة',
      PAID: 'مدفوعة',
      VOID: 'ملغاة',
    };
    return map[status] ?? status;
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
}
