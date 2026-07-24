import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  OrdersApiService,
  ShopOrder,
} from '../../core/orders/orders-api.service';
import { ReturnsApi } from '../../core/returns/returns-api.service';

interface ReturnLineDraft {
  productId: string;
  title: string;
  maxQty: number;
  unitPrice: number;
  selected: boolean;
  quantity: number;
}

@Component({
  selector: 'app-return-create',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './return-create.html',
  styleUrl: './return-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReturnCreatePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly returnsApi = inject(ReturnsApi);

  protected readonly order = signal<ShopOrder | null>(null);
  protected readonly lines = signal<ReturnLineDraft[]>([]);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected reason = '';

  protected readonly estimatedRefund = computed(() =>
    this.lines()
      .filter((l) => l.selected && l.quantity > 0)
      .reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  );

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (!orderId) {
      this.error.set('معرّف الطلب غير موجود');
      return;
    }
    this.ordersApi.myOrder(orderId).subscribe({
      next: (o) => {
        this.order.set(o);
        if (o.status !== 'DELIVERED') {
          this.error.set('يمكن طلب الإرجاع فقط للطلبات المسلّمة');
          return;
        }
        this.lines.set(
          o.items.map((item) => ({
            productId: item.productId,
            title: item.title,
            maxQty: item.quantity,
            unitPrice: item.unitPrice,
            selected: true,
            quantity: item.quantity,
          })),
        );
      },
      error: () => this.error.set('تعذر تحميل الطلب'),
    });
  }

  protected toggleLine(index: number, checked: boolean): void {
    this.lines.update((rows) =>
      rows.map((row, i) =>
        i === index ? { ...row, selected: checked } : row,
      ),
    );
  }

  protected setQty(index: number, raw: string | number): void {
    const qty = Math.max(1, Math.floor(Number(raw)) || 1);
    this.lines.update((rows) =>
      rows.map((row, i) =>
        i === index
          ? { ...row, quantity: Math.min(row.maxQty, qty) }
          : row,
      ),
    );
  }

  protected submit(): void {
    const o = this.order();
    if (!o) return;
    if (this.reason.trim().length < 3) {
      this.error.set('اكتب سبب الإرجاع (٣ أحرف على الأقل)');
      return;
    }
    const items = this.lines()
      .filter((l) => l.selected && l.quantity > 0)
      .map((l) => ({ productId: l.productId, quantity: l.quantity }));
    if (items.length === 0) {
      this.error.set('اختر صنفاً واحداً على الأقل للإرجاع');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.returnsApi
      .create({
        orderId: o.id,
        items,
        reason: this.reason.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          void this.router.navigateByUrl('/returns');
        },
        error: (err: { error?: { message?: string | string[] } }) => {
          this.submitting.set(false);
          const msg = err.error?.message;
          if (Array.isArray(msg)) {
            this.error.set(msg.join(' · '));
          } else if (typeof msg === 'string' && msg.trim()) {
            this.error.set(msg);
          } else {
            this.error.set('تعذر إرسال طلب الإرجاع');
          }
        },
      });
  }
}
