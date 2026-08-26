ALTER TABLE "chat_messages"
  ADD COLUMN IF NOT EXISTS "message_unit_id" TEXT,
  ADD COLUMN IF NOT EXISTS "receipt_id" TEXT,
  ADD COLUMN IF NOT EXISTS "receipt_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "pwrc_debit_base_units" TEXT,
  ADD COLUMN IF NOT EXISTS "reference_value_usd" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "chat_messages_message_unit_id_key"
  ON "chat_messages"("message_unit_id")
  WHERE "message_unit_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "chat_messages_receipt_id_idx"
  ON "chat_messages"("receipt_id")
  WHERE "receipt_id" IS NOT NULL;
