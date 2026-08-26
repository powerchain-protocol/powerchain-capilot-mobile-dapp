import type { FastifyInstance } from 'fastify';
import { buildOpenApiDocument } from '../../openapi/spec.ts';

const SWAGGER_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>PowerChain Copilot Mobile API v1</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>body{margin:0;background:#f7f8f7} .topbar{display:none}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>window.ui=SwaggerUIBundle({url:'/api/v1/openapi.json',dom_id:'#swagger-ui',deepLinking:true,displayRequestDuration:true,persistAuthorization:false,tryItOutEnabled:true});</script>
</body>
</html>`;

export async function registerApiDocsRoutes(app: FastifyInstance) {
  app.get('/api/v1/openapi.json', async (_request, reply) => reply
    .header('cache-control', 'public, max-age=300')
    .header('content-type', 'application/json; charset=utf-8')
    .send(buildOpenApiDocument()));

  for (const path of ['/api/v1/swagger', '/api/v1/swagger/']) {
    app.get(path, async (_request, reply) => reply
      .header('cache-control', 'no-store')
      .header('content-security-policy', "default-src 'none'; style-src 'self' https://unpkg.com 'unsafe-inline'; script-src 'self' https://unpkg.com 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src https://unpkg.com")
      .type('text/html; charset=utf-8')
      .send(SWAGGER_HTML));
  }
}
