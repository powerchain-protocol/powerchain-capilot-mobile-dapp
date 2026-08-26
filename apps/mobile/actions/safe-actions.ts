import { prepareSafeAction } from '@/services/operations/client';
import type { SafeActionRequest, SafeActionType } from '@/types/operations';

function idempotencyKey(action: SafeActionType, resourceId: string) {
  const random = Math.random().toString(36).slice(2, 12);
  return `${action}:${resourceId}:${Date.now().toString(36)}:${random}`.replace(/[^A-Za-z0-9._:-]/g, '-').slice(0, 128);
}

export async function prepareOperationalAction(input: {
  accessToken: string;
  action: SafeActionType;
  resourceId: string;
  reason: string;
  parameters?: Record<string, unknown>;
}) {
  const request: SafeActionRequest = {
    action: input.action,
    resourceId: input.resourceId,
    reason: input.reason,
    parameters: input.parameters,
    idempotencyKey: idempotencyKey(input.action, input.resourceId),
  };
  return prepareSafeAction(input.accessToken, request);
}
