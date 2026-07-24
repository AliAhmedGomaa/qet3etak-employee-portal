import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageParams, Paginated } from '../pagination';
import {
  CatalogBrand,
  CatalogCategory,
  CatalogFacets,
  CatalogProduct,
  CatalogResponse,
  LineQuote,
} from './catalog.models';

export type CatalogFilters = {
  q?: string;
  brand?: string[];
  model?: string[];
  category?: string[];
  part?: string[];
  qualityGrade?: string[];
  page?: number;
  limit?: number;
};

export type CartCalculateResponse = {
  lines: Array<{
    productId: string;
    title: string;
    quantity: number;
    basePrice: number;
    unitPrice: number;
    lineTotal: number;
    appliedMinQty: number;
    isTiered: boolean;
  }>;
  subtotal: number;
  currency: string;
};

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  search(filters: CatalogFilters): Observable<CatalogResponse> {
    return this.http.get<CatalogResponse>(`${environment.apiUrl}/wholesale/catalog`, {
      params: this.toParams(filters),
    });
  }

  product(id: string): Observable<CatalogProduct> {
    return this.http.get<CatalogProduct>(
      `${environment.apiUrl}/wholesale/products/${id}`,
    );
  }

  facets(filters: CatalogFilters): Observable<CatalogFacets> {
    return this.http.get<CatalogFacets>(
      `${environment.apiUrl}/wholesale/catalog/facets`,
      { params: this.toParams(filters) },
    );
  }

  brands(params: PageParams = {}): Observable<Paginated<CatalogBrand>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<Paginated<CatalogBrand>>(
      `${environment.apiUrl}/wholesale/brands`,
      { params: httpParams },
    );
  }

  categories(params: PageParams = {}): Observable<Paginated<CatalogCategory>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<Paginated<CatalogCategory>>(
      `${environment.apiUrl}/wholesale/categories`,
      { params: httpParams },
    );
  }

  quote(productId: string, quantity: number): Observable<LineQuote> {
    return this.http.get<LineQuote>(
      `${environment.apiUrl}/wholesale/products/${productId}/quote`,
      { params: new HttpParams().set('quantity', String(quantity)) },
    );
  }

  /** Server-side tier evaluation for cart lines (authoritative totals). */
  calculateCart(
    items: Array<{ productId: string; quantity: number }>,
  ): Observable<CartCalculateResponse> {
    return this.http.post<CartCalculateResponse>(
      `${environment.apiUrl}/wholesale/cart/calculate`,
      { items },
    );
  }

  private toParams(filters: CatalogFilters): HttpParams {
    let params = new HttpParams();
    if (filters.q) params = params.set('q', filters.q);
    if (filters.brand?.length) params = params.set('brand', filters.brand.join(','));
    if (filters.model?.length) params = params.set('model', filters.model.join(','));
    if (filters.category?.length) {
      params = params.set('category', filters.category.join(','));
    }
    if (filters.part?.length) {
      params = params.set('part', filters.part.join(','));
    }
    if (filters.qualityGrade?.length) {
      params = params.set('qualityGrade', filters.qualityGrade.join(','));
    }
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return params;
  }
}
