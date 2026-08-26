import type { ManagedAiRouter } from '../../packages/ai-providers/router.ts';
import { loadLoraRegistry } from '../lora/registry.ts';

export function getLlmRuntimeStatus(router: ManagedAiRouter, source: NodeJS.ProcessEnv = process.env) {
  const lora = loadLoraRegistry(source);
  return {
    mode: 'managed',
    providers: router.configuredProviders(),
    fallbackEnabled: (source.AI_FALLBACK_ENABLED || 'true').toLowerCase() !== 'false',
    lora: { enabled: lora.enabled, adapters: lora.adapters.map((adapter) => ({ id: adapter.id, baseModel: adapter.baseModel })) },
  };
}
