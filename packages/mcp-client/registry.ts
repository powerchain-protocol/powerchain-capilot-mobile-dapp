import { validateServerPolicy } from './policy.ts';
import type { McpServerConfig } from './types.ts';

export function parseMcpRegistry(value = process.env.MCP_SERVERS_JSON || '[]', production = process.env.NODE_ENV === 'production') {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) throw new Error('MCP_SERVERS_JSON must be a JSON array.');
  const servers = parsed.map((item) => validateServerPolicy(item as McpServerConfig, production));
  const ids = new Set<string>();
  for (const server of servers) {
    if (ids.has(server.id)) throw new Error(`Duplicate MCP server id: ${server.id}`);
    ids.add(server.id);
  }
  return servers;
}
