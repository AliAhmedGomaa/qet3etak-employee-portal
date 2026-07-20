import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersApiService, ShopOrder } from '../../core/orders/orders-api.service';
import { OrderStepper } from './order-stepper';

@Component({
  selector: 'app-order-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink, OrderStepper],
  template: `
    <section class="detail safe-area-page" dir="rtl">
      <a routerLink="/orders">← الطلبات</a>
      @if (order(); as o) {
        <h1>{{ o.orderNumber }}</h1>
        <app-order-stepper [status]="o.status" />
        <p class="meta">
          {{ o.paymentMethod === 'CREDIT' ? 'دفع بالآجل' : 'دفع عند الاستلام' }}
          · {{ o.createdAt | date: 'medium' }}
        </p>
        <ul>
          @for (item of o.items; track $index) {
            <li>
              <span>{{ item.title }} × {{ item.quantity }}</span>
              <strong>{{ item.lineTotal | currency: 'EGP':'symbol-narrow':'1.2-2' }}</strong>
            </li>
          }
        </ul>
        <div class="total">
          <span>الإجمالي</span>
          <strong>{{ o.total | currency: 'EGP':'symbol-narrow':'1.2-2' }}</strong>
        </div>
        <h2>الخط الزمني</h2>
        <ol class="timeline">
          @for (ev of o.statusHistory; track $index) {
            <li>
              <strong>{{ statusLabel(ev.status) }}</strong>
              <span>{{ ev.at | date: 'short' }} · {{ ev.note }}</span>
            </li>
          }
        </ol>
      } @else {
        <p>جارٍ التحميل…</p>
      }
    </section>
  `,
  styles: `
    .detail {
      --page-pad-bottom: 2rem;
      max-width: 28rem;
      margin: 0 auto;
    }
    a { color: #0d9a6a; font-weight: 700; text-decoration: none; }
    h1 { margin: 0.75rem 0; font-size: 1.25rem; }
    .meta { color: #64748b; font-size: 0.85rem; }
    ul { list-style: none; padding: 0; margin: 1rem 0; display: grid; gap: 0.5rem; }
    li { display: flex; justify-content: space-between; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem; }
    .total { display: flex; justify-content: space-between; font-size: 1.05rem; margin: 0.75rem 0 1.25rem; }
    h2 { font-size: 0.95rem; }
    .timeline { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.55rem; }
    .timeline li { border-inline-start: 3px solid #10b880; padding-inline-start: 0.75rem; }
    .timeline span { display: block; color: #94a3b8; font-size: 0.75rem; margin-top: 0.15rem; }
    @media (min-width: 900px) {
      .detail { max-width: 44rem; }
      h1 { font-size: 1.75rem; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(OrdersApiService);
  protected readonly order = signal<ShopOrder | null>(null);

  protected statusLabel(status: string): string {
    const map: Record<string, string> = {
      RECEIVED: 'مستلم',
      PREPARING: 'قيد التجهيز',
      SHIPPED: 'تم الشحن',
      DELIVERED: 'تم التسليم',
    };
    return map[status] ?? status;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.myOrder(id).subscribe({ next: (o) => this.order.set(o) });
  }
}
