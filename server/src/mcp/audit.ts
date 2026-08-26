import { createHash } from 'node:crypto';

export type McpInvocationAuditInput = {
  userId: string;
  conversationId?: string;
  reservationId?: string;
  requestId?: string;
  serverId: string;
  toolName: string;
  functionName: string;
  arguments: Record<string, unknown>;
};

export interface McpAuditWriter {
  start(input: McpInvocationAuditInput & { argumentHash: string; redactedArguments: Record<string, unknown>; startedAt: Date }): Promise<{ id: string }>;
  finish(id: string, input: { status: 'completed' | 'failed'; resultHash?: string; error?: string; latencyMs: number; completedAt: Date }): Promise<void>;
}

const REDACT = /(api[_-]?key|secret|password|token|authorization|cookie|private[_-]?key|seed|mnemonic)/i;
export function redactMcpArguments(value: Record<string, unknown>) {
  const walk = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(walk);
    if (!input || typeof input !== 'object') return input;
    return Object.fromEntries(Object.entries(input as Record<string, unknown>).map(([key, child]) => [key, REDACT.test(key) ? '[REDACTED]' : walk(child)]));
  };
  return walk(value) as Record<string, unknown>;
}
export function hashAuditPayload(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }

export class PrismaLikeMcpAuditWriter implements McpAuditWriter {
  constructor(private readonly delegate: { create(input: { data: Record<string, unknown> }): Promise<{ id: string }>; update(input: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown> }) {}
  start(input: McpInvocationAuditInput & { argumentHash: string; redactedArguments: Record<string, unknown>; startedAt: Date }) {
    return this.delegate.create({ data: {
      userId: input.userId,
      conversationId: input.conversationId,
      pwrcReservationId: input.reservationId,
      requestId: input.requestId,
      serverId: input.serverId,
      toolName: input.toolName,
      functionName: input.functionName,
      readOnly: true,
      redactedArguments: input.redactedArguments,
      argumentHash: input.argumentHash,
      status: 'started',
      startedAt: input.startedAt,
    } });
  }
  async finish(id: string, input: { status: 'completed' | 'failed'; resultHash?: string; error?: string; latencyMs: number; completedAt: Date }) {
    await this.delegate.update({ where: { id }, data: { ...input } });
  }
}
