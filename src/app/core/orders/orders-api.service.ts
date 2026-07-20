import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PaymentMethod = 'CREDIT' | 'CASH_ON_DELIVERY';
export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED';

export interface WalletTx {
  id?: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string;
  createdAt?: string;
  orderId?: string;
}

export interface WalletView {
  id: string;
  shopId: string;
  creditLimit: number;
  currentDebt: number;
  availableCredit: number;
  utilization: number;
  transactions: WalletTx[];
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  total: number;
  statusHistory: Array<{ status: OrderStatus; at: string; note: string }>;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  wallet(): Observable<WalletView> {
    return this.http.get<WalletView>(`${this.api}/wholesale/wallet`);
  }

  checkout(body: {
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): Observable<ShopOrder> {
    return this.http.post<ShopOrder>(`${this.api}/wholesale/orders/checkout`, body);
  }

  myOrders(): Observable<ShopOrder[]> {
    return this.http.get<ShopOrder[]>(`${this.api}/wholesale/orders`);
  }

  myOrder(id: string): Observable<ShopOrder> {
    return this.http.get<ShopOrder>(`${this.api}/wholesale/orders/${id}`);
  }
}
