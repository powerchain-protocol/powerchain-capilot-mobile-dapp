import assert from 'node:assert/strict';
import test from 'node:test';
import { ManagedAiRouter } from '../../packages/ai-providers/router.ts';
import type { ManagedAiProvider, ManagedAiTurnInput } from '../../packages/ai-providers/types.ts';
import { loadServerEnv } from '../config/env.ts';

class FakeProvider implements ManagedAiProvider {
  constructor(readonly name: any, readonly model: string, private readonly result: 'ok' | 'fail', private readonly configured = true) {}
  isConfigured() { return this.configured; }
  async generateTurn(_input: ManagedAiTurnInput) {
    if (this.result === 'fail') throw new Error('provider failed');
    return { provider: this.name, model: this.model, text: `${this.name} ok`, toolCalls: [] };
  }
}

test('managed AI environment normalizes requested defaults', () => {
  const env = loadServerEnv({ AI_PRIMARY_PROVIDER: 'openai' } as NodeJS.ProcessEnv);
  assert.equal(env.ai.openai.model, 'gpt-5.6-terra');
  assert.equal(env.ai.deepseek.model, 'deepseek-v4-flash');
  assert.equal(env.ai.anthropic.model, '');
  assert.deepEqual(env.ai.providerOrder.slice(0, 4), ['openai', 'anthropic', 'gemini', 'deepseek']);
});

test('provider fallback returns the first successful configured provider', async () => {
  const router = new ManagedAiRouter([
    new FakeProvider('openai', 'a', 'fail'),
    new FakeProvider('anthropic', 'b', 'ok'),
    new FakeProvider('deepseek', 'c', 'ok'),
  ], { order: ['openai', 'anthropic', 'deepseek'], fallbackEnabled: true, timeoutMs: 1_000 });
  const result = await router.generateTurn({ instructions: 'x', transcript: [{ kind: 'user', text: 'hi' }], tools: [], maxOutputTokens: 10 });
  assert.equal(result.provider, 'anthropic');
});

test('fallback disabled never invokes secondary providers', async () => {
  let secondaryCalled = false;
  const secondary: ManagedAiProvider = {
    name: 'anthropic', model: 'b', isConfigured: () => true,
    async generateTurn() { secondaryCalled = true; return { provider: 'anthropic', model: 'b', text: 'ok', toolCalls: [] }; },
  };
  const router = new ManagedAiRouter([new FakeProvider('openai', 'a', 'fail'), secondary], { order: ['openai', 'anthropic'], fallbackEnabled: false, timeoutMs: 1_000 });
  await assert.rejects(router.generateTurn({ instructions: 'x', transcript: [{ kind: 'user', text: 'hi' }], tools: [], maxOutputTokens: 10 }));
  assert.equal(secondaryCalled, false);
});
