import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { BrandingService } from '../core/branding/branding.service';
import { ChatService } from '../core/chat/chat.service';
import { ThemeService } from '../core/theme/theme.service';
import { PushNotificationService } from '../core/push/push-notification.service';
import { InstallAppBanner } from '../shared/install-app-banner/install-app-banner';

@Component({
  selector: 'app-employee-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, InstallAppBanner],
  templateUrl: './employee-shell.html',
  styleUrl: './employee-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeShell {
  protected readonly auth = inject(AuthService);
  protected readonly branding = inject(BrandingService);
  protected readonly theme = inject(ThemeService);
  protected readonly push = inject(PushNotificationService);
  protected readonly chat = inject(ChatService);
  private readonly router = inject(Router);

  constructor() {
    afterNextRender(() => {
      this.auth.refreshMe().subscribe({
        next: () => {
          if (!this.auth.isActive()) {
            void this.router.navigateByUrl('/inactive');
            return;
          }
          this.push.listenForPush();
          this.chat.connect();
          this.chat.loadThread().subscribe();
        },
        error: () => {
          this.push.listenForPush();
        },
      });
    });
  }
}
