import { PwrcCreditDomainError } from "./errors.ts";

export type VerifiedPwrcSettlement = {
  settlementId: string;
  reference: string;
  amountBaseUnits: string;
  network: string;
  mint: string;
  recipient: string;
  transactionSignature: string;
  grossTransferBaseUnits?: string | null;
  withheldTransferFeeBaseUnits?: string | null;
  recipientNetBaseUnits?: string | null;
};

export function assertSettlementReplayCompatible(
  prior: VerifiedPwrcSettlement,
  incoming: VerifiedPwrcSettlement,
): void {
  const fields = [
    "reference",
    "amountBaseUnits",
    "network",
    "mint",
    "recipient",
    "transactionSignature",
    "grossTransferBaseUnits",
    "withheldTransferFeeBaseUnits",
    "recipientNetBaseUnits",
  ] as const;
  const mismatch = fields.find(
    (field) => (prior[field] ?? null) !== (incoming[field] ?? null),
  );
  if (prior.settlementId !== incoming.settlementId || mismatch) {
    throw new PwrcCreditDomainError(
      "PWRC_SETTLEMENT_IDEMPOTENCY_CONFLICT",
      "Verified PWRC settlement idempotency key was reused with different evidence.",
      mismatch ? { field: mismatch } : undefined,
    );
  }
}
