import assert from 'node:assert/strict';
import test from 'node:test';
import { PrismaEncryptedChatService } from '../chat/service.ts';
import { PrismaAiMemoryService } from '../ai/memory/service.ts';
import { loadCorsPolicy } from '../src/cors/policy.ts';
import { filterToolsForAgent, getMcpAgentProfile } from '../src/mcp/agents/registry.ts';
import { loadServerEnv } from '../config/env.ts';

const SECRET = '0123456789abcdef0123456789abcdef';

function createFakeChatDelegates() {
  const conversations: any[] = [];
  const messages: any[] = [];
  return {
    conversations: {
      async findFirst(args: any) { return conversations.find((row) => row.id === args.where.id && row.userId === args.where.userId) ?? null; },
      async findMany(args: any) { return conversations.filter((row) => row.userId === args.where.userId).slice(0, args.take); },
      async create(args: any) { const row = { id: `c_${conversations.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() }; conversations.push(row); return row; },
      async update(args: any) { const row = conversations.find((item) => item.id === args.where.id); Object.assign(row, args.data); return row; },
    },
    messages: {
      async findMany(args: any) { return messages.filter((row) => row.userId === args.where.userId && row.conversationId === args.where.conversationId).slice(0, args.take); },
      async create(args: any) { const row = { id: `m_${messages.length + 1}`, ...args.data, createdAt: new Date() }; messages.push(row); return row; },
    },
    rows: { conversations, messages },
  };
}

test('secure chat encrypts stored content and scopes conversation access', async () => {
  const fake = createFakeChatDelegates();
  const chat = new PrismaEncryptedChatService(fake.conversations, fake.messages, SECRET);
  const conversation = await chat.ensureConversation({ userId: 'u1', titleSeed: 'Solar Farm Analysis' });
  const message = await chat.appendMessage({ userId: 'u1', conversationId: conversation.id, role: 'user', content: 'Review meter evidence.' });
  assert.equal(message.content, 'Review meter evidence.');
  assert.notEqual(fake.rows.messages[0].contentCiphertext, message.content);
  assert.equal(fake.rows.messages[0].contentHash.length, 64);
  const listed = await chat.listMessages('u1', conversation.id, 10);
  assert.equal(listed[0]?.content, 'Review meter evidence.');
  await assert.rejects(() => chat.listMessages('u2', conversation.id, 10), /Conversation not found/);
});



test('secure chat persists message-unit proof metadata without exposing plaintext billing data', async () => {
  const fake = createFakeChatDelegates();
  const chat = new PrismaEncryptedChatService(fake.conversations, fake.messages, SECRET);
  const conversation = await chat.ensureConversation({ userId: 'u1', titleSeed: 'PWRC message unit' });
  await chat.appendMessage({
    userId: 'u1',
    conversationId: conversation.id,
    role: 'assistant',
    content: 'Verified operational response.',
    reservationId: 'res_1',
    messageUnitId: 'pmsg_0123456789abcdef0123456789abcdef',
    receiptId: 'receipt_1',
    receiptHash: 'a'.repeat(64),
    pwrcDebitBaseUnits: '10000000000000',
    referenceValueUsd: '0.02',
  });
  assert.notEqual(fake.rows.messages[0].contentCiphertext, 'Verified operational response.');
  const [listed] = await chat.listMessages('u1', conversation.id, 10);
  assert.equal(listed?.messageUnitId, 'pmsg_0123456789abcdef0123456789abcdef');
  assert.equal(listed?.receiptId, 'receipt_1');
  assert.equal(listed?.receiptHash, 'a'.repeat(64));
  assert.equal(listed?.pwrcDebitBaseUnits, '10000000000000');
  assert.equal(listed?.referenceValueUsd, '0.02');
});
test('AI memory rejects likely credentials and decrypts user-scoped grounding', async () => {
  const rows: any[] = [];
  const delegate = {
    async findMany(args: any) { return rows.filter((row) => row.userId === args.where.userId).slice(0, args.take); },
    async create(args: any) { const row = { id: `mem_${rows.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() }; rows.push(row); return row; },
    async deleteMany(args: any) { const before = rows.length; for (let i = rows.length - 1; i >= 0; i--) if (rows[i].userId === args.where.userId && (!args.where.id || rows[i].id === args.where.id)) rows.splice(i, 1); return { count: before - rows.length }; },
  };
  const memory = new PrismaAiMemoryService(delegate, SECRET);
  await assert.rejects(() => memory.remember({ userId: 'u1', kind: 'context', content: 'api_key=supersecret' }), /credentials/i);
  await memory.remember({ userId: 'u1', kind: 'preference', content: 'Prefer concise operational summaries.' });
  const grounding = await memory.getGrounding({ userId: 'u1' });
  assert.deepEqual(grounding, [{ kind: 'preference', content: 'Prefer concise operational summaries.' }]);
});

test('production CORS requires explicit origins and normalizes allowed origins', () => {
  assert.throws(() => loadCorsPolicy({ NODE_ENV: 'production' } as NodeJS.ProcessEnv), /CORS_ALLOWED_ORIGINS/);
  const policy = loadCorsPolicy({ NODE_ENV: 'production', CORS_ALLOWED_ORIGINS: 'https://app.powerchain.energy', CORS_ALLOW_CREDENTIALS: 'true' } as NodeJS.ProcessEnv);
  assert.equal(policy.allowedOrigins.has('https://app.powerchain.energy'), true);
});

test('managed provider environment includes Gemini, Ollama and GRIDLLM without changing PWRC billing', () => {
  const env = loadServerEnv({ AI_PROVIDER_ORDER: 'openai,anthropic,gemini,deepseek,ollama,gridllm', CHAT_ENABLED: 'false' } as NodeJS.ProcessEnv);
  assert.deepEqual(env.ai.providerOrder, ['openai', 'anthropic', 'gemini', 'deepseek', 'ollama', 'gridllm']);
  assert.equal(env.ai.gemini.baseUrl.includes('generativelanguage.googleapis.com'), true);
  assert.equal(env.ai.ollama.baseUrl, 'http://127.0.0.1:11434/v1');
});

test('MCP agent profiles only narrow model-visible tools', () => {
  const tools = [
    { name: 'energy__search_assets', description: 'x', inputSchema: {} },
    { name: 'treasury__balances', description: 'x', inputSchema: {} },
  ];
  const researcher = getMcpAgentProfile('researcher');
  const filtered = filterToolsForAgent(tools, researcher);
  assert.deepEqual(filtered.map((tool) => tool.name), ['energy__search_assets']);
  assert.equal(getMcpAgentProfile('operator').maxToolCalls, 8);
});

test('CORS_ORIGINS compatibility alias is accepted by production policy', () => {
  const policy = loadCorsPolicy({ NODE_ENV: 'production', CORS_ORIGINS: 'https://mobile.powerchain.energy' } as NodeJS.ProcessEnv);
  assert.equal(policy.allowedOrigins.has('https://mobile.powerchain.energy'), true);
});
