CREATE TABLE IF NOT EXISTS "conversations" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_user_id_slug_key" ON "conversations"("user_id", "slug");
CREATE INDEX IF NOT EXISTS "conversations_user_id_updated_at_idx" ON "conversations"("user_id", "updated_at");

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "conversation_id" TEXT NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content_ciphertext" TEXT NOT NULL,
  "content_hash" TEXT NOT NULL,
  "provider" TEXT,
  "model" TEXT,
  "reservation_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "chat_messages_user_conversation_created_idx" ON "chat_messages"("user_id", "conversation_id", "created_at");
CREATE INDEX IF NOT EXISTS "chat_messages_reservation_id_idx" ON "chat_messages"("reservation_id");

CREATE TABLE IF NOT EXISTS "ai_memories" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "conversation_id" TEXT REFERENCES "conversations"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL,
  "content_ciphertext" TEXT NOT NULL,
  "content_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ai_memories_user_updated_idx" ON "ai_memories"("user_id", "updated_at");
CREATE INDEX IF NOT EXISTS "ai_memories_user_conversation_updated_idx" ON "ai_memories"("user_id", "conversation_id", "updated_at");
