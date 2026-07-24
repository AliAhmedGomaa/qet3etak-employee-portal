import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Dynamic, auth-driven app: render on demand per request instead of
    // prerendering (avoids build-time failures on param/guarded routes).
    path: '**',
    renderMode: RenderMode.Server,
  },
];
