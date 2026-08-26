import OpenAI from "openai";
import { env } from "../config/env.js";
import { runCopilotMcpLoop } from "../mcp/copilot-loop.js";
import { createCopilotMcpRuntime } from "../mcp/runtime.js";

export type AiProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "deepseek"
  | "ollama"
  | "gridllm"
  | "emergent";

export interface AiGenerationInput {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  context?: unknown;
  signal?: AbortSignal;
  userId: string;
  conversationId?: string;
  reservationId?: string;
  requestId: string;
  instructions: string;
}

export interface AiGenerationResult {
  provider: AiProviderId;
  content: string;
  model: string;
  responseId: string | null;
  mcpInvocations: Array<{
    serverId: string;
    toolName: string;
    functionName: string;
    status: "completed" | "failed";
    latencyMs: number;
  }>;
}

type ProviderConfig = {
  id: AiProviderId;
  configured: boolean;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
};

function providerConfigs(): Record<AiProviderId, ProviderConfig> {
  return {
    openai: {
      id: "openai",
      configured: Boolean(env.OPENAI_API_KEY),
      model: env.OPENAI_MODEL,
      baseUrl: env.OPENAI_BASE_URL || undefined,
      apiKey: env.OPENAI_API_KEY,
    },
    anthropic: {
      id: "anthropic",
      configured: Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_MODEL),
      model: env.ANTHROPIC_MODEL,
      baseUrl: env.ANTHROPIC_BASE_URL,
      apiKey: env.ANTHROPIC_API_KEY,
    },
    gemini: {
      id: "gemini",
      configured: Boolean(env.GEMINI_API_KEY && env.GEMINI_MODEL),
      model: env.GEMINI_MODEL,
      baseUrl: env.GEMINI_BASE_URL,
      apiKey: env.GEMINI_API_KEY,
    },
    deepseek: {
      id: "deepseek",
      configured: Boolean(env.DEEPSEEK_API_KEY),
      model: env.DEEPSEEK_MODEL,
      baseUrl: env.DEEPSEEK_BASE_URL,
      apiKey: env.DEEPSEEK_API_KEY,
    },
    ollama: {
      id: "ollama",
      configured: Boolean(env.OLLAMA_BASE_URL && env.OLLAMA_MODEL),
      model: env.OLLAMA_MODEL,
      baseUrl: env.OLLAMA_BASE_URL || undefined,
      apiKey: env.OLLAMA_API_KEY || "local",
    },
    gridllm: {
      id: "gridllm",
      configured: Boolean(env.GRIDLLM_ENABLED && env.GRIDLLM_BASE_URL && env.GRIDLLM_MODEL),
      model: env.GRIDLLM_MODEL,
      baseUrl: env.GRIDLLM_BASE_URL || undefined,
      apiKey: env.GRIDLLM_API_KEY || "managed",
    },
    emergent: {
      id: "emergent",
      configured: Boolean(
        env.EMERGENT_LLM_KEY &&
          env.EMERGENT_LLM_BASE_URL &&
          env.EMERGENT_LLM_MODEL,
      ),
      model: env.EMERGENT_LLM_MODEL,
      baseUrl: env.EMERGENT_LLM_BASE_URL || undefined,
      apiKey: env.EMERGENT_LLM_KEY,
    },
  };
}

export function aiProviderStatus() {
  const configs = providerConfigs();
  return Object.values(configs).map(({ id, configured, model }) => ({
    id,
    configured,
    model: model ?? null,
  }));
}

function providerOrder(): AiProviderId[] {
  const raw = [
    env.AI_PRIMARY_PROVIDER,
    ...env.AI_PROVIDER_ORDER_PARSED,
  ] as AiProviderId[];
  return [...new Set(raw)];
}

function combinedSignal(signal?: AbortSignal) {
  const timeoutSignal = AbortSignal.timeout(env.AI_PROVIDER_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

function buildUserContent(input: AiGenerationInput) {
  const contextText = input.context
    ? `\nOperational context JSON:\n${JSON.stringify(input.context)}`
    : "";
  return `${input.message}${contextText}`;
}

async function generateWithOpenAiResponses(
  config: ProviderConfig,
  input: AiGenerationInput,
): Promise<AiGenerationResult> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
  });
  const initialInput = [
    ...input.history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user" as const, content: buildUserContent(input) },
  ];

  const { response, invocations } = await runCopilotMcpLoop({
    openai: client,
    model: config.model!,
    instructions: input.instructions,
    initialInput,
    signal: combinedSignal(input.signal),
    userId: input.userId,
    conversationId: input.conversationId,
    reservationId: input.reservationId,
    requestId: input.requestId,
    reasoningEffort: env.AI_REASONING_EFFORT,
  });

  return {
    provider: "openai",
    content: response?.output_text ?? "",
    model: config.model!,
    responseId: response?.id ?? null,
    mcpInvocations: invocations,
  };
}

