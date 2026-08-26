import { createHash } from 'node:crypto';
import type { RateLimitStore } from './store.ts';

export class RateLimitExceededError extends Error {
  readonly status = 429;
  readonly code = 'RATE_LIMIT_EXCEEDED';
  constructor(readonly resetAt: number) { super('Rate limit exceeded.'); }
}

function credentialFingerprint(request: Request) {
  const bearer = request.headers.get('authorization') || '';
  if (bearer) return createHash('sha256').update(bearer, 'utf8').digest('hex');
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
}

export async function enforceRateLimit(input: { request: Request; store: RateLimitStore; namespace: string; limit: number; windowMs: number }) {
  const key = `${input.namespace}:${credentialFingerprint(input.request)}`;
  const state = await input.store.increment(key, input.windowMs);
  if (state.count > input.limit) throw new RateLimitExceededError(state.resetAt);
  return state;
}
