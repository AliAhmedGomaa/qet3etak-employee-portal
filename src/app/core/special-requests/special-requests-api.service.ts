import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageParams, Paginated } from '../pagination';

export type SpecialRequestStatus = 'PENDING' | 'QUOTED' | 'FULFILLED';

export interface SpecialRequest {
  id: string;
  deviceModel: string;
  partName: string;
  quantity: number;
  targetPrice: number;
  photoUrl: string;
  status: SpecialRequestStatus;
  quotePrice?: number;
  estimatedArrival?: string;
  adminReply?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SpecialRequestsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/wholesale/special-requests`;

  list(params: PageParams = {}): Observable<Paginated<SpecialRequest>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<Paginated<SpecialRequest>>(this.base, {
      params: httpParams,
    });
  }

  create(form: FormData): Observable<SpecialRequest> {
    return this.http.post<SpecialRequest>(this.base, form);
  }

  photoUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path}`;
  }
}
