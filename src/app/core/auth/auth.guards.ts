import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const employeeAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (!auth.isActive()) {
    return router.createUrlTree(['/inactive']);
  }
  return true;
};

export const employeeGuestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  if (!auth.isActive()) {
    return router.createUrlTree(['/inactive']);
  }
  return router.createUrlTree(['/home']);
};

/** Inactive screen — authenticated but not ACTIVE. */
export const employeeInactiveGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.isActive()) {
    return router.createUrlTree(['/home']);
  }
  return true;
};
