import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageParams, Paginated } from '../pagination';
import type { PaymentMethod } from '../orders/orders-api.service';

export type InvoiceStatus = 'ISSUED' | 'PAID' | 'VOID';

export interface InvoiceParty {
  name: string;
  phone: string;
  city: string;
  address: string;
  taxId: string;
}

export interface InvoiceLine {
  title: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ShopInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  shopId: string;
  shopName: string;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  items: InvoiceLine[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  issuedAt: string;
  notes?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class InvoicesApiService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  list(params: PageParams = {}): Observable<Paginated<ShopInvoice>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.q?.trim()) httpParams = httpParams.set('q', params.q.trim());
    return this.http.get<Paginated<ShopInvoice>>(
      `${this.api}/wholesale/invoices`,
      { params: httpParams },
    );
  }

  get(id: string): Observable<ShopInvoice> {
    return this.http.get<ShopInvoice>(`${this.api}/wholesale/invoices/${id}`);
  }

  byOrder(orderId: string): Observable<ShopInvoice> {
    return this.http.get<ShopInvoice>(
      `${this.api}/wholesale/invoices/by-order/${orderId}`,
    );
  }
}
