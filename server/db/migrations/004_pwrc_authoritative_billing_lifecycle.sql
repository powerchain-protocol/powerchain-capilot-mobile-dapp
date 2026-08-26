-- PowerChain Copilot v1.0.0 authoritative PWRC billing lifecycle hardening.
-- Scope, idempotency, durable response proof, signed hash-chained receipts, and Solana anchor outbox.
-- Existing monetary values are never rewritten. Legacy rows receive deterministic scope metadata only.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Organization/account scope. Migrate from user-primary accounting to composite
-- organization/account scope so one user may participate in multiple tenants.
-- ---------------------------------------------------------------------------
ALTER TABLE pwrc_credit_accounts
  ADD COLUMN IF NOT EXISTS organization_id text,
  ADD COLUMN IF NOT EXISTS account_id text;
UPDATE pwrc_credit_accounts
SET organization_id = COALESCE(organization_id, 'personal:' || user_id),
    account_id = COALESCE(account_id, user_id)
WHERE organization_id IS NULL OR account_id IS NULL;
ALTER TABLE pwrc_credit_accounts ALTER COLUMN organization_id SET NOT NULL, ALTER COLUMN account_id SET NOT NULL;

ALTER TABLE pwrc_credit_reservations ADD COLUMN IF NOT EXISTS organization_id text, ADD COLUMN IF NOT EXISTS account_id text;
ALTER TABLE pwrc_credit_ledger ADD COLUMN IF NOT EXISTS organization_id text, ADD COLUMN IF NOT EXISTS account_id text;
ALTER TABLE pwrc_credit_demo_grants ADD COLUMN IF NOT EXISTS organization_id text, ADD COLUMN IF NOT EXISTS account_id text;
ALTER TABLE pwrc_credit_topup_intents ADD COLUMN IF NOT EXISTS organization_id text, ADD COLUMN IF NOT EXISTS account_id text;
ALTER TABLE pwrc_credit_payment_events ADD COLUMN IF NOT EXISTS organization_id text, ADD COLUMN IF NOT EXISTS account_id text;
ALTER TABLE pwrc_credit_quotes ADD COLUMN IF NOT EXISTS organization_id text, ADD COLUMN IF NOT EXISTS account_id text;
ALTER TABLE pwrc_copilot_deliveries ADD COLUMN IF NOT EXISTS organization_id text, ADD COLUMN IF NOT EXISTS account_id text;

UPDATE pwrc_credit_reservations SET organization_id=COALESCE(organization_id,'personal:'||user_id), account_id=COALESCE(account_id,user_id) WHERE organization_id IS NULL OR account_id IS NULL;
UPDATE pwrc_credit_ledger SET organization_id=COALESCE(organization_id,'personal:'||user_id), account_id=COALESCE(account_id,user_id) WHERE organization_id IS NULL OR account_id IS NULL;
UPDATE pwrc_credit_demo_grants SET organization_id=COALESCE(organization_id,'personal:'||user_id), account_id=COALESCE(account_id,user_id) WHERE organization_id IS NULL OR account_id IS NULL;
UPDATE pwrc_credit_topup_intents SET organization_id=COALESCE(organization_id,'personal:'||user_id), account_id=COALESCE(account_id,user_id) WHERE organization_id IS NULL OR account_id IS NULL;
UPDATE pwrc_credit_payment_events SET organization_id=COALESCE(organization_id,'personal:'||user_id), account_id=COALESCE(account_id,user_id) WHERE organization_id IS NULL OR account_id IS NULL;
UPDATE pwrc_credit_quotes SET organization_id=COALESCE(organization_id,'personal:'||user_id), account_id=COALESCE(account_id,user_id) WHERE organization_id IS NULL OR account_id IS NULL;
UPDATE pwrc_copilot_deliveries SET organization_id=COALESCE(organization_id,'personal:'||user_id), account_id=COALESCE(account_id,user_id) WHERE organization_id IS NULL OR account_id IS NULL;

