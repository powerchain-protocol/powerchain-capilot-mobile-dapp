CREATE TYPE "PwrcCreditReservationStatus" AS ENUM ('RESERVED', 'SETTLED', 'RELEASED', 'EXPIRED');
CREATE TYPE "PwrcCreditLedgerEntryType" AS ENUM ('DEMO_GRANT', 'FUNDING', 'RESERVE', 'SETTLE', 'RELEASE', 'EXPIRE');
CREATE TYPE "PwrcTopupStatus" AS ENUM ('PENDING', 'SETTLED', 'EXPIRED', 'CANCELLED');

CREATE TABLE "PwrcCreditAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "availableBaseUnits" DECIMAL(38,0) NOT NULL DEFAULT 0,
  "reservedBaseUnits" DECIMAL(38,0) NOT NULL DEFAULT 0,
  "spentBaseUnits" DECIMAL(38,0) NOT NULL DEFAULT 0,
  "fundedBaseUnits" DECIMAL(38,0) NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PwrcCreditAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PwrcCreditReservation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "conversationId" TEXT,
  "clientRequestId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "quoteHash" TEXT NOT NULL,
  "amountBaseUnits" DECIMAL(38,0) NOT NULL,
  "status" "PwrcCreditReservationStatus" NOT NULL DEFAULT 'RESERVED',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "settledAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "releaseReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PwrcCreditReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PwrcMessageReceipt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "aiMessageId" TEXT,
  "requestId" TEXT NOT NULL,
  "quoteHash" TEXT NOT NULL,
  "responseUnits" INTEGER NOT NULL DEFAULT 1,
  "debitBaseUnits" DECIMAL(38,0) NOT NULL,
  "referenceUsdMicros" DECIMAL(38,0) NOT NULL,
  "referencePriceMicros" DECIMAL(38,0) NOT NULL,
  "pricingVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PwrcMessageReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PwrcCreditLedgerEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "entryType" "PwrcCreditLedgerEntryType" NOT NULL,
  "deltaAvailableBaseUnits" DECIMAL(38,0) NOT NULL DEFAULT 0,
  "deltaReservedBaseUnits" DECIMAL(38,0) NOT NULL DEFAULT 0,
  "deltaSpentBaseUnits" DECIMAL(38,0) NOT NULL DEFAULT 0,
  "deltaFundedBaseUnits" DECIMAL(38,0) NOT NULL DEFAULT 0,
  "reservationId" TEXT,
  "messageReceiptId" TEXT,
  "paymentSettlementId" TEXT,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PwrcCreditLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PwrcTopupIntent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "amountBaseUnits" DECIMAL(38,0) NOT NULL,
  "responseUnits" INTEGER NOT NULL,
  "network" TEXT NOT NULL,
  "mint" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "status" "PwrcTopupStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "settledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PwrcTopupIntent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PwrcCreditFunding" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "topupIntentId" TEXT,
  "paymentSettlementId" TEXT NOT NULL,
  "paymentReference" TEXT,
  "transactionSignature" TEXT,
  "amountBaseUnits" DECIMAL(38,0) NOT NULL,
  "network" TEXT NOT NULL,
  "mint" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PwrcCreditFunding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PwrcCreditAccount_userId_key" ON "PwrcCreditAccount"("userId");
CREATE INDEX "PwrcCreditAccount_updatedAt_idx" ON "PwrcCreditAccount"("updatedAt");
CREATE UNIQUE INDEX "PwrcCreditReservation_userId_idempotencyKey_key" ON "PwrcCreditReservation"("userId", "idempotencyKey");
CREATE UNIQUE INDEX "PwrcCreditReservation_userId_clientRequestId_key" ON "PwrcCreditReservation"("userId", "clientRequestId");
CREATE INDEX "PwrcCreditReservation_userId_status_expiresAt_idx" ON "PwrcCreditReservation"("userId", "status", "expiresAt");
CREATE INDEX "PwrcCreditReservation_accountId_createdAt_idx" ON "PwrcCreditReservation"("accountId", "createdAt");
CREATE UNIQUE INDEX "PwrcMessageReceipt_reservationId_key" ON "PwrcMessageReceipt"("reservationId");
CREATE UNIQUE INDEX "PwrcMessageReceipt_aiMessageId_key" ON "PwrcMessageReceipt"("aiMessageId");
CREATE INDEX "PwrcMessageReceipt_userId_createdAt_idx" ON "PwrcMessageReceipt"("userId", "createdAt");
CREATE INDEX "PwrcMessageReceipt_conversationId_createdAt_idx" ON "PwrcMessageReceipt"("conversationId", "createdAt");
CREATE INDEX "PwrcCreditLedgerEntry_userId_createdAt_idx" ON "PwrcCreditLedgerEntry"("userId", "createdAt");
CREATE INDEX "PwrcCreditLedgerEntry_accountId_createdAt_idx" ON "PwrcCreditLedgerEntry"("accountId", "createdAt");
CREATE INDEX "PwrcCreditLedgerEntry_reservationId_idx" ON "PwrcCreditLedgerEntry"("reservationId");
CREATE INDEX "PwrcCreditLedgerEntry_paymentSettlementId_idx" ON "PwrcCreditLedgerEntry"("paymentSettlementId");
CREATE UNIQUE INDEX "PwrcTopupIntent_reference_key" ON "PwrcTopupIntent"("reference");
CREATE INDEX "PwrcTopupIntent_userId_status_createdAt_idx" ON "PwrcTopupIntent"("userId", "status", "createdAt");
CREATE INDEX "PwrcTopupIntent_expiresAt_idx" ON "PwrcTopupIntent"("expiresAt");
CREATE UNIQUE INDEX "PwrcCreditFunding_paymentSettlementId_key" ON "PwrcCreditFunding"("paymentSettlementId");
CREATE INDEX "PwrcCreditFunding_userId_createdAt_idx" ON "PwrcCreditFunding"("userId", "createdAt");

