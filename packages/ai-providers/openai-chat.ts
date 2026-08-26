import { joinApiUrl, parseToolArguments, postJson } from './http.ts';
import type { AiProviderName, ManagedAiProvider, ManagedAiTurnInput, ManagedConversationEvent, ManagedToolCall } from './types.ts';

function toMessages(instructions: string, transcript: ManagedConversationEvent[]) {
  const messages: Array<Record<string, unknown>> = [{ role: 'system', content: instructions }];
  for (const event of transcript) {
    if (event.kind === 'user') messages.push({ role: 'user', content: event.text });
    else if (event.kind === 'assistant') {
      messages.push({
        role: 'assistant',
        content: event.text || null,
        tool_calls: event.toolCalls.length ? event.toolCalls.map((call) => ({
          id: call.id,
          type: 'function',
          function: { name: call.name, arguments: JSON.stringify(call.arguments) },
        })) : undefined,
      });
    } else messages.push({ role: 'tool', tool_call_id: event.callId, name: event.name, content: event.output });
  }
  return messages;
}

export class OpenAiChatCompatibleProvider implements ManagedAiProvider {
  constructor(
    readonly name: AiProviderName,
    private readonly config: { apiKey: string; baseUrl: string; model: string },
  ) {}
  get model() { return this.config.model; }
  isConfigured() { return Boolean(this.config.baseUrl && this.config.model && this.config.apiKey); }

  async generateTurn(input: ManagedAiTurnInput) {
    type Payload = { id?: string; choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }> } }> };
    const response = await postJson<Payload>({
      provider: this.name,
      url: joinApiUrl(this.config.baseUrl, '/chat/completions'),
      headers: this.config.apiKey ? { authorization: `Bearer ${this.config.apiKey}` } : {},
      body: {
        model: this.model,
        messages: toMessages(input.instructions, input.transcript),
        max_tokens: input.maxOutputTokens,
        tools: input.tools.map((tool) => ({ type: 'function', function: { name: tool.name, description: tool.description, parameters: tool.inputSchema } })),
        tool_choice: 'auto',
      },
      signal: input.signal,
    });
    const message = response.choices?.[0]?.message;
    const toolCalls: ManagedToolCall[] = [];
    for (const call of message?.tool_calls ?? []) {
      if (call.id && call.function?.name) toolCalls.push({ id: call.id, name: call.function.name, arguments: parseToolArguments(call.function.arguments) });
    }
    return { provider: this.name, model: this.model, text: message?.content?.trim() ?? '', toolCalls, responseId: response.id };
  }
}
