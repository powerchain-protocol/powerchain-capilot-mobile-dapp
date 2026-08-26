ALTER TABLE "AiConversation" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "AiConversation_userId_slug_key" ON "AiConversation"("userId","slug");

ALTER TABLE "AiMessage"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "contentHash" TEXT,
  ADD COLUMN IF NOT EXISTS "encryptedContent" TEXT,
  ADD COLUMN IF NOT EXISTS "contentEncoding" TEXT NOT NULL DEFAULT 'plain';
CREATE UNIQUE INDEX IF NOT EXISTS "AiMessage_conversationId_slug_key" ON "AiMessage"("conversationId","slug");

CREATE TABLE IF NOT EXISTS "AiMemory" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "encryptedContent" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "metadata" JSONB,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AiMemory_userId_slug_key" ON "AiMemory"("userId","slug");
CREATE INDEX IF NOT EXISTS "AiMemory_userId_kind_updatedAt_idx" ON "AiMemory"("userId","kind","updatedAt");
CREATE INDEX IF NOT EXISTS "AiMemory_expiresAt_idx" ON "AiMemory"("expiresAt");
