import { AnthropicProvider } from '../../../packages/ai-providers/anthropic.ts';
import { OpenAiChatCompatibleProvider } from '../../../packages/ai-providers/openai-chat.ts';
import { OpenAiResponsesProvider } from '../../../packages/ai-providers/openai-responses.ts';
import { ManagedAiRouter } from '../../../packages/ai-providers/router.ts';
import { loadServerEnv } from '../../config/env.ts';

export function createManagedAiRouter(source: NodeJS.ProcessEnv = process.env) {
  const env = loadServerEnv(source);
  const providers = [
    new OpenAiResponsesProvider('openai', env.ai.openai),
    new AnthropicProvider(env.ai.anthropic),
    // Gemini's OpenAI-compatible surface keeps the structural function-call contract consistent.
    new OpenAiChatCompatibleProvider('gemini', env.ai.gemini),
    new OpenAiResponsesProvider('deepseek', { ...env.ai.deepseek, responsePath: '/responses' }),
    new OpenAiChatCompatibleProvider('ollama', env.ai.ollama),
    // Backward-compatible Llama alias for existing deployments.
    new OpenAiChatCompatibleProvider('llama', env.ai.llama),
    new OpenAiChatCompatibleProvider('gridllm', env.ai.gridllm),
    new OpenAiChatCompatibleProvider('emergent', env.ai.emergent),
  ];
  return new ManagedAiRouter(providers, {
    order: env.ai.providerOrder,
    fallbackEnabled: env.ai.fallbackEnabled,
    timeoutMs: env.ai.timeoutMs,
  });
}
