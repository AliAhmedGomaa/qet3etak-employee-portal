import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ChatService } from '../../core/chat/chat.service';

@Component({
  selector: 'app-support-chat',
  imports: [FormsModule, DatePipe],
  templateUrl: './support-chat.html',
  styleUrl: './support-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportChat {
  protected readonly chat = inject(ChatService);
  protected readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly scrollBox =
    viewChild<ElementRef<HTMLDivElement>>('scrollBox');

  protected readonly draft = signal('');
  protected readonly loading = signal(true);

  private readonly onVisibility = () =>
    this.chat.setViewing(document.visibilityState === 'visible');

  constructor() {
    afterNextRender(() => {
      this.chat.connect();
      this.chat.loadThread().subscribe({
        next: () => {
          this.loading.set(false);
          this.chat.setViewing(true);
          this.scrollToBottom();
        },
        error: () => this.loading.set(false),
      });

      // Pause "viewing" when the tab is backgrounded so pushes resume.
      document.addEventListener('visibilitychange', this.onVisibility);
    });

    this.destroyRef.onDestroy(() => {
      this.chat.setViewing(false);
      if (isPlatformBrowser(this.platformId)) {
        document.removeEventListener('visibilitychange', this.onVisibility);
      }
    });

    // Keep the thread pinned to the newest message.
    effect(() => {
      this.chat.messages();
      if (isPlatformBrowser(this.platformId)) {
        queueMicrotask(() => this.scrollToBottom());
      }
    });
  }

  protected send(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.chat.send(text);
    this.draft.set('');
    this.chat.notifyTyping(false);
  }

  protected onInput(value: string): void {
    this.draft.set(value);
    this.chat.notifyTyping(value.trim().length > 0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private scrollToBottom(): void {
    const el = this.scrollBox()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
