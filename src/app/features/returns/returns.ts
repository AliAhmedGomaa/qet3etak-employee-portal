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
  ReturnRequest,
  ReturnsApi,
} from '../../core/returns/returns-api.service';

@Component({
  selector: 'app-returns',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './returns.html',
  styleUrl: './returns.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReturnsPage implements OnInit {
  private readonly api = inject(ReturnsApi);

  protected readonly requests = signal<ReturnRequest[]>([]);
  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly total = signal(0);

  protected statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'قيد المراجعة',
      APPROVED: 'مقبول',
      REJECTED: 'مرفوض',
    };
    return map[status] ?? status;
  }

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.api.list({ page: this.page(), limit: 20 }).subscribe({
      next: (res) => {
        this.requests.set(res.items);
        this.page.set(res.page);
        this.totalPages.set(res.totalPages);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
}
