export type AiProviderName = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'ollama' | 'llama' | 'gridllm' | 'emergent';

export type ManagedTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type ManagedToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type ManagedConversationEvent =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string; toolCalls: ManagedToolCall[] }
  | { kind: 'tool_result'; callId: string; name: string; output: string };

export type ManagedAiTurnInput = {
  instructions: string;
  transcript: ManagedConversationEvent[];
  tools: ManagedTool[];
  maxOutputTokens: number;
  reasoningEffort?: string;
  signal?: AbortSignal;
};

export type ManagedAiTurn = {
  provider: AiProviderName;
  model: string;
  text: string;
  toolCalls: ManagedToolCall[];
  responseId?: string;
};

export interface ManagedAiProvider {
  readonly name: AiProviderName;
  readonly model: string;
  isConfigured(): boolean;
  generateTurn(input: ManagedAiTurnInput): Promise<ManagedAiTurn>;
}