ALTER TABLE pwrc_credit_reservations ALTER COLUMN organization_id SET NOT NULL, ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE pwrc_credit_ledger ALTER COLUMN organization_id SET NOT NULL, ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE pwrc_credit_demo_grants ALTER COLUMN organization_id SET NOT NULL, ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE pwrc_credit_topup_intents ALTER COLUMN organization_id SET NOT NULL, ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE pwrc_credit_payment_events ALTER COLUMN organization_id SET NOT NULL, ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE pwrc_credit_quotes ALTER COLUMN organization_id SET NOT NULL, ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE pwrc_copilot_deliveries ALTER COLUMN organization_id SET NOT NULL, ALTER COLUMN account_id SET NOT NULL;

-- Remove user-only foreign keys before changing the account primary key.
ALTER TABLE pwrc_credit_reservations DROP CONSTRAINT IF EXISTS pwrc_credit_reservations_user_id_fkey;
ALTER TABLE pwrc_credit_ledger DROP CONSTRAINT IF EXISTS pwrc_credit_ledger_user_id_fkey;
ALTER TABLE pwrc_credit_demo_grants DROP CONSTRAINT IF EXISTS pwrc_credit_demo_grants_user_id_fkey;
ALTER TABLE pwrc_credit_topup_intents DROP CONSTRAINT IF EXISTS pwrc_credit_topup_intents_user_id_fkey;
ALTER TABLE pwrc_credit_payment_events DROP CONSTRAINT IF EXISTS pwrc_credit_payment_events_user_id_fkey;
ALTER TABLE pwrc_credit_quotes DROP CONSTRAINT IF EXISTS pwrc_credit_quotes_user_id_fkey;
ALTER TABLE pwrc_copilot_deliveries DROP CONSTRAINT IF EXISTS pwrc_copilot_deliveries_user_id_fkey;
ALTER TABLE pwrc_tokenized_receipts DROP CONSTRAINT IF EXISTS pwrc_tokenized_receipts_user_id_fkey;

ALTER TABLE pwrc_credit_accounts DROP CONSTRAINT IF EXISTS pwrc_credit_accounts_pkey;
ALTER TABLE pwrc_credit_accounts ADD CONSTRAINT pwrc_credit_accounts_pkey PRIMARY KEY (organization_id, account_id);
CREATE INDEX IF NOT EXISTS pwrc_credit_accounts_user_idx ON pwrc_credit_accounts(user_id);

ALTER TABLE pwrc_credit_reservations ADD CONSTRAINT pwrc_credit_reservations_account_fkey FOREIGN KEY (organization_id,account_id) REFERENCES pwrc_credit_accounts(organization_id,account_id) ON DELETE RESTRICT;
ALTER TABLE pwrc_credit_ledger ADD CONSTRAINT pwrc_credit_ledger_account_fkey FOREIGN KEY (organization_id,account_id) REFERENCES pwrc_credit_accounts(organization_id,account_id) ON DELETE RESTRICT;
ALTER TABLE pwrc_credit_topup_intents ADD CONSTRAINT pwrc_credit_topup_account_fkey FOREIGN KEY (organization_id,account_id) REFERENCES pwrc_credit_accounts(organization_id,account_id) ON DELETE RESTRICT;
ALTER TABLE pwrc_credit_payment_events ADD CONSTRAINT pwrc_credit_payment_account_fkey FOREIGN KEY (organization_id,account_id) REFERENCES pwrc_credit_accounts(organization_id,account_id) ON DELETE RESTRICT;
ALTER TABLE pwrc_credit_quotes ADD CONSTRAINT pwrc_credit_quotes_account_fkey FOREIGN KEY (organization_id,account_id) REFERENCES pwrc_credit_accounts(organization_id,account_id) ON DELETE RESTRICT;
ALTER TABLE pwrc_copilot_deliveries ADD CONSTRAINT pwrc_copilot_deliveries_account_fkey FOREIGN KEY (organization_id,account_id) REFERENCES pwrc_credit_accounts(organization_id,account_id) ON DELETE RESTRICT;

