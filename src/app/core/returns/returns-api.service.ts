import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageParams, Paginated } from '../pagination';
import { PaymentMethod } from '../orders/orders-api.service';

export type ReturnRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReturnRefundMethod = 'WALLET_CREDIT' | 'NONE';

export interface ReturnItem {
  productId: string;
  title: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  items: ReturnItem[];
  refundAmount: number;
  reason: string;
  status: ReturnRequestStatus;
  adminNote?: string;
  refundMethod?: ReturnRefundMethod;
  reviewedAt?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ReturnsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/wholesale/returns`;

  list(params: PageParams = {}): Observable<Paginated<ReturnRequest>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<Paginated<ReturnRequest>>(this.base, {
      params: httpParams,
    });
  }

  get(id: string): Observable<ReturnRequest> {
    return this.http.get<ReturnRequest>(`${this.base}/${id}`);
  }

  create(body: {
    orderId: string;
    items: Array<{ productId: string; quantity: number }>;
    reason: string;
  }): Observable<ReturnRequest> {
    return this.http.post<ReturnRequest>(this.base, body);
  }
}
