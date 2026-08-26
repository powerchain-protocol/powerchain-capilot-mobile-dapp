import { existsSync, readFileSync } from 'node:fs';

const required = [
  'server/chat/service.ts',
  'server/ai/memory/service.ts',
  'server/llm/health.ts',
  'server/lora/registry.ts',
  'server/src/mcp/agents/registry.ts',
  'server/src/cors/policy.ts',
  'server/src/routes/chat.ts',
  'server/src/routes/diagnostics.ts',
  'apps/mobile/app/(tabs)/copilot.tsx',
  'apps/mobile/app/(tabs)/index.tsx',
  'apps/mobile/app/(tabs)/assets.tsx',
  'apps/mobile/app/(tabs)/alerts.tsx',
  'apps/mobile/app/(tabs)/profile.tsx',
  'apps/mobile/app/diagnostics.tsx',
  'apps/mobile/skills/SKILLS.md',
  'apps/mobile/skills/CHARACTERS.md',
  'apps/mobile/skills/CAPILOT.md',
  'shared/storage/index.ts',
  'shared/store/index.ts',
  'shared/utils/index.ts',
];
for (const path of required) if (!existsSync(path)) throw new Error(`Missing platform v3 file: ${path}`);
const tabs = readFileSync('apps/mobile/app/(tabs)/_layout.tsx', 'utf8');
for (const name of ['copilot', 'index', 'assets', 'alerts', 'profile']) if (!tabs.includes(`name="${name}"`)) throw new Error(`Missing visible tab: ${name}`);
const env = readFileSync('.env.server.example', 'utf8');
for (const name of ['GEMINI_API_KEY=', 'OLLAMA_BASE_URL=', 'GRIDLLM_BASE_URL=', 'CORS_ALLOWED_ORIGINS=', 'MESSAGE_ENCRYPTION_KEY=', 'LORA_ADAPTERS_JSON=']) if (!env.includes(name)) throw new Error(`Missing environment contract: ${name}`);
const schema = readFileSync('prisma/schema.prisma', 'utf8');
for (const model of ['model Conversation', 'model ChatMessage', 'model AiMemory']) if (!schema.includes(model)) throw new Error(`Missing Prisma model: ${model}`);
console.log('platform v3 static verification passed');