ALTER TABLE pwrc_credit_demo_grants DROP CONSTRAINT IF EXISTS pwrc_credit_demo_grants_pkey;
ALTER TABLE pwrc_credit_demo_grants ADD CONSTRAINT pwrc_credit_demo_grants_pkey PRIMARY KEY (organization_id, account_id);
ALTER TABLE pwrc_credit_demo_grants ADD CONSTRAINT pwrc_credit_demo_grants_account_fkey FOREIGN KEY (organization_id,account_id) REFERENCES pwrc_credit_accounts(organization_id,account_id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- Quote identity + idempotency. Legacy quotes retain their original payload/hash;
-- only auxiliary IDs are added. New quotes use RFC-8785-compatible canonical JSON.
-- ---------------------------------------------------------------------------
ALTER TABLE pwrc_credit_quotes ADD COLUMN IF NOT EXISTS id uuid;
ALTER TABLE pwrc_credit_quotes ADD COLUMN IF NOT EXISTS idempotency_key text;
UPDATE pwrc_credit_quotes SET id=gen_random_uuid() WHERE id IS NULL;
UPDATE pwrc_credit_quotes SET idempotency_key='legacy:'||hash WHERE idempotency_key IS NULL;
ALTER TABLE pwrc_credit_quotes ALTER COLUMN id SET NOT NULL, ALTER COLUMN idempotency_key SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pwrc_credit_quotes_id_uidx ON pwrc_credit_quotes(id);
CREATE UNIQUE INDEX IF NOT EXISTS pwrc_credit_quotes_scope_idempotency_uidx ON pwrc_credit_quotes(organization_id,account_id,idempotency_key);

ALTER TABLE pwrc_credit_reservations ADD COLUMN IF NOT EXISTS quote_id uuid;
ALTER TABLE pwrc_credit_reservations ADD COLUMN IF NOT EXISTS idempotency_key text;
UPDATE pwrc_credit_reservations r SET quote_id=q.id, idempotency_key=q.idempotency_key FROM pwrc_credit_quotes q WHERE q.hash=r.quote_hash AND (r.quote_id IS NULL OR r.idempotency_key IS NULL);
DROP INDEX IF EXISTS pwrc_credit_reservations_user_quote_hash_key;
CREATE UNIQUE INDEX IF NOT EXISTS pwrc_credit_reservation_scope_quote_uidx ON pwrc_credit_reservations(organization_id,account_id,quote_hash);

-- ---------------------------------------------------------------------------
-- Durable completed-response identity.
-- ---------------------------------------------------------------------------
ALTER TABLE pwrc_copilot_deliveries ADD COLUMN IF NOT EXISTS response_id uuid;
ALTER TABLE pwrc_copilot_deliveries ADD COLUMN IF NOT EXISTS quote_id uuid;
ALTER TABLE pwrc_copilot_deliveries ADD COLUMN IF NOT EXISTS provider_response_id text;
UPDATE pwrc_copilot_deliveries d SET response_id=COALESCE(response_id,id), quote_id=COALESCE(quote_id,q.id) FROM pwrc_credit_quotes q WHERE q.hash=d.quote_hash;
UPDATE pwrc_copilot_deliveries SET response_id=COALESCE(response_id,id) WHERE response_id IS NULL;
ALTER TABLE pwrc_copilot_deliveries ALTER COLUMN response_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pwrc_copilot_deliveries_response_id_uidx ON pwrc_copilot_deliveries(response_id);

-- Ledger remains append-only. Refunds/reversals are compensating entries, never mutation.
ALTER TABLE pwrc_credit_ledger DROP CONSTRAINT IF EXISTS pwrc_credit_ledger_entry_type_check;
ALTER TABLE pwrc_credit_ledger ADD CONSTRAINT pwrc_credit_ledger_entry_type_check CHECK (entry_type IN (
  'demo_grant','payment_credit','reservation_created','reservation_settled','reservation_released','reservation_expired',
  'settlement_refund','settlement_reversal'
));
CREATE INDEX IF NOT EXISTS pwrc_credit_ledger_scope_sequence_idx ON pwrc_credit_ledger(organization_id,account_id,sequence DESC);

-- Update top-up idempotency to tenant/account scope.
DROP INDEX IF EXISTS pwrc_credit_topup_idempotency_idx;
CREATE UNIQUE INDEX IF NOT EXISTS pwrc_credit_topup_scope_idempotency_idx ON pwrc_credit_topup_intents(organization_id,account_id,idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Authoritative signed receipt. This supersedes the v6.2 non-transferable proof
-- table without rewriting its historic rows.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pwrc_signed_receipts (
  version text NOT NULL CHECK (version='1'),
  receipt_id uuid PRIMARY KEY,
  quote_id uuid NOT NULL,
  quote_hash char(64) NOT NULL,
  reservation_id uuid NOT NULL UNIQUE REFERENCES pwrc_credit_reservations(id) ON DELETE RESTRICT,
  response_id uuid NOT NULL UNIQUE,
  organization_id text NOT NULL,
  account_id text NOT NULL,
  mint text NOT NULL,
  amount_base_units numeric(39,0) NOT NULL CHECK (amount_base_units=10000000000000),
  amount_display text NOT NULL CHECK (amount_display='10000'),
  status text NOT NULL CHECK (status='SETTLED'),
  settled_at timestamptz NOT NULL,
  ledger_entry_id uuid NOT NULL UNIQUE REFERENCES pwrc_credit_ledger(id) ON DELETE RESTRICT,
  previous_receipt_hash char(64),
  receipt_hash char(64) NOT NULL UNIQUE,
  signature text NOT NULL,
  FOREIGN KEY (organization_id,account_id) REFERENCES pwrc_credit_accounts(organization_id,account_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS pwrc_signed_receipts_scope_settled_idx ON pwrc_signed_receipts(organization_id,account_id,settled_at DESC);

CREATE OR REPLACE FUNCTION reject_pwrc_signed_receipt_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'pwrc_signed_receipts is immutable'; END; $$;
DROP TRIGGER IF EXISTS pwrc_signed_receipts_no_update ON pwrc_signed_receipts;
CREATE TRIGGER pwrc_signed_receipts_no_update BEFORE UPDATE ON pwrc_signed_receipts FOR EACH ROW EXECUTE FUNCTION reject_pwrc_signed_receipt_mutation();
DROP TRIGGER IF EXISTS pwrc_signed_receipts_no_delete ON pwrc_signed_receipts;
CREATE TRIGGER pwrc_signed_receipts_no_delete BEFORE DELETE ON pwrc_signed_receipts FOR EACH ROW EXECUTE FUNCTION reject_pwrc_signed_receipt_mutation();

CREATE OR REPLACE FUNCTION verify_pwrc_signed_receipt_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r pwrc_credit_reservations%ROWTYPE; d pwrc_copilot_deliveries%ROWTYPE; l pwrc_credit_ledger%ROWTYPE; q pwrc_credit_quotes%ROWTYPE;
BEGIN
  SELECT * INTO r FROM pwrc_credit_reservations WHERE id=NEW.reservation_id FOR KEY SHARE;
  SELECT * INTO d FROM pwrc_copilot_deliveries WHERE response_id=NEW.response_id FOR KEY SHARE;
  SELECT * INTO l FROM pwrc_credit_ledger WHERE id=NEW.ledger_entry_id;
  SELECT * INTO q FROM pwrc_credit_quotes WHERE id=NEW.quote_id FOR KEY SHARE;
  IF r.id IS NULL OR d.id IS NULL OR l.id IS NULL OR q.id IS NULL THEN RAISE EXCEPTION 'PWRC signed receipt evidence is incomplete'; END IF;
  IF r.status<>'settled' OR r.organization_id<>NEW.organization_id OR r.account_id<>NEW.account_id OR r.quote_hash<>NEW.quote_hash OR r.quote_id<>NEW.quote_id THEN RAISE EXCEPTION 'PWRC receipt reservation scope mismatch'; END IF;
  IF d.reservation_id<>NEW.reservation_id OR d.response_id<>NEW.response_id OR d.organization_id<>NEW.organization_id OR d.account_id<>NEW.account_id THEN RAISE EXCEPTION 'PWRC receipt response binding mismatch'; END IF;
  IF l.reservation_id<>NEW.reservation_id OR l.entry_type<>'reservation_settled' OR l.organization_id<>NEW.organization_id OR l.account_id<>NEW.account_id THEN RAISE EXCEPTION 'PWRC receipt ledger binding mismatch'; END IF;
  IF q.hash<>NEW.quote_hash OR q.organization_id<>NEW.organization_id OR q.account_id<>NEW.account_id THEN RAISE EXCEPTION 'PWRC receipt quote binding mismatch'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS pwrc_signed_receipt_binding ON pwrc_signed_receipts;
CREATE TRIGGER pwrc_signed_receipt_binding BEFORE INSERT ON pwrc_signed_receipts FOR EACH ROW EXECUTE FUNCTION verify_pwrc_signed_receipt_binding();

-- ---------------------------------------------------------------------------
-- Transactional outbox for batched Merkle-root publication on Solana.
-- Receipt settlement commits even if Solana is unavailable; the outbox retries safely.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pwrc_receipt_anchor_outbox (
  id uuid PRIMARY KEY,
  organization_id text NOT NULL,
  account_id text NOT NULL,
  receipt_id uuid NOT NULL UNIQUE REFERENCES pwrc_signed_receipts(receipt_id) ON DELETE RESTRICT,
  receipt_hash char(64) NOT NULL,
  event_type text NOT NULL CHECK (event_type='pwrc.receipt.anchor.requested'),
  status text NOT NULL CHECK (status IN ('pending','processing','published','failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts>=0),
  created_at timestamptz NOT NULL,
  available_at timestamptz NOT NULL,
  published_at timestamptz,
  solana_signature text,
  merkle_root char(64),
  FOREIGN KEY (organization_id,account_id) REFERENCES pwrc_credit_accounts(organization_id,account_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS pwrc_receipt_anchor_pending_idx ON pwrc_receipt_anchor_outbox(status,available_at,created_at) WHERE status IN ('pending','failed','processing');

-- Reconciliation view becomes account-scope aware.
CREATE OR REPLACE VIEW pwrc_credit_account_reconciliation AS
SELECT a.organization_id,a.account_id,a.user_id,
  a.available_base_units,COALESCE(SUM(l.available_delta_base_units),0)::numeric(39,0) AS ledger_available_base_units,
  a.reserved_base_units,COALESCE(SUM(l.reserved_delta_base_units),0)::numeric(39,0) AS ledger_reserved_base_units,
  a.spent_base_units,COALESCE(SUM(l.spent_delta_base_units),0)::numeric(39,0) AS ledger_spent_base_units,
  a.funded_base_units,COALESCE(SUM(l.funded_delta_base_units),0)::numeric(39,0) AS ledger_funded_base_units,
  (a.available_base_units=COALESCE(SUM(l.available_delta_base_units),0)
   AND a.reserved_base_units=COALESCE(SUM(l.reserved_delta_base_units),0)
   AND a.spent_base_units=COALESCE(SUM(l.spent_delta_base_units),0)
   AND a.funded_base_units=COALESCE(SUM(l.funded_delta_base_units),0)) AS reconciled
FROM pwrc_credit_accounts a
LEFT JOIN pwrc_credit_ledger l ON l.organization_id=a.organization_id AND l.account_id=a.account_id
GROUP BY a.organization_id,a.account_id,a.user_id;

COMMENT ON TABLE pwrc_signed_receipts IS 'Immutable Ed25519-signed PWRC billing receipts. Not SPL assets and not transferable.';
COMMENT ON TABLE pwrc_receipt_anchor_outbox IS 'Transactional outbox for retry-safe batched Merkle-root anchoring of signed receipt hashes on Solana.';
