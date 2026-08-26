import { COPILOT_RESPONSE_PATH } from '@/constants/product';
import { ApiError, requestJson } from '@/lib/http';
import type { CopilotRequest, CopilotResponse } from '@/types/copilot';

function extractText(response: CopilotResponse) {
  const text = response.message ?? response.outputText ?? response.output_text;
  if (!text?.trim()) throw new ApiError('The Copilot response did not contain assistant text.', 502, response);
  return text.trim();
}

export async function createCopilotResponse(request: CopilotRequest, accessToken: string, idempotencyKey: string) {
  const response = await requestJson<CopilotResponse>(COPILOT_RESPONSE_PATH, {
    method: 'POST',
    authToken: accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    body: request,
  });

  return {
    conversationId: response.conversationId,
    text: extractText(response),
    credits: response.credits,
    delivery: response.delivery,
    provenance: response.provenance,
    messageUnit: response.messageUnit,
  };
}

export async function acknowledgeCopilotDelivery(reservationId: string, accessToken: string) {
  const path = COPILOT_RESPONSE_PATH.replace(/\/responses$/, '/delivery-ack');
  return requestJson<{ settlement: { reservationId: string; status: string; availableBaseUnits: string; availablePwrc?: string } }>(path, {
    method: 'POST',
    authToken: accessToken,
    body: { reservationId },
  });
}
