CREATE TYPE "PwrcPendingResponseStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'EXPIRED', 'CANCELLED');

ALTER TABLE "PwrcTopupIntent"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "settlementId" TEXT;

CREATE UNIQUE INDEX "PwrcTopupIntent_settlementId_key"
  ON "PwrcTopupIntent"("settlementId");
CREATE UNIQUE INDEX "PwrcTopupIntent_userId_idempotencyKey_key"
  ON "PwrcTopupIntent"("userId", "idempotencyKey");

CREATE TABLE "PwrcPendingResponse" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "responseTokenHash" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "upstreamResponseId" TEXT,
  "status" "PwrcPendingResponseStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acknowledgedAt" TIMESTAMP(3),
  "aiMessageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PwrcPendingResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PwrcPendingResponse_reservationId_key"
  ON "PwrcPendingResponse"("reservationId");
CREATE UNIQUE INDEX "PwrcPendingResponse_aiMessageId_key"
  ON "PwrcPendingResponse"("aiMessageId");
CREATE INDEX "PwrcPendingResponse_userId_status_expiresAt_idx"
  ON "PwrcPendingResponse"("userId", "status", "expiresAt");
CREATE INDEX "PwrcPendingResponse_conversationId_createdAt_idx"
  ON "PwrcPendingResponse"("conversationId", "createdAt");

ALTER TABLE "PwrcPendingResponse"
  ADD CONSTRAINT "PwrcPendingResponse_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PwrcPendingResponse_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "PwrcCreditReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PwrcPendingResponse_aiMessageId_fkey"
    FOREIGN KEY ("aiMessageId") REFERENCES "AiMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PwrcPaymentKernelEvent" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "signatureTimestamp" TIMESTAMP(3) NOT NULL,
  "fundingId" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PwrcPaymentKernelEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PwrcPaymentKernelEvent_settlementId_receivedAt_idx"
  ON "PwrcPaymentKernelEvent"("settlementId", "receivedAt");
CREATE INDEX "PwrcPaymentKernelEvent_fundingId_idx"
  ON "PwrcPaymentKernelEvent"("fundingId");

-- Payment Kernel event receipts are immutable after successful insertion.
CREATE OR REPLACE FUNCTION prevent_pwrc_payment_kernel_event_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'PwrcPaymentKernelEvent is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PwrcPaymentKernelEvent_append_only"
BEFORE UPDATE OR DELETE ON "PwrcPaymentKernelEvent"
FOR EACH ROW EXECUTE FUNCTION prevent_pwrc_payment_kernel_event_mutation();

-- One development demo grant per user, enforced under concurrency.
CREATE UNIQUE INDEX "PwrcCreditLedgerEntry_demo_grant_once"
  ON "PwrcCreditLedgerEntry"("userId")
  WHERE "entryType" = 'DEMO_GRANT';

-- New reservations persist a deterministic request fingerprint. Nullable keeps
-- the migration safe for any pre-hardening in-flight reservations.
ALTER TABLE "PwrcCreditReservation"
  ADD COLUMN "requestHash" TEXT;
CREATE INDEX "PwrcCreditReservation_requestHash_idx"
  ON "PwrcCreditReservation"("requestHash");

-- Message receipts and settled funding are financial evidence and immutable.
CREATE OR REPLACE FUNCTION prevent_pwrc_financial_evidence_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is immutable financial evidence', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PwrcMessageReceipt_immutable"
BEFORE UPDATE OR DELETE ON "PwrcMessageReceipt"
FOR EACH ROW EXECUTE FUNCTION prevent_pwrc_financial_evidence_mutation();

CREATE TRIGGER "PwrcCreditFunding_immutable"
BEFORE UPDATE OR DELETE ON "PwrcCreditFunding"
FOR EACH ROW EXECUTE FUNCTION prevent_pwrc_financial_evidence_mutation();

-- Terminal reservations cannot be moved back to RESERVED or another terminal
-- state. This protects against replay-enabling state regression.
CREATE OR REPLACE FUNCTION prevent_pwrc_reservation_state_regression()
RETURNS trigger AS $$
BEGIN
  IF OLD."status" <> 'RESERVED' AND NEW."status" <> OLD."status" THEN
    RAISE EXCEPTION 'Terminal PWRC reservation status cannot change';
  END IF;

  IF OLD."userId" IS DISTINCT FROM NEW."userId"
     OR OLD."accountId" IS DISTINCT FROM NEW."accountId"
     OR OLD."clientRequestId" IS DISTINCT FROM NEW."clientRequestId"
     OR OLD."idempotencyKey" IS DISTINCT FROM NEW."idempotencyKey"
     OR OLD."requestHash" IS DISTINCT FROM NEW."requestHash"
     OR OLD."quoteHash" IS DISTINCT FROM NEW."quoteHash"
     OR OLD."amountBaseUnits" IS DISTINCT FROM NEW."amountBaseUnits" THEN
    RAISE EXCEPTION 'PWRC reservation economic identity is immutable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PwrcCreditReservation_state_guard"
BEFORE UPDATE ON "PwrcCreditReservation"
FOR EACH ROW EXECUTE FUNCTION prevent_pwrc_reservation_state_regression();

-- Receipt immutability means assistant-message deletion must be restricted,
-- not translated into a receipt UPDATE via ON DELETE SET NULL.
ALTER TABLE "PwrcMessageReceipt"
  DROP CONSTRAINT "PwrcMessageReceipt_aiMessageId_fkey";
ALTER TABLE "PwrcMessageReceipt"
  ADD CONSTRAINT "PwrcMessageReceipt_aiMessageId_fkey"
  FOREIGN KEY ("aiMessageId") REFERENCES "AiMessage"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PwrcPaymentKernelEvent"
  ADD CONSTRAINT "PwrcPaymentKernelEvent_fundingId_fkey"
  FOREIGN KEY ("fundingId") REFERENCES "PwrcCreditFunding"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
