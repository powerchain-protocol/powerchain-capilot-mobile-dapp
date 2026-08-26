-- PowerChain Copilot billing proof chain.
-- Canonical flow:
-- server quote -> SHA-256 quote hash -> persisted immutable quote -> atomic reservation
-- -> completed server response proof -> delivery ACK -> 10,000 PWRC settlement
-- -> append-only ledger -> immutable non-transferable tokenized receipt.

CREATE TABLE IF NOT EXISTS pwrc_credit_quotes (
  hash char(64) PRIMARY KEY,
  price_version text NOT NULL,
  user_id text NOT NULL REFERENCES pwrc_credit_accounts(user_id) ON DELETE RESTRICT,
  product text NOT NULL CHECK (product = 'copilot.response'),
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 1000),
  unit_cost_base_units numeric(39,0) NOT NULL CHECK (unit_cost_base_units > 0),
  total_base_units numeric(39,0) NOT NULL CHECK (total_base_units > 0),
  canonical_payload text NOT NULL,
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  persisted_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > issued_at),
  CHECK (total_base_units = unit_cost_base_units * quantity)
);

CREATE INDEX IF NOT EXISTS pwrc_credit_quotes_user_issued_idx
  ON pwrc_credit_quotes (user_id, issued_at DESC);

-- Existing legacy reservations may predate persisted quote snapshots; do not invent/backfill quote evidence.
-- New canonical reservations are application-bound to pwrc_credit_quotes before balance mutation.

