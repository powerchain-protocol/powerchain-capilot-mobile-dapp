-- PWRC credit quote-snapshot and settlement-evidence hardening.

-- The quote hash contract now binds token/network identity and the billing trigger.
-- Drain the short-lived reservation/ACK window before this migration so an
-- active request cannot cross quote-contract semantics during deployment.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "PwrcCreditReservation" WHERE "status" = 'RESERVED') THEN
    RAISE EXCEPTION 'Drain active PWRC credit reservations before applying quote-snapshot migration';
  END IF;
END $$;

ALTER TABLE "PwrcCreditReservation"
  ADD COLUMN "quoteSnapshot" JSONB,
  ADD COLUMN "quoteSchemaVersion" TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN "pricingVersion" TEXT NOT NULL DEFAULT 'pwrc-copilot-v1',
  ADD COLUMN "responseUnits" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "referenceUsdMicros" NUMERIC(38,0) NOT NULL DEFAULT 20000,
  ADD COLUMN "referencePriceMicros" NUMERIC(38,0) NOT NULL DEFAULT 2,
  ADD COLUMN "network" TEXT NOT NULL DEFAULT 'mainnet-beta',
  ADD COLUMN "mint" TEXT NOT NULL DEFAULT 'PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc',
  ADD COLUMN "tokenProgram" TEXT NOT NULL DEFAULT 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

ALTER TABLE "PwrcMessageReceipt"
  ADD COLUMN "quoteSchemaVersion" TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN "quoteKind" TEXT NOT NULL DEFAULT 'copilot.completed_response',
  ADD COLUMN "billingTrigger" TEXT NOT NULL DEFAULT 'delivery_acknowledged',
  ADD COLUMN "network" TEXT NOT NULL DEFAULT 'mainnet-beta',
  ADD COLUMN "mint" TEXT NOT NULL DEFAULT 'PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc',
  ADD COLUMN "tokenProgram" TEXT NOT NULL DEFAULT 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  ADD COLUMN "decimals" INTEGER NOT NULL DEFAULT 9;

ALTER TABLE "PwrcTopupIntent"
  ADD COLUMN "pricingVersion" TEXT NOT NULL DEFAULT 'pwrc-copilot-v1',
  ADD COLUMN "messageQuoteHash" TEXT NOT NULL DEFAULT '';

ALTER TABLE "PwrcCreditFunding"
  ADD COLUMN "recipient" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "pricingVersion" TEXT NOT NULL DEFAULT 'pwrc-copilot-v1',
  ADD COLUMN "messageQuoteHash" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "grossTransferBaseUnits" NUMERIC(38,0),
  ADD COLUMN "withheldTransferFeeBaseUnits" NUMERIC(38,0),
  ADD COLUMN "recipientNetBaseUnits" NUMERIC(38,0);

-- Extend the existing immutable reservation-economic-identity guard to the
-- persisted quote snapshot. Existing terminal reservations stay immutable.
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
     OR OLD."quoteSnapshot" IS DISTINCT FROM NEW."quoteSnapshot"
     OR OLD."quoteSchemaVersion" IS DISTINCT FROM NEW."quoteSchemaVersion"
     OR OLD."pricingVersion" IS DISTINCT FROM NEW."pricingVersion"
     OR OLD."responseUnits" IS DISTINCT FROM NEW."responseUnits"
     OR OLD."referenceUsdMicros" IS DISTINCT FROM NEW."referenceUsdMicros"
     OR OLD."referencePriceMicros" IS DISTINCT FROM NEW."referencePriceMicros"
     OR OLD."network" IS DISTINCT FROM NEW."network"
     OR OLD."mint" IS DISTINCT FROM NEW."mint"
     OR OLD."tokenProgram" IS DISTINCT FROM NEW."tokenProgram"
     OR OLD."amountBaseUnits" IS DISTINCT FROM NEW."amountBaseUnits" THEN
    RAISE EXCEPTION 'PWRC reservation economic identity is immutable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Evidence arithmetic is optional because not all payment processors expose
-- Token-2022 transfer-fee decomposition. When all fields are present, it must
-- reconcile exactly: gross transfer = recipient net + withheld transfer fee.
ALTER TABLE "PwrcCreditFunding"
  ADD CONSTRAINT "PwrcCreditFunding_transfer_evidence_check"
  CHECK (
    ("grossTransferBaseUnits" IS NULL AND "withheldTransferFeeBaseUnits" IS NULL AND "recipientNetBaseUnits" IS NULL)
    OR
    ("grossTransferBaseUnits" IS NOT NULL
      AND "withheldTransferFeeBaseUnits" IS NOT NULL
      AND "recipientNetBaseUnits" IS NOT NULL
      AND "grossTransferBaseUnits" >= 0
      AND "withheldTransferFeeBaseUnits" >= 0
      AND "recipientNetBaseUnits" >= 0
      AND "grossTransferBaseUnits" = "recipientNetBaseUnits" + "withheldTransferFeeBaseUnits")
  );
