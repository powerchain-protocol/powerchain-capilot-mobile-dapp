import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const rootPkg = JSON.parse(read('package.json'));
const expressPkg = JSON.parse(read('backend/express/package.json'));
const client = read('packages/mcp-client/client.ts');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(rootPkg.packageManager === 'pnpm@11.24.0', 'Expected pnpm@11.24.0 packageManager pin.');
assert(rootPkg.dependencies?.['@modelcontextprotocol/client'] === '2.0.0', 'MCP v2 must use @modelcontextprotocol/client@2.0.0.');
assert(!rootPkg.dependencies?.['@modelcontextprotocol/sdk'], 'Legacy monolithic @modelcontextprotocol/sdk must not be declared at the root.');
assert(!expressPkg.dependencies?.['@modelcontextprotocol/sdk'], 'Express gateway must not carry the unused legacy MCP SDK dependency.');
assert(client.includes("import('@modelcontextprotocol/client')"), 'PowerChainMcpClient must import the v2 client package.');
assert(!client.includes('@modelcontextprotocol/sdk/'), 'No v1 monolithic MCP import path may remain.');
assert(client.includes("versionNegotiation: { mode: 'auto' }"), 'MCP client must negotiate modern 2026-07-28 with legacy fallback.');

console.log('MCP SDK dependency contract OK: @modelcontextprotocol/client 2.0.0, pnpm 11.24.0.');
