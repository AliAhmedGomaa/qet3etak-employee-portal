import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AttendanceResponse,
  EmployeeApiService,
  currentYearMonth,
} from '../../core/employee/employee-api.service';

@Component({
  selector: 'app-employee-attendance',
  imports: [DatePipe, FormsModule],
  template: `
    <section class="page" dir="rtl">
      <header>
        <h1>ساعات العمل</h1>
        <p>عرض حسب الشهر أو فترة مخصصة</p>
      </header>
      <div class="filters">
        <label>
          شهر
          <input type="month" [(ngModel)]="month" (change)="loadMonth()" />
        </label>
        <label>
          من
          <input type="date" [(ngModel)]="from" />
        </label>
        <label>
          إلى
          <input type="date" [(ngModel)]="to" />
        </label>
        <button type="button" class="btn" (click)="loadRange()">عرض الفترة</button>
      </div>
      @if (error()) {
        <p class="err">{{ error() }}</p>
      }
      @if (data(); as d) {
        <p class="total">الإجمالي: <strong>{{ d.hoursWorked }}</strong> ساعة</p>
        <ul>
          @for (day of d.items; track day.id) {
            <li>
              <span>{{ day.date | date: 'fullDate' }}</span>
              <strong>{{ day.hours }} س</strong>
            </li>
          } @empty {
            <li class="muted">لا توجد ساعات مسجّلة.</li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1rem; padding: 1rem; color: var(--ink); }
      h1 { margin: 0; font-size: 1.3rem; }
      p { margin: 0.25rem 0 0; color: var(--ink-muted); }
      .filters { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
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
      .btn {
        min-height: 2.5rem;
        border: 0;
        border-radius: 0.65rem;
        background: var(--accent);
        color: #fff;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        grid-column: 1 / -1;
      }
      .total { color: var(--ink); }
      ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
      li {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        padding: 0.85rem 1rem;
      }
      .muted { justify-content: center; color: var(--ink-soft); }
      .err { background: var(--danger-bg); color: var(--danger); padding: 0.75rem; border-radius: 0.75rem; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAttendance implements OnInit {
  private readonly api = inject(EmployeeApiService);
  protected month = currentYearMonth();
  protected from = '';
  protected to = '';
  protected readonly data = signal<AttendanceResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMonth();
  }

  protected loadMonth(): void {
    this.api.attendance({ month: this.month }).subscribe({
      next: (d) => this.data.set(d),
      error: () => this.error.set('تعذر تحميل الحضور'),
    });
  }

  protected loadRange(): void {
    if (!this.from || !this.to) {
      this.error.set('حدد تاريخ البداية والنهاية');
      return;
    }
    this.api.attendance({ from: this.from, to: this.to }).subscribe({
      next: (d) => {
        this.data.set(d);
        this.error.set(null);
      },
      error: () => this.error.set('تعذر تحميل الحضور'),
    });
  }
}
