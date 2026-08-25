import { z } from "zod";
import { env } from "../config/env.js";
import type { McpSecurityLimits, McpServerDefinition } from "@powerchain/mcp-client";

const serverSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,32}$/),
  url: z.string().url(),
  allowedTools: z.array(z.string().min(1)).max(64),
  authorizationHeader: z.string().min(1).optional(),
});

export function mcpConfiguration(): {
  enabled: boolean;
  servers: McpServerDefinition[];
  allowedHosts: Set<string>;
  limits: McpSecurityLimits;
} {
  let servers: McpServerDefinition[] = [];
  if (env.MCP_SERVERS_JSON.trim()) {
    const raw = JSON.parse(env.MCP_SERVERS_JSON);
    servers = z.array(serverSchema).max(env.MCP_MAX_SERVERS).parse(raw);
  }
  return {
    enabled: env.MCP_ENABLED,
    servers,
    allowedHosts: new Set(env.MCP_ALLOWED_HOSTS.split(",").map((v) => v.trim()).filter(Boolean)),
    limits: {
      maxTools: env.MCP_MAX_TOOLS,
      maxToolCalls: env.MCP_MAX_TOOL_CALLS,
      maxArgumentBytes: env.MCP_MAX_ARGUMENT_BYTES,
      maxToolSchemaBytes: env.MCP_MAX_TOOL_SCHEMA_BYTES,
      maxResultChars: env.MCP_MAX_RESULT_CHARS,
      timeoutMs: env.MCP_TOOL_TIMEOUT_MS,
    },
  };
}
