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
  EmployeeApiService,
  VacationItem,
} from '../../core/employee/employee-api.service';

@Component({
  selector: 'app-employee-vacations',
  imports: [DatePipe, FormsModule],
  template: `
    <section class="page" dir="rtl">
      <header>
        <h1>إجازاتي</h1>
        <p>اطلب إجازة وتابع حالتها — الطلب يصل لإدارة الموارد البشرية</p>
      </header>
      <div class="form">
        <label>من<input type="date" [(ngModel)]="from" /></label>
        <label>إلى<input type="date" [(ngModel)]="to" /></label>
        <label>
          النوع
          <select [(ngModel)]="type">
            <option value="ANNUAL">سنوية</option>
            <option value="SICK">مرضية</option>
            <option value="UNPAID">بدون راتب</option>
          </select>
        </label>
        <label>السبب<input type="text" [(ngModel)]="reason" /></label>
        <button type="button" class="btn" [disabled]="busy()" (click)="submit()">إرسال الطلب</button>
      </div>
      @if (error()) {
        <p class="err">{{ error() }}</p>
      }
      @if (ok()) {
        <p class="ok">{{ ok() }}</p>
      }
      <ul>
        @for (v of items(); track v.id) {
          <li>
            <div>
              <strong>{{ v.from | date: 'mediumDate' }} → {{ v.to | date: 'mediumDate' }}</strong>
              <small>{{ typeLabel(v.type) }} · {{ v.days }} يوم · {{ statusLabel(v.status) }}</small>
            </div>
          </li>
        } @empty {
          <li class="muted">لا توجد طلبات بعد.</li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1rem; padding: 1rem; color: var(--ink); }
      h1 { margin: 0; font-size: 1.3rem; }
      header p { margin: 0.25rem 0 0; color: var(--ink-muted); }
      .form {
        display: grid;
        gap: 0.65rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1rem;
      }
      label { display: grid; gap: 0.25rem; font-size: 0.75rem; font-weight: 700; color: var(--ink-muted); }
      input, select {
        min-height: 2.5rem;
        border: 1.5px solid var(--border);
        border-radius: 0.65rem;
        padding: 0.35rem 0.6rem;
        font: inherit;
        background: var(--input-bg);
        color: var(--ink);
      }
      .btn {
        min-height: 2.6rem;
        border: 0;
        border-radius: 0.65rem;
        background: var(--accent);
        color: #fff;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
      li {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        padding: 0.85rem 1rem;
      }
      small { display: block; margin-top: 0.25rem; color: var(--ink-muted); }
      .muted { text-align: center; color: var(--ink-soft); }
      .err { background: var(--danger-bg); color: var(--danger); padding: 0.75rem; border-radius: 0.75rem; }
      .ok { background: var(--chip-ok-bg); color: var(--chip-ok-ink); padding: 0.75rem; border-radius: 0.75rem; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeVacations implements OnInit {
  private readonly api = inject(EmployeeApiService);
  protected readonly items = signal<VacationItem[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly ok = signal<string | null>(null);
  protected from = '';
  protected to = '';
  protected type = 'ANNUAL';
  protected reason = '';

  ngOnInit(): void {
    this.load();
  }

  protected typeLabel(type: string): string {
    return ({ ANNUAL: 'سنوية', SICK: 'مرضية', UNPAID: 'بدون راتب' } as Record<string, string>)[type] ?? type;
  }

  protected statusLabel(status: string): string {
    return ({ PENDING: 'قيد المراجعة', APPROVED: 'مقبولة', REJECTED: 'مرفوضة' } as Record<string, string>)[status] ?? status;
  }

  protected submit(): void {
    if (!this.from || !this.to) {
      this.error.set('حدد فترة الإجازة');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.ok.set(null);
    this.api
      .requestVacation({
        from: this.from,
        to: this.to,
        type: this.type,
        reason: this.reason.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.ok.set('تم إرسال الطلب للإدارة');
          this.reason = '';
          this.load();
        },
        error: (err: { error?: { message?: string } }) => {
          this.busy.set(false);
          this.error.set(err.error?.message || 'تعذر إرسال الطلب');
        },
      });
  }

  private load(): void {
    this.api.vacations().subscribe({
      next: (items) => this.items.set(items),
      error: () => this.error.set('تعذر تحميل الإجازات'),
    });
  }
}
