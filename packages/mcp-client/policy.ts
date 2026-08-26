import type { McpServerConfig } from './types.ts';

export function validateServerPolicy(server: McpServerConfig, production = process.env.NODE_ENV === 'production') {
  if (!server.id.trim()) throw new Error('MCP server id is required.');
  if (production && (!Array.isArray(server.allowedTools) || server.allowedTools.length === 0)) {
    throw new Error(`Production MCP server ${server.id} requires explicit non-empty allowedTools.`);
  }
  if (new Set(server.allowedTools).size !== server.allowedTools.length) throw new Error(`Duplicate allowedTools for MCP server ${server.id}.`);
  return server;
}

export function assertToolAllowed(input: { server: McpServerConfig; toolName: string; readOnlyHint: unknown }) {
  if (!input.server.allowedTools.includes(input.toolName)) throw new Error(`MCP tool is not operator-allowlisted: ${input.server.id}/${input.toolName}`);
  if (input.readOnlyHint !== true) throw new Error(`MCP tool is not externally classified read-only: ${input.server.id}/${input.toolName}`);
}
