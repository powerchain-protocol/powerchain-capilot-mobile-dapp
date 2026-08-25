import { prisma } from "../lib/prisma.js";
import { redactArguments, sha256Json } from "@powerchain/mcp-client";

export async function auditMcpInvocation(input: {
  id: string;
  userId: string;
  conversationId?: string;
  reservationId?: string;
  requestId: string;
  serverId: string;
  toolName: string;
  functionName: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: "COMPLETED" | "FAILED";
  errorCode?: string;
  latencyMs: number;
}) {
  const redacted = redactArguments(input.arguments);
  await prisma.mcpToolInvocation.create({
    data: {
      id: input.id,
      userId: input.userId,
      conversationId: input.conversationId,
      reservationId: input.reservationId,
      requestId: input.requestId,
      serverId: input.serverId,
      toolName: input.toolName,
      functionName: input.functionName,
      readOnly: true,
      argumentsHash: sha256Json(input.arguments),
      argumentsPreview: JSON.stringify(redacted).slice(0, 2000),
      resultHash: input.result ? sha256Json(input.result) : null,
      status: input.status,
      errorCode: input.errorCode,
      latencyMs: input.latencyMs,
    },
  });
}
