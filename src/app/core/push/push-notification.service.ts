import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const ENABLED_KEY = 'qet3etak.employee.push.enabled';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly swPush = inject(SwPush, { optional: true });

  readonly enabled = signal(this.readEnabled());
  readonly supported = signal(this.isPushSupported());
  readonly busy = signal(false);
  readonly lastError = signal<string | null>(null);
  private listening = false;
  private inboxTimer: number | null = null;
  private readonly seenInbox = new Set<string>();

  async enable(): Promise<boolean> {
    this.busy.set(true);
    this.lastError.set(null);
    this.supported.set(this.isPushSupported());
    this.listenForPush();
    try {
      if (!this.isPushSupported()) {
        this.lastError.set('الإشعارات غير مدعومة في هذا المتصفح');
        return false;
      }

      const ready = await navigator.serviceWorker.ready;
      if (!ready) {
        this.lastError.set('فعّل التطبيق على HTTPS / نسخة الإنتاج');
        return false;
      }

      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const script = reg.active?.scriptURL || '';
        if (script && !script.includes('push-sw.js')) {
          await reg.unregister();
        }
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.lastError.set('تم رفض إذن الإشعارات');
        return false;
      }

      const key = await this.resolveVapidPublicKey();
      if (!key) {
        this.lastError.set('مفتاح الإشعارات غير متوفر');
        return false;
      }

      const existing = await ready.pushManager.getSubscription();
      if (existing) {
        try {
          await existing.unsubscribe();
        } catch {
          /* ignore */
        }
      }

      const sub = await ready.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const json = sub.toJSON();
      const p256dh = json.keys?.['p256dh'];
      const auth = json.keys?.['auth'];
      if (!json.endpoint || !p256dh || !auth) {
        this.lastError.set('تعذر إنشاء اشتراك الإشعارات');
        return false;
      }

      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/employee/push/subscribe`, {
          endpoint: json.endpoint,
          keys: { p256dh, auth },
        }),
      );
      this.enabled.set(true);
      localStorage.setItem(ENABLED_KEY, '1');
      this.startInboxPolling();
      void this.pullInbox();

      ready.active?.postMessage({
        type: 'SHOW_LOCAL',
        title: 'تم تفعيل الإشعارات',
        body: 'ستصلك تنبيهات الإجازات والرواتب',
        tag: `emp-welcome-${Date.now()}`,
        data: { url: '/home' },
      });

      return true;
    } catch (err) {
      this.lastError.set(err instanceof Error ? err.message : 'تعذر التفعيل');
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  async disable(): Promise<void> {
    this.busy.set(true);
    try {
      const ready = await navigator.serviceWorker.ready.catch(() => null);
      const sub = await ready?.pushManager.getSubscription();
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/employee/push/subscribe`, {
          body: { endpoint: sub?.endpoint },
        }),
      ).catch(() => undefined);
      await sub?.unsubscribe();
    } catch {
      /* ignore */
    } finally {
      this.enabled.set(false);
      localStorage.removeItem(ENABLED_KEY);
      this.busy.set(false);
    }
  }

  async toggle(): Promise<void> {
    if (this.enabled()) await this.disable();
    else await this.enable();
  }

  listenForPush(): void {
    this.supported.set(this.isPushSupported());
    if (this.listening) return;
    this.listening = true;
    if (this.enabled() || Notification.permission === 'granted') {
      this.startInboxPolling();
    }
  }

  startInboxPolling(): void {
    if (typeof window === 'undefined' || this.inboxTimer) return;
    void this.pullInbox();
    this.inboxTimer = window.setInterval(() => void this.pullInbox(), 8000);
  }

  private async pullInbox(): Promise<void> {
    if (!this.enabled() && Notification.permission !== 'granted') return;
    try {
      const items = await firstValueFrom(
        this.http.get<
          Array<{ id: string; title: string; body: string; url?: string }>
        >(`${environment.apiUrl}/employee/push/inbox`),
      );
      if (!items?.length) return;
      const fresh = items.filter((i) => !this.seenInbox.has(i.id));
      for (const item of fresh) {
        this.seenInbox.add(item.id);
        try {
          new Notification(item.title, {
            body: item.body,
            tag: `inbox-${item.id}`,
            dir: 'rtl',
            lang: 'ar',
          });
        } catch {
          /* ignore */
        }
      }
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/employee/push/inbox/read`, {
          ids: fresh.map((i) => i.id),
        }),
      ).catch(() => undefined);
    } catch {
      /* ignore */
    }
  }

  private async resolveVapidPublicKey(): Promise<string> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ publicKey?: string; enabled?: boolean }>(
          `${environment.apiUrl}/push/vapid-public-key`,
        ),
      );
      if (res.enabled === false) throw new Error('VAPID off');
      if (res.publicKey?.trim()) return res.publicKey.trim();
    } catch {
      /* fall through */
    }
    return environment.vapidPublicKey?.trim() || '';
  }

  private isPushSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  private readEnabled(): boolean {
    try {
      return localStorage.getItem(ENABLED_KEY) === '1';
    } catch {
      return false;
    }
  }
}
