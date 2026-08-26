import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

import {
  COPILOT_RESPONSE_COST_BASE_UNITS,
  CREDIT_PRICE_VERSION,
  DEFAULT_QUOTE_TTL_MS,
  PWRC_DECIMALS,
  PWRC_IDENTITY,
} from './constants.ts';
import { canonicalizeJson } from './canonical-json.ts';
import { CreditConflictError } from './errors.ts';
import type { CreditQuote, CreditScope } from './types.ts';

export function canonicalQuotePayload(quote: Omit<CreditQuote, 'hash'>): string {
  return canonicalizeJson({
    version: '1',
    quoteId: quote.id,
    idempotencyKey: quote.idempotencyKey,
    userId: quote.userId,
    organizationId: quote.organizationId,
    accountId: quote.accountId,
    priceVersion: quote.priceVersion,
    product: quote.product,
    quantity: quote.quantity,
    unitCostBaseUnits: quote.unitCostBaseUnits.toString(),
    totalBaseUnits: quote.totalBaseUnits.toString(),
    mint: PWRC_IDENTITY.mint,
    network: PWRC_IDENTITY.network,
    decimals: PWRC_DECIMALS,
    issuedAt: quote.issuedAt.toISOString(),
    expiresAt: quote.expiresAt.toISOString(),
  });
}

export function hashQuote(quote: Omit<CreditQuote, 'hash'>): string {
  return createHash('sha256').update(canonicalQuotePayload(quote), 'utf8').digest('hex');
}

function hashesEqual(a: string, b: string) {
  if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

export function assertCreditQuoteIntegrity(quote: CreditQuote, scope: CreditScope, now = new Date()) {
  if (
    quote.userId !== scope.userId ||
    quote.organizationId !== scope.organizationId ||
    quote.accountId !== scope.accountId
  ) {
    throw new CreditConflictError('Quote does not belong to the authenticated billing scope.', 'QUOTE_SCOPE_MISMATCH');
  }
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(quote.idempotencyKey)) {
    throw new CreditConflictError('Quote idempotency key is invalid.', 'QUOTE_INVALID');
  }
  if (quote.priceVersion !== CREDIT_PRICE_VERSION || quote.product !== 'copilot.response') {
    throw new CreditConflictError('Quote pricing version or product is no longer valid.', 'QUOTE_PRICE_MISMATCH');
  }
  if (!Number.isSafeInteger(quote.quantity) || quote.quantity <= 0 || quote.quantity > 1000) {
    throw new CreditConflictError('Quote quantity is invalid.', 'QUOTE_INVALID');
  }
  const expectedTotal = COPILOT_RESPONSE_COST_BASE_UNITS * BigInt(quote.quantity);
  if (quote.unitCostBaseUnits !== COPILOT_RESPONSE_COST_BASE_UNITS || quote.totalBaseUnits !== expectedTotal) {
    throw new CreditConflictError('Quote amount does not match canonical pricing.', 'QUOTE_AMOUNT_MISMATCH');
  }
  if (quote.expiresAt <= quote.issuedAt || quote.expiresAt <= now) {
    throw new CreditConflictError('PWRC quote has expired.', 'QUOTE_EXPIRED');
  }
  if (quote.issuedAt.getTime() > now.getTime() + 30_000) {
    throw new CreditConflictError('Quote issue time is in the future.', 'QUOTE_INVALID');
  }
  const { hash, ...body } = quote;
  const expectedHash = hashQuote(body);
  if (!hashesEqual(hash, expectedHash)) {
    throw new CreditConflictError('PWRC quote hash does not match its canonical RFC 8785 payload.', 'QUOTE_HASH_MISMATCH');
  }
  return quote;
}

export function createCopilotCreditQuote(input: {
  scope: CreditScope;
  idempotencyKey: string;
  quantity?: number;
  now?: Date;
  ttlMs?: number;
  quoteId?: string;
}): CreditQuote {
  const quantity = input.quantity ?? 1;
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 1000) {
    throw new RangeError('Quote quantity must be an integer between 1 and 1000.');
  }
  const idempotencyKey = input.idempotencyKey.trim();
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
    throw new RangeError('Idempotency-Key must be 8-128 URL-safe characters.');
  }
  const issuedAt = input.now ?? new Date();
  const ttlMs = input.ttlMs ?? DEFAULT_QUOTE_TTL_MS;
  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0 || ttlMs > 15 * 60 * 1_000) {
    throw new RangeError('Quote TTL must be between 1 ms and 15 minutes.');
  }
  const expiresAt = new Date(issuedAt.getTime() + ttlMs);
  const body: Omit<CreditQuote, 'hash'> = {
    id: input.quoteId ?? randomUUID(),
    idempotencyKey,
    ...input.scope,
    priceVersion: CREDIT_PRICE_VERSION,
    product: 'copilot.response',
    quantity,
    unitCostBaseUnits: COPILOT_RESPONSE_COST_BASE_UNITS,
    totalBaseUnits: COPILOT_RESPONSE_COST_BASE_UNITS * BigInt(quantity),
    issuedAt,
    expiresAt,
  };
  return { ...body, hash: hashQuote(body) };
}
