import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  SpecialRequest,
  SpecialRequestsApi,
} from '../../core/special-requests/special-requests-api.service';

@Component({
  selector: 'app-special-requests',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './special-requests.html',
  styleUrl: './special-requests.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialRequestsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SpecialRequestsApi);

  protected readonly requests = signal<SpecialRequest[]>([]);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly preview = signal<string | null>(null);
  protected readonly photoFile = signal<File | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    deviceModel: ['', [Validators.required, Validators.minLength(2)]],
    partName: ['', [Validators.required, Validators.minLength(2)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    targetPrice: [0, [Validators.required, Validators.min(0)]],
  });

  protected readonly mediaUrl = (path: string) => this.api.photoUrl(path);

  protected statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'قيد الانتظار',
      QUOTED: 'تم التسعير',
      FULFILLED: 'تم التوفير',
    };
    return map[status] ?? status;
  }

  ngOnInit(): void {
    this.reload();
  }

  protected onPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (!file) return;
    this.photoFile.set(file);
    this.preview.set(URL.createObjectURL(file));
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (!this.photoFile()) {
      this.error.set('أرفق صورة اللوحة / القطعة');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    const data = new FormData();
    data.append('deviceModel', value.deviceModel);
    data.append('partName', value.partName);
    data.append('quantity', String(value.quantity));
    data.append('targetPrice', String(value.targetPrice));
    data.append('photo', this.photoFile()!);

    this.api.create(data).subscribe({
      next: () => {
        this.submitting.set(false);
        this.form.reset({ deviceModel: '', partName: '', quantity: 1, targetPrice: 0 });
        this.photoFile.set(null);
        this.preview.set(null);
        this.reload();
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('تعذر إرسال الطلب');
      },
    });
  }

  private reload(): void {
    this.api.list().subscribe({
      next: (rows) => this.requests.set(rows),
    });
  }
}