CREATE TABLE IF NOT EXISTS pwrc_copilot_deliveries (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES pwrc_credit_accounts(user_id) ON DELETE RESTRICT,
  reservation_id uuid NOT NULL UNIQUE REFERENCES pwrc_credit_reservations(id) ON DELETE RESTRICT,
  quote_hash char(64) NOT NULL REFERENCES pwrc_credit_quotes(hash) ON DELETE RESTRICT,
  response_hash char(64) NOT NULL,
  status text NOT NULL CHECK (status = 'completed'),
  conversation_id text,
  provider text,
  model text,
  completed_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS pwrc_copilot_deliveries_user_completed_idx
  ON pwrc_copilot_deliveries (user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS pwrc_tokenized_receipts (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES pwrc_credit_accounts(user_id) ON DELETE RESTRICT,
  reservation_id uuid NOT NULL UNIQUE REFERENCES pwrc_credit_reservations(id) ON DELETE RESTRICT,
  quote_hash char(64) NOT NULL REFERENCES pwrc_credit_quotes(hash) ON DELETE RESTRICT,
  delivery_id uuid NOT NULL UNIQUE REFERENCES pwrc_copilot_deliveries(id) ON DELETE RESTRICT,
  response_hash char(64) NOT NULL,
  ledger_entry_id uuid NOT NULL UNIQUE REFERENCES pwrc_credit_ledger(id) ON DELETE RESTRICT,
  amount_base_units numeric(39,0) NOT NULL CHECK (amount_base_units > 0),
  symbol text NOT NULL CHECK (symbol = 'PWRC'),
  decimals smallint NOT NULL CHECK (decimals = 9),
  mint text NOT NULL,
  network text NOT NULL,
  receipt_hash char(64) NOT NULL UNIQUE,
  token text NOT NULL UNIQUE,
  non_transferable boolean NOT NULL DEFAULT true CHECK (non_transferable = true),
  issued_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS pwrc_tokenized_receipts_user_issued_idx
  ON pwrc_tokenized_receipts (user_id, issued_at DESC);

CREATE OR REPLACE FUNCTION reject_pwrc_proof_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is immutable', TG_TABLE_NAME;
END;
$$;

DROP TRIGGER IF EXISTS pwrc_credit_quotes_no_update ON pwrc_credit_quotes;
CREATE TRIGGER pwrc_credit_quotes_no_update
BEFORE UPDATE ON pwrc_credit_quotes
FOR EACH ROW EXECUTE FUNCTION reject_pwrc_proof_mutation();

DROP TRIGGER IF EXISTS pwrc_credit_quotes_no_delete ON pwrc_credit_quotes;
CREATE TRIGGER pwrc_credit_quotes_no_delete
BEFORE DELETE ON pwrc_credit_quotes
FOR EACH ROW EXECUTE FUNCTION reject_pwrc_proof_mutation();

DROP TRIGGER IF EXISTS pwrc_copilot_deliveries_no_update ON pwrc_copilot_deliveries;
CREATE TRIGGER pwrc_copilot_deliveries_no_update
BEFORE UPDATE ON pwrc_copilot_deliveries
FOR EACH ROW EXECUTE FUNCTION reject_pwrc_proof_mutation();

DROP TRIGGER IF EXISTS pwrc_copilot_deliveries_no_delete ON pwrc_copilot_deliveries;
CREATE TRIGGER pwrc_copilot_deliveries_no_delete
BEFORE DELETE ON pwrc_copilot_deliveries
FOR EACH ROW EXECUTE FUNCTION reject_pwrc_proof_mutation();

DROP TRIGGER IF EXISTS pwrc_tokenized_receipts_no_update ON pwrc_tokenized_receipts;
CREATE TRIGGER pwrc_tokenized_receipts_no_update
BEFORE UPDATE ON pwrc_tokenized_receipts
FOR EACH ROW EXECUTE FUNCTION reject_pwrc_proof_mutation();

DROP TRIGGER IF EXISTS pwrc_tokenized_receipts_no_delete ON pwrc_tokenized_receipts;
CREATE TRIGGER pwrc_tokenized_receipts_no_delete
BEFORE DELETE ON pwrc_tokenized_receipts
FOR EACH ROW EXECUTE FUNCTION reject_pwrc_proof_mutation();

CREATE OR REPLACE FUNCTION verify_pwrc_receipt_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  r pwrc_credit_reservations%ROWTYPE;
  d pwrc_copilot_deliveries%ROWTYPE;
  l pwrc_credit_ledger%ROWTYPE;
BEGIN
  SELECT * INTO r FROM pwrc_credit_reservations WHERE id = NEW.reservation_id FOR KEY SHARE;
  SELECT * INTO d FROM pwrc_copilot_deliveries WHERE id = NEW.delivery_id FOR KEY SHARE;
  SELECT * INTO l FROM pwrc_credit_ledger WHERE id = NEW.ledger_entry_id;

  IF r.id IS NULL OR d.id IS NULL OR l.id IS NULL THEN
    RAISE EXCEPTION 'PWRC receipt evidence is incomplete';
  END IF;
  IF r.status <> 'settled' OR r.user_id <> NEW.user_id OR r.quote_hash <> NEW.quote_hash THEN
    RAISE EXCEPTION 'PWRC receipt reservation binding mismatch';
  END IF;
  IF d.user_id <> NEW.user_id OR d.reservation_id <> NEW.reservation_id OR d.response_hash <> NEW.response_hash THEN
    RAISE EXCEPTION 'PWRC receipt delivery binding mismatch';
  END IF;
  IF l.user_id <> NEW.user_id OR l.reservation_id <> NEW.reservation_id OR l.entry_type <> 'reservation_settled' THEN
    RAISE EXCEPTION 'PWRC receipt ledger binding mismatch';
  END IF;
  IF r.amount_base_units <> NEW.amount_base_units THEN
    RAISE EXCEPTION 'PWRC receipt amount mismatch';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pwrc_receipt_binding ON pwrc_tokenized_receipts;
CREATE TRIGGER pwrc_receipt_binding
BEFORE INSERT ON pwrc_tokenized_receipts
FOR EACH ROW EXECUTE FUNCTION verify_pwrc_receipt_binding();

COMMENT ON TABLE pwrc_credit_quotes IS
  'Immutable canonical server quote snapshots. SHA-256 hash is the primary key and reservation proof anchor.';
COMMENT ON TABLE pwrc_copilot_deliveries IS
  'Immutable completed-response hash proofs. Raw Copilot response content is not stored in the credit kernel.';
COMMENT ON TABLE pwrc_tokenized_receipts IS
  'Immutable non-transferable billing proof records linking quote, reservation, response hash and append-only settlement ledger.';
