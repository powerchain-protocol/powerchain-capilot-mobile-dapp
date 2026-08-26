import { randomUUID } from 'node:crypto';
import { assertSafeActionRequest, classifySafeAction, type AuthPrincipal, type SafeActionDecision, type SafeActionRequest } from '@powerchain/operations-contracts';
import { OperationsApiError } from '../errors.ts';
import { sha256Canonical } from '../lib/canonical.ts';

export type StoredSafeAction = { decision: SafeActionDecision; requestHash: string };

export interface SafeActionStore {
  findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<StoredSafeAction | null>;
  create(input: { principal: AuthPrincipal; request: SafeActionRequest; decision: SafeActionDecision; requestHash: string }): Promise<StoredSafeAction>;
}

export function safeActionRequestHash(request: SafeActionRequest) {
  return sha256Canonical({
    action: request.action,
    resourceId: request.resourceId,
    reason: request.reason,
    idempotencyKey: request.idempotencyKey,
    parameters: request.parameters ?? {},
  });
}

function currentDecision(decision: SafeActionDecision): SafeActionDecision {
  if (decision.status === 'prepared' && Date.parse(decision.expiresAt) <= Date.now()) return { ...decision, status: 'expired' };
  return decision;
}

export class SafeActionService {
  constructor(private readonly store: SafeActionStore, private readonly ttlSeconds: number) {}

  async prepare(principal: AuthPrincipal, request: SafeActionRequest): Promise<SafeActionDecision> {
    assertSafeActionRequest(request);
    const requestHash = safeActionRequestHash(request);
    const existing = await this.store.findByIdempotencyKey(principal.userId, request.idempotencyKey);
    if (existing) {
      if (existing.requestHash !== requestHash) throw new OperationsApiError('IDEMPOTENCY_KEY_REUSE', 'The idempotency key was already used for a different safe-action request.', 409);
      return currentDecision(existing.decision);
    }

    const risk = classifySafeAction(request.action);
    const requiresHumanApproval = risk !== 'read_only';
    const requiresWalletSignature = risk === 'wallet_signature_required';
    const policyReasons = risk === 'read_only'
      ? ['Read-only action; no physical or financial state mutation is authorized.']
      : requiresWalletSignature
        ? ['Preparation only.', 'Explicit human approval is required.', 'Execution requires a user-controlled wallet signature.']
        : ['Preparation only.', 'Explicit human approval is required before execution.', 'Physical-state execution remains outside this endpoint.'];

    const simulation = request.action === 'ems.dispatch.prepare'
      ? { status: 'required_before_execution' }
      : request.action === 'alarm.acknowledge.prepare'
        ? { status: 'acknowledgement_requires_confirmation' }
        : undefined;

    const decision: SafeActionDecision = {
      requestId: randomUUID(),
      action: request.action,
      risk,
      status: 'prepared',
      requiresHumanApproval,
      requiresWalletSignature,
      expiresAt: new Date(Date.now() + this.ttlSeconds * 1000).toISOString(),
      simulation,
      policyReasons,
    };
    const created = await this.store.create({ principal, request, decision, requestHash });
    if (created.requestHash !== requestHash) throw new OperationsApiError('IDEMPOTENCY_KEY_REUSE', 'The idempotency key was concurrently used for a different safe-action request.', 409);
    return currentDecision(created.decision);
  }
}
