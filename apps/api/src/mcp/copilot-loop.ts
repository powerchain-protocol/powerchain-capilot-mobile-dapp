import type OpenAI from "openai";
import {
  createCopilotMcpRuntime,
  type CopilotMcpInvocationSummary,
} from "./runtime.js";

export type { CopilotMcpInvocationSummary } from "./runtime.js";

export async function buildCopilotMcpTools(production: boolean) {
  const runtime = await createCopilotMcpRuntime({
    production,
    userId: "tool-discovery",
    requestId: "tool-discovery",
  });
  return {
    config: runtime.config,
    descriptors: runtime.descriptors,
    tools: runtime.openAiResponsesTools,
  };
}

export async function runCopilotMcpLoop(input: {
  openai: OpenAI;
  model: string;
  instructions: string;
  initialInput: any[];
  signal?: AbortSignal;
  userId: string;
  conversationId?: string;
  reservationId?: string;
  requestId: string;
  reasoningEffort?: "none" | "low" | "medium" | "high" | "xhigh" | "max";
}) {
  const runtime = await createCopilotMcpRuntime({
    production: process.env.NODE_ENV === "production",
    userId: input.userId,
    conversationId: input.conversationId,
    reservationId: input.reservationId,
    requestId: input.requestId,
  });

  let modelInput: any[] = [...input.initialInput];
  let lastResponse: any = null;

  for (let round = 0; round <= runtime.config.limits.maxToolCalls; round += 1) {
    lastResponse = await input.openai.responses.create(
      {
        model: input.model,
        store: false,
        instructions: input.instructions,
        input: modelInput,
        tools: runtime.openAiResponsesTools,
        tool_choice: runtime.openAiResponsesTools.length ? "auto" : "none",
        parallel_tool_calls: false,
        ...(input.reasoningEffort ? { reasoning: { effort: input.reasoningEffort } } : {}),
      } as any,
      { signal: input.signal },
    );

    const functionCalls = (lastResponse.output ?? []).filter(
      (item: any) => item.type === "function_call",
    );
    if (functionCalls.length === 0) break;

    modelInput.push(...lastResponse.output);

    for (const call of functionCalls) {
      let argumentsObject: Record<string, unknown> = {};
      try {
        argumentsObject = JSON.parse(call.arguments || "{}") as Record<string, unknown>;
      } catch {
        throw new Error(`Invalid MCP function arguments for ${call.name}.`);
      }

      const result = await runtime.execute(call.name, argumentsObject);
      modelInput.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: result.content,
      });
    }
  }

  return {
    response: lastResponse,
    invocations: runtime.invocations as CopilotMcpInvocationSummary[],
  };
}
