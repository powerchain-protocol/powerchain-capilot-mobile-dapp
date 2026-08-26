import { mkdirSync, writeFileSync } from 'node:fs';
import { buildOpenApiDocument } from '../server/openapi/spec.ts';

const root = new URL('../', import.meta.url);
const out = new URL('docs/api/', root);
mkdirSync(out, { recursive: true });
mkdirSync(new URL('postman/', out), { recursive: true });

const spec = buildOpenApiDocument();
writeFileSync(new URL('openapi-v1.json', out), `${JSON.stringify(spec, null, 2)}\n`);

const items = [
  ['System', 'GET', '/health/live'],
  ['System', 'GET', '/health/ready'],
  ['System', 'GET', '/api/v1/health'],
  ['System', 'GET', '/api/v1/config'],
  ['System', 'GET', '/api/v1/diagnostics'],
  ['AI', 'GET', '/api/v1/ai/runtime'],
  ['AI', 'GET', '/api/v1/ai/readiness'],
  ['AI', 'GET', '/api/v1/ai/agents'],
  ['AI', 'GET', '/api/v1/ai/lora'],
  ['Chat', 'POST', '/api/v1/chat/conversations', { title: 'Solar Farm Analysis' }],
  ['Chat', 'GET', '/api/v1/chat/conversations'],
  ['AI Memory', 'GET', '/api/v1/ai/memory'],
  ['AI Memory', 'POST', '/api/v1/ai/memory', { kind: 'context', content: 'Prefer evidence-linked operational summaries.' }],
  ['Credits', 'GET', '/api/v1/credits/pricing'],
  ['Credits', 'GET', '/api/v1/credits/account'],
  ['Credits', 'GET', '/api/v1/credits/ledger'],
  ['Credits', 'POST', '/api/v1/credits/quotes', { quantity: 1 }],
  ['Copilot', 'POST', '/api/v1/copilot/responses', { message: 'Summarize current renewable operations.', agent: 'operator' }],
  ['Copilot', 'POST', '/api/v1/copilot/delivery-ack', { reservationId: '{{reservationId}}' }],
  ['Credits', 'GET', '/api/v1/credits/quotes/{{quoteHash}}'],
  ['Credits', 'GET', '/api/v1/credits/receipts/{{receiptId}}'],
  ['Operations', 'GET', '/api/v1/sites'],
  ['Operations', 'GET', '/api/v1/twin?siteId={{siteId}}'],
  ['Operations', 'GET', '/api/v1/telemetry/integrity?siteId={{siteId}}'],
  ['Operations', 'GET', '/api/v1/ems/overview?siteId={{siteId}}'],
  ['Operations', 'GET', '/api/v1/iot/devices?siteId={{siteId}}&limit=50'],
  ['Operations', 'GET', '/api/v1/depin/nodes?siteId={{siteId}}&limit=50'],
  ['Operations', 'GET', '/api/v1/alarms?siteId={{siteId}}&state=open'],
  ['Operations', 'GET', '/api/v1/events?siteId={{siteId}}&limit=50'],
  ['Safe Actions', 'POST', '/api/v1/actions/prepare', { action: 'iot.device.refresh', resourceId: '{{resourceId}}', reason: 'Prepare a safe read-only refresh.', idempotencyKey: 'postman:refresh:12345678' }],
  ['Safe Actions', 'POST', '/api/v1/actions/execute', { action: 'ems.dispatch.prepare' }],
];

const groups = new Map();
for (const [group, method, path, body] of items) {
  const list = groups.get(group) ?? [];
  const raw = `{{baseUrl}}${path}`;
  const headers = [{ key: 'Accept', value: 'application/json' }];
  if (!['/health/live', '/health/ready', '/api/v1/health', '/api/v1/config'].some((suffix) => path.startsWith(suffix))) {
    headers.push({ key: 'Authorization', value: 'Bearer {{accessToken}}' });
  }
  if (method === 'POST') headers.push({ key: 'Content-Type', value: 'application/json' });
  if (path === '/api/v1/actions/prepare') headers.push({ key: 'Idempotency-Key', value: 'postman:refresh:12345678' });
  if (path === '/api/v1/credits/quotes') headers.push({ key: 'Idempotency-Key', value: 'postman:quote:12345678' });
  if (path === '/api/v1/copilot/responses') headers.push({ key: 'Idempotency-Key', value: 'postman:copilot:12345678' });
  list.push({
    name: `${method} ${path.split('?')[0]}`,
    request: {
      method,
      header: headers,
      url: { raw, host: ['{{baseUrl}}'], path: path.split('?')[0].split('/').filter(Boolean), query: path.includes('?') ? [...new URLSearchParams(path.split('?')[1])].map(([key, value]) => ({ key, value })) : [] },
      ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
      description: path === '/api/v1/actions/execute' ? 'Expected to fail closed with HTTP 405 PHYSICAL_EXECUTION_DISABLED.' : undefined,
    },
  });
  groups.set(group, list);
}

const collection = {
  info: {
    name: 'PowerChain Copilot Mobile API v1',
    description: 'Secure chat/memory/LLM/LoRA/agent boundaries, PWRC billing, tenant-scoped operations, telemetry integrity, alarms/events, diagnostics and prepare-only Safe Actions. Physical execution is disabled.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [...groups.entries()].map(([name, item]) => ({ name, item })),
  variable: [
    { key: 'baseUrl', value: 'http://127.0.0.1:8000' },
    { key: 'accessToken', value: '' },
    { key: 'siteId', value: '' },
    { key: 'resourceId', value: '' },
    { key: 'quoteHash', value: '' },
    { key: 'receiptId', value: '' },
    { key: 'reservationId', value: '' },
  ],
};
writeFileSync(new URL('postman/PowerChain-Copilot-Mobile-v1.postman_collection.json', out), `${JSON.stringify(collection, null, 2)}\n`);

const environment = {
  id: 'powerchain-copilot-mobile-local',
  name: 'PowerChain Copilot Mobile - Local',
  values: [
    { key: 'baseUrl', value: 'http://127.0.0.1:8000', enabled: true },
    { key: 'accessToken', value: '', type: 'secret', enabled: true },
    { key: 'siteId', value: '', enabled: true },
    { key: 'resourceId', value: '', enabled: true },
    { key: 'quoteHash', value: '', enabled: true },
    { key: 'receiptId', value: '', enabled: true },
    { key: 'reservationId', value: '', enabled: true },
  ],
  _postman_variable_scope: 'environment',
  _postman_exported_using: 'PowerChain Copilot Mobile 1.0.0',
};
writeFileSync(new URL('postman/PowerChain-Copilot-Mobile-Local.postman_environment.json', out), `${JSON.stringify(environment, null, 2)}\n`);
console.log('Generated OpenAPI and Postman artifacts.');
