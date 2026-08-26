import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const required=[
  "apps/operations-api/src/services/digital-twin.ts",
  "apps/operations-api/src/services/telemetry-integrity.ts",
  "apps/operations-api/src/services/live-flow-validation.ts",
  "apps/operations-api/src/services/dispatch-state.ts",
  "apps/operations-api/src/services/evidence.ts",
  "apps/operations-api/src/routes/alarms.ts",
  "apps/operations-api/src/routes/events.ts",
  "apps/operations-api/src/routes/twin.ts",
  "apps/operations-api/src/routes/exports.ts",
  "apps/operations-api/prisma/migrations/20260826100000_operational_twin_integrity/migration.sql",
  "apps/api/src/chat/message-security.ts",
  "apps/api/src/routes/chat.ts",
  "apps/api/src/ai/memory/service.ts",
  "apps/api/src/ai/llm/router.ts",
  "apps/api/src/ai/lora/registry.ts",
  "apps/api/src/mpc/agents/registry.ts",
  "apps/mobile/src/operations/useOperationalResource.ts",
  "apps/mobile/src/components/navigation/OperationalCommandMenu.tsx",
  "apps/mobile/app/(app)/operations.tsx",
  "apps/mobile/skills/SKILLS.md",
  "apps/mobile/skills/CHARACTERS.md",
  "apps/mobile/skills/CAPILOT.md",
];
for(const file of required){if(!fs.existsSync(path.join(root,file)))throw new Error(`Missing ${file}`);}
const checks=[
 ["apps/api/src/http/api-namespace.ts",["\"sites\"","\"alarms\"","\"events\"","\"twin\"","\"actions\"","\"chat\""]],
 ["apps/api/src/chat/message-security.ts",["aes-256-gcm","contentHash","[encrypted]"]],
 ["apps/operations-api/src/services/telemetry-integrity.ts",["TELEMETRY_IDEMPOTENCY_CONFLICT","TELEMETRY_SEQUENCE_CONFLICT","BigInt"]],
 ["apps/operations-api/src/services/dispatch-state.ts",["physicalExecutionEnabled:false","review_required","requestHash"]],
 ["apps/operations-api/src/app.ts",["cache-control","x-request-id","/internal/v1/ingestion"]],
 ["apps/mobile/src/operations/useOperationalResource.ts",["AppState","dedupedLoad","staleTimeMs"]],
 ["apps/mobile/src/components/navigation/OperationalCommandMenu.tsx",["metaKey","ctrlKey","physical execution remains disabled"]],
 ["apps/operations-api/prisma/migrations/20260826100000_operational_twin_integrity/migration.sql",["append-only","BEFORE UPDATE OR DELETE","OperationalEventJournal"]],
 ["apps/api/src/routes/ai.ts",["protectUserMessage","secureConversationTitle","slug: crypto.randomUUID()"]],
 ["apps/api/src/credits/pending-response.ts",["slug: crypto.randomUUID()"]],
];
for(const [file,terms] of checks){const text=fs.readFileSync(path.join(root,file),"utf8");for(const term of terms){if(!text.toLowerCase().replaceAll(" ","").includes(String(term).toLowerCase().replaceAll(" ","")))throw new Error(`${file} missing ${term}`);}}
console.log(`Operational hardening verification passed (${required.length} required artifacts).`);
