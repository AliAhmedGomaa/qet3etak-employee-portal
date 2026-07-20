import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersApiService, ShopOrder } from '../../core/orders/orders-api.service';
import { OrderStepper } from './order-stepper';

@Component({
  selector: 'app-orders',
  imports: [CurrencyPipe, DatePipe, RouterLink, OrderStepper],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly api = inject(OrdersApiService);
  protected readonly orders = signal<ShopOrder[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.api.myOrders().subscribe({
      next: (rows) => {
        this.orders.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
