-- PWRC Copilot credit accounting. All amounts are integer Token-2022 base units (9 decimals).
-- Never store PWRC accounting amounts in float/double/JS-number columns.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS pwrc_credit_accounts (
  user_id text PRIMARY KEY,
  available_base_units numeric(39,0) NOT NULL DEFAULT 0 CHECK (available_base_units >= 0),
  reserved_base_units numeric(39,0) NOT NULL DEFAULT 0 CHECK (reserved_base_units >= 0),
  spent_base_units numeric(39,0) NOT NULL DEFAULT 0 CHECK (spent_base_units >= 0),
  funded_base_units numeric(39,0) NOT NULL DEFAULT 0 CHECK (funded_base_units >= 0),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pwrc_credit_account_equation CHECK (
    funded_base_units = available_base_units + reserved_base_units + spent_base_units
  )
);

CREATE TABLE IF NOT EXISTS pwrc_credit_reservations (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES pwrc_credit_accounts(user_id) ON DELETE RESTRICT,
  quote_hash char(64) NOT NULL,
  amount_base_units numeric(39,0) NOT NULL CHECK (amount_base_units > 0),
  status text NOT NULL CHECK (status IN ('active','settled','released','expired')),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  settled_at timestamptz,
  released_at timestamptz,
  UNIQUE (user_id, quote_hash),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS pwrc_credit_reservations_expiry_idx
  ON pwrc_credit_reservations (expires_at)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS pwrc_credit_ledger (
  sequence bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES pwrc_credit_accounts(user_id) ON DELETE RESTRICT,
  entry_type text NOT NULL CHECK (entry_type IN (
    'demo_grant','payment_credit','reservation_created','reservation_settled','reservation_released','reservation_expired'
  )),
  available_delta_base_units numeric(39,0) NOT NULL DEFAULT 0,
  reserved_delta_base_units numeric(39,0) NOT NULL DEFAULT 0,
  spent_delta_base_units numeric(39,0) NOT NULL DEFAULT 0,
  funded_delta_base_units numeric(39,0) NOT NULL DEFAULT 0,
  available_after_base_units numeric(39,0) NOT NULL CHECK (available_after_base_units >= 0),
  reserved_after_base_units numeric(39,0) NOT NULL CHECK (reserved_after_base_units >= 0),
  spent_after_base_units numeric(39,0) NOT NULL CHECK (spent_after_base_units >= 0),
  funded_after_base_units numeric(39,0) NOT NULL CHECK (funded_after_base_units >= 0),
  reservation_id uuid REFERENCES pwrc_credit_reservations(id) ON DELETE RESTRICT,
  payment_id text,
  quote_hash char(64),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pwrc_credit_ledger_account_equation CHECK (
    funded_after_base_units = available_after_base_units + reserved_after_base_units + spent_after_base_units
  )
);

CREATE INDEX IF NOT EXISTS pwrc_credit_ledger_user_sequence_idx
  ON pwrc_credit_ledger (user_id, sequence DESC);

CREATE TABLE IF NOT EXISTS pwrc_credit_demo_grants (
  user_id text PRIMARY KEY REFERENCES pwrc_credit_accounts(user_id) ON DELETE RESTRICT,
  ledger_entry_id uuid NOT NULL UNIQUE REFERENCES pwrc_credit_ledger(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pwrc_credit_topup_intents (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES pwrc_credit_accounts(user_id) ON DELETE RESTRICT,
  requested_base_units numeric(39,0) NOT NULL CHECK (requested_base_units > 0),
  idempotency_key text,
  recipient text NOT NULL,
  reference text NOT NULL UNIQUE,
  solana_pay_uri text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','settled','expired')),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  payment_id text UNIQUE,
  settled_at timestamptz,
  CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS pwrc_credit_topup_idempotency_idx
  ON pwrc_credit_topup_intents (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS pwrc_credit_payment_events (
  event_id text PRIMARY KEY,
  payment_id text NOT NULL UNIQUE,
  topup_intent_id uuid NOT NULL UNIQUE REFERENCES pwrc_credit_topup_intents(id) ON DELETE RESTRICT,
  user_id text NOT NULL REFERENCES pwrc_credit_accounts(user_id) ON DELETE RESTRICT,
  amount_base_units numeric(39,0) NOT NULL CHECK (amount_base_units > 0),
  mint text NOT NULL,
  network text NOT NULL,
  transaction_signature text NOT NULL UNIQUE,
  recipient text NOT NULL,
  reference text NOT NULL,
  settled_at timestamptz NOT NULL,
  verification_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION reject_pwrc_credit_ledger_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'pwrc_credit_ledger is append-only';
END;
$$;

DROP TRIGGER IF EXISTS pwrc_credit_ledger_no_update ON pwrc_credit_ledger;
CREATE TRIGGER pwrc_credit_ledger_no_update
BEFORE UPDATE ON pwrc_credit_ledger
FOR EACH ROW EXECUTE FUNCTION reject_pwrc_credit_ledger_mutation();

DROP TRIGGER IF EXISTS pwrc_credit_ledger_no_delete ON pwrc_credit_ledger;
CREATE TRIGGER pwrc_credit_ledger_no_delete
BEFORE DELETE ON pwrc_credit_ledger
FOR EACH ROW EXECUTE FUNCTION reject_pwrc_credit_ledger_mutation();

COMMENT ON TABLE pwrc_credit_ledger IS
  'Append-only PWRC Copilot credit journal. Amounts are 9-decimal integer PWRC base units.';
COMMENT ON COLUMN pwrc_credit_accounts.funded_base_units IS
  'Lifetime credits funded through verified payment.settled events or the one-time sample grant.';
