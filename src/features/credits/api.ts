import { apiFetch } from "../../api/client";
import type {
  PwrcCreditAccount,
  PwrcCreditReconciliation,
  PwrcFunding,
  PwrcLedgerEntry,
  PwrcMessageQuote,
  PwrcMessageReceipt,
  PwrcPricing,
  PwrcTopupIntent,
} from "./types";

function topupIdempotencyKey() {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  return randomUUID
    ? `topup_${randomUUID()}`
    : `topup_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
}

export const getPwrcPricing = () =>
  apiFetch<PwrcPricing>("/credits/pricing");

export const getPwrcMessageQuote = () =>
  apiFetch<PwrcMessageQuote>("/credits/quote");

export const getPwrcCreditAccount = () =>
  apiFetch<PwrcCreditAccount>("/credits/account");

export const getPwrcCreditReconciliation = () =>
  apiFetch<PwrcCreditReconciliation>("/credits/reconciliation");

export const getPwrcLedger = () =>
  apiFetch<{ items: PwrcLedgerEntry[] }>("/credits/ledger?limit=50");

export const getPwrcFunding = () =>
  apiFetch<{ items: PwrcFunding[] }>("/credits/funding?limit=50");

export const getPwrcTopups = () =>
  apiFetch<{ items: PwrcTopupIntent[] }>("/credits/topups?limit=50");

export const getPwrcMessageReceipt = (id: string) =>
  apiFetch<PwrcMessageReceipt>(
    `/credits/messages/${encodeURIComponent(id)}`,
  );

export const claimPwrcDemoGrant = () =>
  apiFetch<{ granted: boolean; account: PwrcCreditAccount }>(
    "/credits/demo-grant",
    { method: "POST", body: "{}" },
  );

export const createPwrcTopup = (
  responses: 50 | 250 | 500 | 1000,
  idempotencyKey = topupIdempotencyKey(),
) =>
  apiFetch<PwrcTopupIntent>("/credits/topups", {
    method: "POST",
    body: JSON.stringify({ responses, idempotencyKey }),
  });