async function generateWithOpenAiCompatibleChat(
  config: ProviderConfig,
  input: AiGenerationInput,
): Promise<AiGenerationResult> {
  const client = new OpenAI({
    apiKey: config.apiKey || "local",
    baseURL: config.baseUrl,
  });
  const runtime = await createCopilotMcpRuntime({
    production: env.NODE_ENV === "production",
    userId: input.userId,
    conversationId: input.conversationId,
    reservationId: input.reservationId,
    requestId: input.requestId,
  });

  const messages: any[] = [
    { role: "system", content: input.instructions },
    ...input.history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: buildUserContent(input) },
  ];

  let responseId: string | null = null;
  let finalText = "";

  for (let round = 0; round <= runtime.config.limits.maxToolCalls; round += 1) {
    const completion = await client.chat.completions.create(
      {
        model: config.model!,
        messages,
        max_tokens: env.AI_MAX_OUTPUT_TOKENS,
        tools: runtime.openAiChatTools.length
          ? (runtime.openAiChatTools as any)
          : undefined,
        tool_choice: runtime.openAiChatTools.length ? "auto" : undefined,
      } as any,
      { signal: combinedSignal(input.signal) },
    );

    responseId = completion.id ?? responseId;
    const message = completion.choices?.[0]?.message as any;
    if (!message) throw new Error(`${config.id} returned no assistant message.`);

    const toolCalls = Array.isArray(message.tool_calls)
      ? message.tool_calls
      : [];
    if (toolCalls.length === 0) {
      finalText = typeof message.content === "string" ? message.content : "";
      break;
    }

    messages.push(message);
    for (const call of toolCalls) {
      const name = call?.function?.name;
      if (!name) throw new Error(`${config.id} returned a tool call without a function name.`);
      let argumentsObject: Record<string, unknown> = {};
      try {
        argumentsObject = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        throw new Error(`${config.id} returned invalid MCP function arguments for ${name}.`);
      }
      const result = await runtime.execute(name, argumentsObject);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result.content,
      });
    }
  }

  return {
    provider: config.id,
    content: finalText,
    model: config.model!,
    responseId,
    mcpInvocations: runtime.invocations,
  };
}

async function generateWithAnthropic(
  config: ProviderConfig,
  input: AiGenerationInput,
): Promise<AiGenerationResult> {
  const runtime = await createCopilotMcpRuntime({
    production: env.NODE_ENV === "production",
    userId: input.userId,
    conversationId: input.conversationId,
    reservationId: input.reservationId,
    requestId: input.requestId,
  });

  const messages: any[] = [
    ...input.history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: buildUserContent(input) },
  ];

  let responseId: string | null = null;
  let finalText = "";

  for (let round = 0; round <= runtime.config.limits.maxToolCalls; round += 1) {
    const response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey!,
        "anthropic-version": env.ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: env.AI_MAX_OUTPUT_TOKENS,
        system: input.instructions,
        messages,
        tools: runtime.anthropicTools.length
          ? runtime.anthropicTools
          : undefined,
      }),
      signal: combinedSignal(input.signal),
    });

    if (!response.ok) {
      const text = await response.text();
      throw Object.assign(
        new Error(`Anthropic request failed (${response.status}).`),
        { providerStatus: response.status, providerBody: text.slice(0, 500) },
      );
    }

    const payload = (await response.json()) as any;
    responseId = payload.id ?? responseId;
    const blocks = Array.isArray(payload.content) ? payload.content : [];
    const toolUses = blocks.filter((block: any) => block?.type === "tool_use");
    const textBlocks = blocks
      .filter((block: any) => block?.type === "text" && typeof block.text === "string")
      .map((block: any) => block.text);

    if (toolUses.length === 0) {
      finalText = textBlocks.join("\n");
      break;
    }

    messages.push({ role: "assistant", content: blocks });
    const toolResults = [];
    for (const toolUse of toolUses) {
      const result = await runtime.execute(
        toolUse.name,
        (toolUse.input ?? {}) as Record<string, unknown>,
      );
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result.content,
        is_error: result.isError,
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return {
    provider: "anthropic",
    content: finalText,
    model: config.model!,
    responseId,
    mcpInvocations: runtime.invocations,
  };
}

async function generateProvider(
  provider: AiProviderId,
  input: AiGenerationInput,
) {
  const config = providerConfigs()[provider];
  if (!config.configured || !config.model) {
    throw Object.assign(new Error(`${provider} is not configured.`), {
      code: "AI_PROVIDER_NOT_CONFIGURED",
      provider,
    });
  }

  if (provider === "openai") {
    return generateWithOpenAiResponses(config, input);
  }
  if (provider === "anthropic") {
    return generateWithAnthropic(config, input);
  }
  return generateWithOpenAiCompatibleChat(config, input);
}

function isAbort(error: unknown) {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && /abort|cancel/i.test(error.name))
  );
}

export async function generateWithProviderRouting(
  input: AiGenerationInput,
): Promise<AiGenerationResult> {
  const configs = providerConfigs();
  const candidates = providerOrder().filter(
    (provider) => configs[provider].configured,
  );

  if (candidates.length === 0) {
    throw Object.assign(new Error("No AI provider is configured."), {
      statusCode: 503,
      code: "AI_PROVIDER_UNAVAILABLE",
    });
  }

  const failures: Array<{ provider: AiProviderId; message: string }> = [];
  for (const provider of candidates) {
    try {
      return await generateProvider(provider, input);
    } catch (error) {
      if (isAbort(error) || input.signal?.aborted) throw error;
      failures.push({
        provider,
        message: error instanceof Error ? error.message : "Provider failed.",
      });
      if (!env.AI_FALLBACK_ENABLED) throw error;
    }
  }

  throw Object.assign(new Error("All configured AI providers failed."), {
    statusCode: 503,
    code: "AI_PROVIDER_UNAVAILABLE",
    details: { failures },
  });
}
