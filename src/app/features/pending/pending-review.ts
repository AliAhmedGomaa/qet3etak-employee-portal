import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pending-review',
  templateUrl: './pending-review.html',
  styleUrl: './pending-review.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingReview implements OnInit {
  private readonly auth = inject(AuthService);

  protected readonly refreshing = signal(false);
  protected readonly user = this.auth.user;
  protected readonly isRejected = computed(
    () => this.user()?.status === 'REJECTED',
  );

  protected readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      PENDING_VERIFICATION: 'قيد المراجعة',
      APPROVED: 'معتمد',
      REJECTED: 'مرفوض',
    };
    const status = this.user()?.status;
    return status ? map[status] ?? status : '—';
  });

  protected readonly whatsappUrl = computed(() => {
    const phone = environment.whatsappSupport.replace(/\D/g, '');
    const shop = this.user()?.shopName ?? '';
    const text = encodeURIComponent(
      `مرحباً، أحتاج مساعدة بخصوص طلب تسجيل المحل: ${shop}`,
    );
    return `https://wa.me/${phone}?text=${text}`;
  });

  ngOnInit(): void {
    this.refreshStatus();
  }

  protected refreshStatus(): void {
    this.refreshing.set(true);
    this.auth.refreshMe().subscribe({
      next: () => this.refreshing.set(false),
      error: () => this.refreshing.set(false),
    });
  }

  protected logout(): void {
    this.auth.logout();
  }
}
