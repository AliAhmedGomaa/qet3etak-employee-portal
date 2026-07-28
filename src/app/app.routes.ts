import { Routes } from '@angular/router';
import {
  employeeAuthGuard,
  employeeGuestGuard,
  employeeInactiveGuard,
} from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [employeeGuestGuard],
    loadComponent: () =>
      import('./features/login/employee-login').then((m) => m.EmployeeLogin),
  },
  {
    path: 'inactive',
    canActivate: [employeeInactiveGuard],
    loadComponent: () =>
      import('./features/inactive/account-inactive').then(
        (m) => m.AccountInactivePage,
      ),
  },
  {
    path: '',
    canActivate: [employeeAuthGuard],
    loadComponent: () =>
      import('./layout/employee-shell').then((m) => m.EmployeeShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/employee-home').then((m) => m.EmployeeHome),
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./features/attendance/employee-attendance').then(
            (m) => m.EmployeeAttendance,
          ),
      },
      {
        path: 'vacations',
        loadComponent: () =>
          import('./features/vacations/employee-vacations').then(
            (m) => m.EmployeeVacations,
          ),
      },
      {
        path: 'adjustments',
        loadComponent: () =>
          import('./features/adjustments/employee-adjustments').then(
            (m) => m.EmployeeAdjustments,
          ),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/support/employee-support-chat').then(
            (m) => m.EmployeeSupportChat,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
