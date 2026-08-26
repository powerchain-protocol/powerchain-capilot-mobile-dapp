import type { OperationsPrismaClient } from '../db/prisma.ts';
import type { SafeActionDecision, SafeActionRequest, AuthPrincipal } from '@powerchain/operations-contracts';
import type { SafeActionStore, StoredSafeAction } from './safe-action.ts';

function fromRow(row: {
  id: string; action: string; risk: string; status: string; requiresHumanApproval: boolean; requiresWalletSignature: boolean; expiresAt: Date; simulation: unknown; policyReasons: unknown; requestHash: string;
}): StoredSafeAction {
  return {
    requestHash: row.requestHash,
    decision: {
      requestId: row.id,
      action: row.action as SafeActionDecision['action'],
      risk: row.risk as SafeActionDecision['risk'],
      status: row.status as SafeActionDecision['status'],
      requiresHumanApproval: row.requiresHumanApproval,
      requiresWalletSignature: row.requiresWalletSignature,
      expiresAt: row.expiresAt.toISOString(),
      simulation: row.simulation && typeof row.simulation === 'object' && !Array.isArray(row.simulation) ? row.simulation as Record<string, unknown> : undefined,
      policyReasons: Array.isArray(row.policyReasons) ? row.policyReasons.filter((value): value is string => typeof value === 'string') : [],
    },
  };
}

export class PrismaSafeActionStore implements SafeActionStore {
  constructor(private readonly prisma: OperationsPrismaClient) {}

  async findByIdempotencyKey(userId: string, idempotencyKey: string) {
    const row = await this.prisma.safeActionIntent.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } } });
    return row ? fromRow(row) : null;
  }

  async create(input: { principal: AuthPrincipal; request: SafeActionRequest; decision: SafeActionDecision; requestHash: string }) {
    try {
      const row = await this.prisma.safeActionIntent.create({
        data: {
          id: input.decision.requestId,
          userId: input.principal.userId,
          organizationId: input.principal.organizationId ?? null,
          action: input.request.action,
          resourceId: input.request.resourceId,
          reason: input.request.reason,
          risk: input.decision.risk,
          status: input.decision.status,
          idempotencyKey: input.request.idempotencyKey,
          requestHash: input.requestHash,
          parameters: JSON.parse(JSON.stringify(input.request.parameters ?? {})),
          simulation: input.decision.simulation === undefined ? undefined : JSON.parse(JSON.stringify(input.decision.simulation)),
          requiresHumanApproval: input.decision.requiresHumanApproval,
          requiresWalletSignature: input.decision.requiresWalletSignature,
          policyReasons: JSON.parse(JSON.stringify(input.decision.policyReasons)),
          expiresAt: new Date(input.decision.expiresAt),
        },
      });
      return fromRow(row);
    } catch (error) {
      const existing = await this.findByIdempotencyKey(input.principal.userId, input.request.idempotencyKey);
      if (existing) return existing;
      throw error;
    }
  }
}
