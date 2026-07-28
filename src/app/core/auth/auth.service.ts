import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, EmployeeUser } from './auth.models';

const TOKEN_KEY = 'qet3etak.employee.token';
const USER_KEY = 'qet3etak.employee.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userSignal = signal<EmployeeUser | null>(this.readUser());
  private readonly tokenSignal = signal<string | null>(this.readToken());

  readonly user = this.userSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly isActive = computed(() => this.userSignal()?.status === 'ACTIVE');

  login(phone: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/employee/login`, {
        phone,
        password,
      })
      .pipe(tap((res) => this.persistSession(res)));
  }

  refreshMe(): Observable<EmployeeUser> {
    return this.http.get<EmployeeUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.userSignal.set(user);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch {
          /* ignore */
        }
      }),
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    void this.router.navigateByUrl('/login');
  }

  getAuthorizationHeader(): string | null {
    const token = this.tokenSignal();
    return token ? `Bearer ${token}` : null;
  }

  private persistSession(res: AuthResponse): void {
    this.tokenSignal.set(res.accessToken);
    this.userSignal.set(res.user);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private readUser(): EmployeeUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as EmployeeUser) : null;
    } catch {
      return null;
    }
  }
}
