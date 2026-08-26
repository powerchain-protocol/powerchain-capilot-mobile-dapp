import { parseMcpRegistry } from '../../../packages/mcp-client/registry.ts';

export function loadMcpConfig(source: NodeJS.ProcessEnv = process.env) {
  const production = (source.NODE_ENV || 'development') === 'production';
  const servers = parseMcpRegistry(source.MCP_SERVERS_JSON || '[]', production);
  const allowedHosts = new Set((source.MCP_ALLOWED_HOSTS || '').split(',').map((value) => value.trim()).filter(Boolean));
  for (const server of servers) {
    const host = new URL(server.url).hostname;
    if (production && !allowedHosts.has(host)) {
      throw new Error(`Production MCP hostname must be explicitly present in MCP_ALLOWED_HOSTS: ${host}`);
    }
    if (!production && allowedHosts.size === 0) allowedHosts.add(host);
  }
  return {
    servers,
    allowedHosts,
    internalBearerSecret: source.MCP_INTERNAL_BEARER_SECRET?.trim() || '',
  };
}
