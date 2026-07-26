import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  EmployeeApiService,
  EmployeeDashboard,
  VacationItem,
  currentYearMonth,
} from '../../core/employee/employee-api.service';
import { PushNotificationService } from '../../core/push/push-notification.service';

@Component({
  selector: 'app-employee-home',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  template: `
    <section class="home safe-area-page" dir="rtl">
      <header>
        <div>
          <h1>راتبي</h1>
          <p>ملخص الراتب والساعات لهذا الشهر</p>
        </div>
        <label>
          الشهر
          <input type="month" [ngModel]="month()" (ngModelChange)="onMonth($event)" />
        </label>
      </header>

      @if (!push.enabled() && push.supported()) {
        <button type="button" class="nudge" (click)="push.enable()">
          فعّل الإشعارات ليصلك تنبيه عند الموافقة على الإجازة أو صرف الراتب
        </button>
      }

      @if (error()) {
        <p class="err">{{ error() }}</p>
      }
      @if (loading()) {
        <p class="muted">جارٍ التحميل…</p>
      } @else if (data(); as d) {
        <div class="hero">
          <div>
            <strong>{{ d.fullName }}</strong>
            <span>{{ d.jobTitle || 'موظف' }}</span>
          </div>
          @if (d.salaryPaidThisMonth) {
            <em class="chip ok">تم الصرف هذا الشهر</em>
          } @else {
            <em class="chip">لم يُصرف بعد</em>
          }
        </div>

        @if (pendingVacations() > 0) {
          <a routerLink="/vacations" class="banner">
            لديك {{ pendingVacations() }} طلب إجازة قيد المراجعة
          </a>
        }

        <div class="stats">
          <article>
            <span>ساعات العمل</span>
            <strong>{{ d.hoursWorkedThisMonth }}</strong>
          </article>
          <article>
            <span>الأساسي</span>
            <strong>{{ d.baseAmount | currency: 'EGP':'symbol-narrow':'1.0-2' }}</strong>
          </article>
          <article>
            <span>مكافآت</span>
            <strong>{{ d.bonus | currency: 'EGP':'symbol-narrow':'1.0-2' }}</strong>
          </article>
          <article>
            <span>خصومات</span>
            <strong>{{ d.deduction | currency: 'EGP':'symbol-narrow':'1.0-2' }}</strong>
          </article>
          <article class="pay">
            <span>{{ d.salaryPaidThisMonth ? 'تم الصرف' : 'المستحق' }}</span>
            <strong>{{ d.expectedPay | currency: 'EGP':'symbol-narrow':'1.2-2' }}</strong>
          </article>
          <article>
            <span>رصيد الإجازة</span>
            <strong>{{ d.vacationDaysRemaining }} / {{ d.annualLeaveDays }}</strong>
          </article>
        </div>

        <section class="quick">
          <h2>اختصارات</h2>
          <div class="quick__grid">
            <a routerLink="/vacations" class="quick__card">طلب إجازة</a>
            <a routerLink="/attendance" class="quick__card">سجل الساعات</a>
            <a routerLink="/adjustments" class="quick__card">المكافآت والخصومات</a>
          </div>
        </section>
      }
    </section>
  `,
  styles: `
    .home {
      display: grid;
      gap: 1rem;
      color: var(--ink);
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
    }
    h1 {
      margin: 0;
      font-size: 1.45rem;
    }
    p {
      margin: 0.25rem 0 0;
      color: var(--ink-muted);
    }
    label {
      display: grid;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ink-muted);
    }
    input {
      min-height: 2.5rem;
      border: 1.5px solid var(--border);
      border-radius: 0.65rem;
      padding: 0.35rem 0.6rem;
      font: inherit;
      background: var(--input-bg);
      color: var(--ink);
    }
    .nudge {
      border: 1.5px dashed color-mix(in srgb, var(--accent) 50%, var(--border));
      background: var(--accent-soft);
      color: var(--ink);
      border-radius: 0.85rem;
      padding: 0.85rem 1rem;
      font: inherit;
      font-weight: 700;
      text-align: start;
      cursor: pointer;
    }
    .hero {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: center;
    }
    .hero strong {
      display: block;
    }
    .hero span {
      color: var(--ink-muted);
      font-size: 0.85rem;
    }
    .chip {
      font-style: normal;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.35rem 0.65rem;
      border-radius: 999px;
      background: var(--surface-muted);
      color: var(--ink-muted);
      white-space: nowrap;
    }
    .chip.ok {
      background: var(--chip-ok-bg);
      color: var(--chip-ok-ink);
    }
    .banner {
      display: block;
      text-decoration: none;
      background: #fff7ed;
      color: #9a3412;
      border: 1px solid #fdba74;
      border-radius: 0.85rem;
      padding: 0.85rem 1rem;
      font-weight: 700;
    }
    html[data-theme='dark'] .banner {
      background: rgba(154, 52, 18, 0.25);
      color: #fdba74;
      border-color: rgba(253, 186, 116, 0.35);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.65rem;
    }
    article {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 0.9rem;
      display: grid;
      gap: 0.3rem;
    }
    article span {
      font-size: 0.75rem;
      color: var(--ink-muted);
      font-weight: 700;
    }
    article strong {
      font-size: 1.1rem;
    }
    .pay {
      grid-column: 1 / -1;
      background: linear-gradient(145deg, var(--accent-soft), var(--surface));
      border-color: color-mix(in srgb, var(--accent) 40%, transparent);
    }
    .quick h2 {
      margin: 0 0 0.65rem;
      font-size: 1rem;
    }
    .quick__grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.55rem;
    }
    .quick__card {
      text-decoration: none;
      text-align: center;
      font-weight: 800;
      font-size: 0.85rem;
      color: var(--ink);
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: 0.85rem;
      padding: 0.95rem 0.5rem;
    }
    .quick__card:hover {
      border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
      background: var(--accent-soft);
    }
    .err {
      background: var(--danger-bg);
      color: var(--danger);
      padding: 0.75rem;
      border-radius: 0.75rem;
    }
    .muted {
      color: var(--ink-soft);
      text-align: center;
    }
    @media (min-width: 900px) {
      .home {
        gap: 1.25rem;
      }
      .stats {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .pay {
        grid-column: auto;
      }
    }
    @media (max-width: 520px) {
      .quick__grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeHome implements OnInit {
  private readonly api = inject(EmployeeApiService);
  protected readonly push = inject(PushNotificationService);
  protected readonly data = signal<EmployeeDashboard | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly month = signal(currentYearMonth());
  private readonly vacations = signal<VacationItem[]>([]);

  protected readonly pendingVacations = computed(
    () => this.vacations().filter((v) => v.status === 'PENDING').length,
  );

  ngOnInit(): void {
    this.load();
  }

  protected onMonth(value: string): void {
    this.month.set(value);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.dashboard(this.month()).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('تعذر تحميل بيانات الراتب');
      },
    });
    this.api.vacations().subscribe({
      next: (list) => this.vacations.set(list ?? []),
      error: () => this.vacations.set([]),
    });
  }
}
