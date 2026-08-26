-- PWRC Credit Kernel hardening for installations that already applied 001_pwrc_credits.sql.
-- Safe to run repeatedly on a clean/current schema. Existing legacy rows without recipient/reference
-- intentionally block the migration so operators must reconcile evidence instead of inventing values.

ALTER TABLE pwrc_credit_topup_intents
  ADD COLUMN IF NOT EXISTS recipient text,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

ALTER TABLE pwrc_credit_payment_events
  ADD COLUMN IF NOT EXISTS recipient text,
  ADD COLUMN IF NOT EXISTS reference text;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pwrc_credit_topup_intents WHERE recipient IS NULL) THEN
    RAISE EXCEPTION 'Cannot harden PWRC top-ups: legacy rows are missing recipient evidence';
  END IF;
  IF EXISTS (SELECT 1 FROM pwrc_credit_payment_events WHERE recipient IS NULL OR reference IS NULL) THEN
    RAISE EXCEPTION 'Cannot harden PWRC payment events: legacy rows are missing recipient/reference evidence';
  END IF;
END;
$$;

ALTER TABLE pwrc_credit_topup_intents
  ALTER COLUMN recipient SET NOT NULL;

ALTER TABLE pwrc_credit_payment_events
  ALTER COLUMN recipient SET NOT NULL,
  ALTER COLUMN reference SET NOT NULL;

CREATE INDEX IF NOT EXISTS pwrc_credit_reservations_user_expiry_idx
  ON pwrc_credit_reservations (user_id, expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS pwrc_credit_topup_user_status_idx
  ON pwrc_credit_topup_intents (user_id, status, expires_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS pwrc_credit_topup_idempotency_idx
  ON pwrc_credit_topup_intents (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION verify_pwrc_payment_event_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  intent pwrc_credit_topup_intents%ROWTYPE;
BEGIN
  SELECT * INTO intent
  FROM pwrc_credit_topup_intents
  WHERE id = NEW.topup_intent_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PWRC top-up intent not found for payment event';
  END IF;
  IF intent.user_id <> NEW.user_id THEN
    RAISE EXCEPTION 'PWRC payment user does not match top-up intent';
  END IF;
  IF intent.requested_base_units <> NEW.amount_base_units THEN
    RAISE EXCEPTION 'PWRC payment amount does not match top-up intent';
  END IF;
  IF intent.recipient <> NEW.recipient OR intent.reference <> NEW.reference THEN
    RAISE EXCEPTION 'PWRC payment recipient/reference does not match top-up intent';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pwrc_payment_event_binding ON pwrc_credit_payment_events;
CREATE TRIGGER pwrc_payment_event_binding
BEFORE INSERT ON pwrc_credit_payment_events
FOR EACH ROW EXECUTE FUNCTION verify_pwrc_payment_event_binding();

CREATE OR REPLACE VIEW pwrc_credit_account_reconciliation AS
SELECT
  a.user_id,
  a.available_base_units,
  COALESCE(SUM(l.available_delta_base_units), 0)::numeric(39,0) AS ledger_available_base_units,
  a.reserved_base_units,
  COALESCE(SUM(l.reserved_delta_base_units), 0)::numeric(39,0) AS ledger_reserved_base_units,
  a.spent_base_units,
  COALESCE(SUM(l.spent_delta_base_units), 0)::numeric(39,0) AS ledger_spent_base_units,
  a.funded_base_units,
  COALESCE(SUM(l.funded_delta_base_units), 0)::numeric(39,0) AS ledger_funded_base_units,
  (
    a.available_base_units = COALESCE(SUM(l.available_delta_base_units), 0)
    AND a.reserved_base_units = COALESCE(SUM(l.reserved_delta_base_units), 0)
    AND a.spent_base_units = COALESCE(SUM(l.spent_delta_base_units), 0)
    AND a.funded_base_units = COALESCE(SUM(l.funded_delta_base_units), 0)
  ) AS reconciled
FROM pwrc_credit_accounts a
LEFT JOIN pwrc_credit_ledger l ON l.user_id = a.user_id
GROUP BY a.user_id;

COMMENT ON COLUMN pwrc_credit_topup_intents.recipient IS
  'Native SOL account recipient encoded into the Solana Pay transfer request.';
COMMENT ON COLUMN pwrc_credit_payment_events.reference IS
  'Solana Pay reference verified by Payment Kernel and matched to the top-up intent.';
COMMENT ON VIEW pwrc_credit_account_reconciliation IS
  'Control view: current account balances must equal the append-only ledger delta totals.';
