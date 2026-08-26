import { joinApiUrl, postJson } from './http.ts';
import type { ManagedAiProvider, ManagedAiTurnInput, ManagedConversationEvent, ManagedToolCall } from './types.ts';

function toMessages(transcript: ManagedConversationEvent[]) {
  const messages: Array<{ role: 'user' | 'assistant'; content: unknown }> = [];
  for (const event of transcript) {
    if (event.kind === 'user') {
      messages.push({ role: 'user', content: event.text });
    } else if (event.kind === 'assistant') {
      const blocks: unknown[] = [];
      if (event.text) blocks.push({ type: 'text', text: event.text });
      for (const call of event.toolCalls) blocks.push({ type: 'tool_use', id: call.id, name: call.name, input: call.arguments });
      messages.push({ role: 'assistant', content: blocks });
    } else {
      messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: event.callId, content: event.output }] });
    }
  }
  return messages;
}

export class AnthropicProvider implements ManagedAiProvider {
  readonly name = 'anthropic' as const;
  constructor(private readonly config: { apiKey: string; baseUrl: string; model: string; version: string }) {}
  get model() { return this.config.model; }
  isConfigured() { return Boolean(this.config.apiKey && this.config.baseUrl && this.config.model); }

  async generateTurn(input: ManagedAiTurnInput) {
    type Payload = { id?: string; content?: Array<{ type?: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }> };
    const response = await postJson<Payload>({
      provider: this.name,
      url: joinApiUrl(this.config.baseUrl, '/v1/messages'),
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': this.config.version,
      },
      body: {
        model: this.model,
        system: input.instructions,
        messages: toMessages(input.transcript),
        max_tokens: input.maxOutputTokens,
        tools: input.tools.map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.inputSchema })),
      },
      signal: input.signal,
    });
    const toolCalls: ManagedToolCall[] = [];
    const text: string[] = [];
    for (const item of response.content ?? []) {
      if (item.type === 'text' && item.text) text.push(item.text);
      if (item.type === 'tool_use' && item.id && item.name) toolCalls.push({ id: item.id, name: item.name, arguments: item.input ?? {} });
    }
    return { provider: this.name, model: this.model, text: text.join('\n').trim(), toolCalls, responseId: response.id };
  }
}
