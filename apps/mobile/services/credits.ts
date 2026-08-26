import { requestJson } from '@/lib/http';
import type {
  CreditAccount,
  CreditLedgerEntry,
  CreditPricing,
  CreditQuote,
  SolanaPayTopUp,
} from '@/types/credits';

const ROOT = '/api/v1/credits';

export async function getCreditPricing(accessToken: string) {
  return requestJson<CreditPricing>(`${ROOT}/pricing`, { authToken: accessToken });
}

export async function getCreditAccount(accessToken: string) {
  const response = await requestJson<{ account: CreditAccount }>(`${ROOT}/account`, { authToken: accessToken });
  return response.account;
}

export async function getCreditLedger(accessToken: string, limit = 25, before?: string) {
  const params = new URLSearchParams({ limit: String(Math.max(1, Math.min(100, Math.trunc(limit)))) });
  if (before) params.set('before', before);
  return requestJson<{ entries: CreditLedgerEntry[]; nextBefore: string | null }>(
    `${ROOT}/ledger?${params.toString()}`,
    { authToken: accessToken },
  );
}

function quoteIdempotencyKey() {
  return `credit-quote-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function createCreditQuote(accessToken: string, quantity = 1, idempotencyKey = quoteIdempotencyKey()) {
  const response = await requestJson<{ quote: CreditQuote }>(`${ROOT}/quotes`, {
    method: 'POST',
    authToken: accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    body: { quantity },
  });
  return response.quote;
}

export async function claimDemoCreditGrant(accessToken: string) {
  const response = await requestJson<{ account: CreditAccount }>(`${ROOT}/demo-grant`, {
    method: 'POST',
    authToken: accessToken,
  });
  return response.account;
}

export async function createSolanaPayTopUp(accessToken: string, amountBaseUnits: string, idempotencyKey?: string) {
  const response = await requestJson<{ topUp: SolanaPayTopUp }>(`${ROOT}/top-ups/solana-pay`, {
    method: 'POST',
    authToken: accessToken,
    body: { amountBaseUnits },
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
  return response.topUp;
}

export async function getSolanaPayTopUp(accessToken: string, topUpId: string) {
  const response = await requestJson<{ topUp: SolanaPayTopUp }>(
    `${ROOT}/top-ups/${encodeURIComponent(topUpId)}`,
    { authToken: accessToken, timeoutMs: 10_000 },
  );
  return response.topUp;
}
