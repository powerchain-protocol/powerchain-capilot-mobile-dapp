import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { mcpFunctionName } from "./names.js";
import { assertMcpUrlAllowed, assertSafeArguments } from "./security.js";
import type { McpSecurityLimits, McpServerDefinition, McpToolCallResult, McpToolDescriptor } from "./types.js";

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`MCP timeout after ${ms}ms`)), ms)),
  ]);
}

async function connect(server: McpServerDefinition, limits: McpSecurityLimits) {
  const client = new Client({ name: "powerchain-copilot", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(server.url), {
    requestInit: {
      redirect: "error",
      headers: server.authorizationHeader ? { Authorization: server.authorizationHeader } : undefined,
    },
  });
  await timeout(client.connect(transport), limits.timeoutMs);
  return client;
}

export async function listMcpTools(input: {
  server: McpServerDefinition;
  limits: McpSecurityLimits;
  production: boolean;
  allowedHosts: Set<string>;
}): Promise<McpToolDescriptor[]> {
  await assertMcpUrlAllowed(input);
  if (input.production && input.server.allowedTools.length === 0) {
    throw new Error(`Production MCP server ${input.server.id} requires an explicit allowedTools list.`);
  }
  const client = await connect(input.server, input.limits);
  try {
    const result = await timeout(client.listTools(), input.limits.timeoutMs);
    const tools = result.tools.slice(0, input.limits.maxTools);
    return tools.flatMap((tool) => {
      const allowed = input.server.allowedTools.includes(tool.name);
      const readOnly = tool.annotations?.readOnlyHint === true;
      if (!allowed || !readOnly) return [];
      const inputSchema = (tool.inputSchema ?? { type: "object", properties: {} }) as Record<string, unknown>;
      if (Buffer.byteLength(JSON.stringify(inputSchema), "utf8") > input.limits.maxToolSchemaBytes) return [];
      return [{
        serverId: input.server.id,
        serverUrl: input.server.url,
        name: tool.name,
        functionName: mcpFunctionName(input.server.id, tool.name),
        description: String(tool.description ?? "Read-only MCP tool").replace(/\s+/g, " ").slice(0, 500),
        inputSchema,
        readOnly,
      }];
    });
  } finally {
    await client.close().catch(() => undefined);
  }
}

export async function callMcpTool(input: {
  server: McpServerDefinition;
  toolName: string;
  arguments: Record<string, unknown>;
  limits: McpSecurityLimits;
  production: boolean;
  allowedHosts: Set<string>;
}): Promise<McpToolCallResult> {
  await assertMcpUrlAllowed(input);
  if (!input.server.allowedTools.includes(input.toolName)) throw new Error("MCP tool is outside the configured allowlist.");
  assertSafeArguments(input.arguments, input.limits);
  const started = Date.now();
  const client = await connect(input.server, input.limits);
  try {
    const listed = await timeout(client.listTools(), input.limits.timeoutMs);
    const tool = listed.tools.find((item) => item.name === input.toolName);
    if (!tool || tool.annotations?.readOnlyHint !== true) throw new Error("MCP execution requires a read-only tool declaration.");
    const result = await timeout(client.callTool({ name: input.toolName, arguments: input.arguments }), input.limits.timeoutMs);
    const parts: string[] = [];
    for (const content of result.content ?? []) {
      if (content.type === "text" && typeof content.text === "string") parts.push(content.text);
      else if (content.type === "resource" && "resource" in content) parts.push(JSON.stringify(content.resource));
    }
    const text = (parts.join("\n") || "(tool returned no text content)").slice(0, input.limits.maxResultChars);
    return {
      serverId: input.server.id,
      toolName: input.toolName,
      functionName: mcpFunctionName(input.server.id, input.toolName),
      content: text,
      isError: Boolean(result.isError),
      latencyMs: Date.now() - started,
    };
  } finally {
    await client.close().catch(() => undefined);
  }
}
