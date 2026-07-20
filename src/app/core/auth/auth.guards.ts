import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/** Blocks wholesale/home when account is still under review. */
export const pendingVerificationGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  if (auth.isPending()) {
    return router.createUrlTree(['/pending']);
  }

  if (auth.user()?.status === 'REJECTED') {
    return router.createUrlTree(['/pending']);
  }

  return true;
};

/** Pending review screen — only for authenticated pending/rejected users. */
export const pendingScreenGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  if (auth.isApproved()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;
  if (auth.isPending() || auth.user()?.status === 'REJECTED') {
    return router.createUrlTree(['/pending']);
  }
  return router.createUrlTree(['/home']);
};
