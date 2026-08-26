import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOpenApiDocument } from '../openapi/spec.ts';
import { PrismaAiMemoryService } from '../ai/memory/service.ts';
import { listMcpAgentProfiles } from '../src/mcp/agents/registry.ts';

const SECRET = '0123456789abcdef0123456789abcdef';

test('OpenAPI v1 publishes secure platform and prepare-only operational boundaries', () => {
  const document = buildOpenApiDocument();
  const paths = document.paths as Record<string, unknown>;
  for (const path of [
    '/api/v1/ai/runtime',
    '/api/v1/ai/readiness',
    '/api/v1/chat/conversations',
    '/api/v1/ai/memory',
    '/api/v1/twin',
    '/api/v1/telemetry/integrity',
    '/api/v1/alarms',
    '/api/v1/events',
    '/api/v1/actions/prepare',
    '/api/v1/actions/execute',
    '/api/v1/credits/receipts/{receiptId}',
    '/api/v1/copilot/responses',
  ]) assert.ok(paths[path], `missing ${path}`);
  const serialized = JSON.stringify(document);
  assert.match(serialized, /PHYSICAL_EXECUTION_DISABLED/);
  assert.match(serialized, /Completed response already settled with signed receipt/);
  assert.match(serialized, /ed25519:/);
  assert.doesNotMatch(serialized, /HELIUS_API_KEY|PAYMENT_KERNEL_WEBHOOK_SECRET|MESSAGE_ENCRYPTION_KEY|adapterPath/);
});

test('AI memory listing returns safe decrypted DTOs with ids but no ciphertext', async () => {
  const rows: any[] = [];
  const delegate = {
    async findMany(args: any) { return rows.filter((row) => row.userId === args.where.userId).slice(0, args.take); },
    async create(args: any) { const row = { id: `mem_${rows.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() }; rows.push(row); return row; },
    async deleteMany() { return { count: 0 }; },
  };
  const memory = new PrismaAiMemoryService(delegate, SECRET);
  await memory.remember({ userId: 'u1', kind: 'context', content: 'Use site-scoped telemetry evidence.' });
  const listed = await memory.listMemories({ userId: 'u1' });
  assert.equal(listed.length, 1);
  assert.equal(listed[0]?.id, 'mem_1');
  assert.equal(listed[0]?.content, 'Use site-scoped telemetry evidence.');
  assert.equal('contentCiphertext' in (listed[0] as object), false);
  assert.notEqual(rows[0]?.contentCiphertext, listed[0]?.content);
});

test('MCP agent profiles only narrow tool visibility and remain bounded', () => {
  const agents = listMcpAgentProfiles();
  assert.deepEqual(agents.map((agent) => agent.id).sort(), ['analyst', 'capital', 'operator', 'researcher', 'risk']);
  assert.equal(agents.every((agent) => agent.maxToolCalls > 0 && agent.maxToolCalls <= 8), true);
  assert.equal(agents.find((agent) => agent.id === 'researcher')?.allowedFunctionPrefixes.includes('energy__'), true);
});
