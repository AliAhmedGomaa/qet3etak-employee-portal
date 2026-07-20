import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register-shop',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-shop.html',
  styleUrl: './register-shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterShop {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly photoFile = signal<File | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    shopName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{8,20}$/)]],
    city: ['', [Validators.required, Validators.minLength(2)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('يرجى اختيار صورة فقط (JPG / PNG / WEBP)');
      return;
    }
    this.photoFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
    this.error.set(null);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (!this.photoFile()) {
      this.error.set('صورة البطاقة التجارية / المحل مطلوبة');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const value = this.form.getRawValue();
    const data = new FormData();
    Object.entries(value).forEach(([key, val]) => data.append(key, val));
    data.append('commercialRegPhoto', this.photoFile()!);

    this.auth.registerShop(data).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl('/pending');
      },
      error: (err: { error?: { message?: string | string[] } }) => {
        this.submitting.set(false);
        const msg = err.error?.message;
        this.error.set(
          Array.isArray(msg)
            ? msg.join(' · ')
            : msg || 'تعذر إكمال التسجيل. حاول مرة أخرى.',
        );
      },
    });
  }
}
