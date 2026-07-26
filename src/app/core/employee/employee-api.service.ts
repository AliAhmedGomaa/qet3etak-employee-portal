import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmployeeDashboard {
  id: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  hourlyRate: number;
  standardDailyHours: number;
  annualLeaveDays: number;
  status: string;
  month: string;
  hoursWorkedThisMonth: number;
  expectedPay: number;
  baseAmount: number;
  bonus: number;
  deduction: number;
  salaryPaidThisMonth: boolean;
  vacationDaysUsedThisYear: number;
  vacationDaysRemaining: number;
  payment?: {
    amount: number;
    bonus: number;
    deduction: number;
    baseAmount: number;
    paidAt?: string;
  } | null;
  adjustments?: Array<{
    id: string;
    type: 'BONUS' | 'DEDUCTION';
    amount: number;
    note: string;
    month: string;
  }>;
}

export interface AttendanceResponse {
  month?: string;
  from?: string;
  to?: string;
  hoursWorked: number;
  items: Array<{
    id: string;
    date: string;
    hours: number;
    note: string;
  }>;
}

export interface VacationItem {
  id: string;
  from: string;
  to: string;
  days: number;
  type: string;
  status: string;
  reason: string;
  reviewNote?: string;
}

export interface AdjustmentItem {
  id: string;
  month: string;
  type: 'BONUS' | 'DEDUCTION';
  amount: number;
  note: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/employee`;

  dashboard(month?: string): Observable<EmployeeDashboard> {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    return this.http.get<EmployeeDashboard>(`${this.base}/me`, { params });
  }

  attendance(opts: {
    month?: string;
    from?: string;
    to?: string;
  } = {}): Observable<AttendanceResponse> {
    let params = new HttpParams();
    if (opts.month) params = params.set('month', opts.month);
    if (opts.from) params = params.set('from', opts.from);
    if (opts.to) params = params.set('to', opts.to);
    return this.http.get<AttendanceResponse>(`${this.base}/attendance`, {
      params,
    });
  }

  vacations(): Observable<VacationItem[]> {
    return this.http.get<VacationItem[]>(`${this.base}/vacations`);
  }

  requestVacation(data: {
    from: string;
    to: string;
    type?: string;
    reason?: string;
  }): Observable<VacationItem> {
    return this.http.post<VacationItem>(`${this.base}/vacations`, data);
  }

  adjustments(month?: string): Observable<AdjustmentItem[]> {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    return this.http.get<AdjustmentItem[]>(`${this.base}/adjustments`, {
      params,
    });
  }
}

export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
