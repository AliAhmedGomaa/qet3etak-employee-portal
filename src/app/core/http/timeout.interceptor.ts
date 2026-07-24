import { HttpInterceptorFn } from '@angular/common/http';
import { timeout, catchError, throwError } from 'rxjs';

/** Prevent infinite spinners when the API is down or unreachable. */
export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  // Multipart uploads (registration photo, etc.) need a longer window.
  const ms = req.body instanceof FormData ? 60000 : 12000;
  return next(req).pipe(
    timeout(ms),
    catchError((err) =>
      throwError(() =>
        err?.name === 'TimeoutError'
          ? { status: 0, message: 'انتهت مهلة الاتصال بالخادم', error: err }
          : err,
      ),
    ),
  );
};
