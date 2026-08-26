CREATE TABLE "McpToolInvocation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "conversationId" TEXT,
  "reservationId" TEXT,
  "requestId" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "functionName" TEXT NOT NULL,
  "readOnly" BOOLEAN NOT NULL DEFAULT TRUE,
  "argumentsHash" TEXT NOT NULL,
  "argumentsPreview" TEXT,
  "resultHash" TEXT,
  "status" TEXT NOT NULL,
  "errorCode" TEXT,
  "latencyMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "McpToolInvocation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "McpToolInvocation_userId_createdAt_idx" ON "McpToolInvocation"("userId", "createdAt");
CREATE INDEX "McpToolInvocation_conversationId_createdAt_idx" ON "McpToolInvocation"("conversationId", "createdAt");
CREATE INDEX "McpToolInvocation_reservationId_createdAt_idx" ON "McpToolInvocation"("reservationId", "createdAt");
CREATE INDEX "McpToolInvocation_requestId_idx" ON "McpToolInvocation"("requestId");
