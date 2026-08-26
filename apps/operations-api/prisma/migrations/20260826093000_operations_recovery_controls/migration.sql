-- PowerChain Operations API recovery controls v1.0.0
-- Outbox delivery attempts are durable so optional realtime publication can be retried safely.
ALTER TABLE "OperationalOutbox"
  ADD COLUMN IF NOT EXISTS "publishAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastPublishAttemptAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastPublishError" TEXT,
  ADD COLUMN IF NOT EXISTS "nextAttemptAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "OperationalOutbox_publishedAt_occurredAt_idx";
CREATE INDEX IF NOT EXISTS "OperationalOutbox_publishedAt_nextAttemptAt_occurredAt_idx"
  ON "OperationalOutbox"("publishedAt", "nextAttemptAt", "occurredAt");
