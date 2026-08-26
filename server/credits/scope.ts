import type { CreditScope } from './types.ts';

export type CreditActor = string | CreditScope;

export function personalCreditScope(userId: string): CreditScope {
  const clean = userId.trim();
  if (!clean) throw new TypeError('userId is required.');
  return { userId: clean, organizationId: `personal:${clean}`, accountId: clean };
}

export function normalizeCreditScope(actor: CreditActor): CreditScope {
  if (typeof actor === 'string') return personalCreditScope(actor);
  const userId = actor.userId.trim();
  const organizationId = actor.organizationId.trim();
  const accountId = actor.accountId.trim();
  if (!userId || !organizationId || !accountId) throw new TypeError('Credit scope requires userId, organizationId and accountId.');
  return { userId, organizationId, accountId };
}

export function sameCreditScope(a: CreditScope, b: CreditScope) {
  return a.userId === b.userId && a.organizationId === b.organizationId && a.accountId === b.accountId;
}
