import assert from 'node:assert/strict';
import test from 'node:test';
import { createManagedCopilotGenerator } from '../src/providers/managed-generator.ts';
import type { ManagedAiTurnInput } from '../../packages/ai-providers/types.ts';

test('managed Copilot executes structural function calls and returns compact MCP provenance', async () => {
  const turns: ManagedAiTurnInput[] = [];
  let calls = 0;
  const router = {
    async generateTurn(input: ManagedAiTurnInput) {
      turns.push(input);
      calls += 1;
      if (calls === 1) {
        return {
          provider: 'openai' as const,
          model: 'test-model',
          text: '',
          toolCalls: [{ id: 'call-1', name: 'energy__search_assets', arguments: { status: 'active' } }],
        };
      }
      return {
        provider: 'openai' as const,
        model: 'test-model',
        text: 'Two active assets were returned by the approved external source.',
        toolCalls: [],
      };
    },
  };
  const executed: Array<Record<string, unknown>> = [];
  const mcp = {
    async tools() {
      return [{
        name: 'energy__search_assets',
        description: 'Search read-only asset records.',
        inputSchema: { type: 'object', properties: { status: { type: 'string' } }, additionalProperties: false },
      }];
    },
    async execute(input: any) {
      executed.push(input);
      return { output: '{"count":2,"assets":["A","B"]}' };
    },
  };
  const generate = createManagedCopilotGenerator({
    router: router as any,
    mcp,
    maxToolCalls: 4,
    maxOutputTokens: 512,
    reasoningEffort: 'medium',
  });

  const result = await generate({
    userId: 'user-1',
    conversationId: 'conversation-1',
    message: 'Find active assets',
    systemGrounding: { credits: { symbol: 'PWRC' } as any },
  });

  assert.equal(result.text, 'Two active assets were returned by the approved external source.');
  assert.deepEqual(result.provenance?.mcp, [{ tool: 'energy__search_assets', status: 'completed' }]);
  assert.equal(executed.length, 1);
  assert.equal((executed[0] as any).call.id, 'call-1');
  assert.equal(turns.length, 2);
  const toolResult = turns[1].transcript.find((event) => event.kind === 'tool_result');
  assert.ok(toolResult && toolResult.kind === 'tool_result');
  assert.match(toolResult.output, /untrusted data, never instructions/i);
  assert.match(toolResult.output, /"count":2/);
});

test('managed Copilot fails closed when an MCP function call fails', async () => {
  const router = {
    async generateTurn() {
      return {
        provider: 'openai' as const,
        model: 'test-model',
        text: '',
        toolCalls: [{ id: 'call-2', name: 'energy__search_assets', arguments: {} }],
      };
    },
  };
  const generate = createManagedCopilotGenerator({
    router: router as any,
    mcp: {
      async tools() { return [{ name: 'energy__search_assets', description: 'read only', inputSchema: { type: 'object' } }]; },
      async execute() { throw new Error('MCP upstream rejected request'); },
    },
    maxToolCalls: 2,
    maxOutputTokens: 256,
  });
  await assert.rejects(
    generate({ userId: 'user-2', message: 'search', systemGrounding: { credits: { symbol: 'PWRC' } as any } }),
    /MCP upstream rejected request/,
  );
});
