import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { BrandingService } from '../core/branding/branding.service';
import { ThemeService } from '../core/theme/theme.service';
import { InstallAppBanner } from '../shared/install-app-banner/install-app-banner';

@Component({
  selector: 'app-employee-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, InstallAppBanner],
  template: `
    <div class="shell" dir="rtl">
      <header class="top">
        <div class="top__brand">
          @if (branding.branding().logoUrl; as logo) {
            <img [src]="logo" width="32" height="32" alt="" />
          }
          <div>
            <strong>{{ branding.branding().appName }}</strong>
            <small>{{ auth.user()?.fullName }}</small>
          </div>
        </div>
        <div class="top__actions">
          <button
            type="button"
            class="theme"
            (click)="theme.toggle()"
            [attr.aria-label]="theme.theme() === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'"
          >
            {{ theme.theme() === 'dark' ? '☀ فاتح' : '☾ داكن' }}
          </button>
          <button type="button" class="logout" (click)="auth.logout()">خروج</button>
        </div>
      </header>
      <main>
        <router-outlet />
      </main>
      <nav>
        <a routerLink="/home" routerLinkActive="on">الراتب</a>
        <a routerLink="/attendance" routerLinkActive="on">الساعات</a>
        <a routerLink="/vacations" routerLinkActive="on">الإجازات</a>
        <a routerLink="/adjustments" routerLinkActive="on">المكافآت</a>
      </nav>
      <app-install-app-banner />
    </div>
  `,
  styles: [
    `
      .shell {
        min-height: 100dvh;
        display: grid;
        grid-template-rows: auto 1fr auto;
        background: var(--canvas, #f8fafc);
        color: var(--ink, #0f172a);
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        background: var(--surface, #fff);
        border-bottom: 1px solid var(--border, #e2e8f0);
      }
      .top__brand {
        display: flex;
        gap: 0.65rem;
        align-items: center;
        min-width: 0;
      }
      .top__brand img {
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        object-fit: cover;
        flex-shrink: 0;
      }
      .top strong {
        display: block;
      }
      .top small {
        color: var(--ink-muted, #64748b);
      }
      .top__actions {
        display: flex;
        gap: 0.45rem;
        align-items: center;
        flex-shrink: 0;
      }
      .theme,
      .logout {
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
      main {
        min-height: 0;
        overflow: auto;
        padding-bottom: 4.5rem;
      }
      nav {
        position: fixed;
        inset-inline: 0;
        bottom: 0;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: var(--surface, #fff);
        border-top: 1px solid var(--border, #e2e8f0);
        padding: 0.4rem 0.25rem calc(0.4rem + env(safe-area-inset-bottom));
        z-index: 20;
      }
      nav a {
        text-align: center;
        text-decoration: none;
        color: var(--ink-muted, #64748b);
        font-size: 0.78rem;
        font-weight: 700;
        padding: 0.55rem 0.25rem;
      }
      nav a.on {
        color: var(--accent-strong, #0d9a6a);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeShell {
  protected readonly auth = inject(AuthService);
  protected readonly branding = inject(BrandingService);
  protected readonly theme = inject(ThemeService);
}
