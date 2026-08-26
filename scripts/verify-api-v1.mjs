import { existsSync, readFileSync } from 'node:fs';

const required = [
  'server/openapi/spec.ts',
  'server/src/routes/api-docs.ts',
  'server/src/routes/ai-boundaries.ts',
  'docs/api/openapi-v1.json',
  'docs/api/postman/PowerChain-Copilot-Mobile-v1.postman_collection.json',
  'docs/api/postman/PowerChain-Copilot-Mobile-Local.postman_environment.json',
  'docs/API_V1.md',
  'apps/mobile/skills/OPERATIONS.md',
  'apps/mobile/skills/TELEMETRY.md',
  'apps/mobile/skills/SAFE_ACTIONS.md',
  'apps/mobile/skills/AGENTS.md',
  'apps/mobile/hooks/useTelemetryIntegrity.ts',
  'apps/mobile/components/operations/TelemetryIntegrityCard.tsx',
];
for (const path of required) if (!existsSync(path)) throw new Error(`Missing API v1 extension file: ${path}`);

const openapi = JSON.parse(readFileSync('docs/api/openapi-v1.json', 'utf8'));
if (openapi.openapi !== '3.1.0' || openapi.info?.version !== '1.0.0') throw new Error('OpenAPI version contract is invalid.');
for (const path of ['/api/v1/ai/runtime', '/api/v1/ai/readiness', '/api/v1/telemetry/integrity', '/api/v1/actions/execute', '/api/v1/credits/receipts/{receiptId}', '/api/v1/copilot/responses']) {
  if (!openapi.paths?.[path]) throw new Error(`OpenAPI missing ${path}`);
}
const openapiText = JSON.stringify(openapi);
for (const secret of ['HELIUS_API_KEY', 'PAYMENT_KERNEL_WEBHOOK_SECRET', 'MESSAGE_ENCRYPTION_KEY', 'SETTINGS_ENCRYPTION_KEY', 'adapterPath']) {
  if (openapiText.includes(secret)) throw new Error(`OpenAPI leaks or documents secret field ${secret}`);
}

const postman = JSON.parse(readFileSync('docs/api/postman/PowerChain-Copilot-Mobile-v1.postman_collection.json', 'utf8'));
if (postman.info?.name !== 'PowerChain Copilot Mobile API v1') throw new Error('Postman collection identity mismatch.');
const postmanText = JSON.stringify(postman);
for (const route of ['/api/v1/telemetry/integrity', '/api/v1/actions/prepare', '/api/v1/actions/execute', '/api/v1/copilot/responses', '/api/v1/credits/receipts/{{receiptId}}']) if (!postmanText.includes(route)) throw new Error(`Postman missing ${route}`);

const fastifyOps = readFileSync('server/src/routes/operations.ts', 'utf8');
const expressOps = readFileSync('backend/operations-api/src/routes/v1.ts', 'utf8');
for (const source of [fastifyOps, expressOps]) {
  if (!source.includes('telemetry/integrity')) throw new Error('Telemetry integrity route missing.');
  if (!source.includes('PHYSICAL_EXECUTION_DISABLED')) throw new Error('Fail-closed execution boundary missing.');
}
if (!expressOps.includes('requireSiteAccess')) throw new Error('Operations backend no longer enforces site scope.');

const aiRoutes = readFileSync('server/src/routes/ai-boundaries.ts', 'utf8');
for (const route of ['ai/runtime', 'ai/readiness', 'ai/agents', 'ai/lora']) if (!aiRoutes.includes(route)) throw new Error(`AI boundary route missing: ${route}`);
if (aiRoutes.includes('adapterPath:')) throw new Error('AI route may not expose LoRA adapter paths.');

const safeActionDocs = readFileSync('apps/mobile/skills/SAFE_ACTIONS.md', 'utf8');
if (!safeActionDocs.includes('405 PHYSICAL_EXECUTION_DISABLED')) throw new Error('Safe Actions docs must state disabled execution.');

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
if (packageJson.version !== '1.0.0') throw new Error('Product version changed unexpectedly.');
console.log('API v1 / Swagger / Postman / secure platform extension verification passed');
