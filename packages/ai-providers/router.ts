import type { AiProviderName, ManagedAiProvider, ManagedAiTurn, ManagedAiTurnInput } from './types.ts';

export class ManagedProviderError extends Error {
  constructor(readonly attempts: Array<{ provider: string; error: string }>) {
    super(`All configured AI providers failed: ${attempts.map((a) => `${a.provider}: ${a.error}`).join('; ')}`);
    this.name = 'ManagedProviderError';
  }
}

export class ManagedAiRouter {
  private readonly providers = new Map<AiProviderName, ManagedAiProvider>();
  constructor(
    providers: ManagedAiProvider[],
    private readonly config: { order: AiProviderName[]; fallbackEnabled: boolean; timeoutMs: number },
  ) {
    for (const provider of providers) this.providers.set(provider.name, provider);
  }

  configuredProviders() {
    return this.config.order.filter((name) => this.providers.get(name)?.isConfigured());
  }

  async generateTurn(input: ManagedAiTurnInput): Promise<ManagedAiTurn> {
    const attempts: Array<{ provider: string; error: string }> = [];
    const candidates = this.config.fallbackEnabled ? this.config.order : this.config.order.slice(0, 1);
    for (const name of candidates) {
      const provider = this.providers.get(name);
      if (!provider?.isConfigured()) continue;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error('AI provider timeout')), this.config.timeoutMs);
      const relay = () => controller.abort(input.signal?.reason);
      input.signal?.addEventListener('abort', relay, { once: true });
      try {
        return await provider.generateTurn({ ...input, signal: controller.signal });
      } catch (error) {
        attempts.push({ provider: name, error: error instanceof Error ? error.message : String(error) });
      } finally {
        clearTimeout(timer);
        input.signal?.removeEventListener('abort', relay);
      }
    }
    if (!attempts.length) attempts.push({ provider: 'router', error: 'No configured provider is available.' });
    throw new ManagedProviderError(attempts);
  }
}
