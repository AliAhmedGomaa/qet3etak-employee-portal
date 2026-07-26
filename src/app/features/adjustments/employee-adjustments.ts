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
  AdjustmentItem,
  EmployeeApiService,
  currentYearMonth,
} from '../../core/employee/employee-api.service';

@Component({
  selector: 'app-employee-adjustments',
  imports: [CurrencyPipe, FormsModule],
  template: `
    <section class="page" dir="rtl">
      <header>
        <div>
          <h1>المكافآت والخصومات</h1>
          <p>ما أضافته الإدارة على راتبك</p>
        </div>
        <label>
          الشهر
          <input type="month" [ngModel]="month()" (ngModelChange)="onMonth($event)" />
        </label>
      </header>
      @if (error()) {
        <p class="err">{{ error() }}</p>
      }
      <ul>
        @for (a of items(); track a.id) {
          <li [class.bonus]="a.type === 'BONUS'" [class.deduction]="a.type === 'DEDUCTION'">
            <div>
              <strong>{{ a.type === 'BONUS' ? 'مكافأة' : 'خصم' }}</strong>
              <small>{{ a.note || '—' }}</small>
            </div>
            <span>{{ a.amount | currency: 'EGP':'symbol-narrow':'1.2-2' }}</span>
          </li>
        } @empty {
          <li class="muted">لا توجد مكافآت أو خصومات لهذا الشهر.</li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1rem; padding: 1rem; color: var(--ink); }
      header { display: flex; justify-content: space-between; gap: 1rem; align-items: end; }
      h1 { margin: 0; font-size: 1.3rem; }
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
      li.bonus { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
      li.deduction { border-color: color-mix(in srgb, var(--danger) 45%, transparent); }
      small { display: block; margin-top: 0.2rem; color: var(--ink-muted); }
      .muted { justify-content: center; color: var(--ink-soft); }
      .err { background: var(--danger-bg); color: var(--danger); padding: 0.75rem; border-radius: 0.75rem; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAdjustments implements OnInit {
  private readonly api = inject(EmployeeApiService);
  protected readonly items = signal<AdjustmentItem[]>([]);
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
    this.api.adjustments(this.month()).subscribe({
      next: (items) => this.items.set(items),
      error: () => this.error.set('تعذر تحميل المكافآت والخصومات'),
    });
  }
}
