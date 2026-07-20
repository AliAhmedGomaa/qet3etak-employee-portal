import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { CartService } from '../core/cart/cart.service';

@Component({
  selector: 'app-shop-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shop-shell.html',
  styleUrl: './shop-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopShell {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);

  protected readonly cartLabel = computed(() => {
    const n = this.cart.itemCount();
    return n > 0 ? `السلة (${n})` : 'السلة';
  });
}
