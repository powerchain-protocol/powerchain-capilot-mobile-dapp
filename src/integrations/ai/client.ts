import { apiFetch } from "../../api/client";
import type {
  AiChatRequest,
  AiChatResponse,
} from "./types";

export async function sendCopilotMessage(
  input: AiChatRequest,
) {
  return apiFetch<AiChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
