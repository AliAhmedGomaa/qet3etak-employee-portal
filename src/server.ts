/**
 * Netlify-compatible SSR request handler (Angular App Engine).
 * Also boots a local Express server when run via `npm run serve:ssr:shop-owner`.
 */
import {
  AngularAppEngine,
  createRequestHandler,
} from '@angular/ssr';
import {
  getAllowedHosts,
  getContext,
  getTrustProxyHeaders,
} from '@netlify/angular-runtime/app-engine.js';

const angularAppEngine = new AngularAppEngine({
  allowedHosts: getAllowedHosts(),
  trustProxyHeaders: getTrustProxyHeaders(),
});

export async function netlifyAppEngineHandler(
  request: Request,
): Promise<Response> {
  const context = getContext();
  const result = await angularAppEngine.handle(request, context);
  return result || new Response('Not found', { status: 404 });
}

/**
 * Request handler used by the Angular CLI (dev-server / build) and by Netlify.
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);

// —— Local Node SSR (Express) — only when this file is the process entry ——
async function startLocalNodeServer(): Promise<void> {
  const {
    AngularNodeAppEngine,
    createNodeRequestHandler,
    isMainModule,
    writeResponseToNodeResponse,
  } = await import('@angular/ssr/node');
  const { default: express } = await import('express');
  const { join } = await import('node:path');

  if (!isMainModule(import.meta.url) && !process.env['pm_id']) {
    return;
  }

  const browserDistFolder = join(import.meta.dirname, '../browser');
  const app = express();
  const angularApp = new AngularNodeAppEngine();

  app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );

  app.use((req, res, next) => {
    angularApp
      .handle(req)
      .then((response) =>
        response ? writeResponseToNodeResponse(response, res) : next(),
      )
      .catch(next);
  });

  const port = process.env['PORT'] || 4000;
  app.listen(port, (error?: Error) => {
    if (error) throw error;
    console.log(`Node Express server listening on http://localhost:${port}`);
  });

  // Keep createNodeRequestHandler referenced so tree-shaking doesn't drop the import path.
  void createNodeRequestHandler;
}

void startLocalNodeServer();
