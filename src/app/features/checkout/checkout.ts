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
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/cart/cart.service';
import { resolveUnitPrice } from '../../core/catalog/catalog.models';
import {
  OrdersApiService,
  PaymentMethod,
  WalletView,
} from '../../core/orders/orders-api.service';
import { resolveMediaUrl } from '../../core/media/media-url';

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkout implements OnInit {
  private readonly cart = inject(CartService);
  private readonly api = inject(OrdersApiService);
  private readonly router = inject(Router);

  protected readonly lines = this.cart.lines;
  protected readonly subtotal = this.cart.subtotal;
  protected readonly wallet = signal<WalletView | null>(null);
  protected readonly paymentMethod = signal<PaymentMethod>('CREDIT');
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected notes = '';
  protected readonly resolveMediaUrl = resolveMediaUrl;

  protected readonly creditExceeded = computed(() => {
    const w = this.wallet();
    if (!w) return true;
    return this.subtotal() + w.currentDebt > w.creditLimit;
  });

  protected readonly availableCredit = computed(
    () => this.wallet()?.availableCredit ?? 0,
  );

  ngOnInit(): void {
    this.api.wallet().subscribe({
      next: (w) => {
        this.wallet.set(w);
        if (this.creditExceeded()) {
          this.paymentMethod.set('CASH_ON_DELIVERY');
        }
      },
    });
  }

  protected unitPrice(base: number, qty: number, tiers: { minQty: number; price: number }[]) {
    return resolveUnitPrice(qty, base, tiers).unitPrice;
  }

  protected lineTotal(base: number, qty: number, tiers: { minQty: number; price: number }[]) {
    return resolveUnitPrice(qty, base, tiers).lineTotal;
  }

  protected selectPayment(method: PaymentMethod): void {
    if (method === 'CREDIT' && this.creditExceeded()) return;
    this.paymentMethod.set(method);
  }

  protected changeQty(productId: string, qty: number): void {
    this.cart.updateQty(productId, qty);
    if (this.paymentMethod() === 'CREDIT' && this.creditExceeded()) {
      this.paymentMethod.set('CASH_ON_DELIVERY');
    }
  }

  protected placeOrder(): void {
    if (!this.lines().length) return;
    if (this.paymentMethod() === 'CREDIT' && this.creditExceeded()) {
      this.error.set('تجاوزت الحد الائتماني — اختر الدفع عند الاستلام أو قلّل الكمية');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.api
      .checkout({
        items: this.cart.checkoutPayload(),
        paymentMethod: this.paymentMethod(),
        notes: this.notes.trim() || undefined,
      })
      .subscribe({
        next: (order) => {
          this.cart.clear();
          this.submitting.set(false);
          void this.router.navigate(['/orders', order.id]);
        },
        error: (err: { error?: { message?: string; code?: string; availableCredit?: number } }) => {
          this.submitting.set(false);
          if (err.error?.code === 'CREDIT_LIMIT_EXCEEDED') {
            this.error.set('تم رفض الطلب: مجموع الطلب + الدين يتجاوز الحد الائتماني');
            this.paymentMethod.set('CASH_ON_DELIVERY');
          } else {
            this.error.set(
              typeof err.error?.message === 'string'
                ? err.error.message
                : 'تعذر إتمام الطلب',
            );
          }
        },
      });
  }
}
