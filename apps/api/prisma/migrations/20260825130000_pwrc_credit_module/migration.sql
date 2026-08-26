-- PWRC Copilot Credits coherent-module hardening.
-- A verified Solana transaction signature is an economic receipt and may fund
-- at most one PWRC credit posting, regardless of Payment Kernel event IDs.
CREATE UNIQUE INDEX IF NOT EXISTS "PwrcCreditFunding_transactionSignature_key"
  ON "PwrcCreditFunding"("transactionSignature")
  WHERE "transactionSignature" IS NOT NULL;
