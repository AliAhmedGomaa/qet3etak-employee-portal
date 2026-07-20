import { Injectable, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  BeforeInstallPromptEvent,
  INSTALL_DISMISS_KEY,
  InstallPlatform,
} from './pwa.types';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
  private readonly dismissed = signal(false);
  private readonly installed = signal(false);

  readonly platform = signal<InstallPlatform>('unsupported');

  /** Banner should render when installable and not dismissed / already installed. */
  readonly shouldShowBanner = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return false;
    if (this.dismissed() || this.installed()) return false;
    const p = this.platform();
    if (p === 'installed' || p === 'unsupported') return false;
    if (p === 'android-chrome') return this.deferredPrompt() !== null;
    return p === 'ios-safari';
  });

  readonly canNativeInstall = computed(
    () => this.platform() === 'android-chrome' && this.deferredPrompt() !== null,
  );

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.dismissed.set(this.readDismissed());
    this.platform.set(this.detectPlatform());

    if (this.platform() === 'installed') {
      this.installed.set(true);
      return;
    }

    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.onAppInstalled);
  }

  destroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.onAppInstalled);
  }

  /** Triggers the native Chrome install sheet (must be called from a user gesture). */
  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    const event = this.deferredPrompt();
    if (!event) return 'unavailable';

    await event.prompt();
    const { outcome } = await event.userChoice;
    this.deferredPrompt.set(null);

    if (outcome === 'accepted') {
      this.installed.set(true);
      this.platform.set('installed');
    }

    return outcome;
  }

  dismiss(persist = true): void {
    this.dismissed.set(true);
    if (persist && isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
      } catch {
        /* private mode / blocked storage */
      }
    }
  }

  private readonly onBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.deferredPrompt.set(event as BeforeInstallPromptEvent);
    if (this.platform() === 'unsupported') {
      this.platform.set('android-chrome');
    }
  };

  private readonly onAppInstalled = (): void => {
    this.deferredPrompt.set(null);
    this.installed.set(true);
    this.platform.set('installed');
  };

  private detectPlatform(): InstallPlatform {
    if (this.isStandalone()) return 'installed';

    const ua = navigator.userAgent;
    const isIos =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari =
      /Safari/.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android/.test(ua);

    if (isIos && isSafari) return 'ios-safari';

    const isAndroid = /Android/i.test(ua);
    const isChrome = /Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua);
    if (isAndroid && isChrome) return 'android-chrome';

    return 'unsupported';
  }

  private isStandalone(): boolean {
    const media = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const twa = document.referrer.startsWith('android-app://');
    return media || iosStandalone || twa;
  }

  private readDismissed(): boolean {
    try {
      const raw = localStorage.getItem(INSTALL_DISMISS_KEY);
      if (!raw) return false;
      const ts = Number(raw);
      // Re-prompt after 14 days
      return Number.isFinite(ts) && Date.now() - ts < 14 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }
}
