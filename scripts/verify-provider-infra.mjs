import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const checks = [
  ['managed provider router', 'packages/ai-providers/router.ts'],
  ['OpenAI Responses provider', 'packages/ai-providers/openai-responses.ts'],
  ['Anthropic provider', 'packages/ai-providers/anthropic.ts'],
  ['Gemini/OpenAI-compatible provider adapter', 'packages/ai-providers/openai-chat.ts'],
  ['DeepSeek/OpenAI-compatible provider adapter', 'packages/ai-providers/openai-responses.ts'],
  ['Ollama/GRIDLLM compatible provider adapter', 'packages/ai-providers/openai-chat.ts'],
  ['managed generator', 'server/src/providers/managed-generator.ts'],
  ['Fastify API', 'server/src/app.ts'],
  ['Express MCP gateway', 'backend/express/src/server.ts'],
  ['Python FastAPI gateway', 'backend/python/app/main.py'],
  ['Solana/Sui config', 'server/config/networks.ts'],
  ['Prisma schema', 'prisma/schema.prisma'],
  ['Prisma v7 config', 'prisma.config.ts'],
  ['settings encryption', 'server/security/settings-crypto.ts'],
  ['rate limiting', 'server/rate-limit/limiter.ts'],
  ['MCP audit', 'server/src/mcp/audit.ts'],
  ['authoritative PWRC metering + ACK compatibility', 'server/copilot/metered-response.ts'],
  ['provider infrastructure docs', 'docs/PROVIDER_INFRASTRUCTURE.md'],
];
for (const [label, relative] of checks) {
  if (!fs.existsSync(path.join(root, relative))) throw new Error(`Missing ${label}: ${relative}`);
  console.log(`✓ ${label}`);
}

const serverEnv = fs.readFileSync(path.join(root, '.env.server.example'), 'utf8');
for (const key of [
  'POWERCHAIN_CREDIT_TOKEN=PWRC',
  'OPENAI_MODEL=gpt-5.6-terra',
  'DEEPSEEK_MODEL=deepseek-v4-flash',
  'GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai',
  'OLLAMA_BASE_URL=http://127.0.0.1:11434/v1',
  'GRIDLLM_BASE_URL=',
  'SOLANA_RPC_PROVIDER=auto',
  'SUI_NETWORK=devnet',
  'AUTH_TOKEN_MODE=opaque',
  'RATE_LIMIT_STORE=memory',
]) {
  if (!serverEnv.includes(key)) throw new Error(`Missing expected environment contract: ${key}`);
}
if (serverEnv.includes('POWERCHAN_:CREDIT_TOKEN')) throw new Error('Invalid shell variable name survived normalization.');
console.log('✓ server environment contract');

const publicEnv = fs.readFileSync(path.join(root, '.env.development.example'), 'utf8');
for (const key of [
  'EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1',
  'EXPO_PUBLIC_NETWORK=devnet',
  'EXPO_PUBLIC_DATA_MODE=demo',
  'EXPO_PUBLIC_AI_MODE=managed',
  'EXPO_PUBLIC_CREDIT_TOKEN=PWRC',
]) {
  if (!publicEnv.includes(key)) throw new Error(`Missing expected Expo environment contract: ${key}`);
}
console.log('✓ Expo environment contract');

const system = fs.readFileSync(path.join(root, 'server/config/networks.ts'), 'utf8');
for (const forbidden of ['HELIUS_API_KEY:', 'DATABASE_URL:', 'OPENAI_API_KEY:', 'rpcUrl: config.solana.rpcUrl']) {
  if (system.includes(forbidden)) throw new Error(`Potential secret field in sanitized system module: ${forbidden}`);
}
console.log('✓ sanitized system API boundary');

const fastify = fs.readFileSync(path.join(root, 'server/src/app.ts'), 'utf8');
for (const route of [
  '/api/v1/copilot/delivery-ack',
  '/api/v1/capilot-mobile/copilot/delivery-ack',
  '/api/v1/copilot-mobile/copilot/delivery-ack',
]) {
  if (!fastify.includes(route)) throw new Error(`Missing delivery ACK compatibility route: ${route}`);
}
console.log('✓ delivery ACK compatibility routes');

const prismaConfig = fs.readFileSync(path.join(root, 'prisma.config.ts'), 'utf8');
if (!prismaConfig.includes('DIRECT_URL') || !prismaConfig.includes('DATABASE_URL')) {
  throw new Error('Prisma v7 config must resolve DIRECT_URL/DATABASE_URL outside schema.prisma.');
}
const prismaSchema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
if (/directUrl\s*=/.test(prismaSchema)) throw new Error('Prisma v7 schema must not use removed datasource.directUrl.');
console.log('✓ Prisma v7 connection contract');

const managedGenerator = fs.readFileSync(path.join(root, 'server/src/providers/managed-generator.ts'), 'utf8');
if (!managedGenerator.includes('untrusted data, never instructions')) throw new Error('Missing untrusted MCP model-context boundary.');
console.log('✓ untrusted MCP result boundary');

const allTs = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) allTs.push(full);
  }
}
for (const dir of ['server', 'packages', 'src', 'backend/express']) walk(path.join(root, dir));
for (const file of allTs) {
  const text = fs.readFileSync(file, 'utf8');
  if (/^\s*(from\s+\w+\s+import|def\s+\w+\s*\()/m.test(text)) throw new Error(`Python syntax detected in TypeScript: ${path.relative(root, file)}`);
}
console.log(`✓ no Python syntax inside ${allTs.length} TypeScript/TSX files`);
