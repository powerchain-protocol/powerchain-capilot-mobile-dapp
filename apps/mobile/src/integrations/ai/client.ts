import { apiFetch } from "../../api/client";
import type {
  AiChatRequest,
  AiChatResponse,
  AiChatWireResponse,
} from "./types";

const DELIVERY_ATTEMPTS = 3;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDeterministicClientError(error: unknown) {
  const status = (error as Error & { status?: number }).status;
  return Boolean(status && status >= 400 && status < 500);
}

async function acknowledgeWithRetry(input: {
  clientRequestId: string;
  responseToken: string;
}) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= DELIVERY_ATTEMPTS; attempt += 1) {
    try {
      return await apiFetch<AiChatResponse>("/ai/chat/ack", {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch (error) {
      lastError = error;
      if (isDeterministicClientError(error)) throw error;
      if (attempt < DELIVERY_ATTEMPTS) {
        await delay(200 * 2 ** (attempt - 1));
      }
    }
  }

  throw lastError;
}

async function recoverWithRetry(clientRequestId: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= DELIVERY_ATTEMPTS; attempt += 1) {
    try {
      return await apiFetch<AiChatWireResponse>("/ai/chat/recover", {
        method: "POST",
        body: JSON.stringify({ clientRequestId }),
      });
    } catch (error) {
      lastError = error;
      if (isDeterministicClientError(error)) throw error;
      if (attempt < DELIVERY_ATTEMPTS) {
        await delay(300 * 2 ** (attempt - 1));
      }
    }
  }

  throw lastError;
}

function acknowledgementUnknown(cause: unknown) {
  const unknown = new Error(
    "Copilot delivery acknowledgement status is unknown. Do not submit a duplicate request until the conversation and PWRC balance are refreshed.",
  ) as Error & {
    code?: string;
    cause?: unknown;
  };
  unknown.code = "COPILOT_ACK_STATUS_UNKNOWN";
  unknown.cause = cause;
  return unknown;
}

export async function sendCopilotMessage(
  input: AiChatRequest,
): Promise<AiChatResponse> {
  const prepared = await apiFetch<AiChatWireResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (prepared.creditSettlement === "settled") {
    return prepared;
  }

  try {
    // Generated content remains private to this function until this ACK
    // atomically converts RESERVED → SPENT on the server.
    return await acknowledgeWithRetry({
      clientRequestId: input.clientRequestId,
      responseToken: prepared.responseToken,
    });
  } catch (ackError) {
    // A lost ACK response is ambiguous: the server may already have settled.
    // Recover by clientRequestId without regenerating the answer.
    try {
      const recovered = await recoverWithRetry(input.clientRequestId);
      if (recovered.creditSettlement === "settled") {
        return recovered;
      }

      return await acknowledgeWithRetry({
        clientRequestId: input.clientRequestId,
        responseToken: recovered.responseToken,
      });
    } catch (recoveryError) {
      if (isDeterministicClientError(recoveryError)) {
        throw recoveryError;
      }
      throw acknowledgementUnknown(recoveryError ?? ackError);
    }
  }
}

export async function cancelCopilotMessage(clientRequestId: string) {
  return apiFetch<{ clientRequestId: string; cancelled: boolean }>(
    "/ai/chat/cancel",
    {
      method: "POST",
      body: JSON.stringify({ clientRequestId }),
    },
  );
}
