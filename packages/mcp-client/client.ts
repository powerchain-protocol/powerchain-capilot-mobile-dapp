import { mcpFunctionName } from './names.ts';
import { assertToolAllowed } from './policy.ts';
import { MCP_LIMITS, assertArgumentsSafe, assertSafeMcpUrl, assertSchemaSize, normalizeMcpResult, normalizeToolDescription } from './security.ts';
import type { McpCallResult, McpServerConfig, McpToolDescriptor } from './types.ts';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => { timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms.`)), timeoutMs); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class PowerChainMcpClient {
  constructor(private readonly servers: McpServerConfig[], private readonly allowedHosts: Set<string>) {}

  private async connect(server: McpServerConfig) {
    await assertSafeMcpUrl(server.url, this.allowedHosts);
    const { Client, StreamableHTTPClientTransport } = await import('@modelcontextprotocol/client');
    const transport = new StreamableHTTPClientTransport(new URL(server.url), {
      requestInit: server.authToken ? { headers: { authorization: `Bearer ${server.authToken}` } } : undefined,
    });
    const client = new Client(
      { name: 'powerchain-copilot-mobile', version: '1.0.0' },
      { versionNegotiation: { mode: 'auto' } },
    );
    await withTimeout(client.connect(transport), server.timeoutMs ?? 15_000, `MCP connect ${server.id}`);
    return { client, transport };
  }

  async listTools(): Promise<McpToolDescriptor[]> {
    const output: McpToolDescriptor[] = [];
    for (const server of this.servers) {
      const { client } = await this.connect(server);
      try {
        const result = await withTimeout(client.listTools(), server.timeoutMs ?? 15_000, `MCP listTools ${server.id}`);
        for (const tool of result.tools) {
          if (output.length >= MCP_LIMITS.maxTools) throw new Error('MCP tool count limit exceeded.');
          assertToolAllowed({ server, toolName: tool.name, readOnlyHint: tool.annotations?.readOnlyHint });
          assertSchemaSize(tool.inputSchema);
          output.push({
            serverId: server.id,
            externalName: tool.name,
            functionName: mcpFunctionName(server.id, tool.name),
            description: normalizeToolDescription(tool.description),
            inputSchema: tool.inputSchema as Record<string, unknown>,
            readOnly: true,
          });
        }
      } finally {
        await client.close();
      }
    }
    return output;
  }

  async callFunction(functionName: string, args: Record<string, unknown>): Promise<McpCallResult> {
    assertArgumentsSafe(args);
    for (const server of this.servers) {
      const { client } = await this.connect(server);
      try {
        // Re-discover on the same connection immediately before execution so policy is checked at execution time.
        const listed = await withTimeout(client.listTools(), server.timeoutMs ?? 15_000, `MCP listTools ${server.id}`);
        const tool = listed.tools.find((candidate) => mcpFunctionName(server.id, candidate.name) === functionName);
        if (!tool) continue;
        assertToolAllowed({ server, toolName: tool.name, readOnlyHint: tool.annotations?.readOnlyHint });
        assertSchemaSize(tool.inputSchema);
        const result = await withTimeout(client.callTool({ name: tool.name, arguments: args }), server.timeoutMs ?? 15_000, `MCP call ${server.id}/${tool.name}`);
        return normalizeMcpResult(result.content);
      } finally {
        await client.close();
      }
    }
    throw new Error(`Unknown or unavailable MCP function: ${functionName}`);
  }
}
