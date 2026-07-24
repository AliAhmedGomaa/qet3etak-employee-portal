import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  InvoicesApiService,
  ShopInvoice,
} from '../../core/invoices/invoices-api.service';

@Component({
  selector: 'app-invoice-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(InvoicesApiService);

  protected readonly invoice = signal<ShopInvoice | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.get(id).subscribe({
      next: (inv) => this.invoice.set(inv),
      error: () => this.error.set('تعذر تحميل الفاتورة'),
    });
  }

  protected statusLabel(status: string): string {
    const map: Record<string, string> = {
      ISSUED: 'صادرة',
      PAID: 'مدفوعة',
      VOID: 'ملغاة',
    };
    return map[status] ?? status;
  }

  protected paymentLabel(method: string): string {
    return method === 'CREDIT' ? 'دفع بالآجل' : 'دفع عند الاستلام';
  }

  protected print(): void {
    window.print();
  }
}
