import { readFile, stat } from 'node:fs/promises';

const required = [
  'packages/operations-contracts/src/index.ts',
  'server/operations/gateway.ts',
  'server/src/routes/operations.ts',
  'backend/operations-api/package.json',
  'backend/operations-api/prisma/schema.prisma',
  'backend/operations-api/prisma/migrations/20260826090000_operations_hardening/migration.sql',
  'backend/operations-api/src/adapters/auth.ts',
  'backend/operations-api/src/adapters/action-access.ts',
  'backend/operations-api/src/adapters/wallet.ts',
  'backend/operations-api/src/clients/solana.ts',
  'backend/operations-api/src/clients/sui.ts',
  'backend/operations-api/src/clients/market-data.ts',
  'backend/operations-api/src/actions/safe-action.ts',
  'backend/operations-api/src/services/ingest.ts',
  'backend/operations-api/src/services/alarms.ts',
  'backend/operations-api/src/services/events.ts',
  'backend/operations-api/src/services/twin.ts',
  'apps/mobile/hooks/useOperationalQuery.ts',
  'apps/mobile/hooks/useOperationalSites.ts',
  'apps/mobile/hooks/useOperationalAlarms.ts',
  'apps/mobile/hooks/useOperationalEvents.ts',
  'apps/mobile/hooks/useOperationalTwin.ts',
  'apps/mobile/components/operations/DigitalTwinSummary.tsx',
  'apps/mobile/components/operations/OperationalAlarmList.tsx',
  'apps/mobile/components/operations/SiteSelector.tsx',
];
for (const path of required) await stat(path);

const publicRoute = await readFile('server/src/routes/operations.ts', 'utf8');
for (const fragment of ['/api/v1/health', '/api/v1/config', '/sites', '/ems/overview', '/iot/devices', '/depin/nodes', '/alarms', '/events', '/twin', '/market-data/prices', '/actions/prepare']) {
  if (!publicRoute.includes(fragment)) throw new Error(`Missing operations route fragment: ${fragment}`);
}
if (publicRoute.includes('/ingest/')) throw new Error('Provider ingestion routes must not be exposed through the public Fastify surface.');

const internalRoute = await readFile('backend/operations-api/src/routes/v1.ts', 'utf8');
for (const fragment of ['/v1/ingest/ems', '/v1/ingest/iot-heartbeats', '/v1/ingest/depin-heartbeats', '/v1/ingest/alarms', 'authorizeSafeAction']) {
  if (!internalRoute.includes(fragment)) throw new Error(`Missing hardened internal operations route: ${fragment}`);
}

const safe = await readFile('packages/operations-contracts/src/index.ts', 'utf8');
if (!safe.includes("'ems.dispatch.prepare': 'review_required'")) throw new Error('EMS dispatch must remain review-required.');
if (!safe.includes("'settlement.prepare': 'wallet_signature_required'")) throw new Error('Settlement must require wallet signature.');
if (!safe.includes("'alarm.acknowledge.prepare': 'review_required'")) throw new Error('Alarm acknowledgement must be prepared/reviewed, never directly executed.');
if (!safe.includes('assertIngestEnvelope')) throw new Error('Bounded ingestion contract is missing.');

const action = await readFile('backend/operations-api/src/actions/safe-action.ts', 'utf8');
if (!action.includes('safeActionRequestHash')) throw new Error('Safe-action idempotency keys must be bound to a request hash.');
if (action.includes('.execute(') || action.includes('executeDispatch')) throw new Error('Safe-action preparation layer must not execute physical work.');

const migration = await readFile('backend/operations-api/prisma/migrations/20260826090000_operations_hardening/migration.sql', 'utf8');
for (const fragment of ['ingest_receipts', 'operational_alarms', 'operational_events', 'append-only', 'request_hash']) {
  if (!migration.includes(fragment)) throw new Error(`Operations hardening migration missing: ${fragment}`);
}

const env = await readFile('.env.server.example', 'utf8');
for (const key of [
  'OPERATIONS_BACKEND_URL=', 'OPERATIONS_BACKEND_BEARER_SECRET=', 'OPERATIONS_DATA_MODE=unavailable',
  'ALARMS_ENABLED=true', 'EVENTS_ENABLED=true', 'DIGITAL_TWIN_ENABLED=true',
  'OPERATIONS_PAGE_SIZE_DEFAULT=50', 'OPERATIONS_INGEST_BATCH_MAX=100',
]) {
  if (!env.includes(key)) throw new Error(`Missing environment contract: ${key}`);
}

console.log('Operations integration static verification passed.');
