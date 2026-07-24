import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShopOrdersReport {
  range: { from: string; to: string };
  totals: { orderCount: number; spent: number; unitsBought: number };
  byStatus: Array<{ status: string; orderCount: number; spent: number }>;
  byPaymentMethod: Array<{
    paymentMethod: string;
    orderCount: number;
    spent: number;
  }>;
  topProducts: Array<{
    productId: string;
    title: string;
    quantity: number;
    spent: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class ShopReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/wholesale/reports`;

  myOrders(from?: string, to?: string): Observable<ShopOrdersReport> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ShopOrdersReport>(`${this.base}/my-orders`, {
      params,
    });
  }
}
