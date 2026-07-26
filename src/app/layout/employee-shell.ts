import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { BrandingService } from '../core/branding/branding.service';
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

  constructor() {
    afterNextRender(() => this.push.listenForPush());
  }
}
