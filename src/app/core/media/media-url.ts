import { environment } from '../../../environments/environment';

/** Resolve API-relative upload paths for <img src>. */
export function resolveMediaUrl(url?: string | null, fallback = ''): string {
  const value = url?.trim() ?? '';
  if (!value) return fallback;
  if (
    value.startsWith('http') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('icons/')
  ) {
    return value;
  }
  if (value.startsWith('/')) return `${environment.apiUrl}${value}`;
  return value;
}
