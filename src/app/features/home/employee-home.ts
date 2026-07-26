import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EmployeeApiService,
  EmployeeDashboard,
  currentYearMonth,
} from '../../core/employee/employee-api.service';

@Component({
  selector: 'app-employee-home',
  imports: [CurrencyPipe, FormsModule],
  template: `
    <section class="home" dir="rtl">
      <header>
        <div>
          <h1>راتبي</h1>
          <p>ملخص الراتب والساعات لهذا الشهر أو أي شهر تختاره</p>
        </div>
        <label>
          الشهر
          <input type="month" [ngModel]="month()" (ngModelChange)="onMonth($event)" />
        </label>
      </header>
      @if (error()) {
        <p class="err">{{ error() }}</p>
      }
      @if (loading()) {
        <p class="muted">جارٍ التحميل…</p>
      } @else if (data(); as d) {
        <div class="hero">
          <strong>{{ d.fullName }}</strong>
          <span>{{ d.jobTitle || 'موظف' }}</span>
        </div>
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
      }
    </section>
  `,
  styles: [
    `
      .home { display: grid; gap: 1rem; padding: 1rem; color: var(--ink); }
      header { display: flex; justify-content: space-between; gap: 1rem; align-items: end; }
      h1 { margin: 0; font-size: 1.35rem; }
      p { margin: 0.25rem 0 0; color: var(--ink-muted); }
      label { display: grid; gap: 0.25rem; font-size: 0.75rem; font-weight: 700; color: var(--ink-muted); }
      input {
        min-height: 2.5rem;
        border: 1.5px solid var(--border);
        border-radius: 0.65rem;
        padding: 0.35rem 0.6rem;
        font: inherit;
        background: var(--input-bg);
        color: var(--ink);
      }
      .hero {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1rem;
        display: grid;
        gap: 0.25rem;
      }
      .stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
      article {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 0.9rem;
        display: grid;
        gap: 0.3rem;
      }
      article span { font-size: 0.75rem; color: var(--ink-muted); font-weight: 700; }
      article strong { font-size: 1.1rem; }
      .pay {
        grid-column: 1 / -1;
        background: linear-gradient(145deg, var(--accent-soft), var(--surface));
        border-color: color-mix(in srgb, var(--accent) 40%, transparent);
      }
      .err { background: var(--danger-bg); color: var(--danger); padding: 0.75rem; border-radius: 0.75rem; }
      .muted { color: var(--ink-soft); text-align: center; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeHome implements OnInit {
  private readonly api = inject(EmployeeApiService);
  protected readonly data = signal<EmployeeDashboard | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly month = signal(currentYearMonth());

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
  }
}
