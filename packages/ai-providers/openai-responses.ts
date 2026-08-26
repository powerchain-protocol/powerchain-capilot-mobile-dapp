import { joinApiUrl, parseToolArguments, postJson } from './http.ts';
import type { ManagedAiProvider, ManagedAiTurnInput, ManagedConversationEvent, ManagedToolCall, AiProviderName } from './types.ts';

function toResponsesInput(transcript: ManagedConversationEvent[]) {
  const input: unknown[] = [];
  for (const event of transcript) {
    if (event.kind === 'user') {
      input.push({ role: 'user', content: event.text });
    } else if (event.kind === 'assistant') {
      if (event.text) input.push({ role: 'assistant', content: event.text });
      for (const call of event.toolCalls) {
        input.push({ type: 'function_call', call_id: call.id, name: call.name, arguments: JSON.stringify(call.arguments) });
      }
    } else {
      input.push({ type: 'function_call_output', call_id: event.callId, output: event.output });
    }
  }
  return input;
}

export class OpenAiResponsesProvider implements ManagedAiProvider {
  constructor(
    readonly name: AiProviderName,
    private readonly config: { apiKey: string; baseUrl: string; model: string; responsePath?: string },
  ) {}

  get model() { return this.config.model; }
  isConfigured() { return Boolean(this.config.apiKey && this.config.baseUrl && this.config.model); }

  async generateTurn(input: ManagedAiTurnInput) {
    type ResponsePayload = {
      id?: string;
      output_text?: string;
      output?: Array<{
        type?: string;
        call_id?: string;
        name?: string;
        arguments?: string;
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };
    const body: Record<string, unknown> = {
      model: this.model,
      instructions: input.instructions,
      input: toResponsesInput(input.transcript),
      max_output_tokens: input.maxOutputTokens,
      tools: input.tools.map((tool) => ({
        type: 'function',
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      })),
    };
    if (this.name === 'openai' && input.reasoningEffort) {
      body.reasoning = { effort: input.reasoningEffort };
    }
    const response = await postJson<ResponsePayload>({
      provider: this.name,
      url: joinApiUrl(this.config.baseUrl, this.config.responsePath || '/v1/responses'),
      headers: { authorization: `Bearer ${this.config.apiKey}` },
      body,
      signal: input.signal,
    });
    const toolCalls: ManagedToolCall[] = [];
    const textParts: string[] = [];
    for (const item of response.output ?? []) {
      if (item.type === 'function_call' && item.call_id && item.name) {
        toolCalls.push({ id: item.call_id, name: item.name, arguments: parseToolArguments(item.arguments) });
      }
      if (item.type === 'message') {
        for (const content of item.content ?? []) {
          if (content.type === 'output_text' && content.text) textParts.push(content.text);
        }
      }
    }
    return {
      provider: this.name,
      model: this.model,
      text: response.output_text?.trim() || textParts.join('\n').trim(),
      toolCalls,
      responseId: response.id,
    };
  }
}
