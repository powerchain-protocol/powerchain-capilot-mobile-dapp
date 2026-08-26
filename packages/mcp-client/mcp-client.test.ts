import assert from 'node:assert/strict';
import test from 'node:test';
import { assertArgumentsSafe, assertSchemaSize, normalizeToolDescription } from './security.ts';
import { validateServerPolicy, assertToolAllowed } from './policy.ts';
import { mcpFunctionName } from './names.ts';

test('production MCP policy requires explicit allowedTools', () => {
  assert.throws(() => validateServerPolicy({ id: 'energy', url: 'https://mcp.example.com', allowedTools: [] }, true));
});

test('tool needs operator allowlist and external readOnlyHint', () => {
  const server = { id: 'energy', url: 'https://mcp.example.com', allowedTools: ['search_assets'] };
  assert.doesNotThrow(() => assertToolAllowed({ server, toolName: 'search_assets', readOnlyHint: true }));
  assert.throws(() => assertToolAllowed({ server, toolName: 'search_assets', readOnlyHint: false }));
});

test('credential-shaped argument fields are blocked', () => {
  assert.throws(() => assertArgumentsSafe({ query: 'ok', apiKey: 'secret' }));
  assert.doesNotThrow(() => assertArgumentsSafe({ query: 'ok' }));
});

test('tool metadata is normalized and bounded', () => {
  assert.equal(normalizeToolDescription('  hello\n world  '), 'hello world');
  assert.doesNotThrow(() => assertSchemaSize({ type: 'object' }));
  assert.match(mcpFunctionName('energy', 'search-assets'), /^mcp_energy_search_assets/);
});
