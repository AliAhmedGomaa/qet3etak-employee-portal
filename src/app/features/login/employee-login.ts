import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BrandingService } from '../../core/branding/branding.service';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-employee-login',
  imports: [FormsModule],
  template: `
    <section class="login" dir="rtl">
      <button
        type="button"
        class="theme"
        (click)="theme.toggle()"
        [attr.aria-label]="theme.theme() === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'"
      >
        {{ theme.theme() === 'dark' ? '☀ فاتح' : '☾ داكن' }}
      </button>
      <div class="card">
        @if (branding.branding().logoUrl; as logo) {
          <img class="logo" [src]="logo" alt="" />
        }
        <h1>{{ branding.branding().appName }}</h1>
        <p>بوابة الموظف — سجّل الدخول لعرض راتبك وساعاتك وإجازاتك</p>
        @if (error()) {
          <p class="err">{{ error() }}</p>
        }
        <label>
          رقم الجوال
          <input type="tel" dir="ltr" [(ngModel)]="phone" autocomplete="username" />
        </label>
        <label>
          كلمة المرور
          <input type="password" dir="ltr" [(ngModel)]="password" autocomplete="current-password" />
        </label>
        <button type="button" class="btn" [disabled]="busy()" (click)="submit()">
          {{ busy() ? 'جارٍ الدخول…' : 'دخول' }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .login {
        position: relative;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        background:
          radial-gradient(
            ellipse at top,
            color-mix(in srgb, var(--accent) 18%, transparent),
            transparent 50%
          ),
          var(--canvas, #f8fafc);
        color: var(--ink, #0f172a);
      }
      .theme {
        position: absolute;
        top: calc(0.85rem + env(safe-area-inset-top, 0px));
        inset-inline-start: 1rem;
        border: 1.5px solid var(--border, #e2e8f0);
        background: var(--surface, #fff);
        color: var(--ink, #0f172a);
        border-radius: 0.65rem;
        min-height: 2.3rem;
        padding: 0 0.75rem;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .card {
        width: min(24rem, 100%);
        background: var(--surface, #fff);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 1.25rem;
        padding: 1.5rem;
        display: grid;
        gap: 0.85rem;
        box-shadow: var(--shadow);
      }
      h1 {
        margin: 0;
        font-size: 1.4rem;
      }
      .logo {
        width: 3.5rem;
        height: 3.5rem;
        object-fit: contain;
        border-radius: 0.75rem;
      }
      p {
        margin: 0;
        color: var(--ink-muted, #64748b);
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--ink, #334155);
      }
      input {
        min-height: 2.75rem;
        border: 1.5px solid var(--border, #e2e8f0);
        border-radius: 0.75rem;
        padding: 0.5rem 0.75rem;
        font: inherit;
        background: var(--input-bg, #fff);
        color: var(--ink, #0f172a);
      }
      .btn {
        min-height: 2.85rem;
        border: 0;
        border-radius: 0.75rem;
        background: var(--accent, #10b880);
        color: #fff;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      .btn:disabled {
        opacity: 0.6;
      }
      .err {
        background: var(--danger-bg, #fef2f2);
        color: var(--danger, #991b1b);
        padding: 0.65rem 0.8rem;
        border-radius: 0.65rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly branding = inject(BrandingService);
  protected readonly theme = inject(ThemeService);
  protected phone = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (!this.phone.trim() || !this.password) {
      this.error.set('أدخل الجوال وكلمة المرور');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.auth.login(this.phone.trim(), this.password).subscribe({
      next: () => {
        this.busy.set(false);
        void this.router.navigateByUrl('/home');
      },
      error: (err: { error?: { message?: string } }) => {
        this.busy.set(false);
        this.error.set(err.error?.message || 'فشل تسجيل الدخول');
      },
    });
  }
}
