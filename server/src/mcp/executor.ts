import { PowerChainMcpClient } from '../../../packages/mcp-client/client.ts';
import { mcpFunctionName } from '../../../packages/mcp-client/names.ts';
import type { ManagedTool } from '../../../packages/ai-providers/types.ts';
import type { McpAuditWriter } from './audit.ts';
import { hashAuditPayload, redactMcpArguments } from './audit.ts';
import { loadMcpConfig } from './config.ts';

export function createAuditedMcpExecutor(input: { source?: NodeJS.ProcessEnv; audit?: McpAuditWriter }) {
  const config = loadMcpConfig(input.source ?? process.env);
  const client = new PowerChainMcpClient(config.servers, config.allowedHosts);
  let cache: Awaited<ReturnType<typeof client.listTools>> | null = null;
  return {
    async tools(): Promise<ManagedTool[]> {
      cache = await client.listTools();
      return cache.map((tool) => ({ name: tool.functionName, description: tool.description, inputSchema: tool.inputSchema }));
    },
    async execute(context: { userId: string; conversationId?: string; reservationId?: string; requestId?: string; call: { id: string; name: string; arguments: Record<string, unknown> } }) {
      const descriptor = (cache ?? await client.listTools()).find((tool) => tool.functionName === context.call.name);
      if (!descriptor) throw new Error(`Unknown MCP function: ${context.call.name}`);
      const startedAt = new Date();
      const audit = input.audit ? await input.audit.start({
        userId: context.userId,
        conversationId: context.conversationId,
        reservationId: context.reservationId,
        requestId: context.requestId,
        serverId: descriptor.serverId,
        toolName: descriptor.externalName,
        functionName: mcpFunctionName(descriptor.serverId, descriptor.externalName),
        arguments: context.call.arguments,
        redactedArguments: redactMcpArguments(context.call.arguments),
        argumentHash: hashAuditPayload(context.call.arguments),
        startedAt,
      }) : null;
      try {
        const result = await client.callFunction(context.call.name, context.call.arguments);
        if (audit) await input.audit!.finish(audit.id, { status: 'completed', resultHash: result.resultHash, latencyMs: Date.now() - startedAt.getTime(), completedAt: new Date() });
        return result;
      } catch (error) {
        if (audit) await input.audit!.finish(audit.id, { status: 'failed', error: error instanceof Error ? error.message.slice(0, 2_000) : String(error).slice(0, 2_000), latencyMs: Date.now() - startedAt.getTime(), completedAt: new Date() });
        throw error;
      }
    },
  };
}