ALTER TABLE "PwrcCreditAccount" ADD CONSTRAINT "PwrcCreditAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PwrcCreditReservation" ADD CONSTRAINT "PwrcCreditReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PwrcCreditReservation" ADD CONSTRAINT "PwrcCreditReservation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PwrcCreditAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PwrcMessageReceipt" ADD CONSTRAINT "PwrcMessageReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PwrcMessageReceipt" ADD CONSTRAINT "PwrcMessageReceipt_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PwrcCreditAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PwrcMessageReceipt" ADD CONSTRAINT "PwrcMessageReceipt_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "PwrcCreditReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PwrcMessageReceipt" ADD CONSTRAINT "PwrcMessageReceipt_aiMessageId_fkey" FOREIGN KEY ("aiMessageId") REFERENCES "AiMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PwrcCreditLedgerEntry" ADD CONSTRAINT "PwrcCreditLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PwrcCreditLedgerEntry" ADD CONSTRAINT "PwrcCreditLedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PwrcCreditAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PwrcCreditLedgerEntry" ADD CONSTRAINT "PwrcCreditLedgerEntry_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "PwrcCreditReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PwrcCreditLedgerEntry" ADD CONSTRAINT "PwrcCreditLedgerEntry_messageReceiptId_fkey" FOREIGN KEY ("messageReceiptId") REFERENCES "PwrcMessageReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PwrcTopupIntent" ADD CONSTRAINT "PwrcTopupIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PwrcTopupIntent" ADD CONSTRAINT "PwrcTopupIntent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PwrcCreditAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PwrcCreditFunding" ADD CONSTRAINT "PwrcCreditFunding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PwrcCreditFunding" ADD CONSTRAINT "PwrcCreditFunding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PwrcCreditAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PwrcCreditFunding" ADD CONSTRAINT "PwrcCreditFunding_topupIntentId_fkey" FOREIGN KEY ("topupIntentId") REFERENCES "PwrcTopupIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PWRC credit-account conservation and non-negative balance controls.
ALTER TABLE "PwrcCreditAccount"
  ADD CONSTRAINT "PwrcCreditAccount_available_nonnegative"
    CHECK ("availableBaseUnits" >= 0),
  ADD CONSTRAINT "PwrcCreditAccount_reserved_nonnegative"
    CHECK ("reservedBaseUnits" >= 0),
  ADD CONSTRAINT "PwrcCreditAccount_spent_nonnegative"
    CHECK ("spentBaseUnits" >= 0),
  ADD CONSTRAINT "PwrcCreditAccount_funded_nonnegative"
    CHECK ("fundedBaseUnits" >= 0),
  ADD CONSTRAINT "PwrcCreditAccount_conservation"
    CHECK (
      "fundedBaseUnits" =
      "availableBaseUnits" + "reservedBaseUnits" + "spentBaseUnits"
    );

ALTER TABLE "PwrcCreditReservation"
  ADD CONSTRAINT "PwrcCreditReservation_amount_positive"
    CHECK ("amountBaseUnits" > 0);

-- v1.0.0 message-unit economics are deterministic and enforced in persistence.
ALTER TABLE "PwrcMessageReceipt"
  ADD CONSTRAINT "PwrcMessageReceipt_one_unit"
    CHECK ("responseUnits" = 1),
  ADD CONSTRAINT "PwrcMessageReceipt_v1_debit"
    CHECK ("debitBaseUnits" = 10000000000000),
  ADD CONSTRAINT "PwrcMessageReceipt_v1_reference"
    CHECK (
      "referenceUsdMicros" = 20000 AND
      "referencePriceMicros" = 2
    );

ALTER TABLE "PwrcTopupIntent"
  ADD CONSTRAINT "PwrcTopupIntent_amount_positive"
    CHECK ("amountBaseUnits" > 0),
  ADD CONSTRAINT "PwrcTopupIntent_response_units_positive"
    CHECK ("responseUnits" > 0);

-- Ledger entries are audit records and are immutable after insert.
CREATE OR REPLACE FUNCTION prevent_pwrc_credit_ledger_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'PwrcCreditLedgerEntry is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PwrcCreditLedgerEntry_append_only"
BEFORE UPDATE OR DELETE ON "PwrcCreditLedgerEntry"
FOR EACH ROW EXECUTE FUNCTION prevent_pwrc_credit_ledger_mutation();
