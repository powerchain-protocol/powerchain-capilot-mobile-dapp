import { createHash } from 'node:crypto';

export function mcpFunctionName(serverId: string, toolName: string) {
  const base = `mcp_${serverId}_${toolName}`.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
  if (base.length <= 64) return base;
  const suffix = createHash('sha256').update(`${serverId}/${toolName}`).digest('hex').slice(0, 10);
  return `${base.slice(0, 53)}_${suffix}`;
}
