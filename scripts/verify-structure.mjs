import { access } from "node:fs/promises";

const required = [
  "docs/MONOREPO.md",
  "apps/README.md",
  "packages/README.md",
  "apps/operations-api/package.json",
  "apps/mcp-gateway/package.json",
  "services/mcp-python/pyproject.toml",
  "tsconfig.base.json",
  "scripts/verify-providers-solana.mjs",
  "apps/api/src/lib/settings-crypto.ts",
  "apps/api/src/lib/jwt.ts",
  "apps/api/src/lib/redis.ts",
  "apps/api/src/lib/mongo.ts",
  "apps/api/src/routes/system-solana.ts",
  "apps/api/src/config/solana.ts",
  "apps/api/src/integrations/ai-providers.ts",
  "docs/AI-PROVIDERS-SOLANA.md",
  "docs/INTERACTION-DESIGN.md",
  "apps/mobile/src/constants/routes.ts",
  "apps/mobile/src/components/layout/ScreenToolbar.tsx",
  "apps/mobile/app/(app)/(tabs)/action-center.tsx",
  "apps/mobile/app/(app)/service-health.tsx",
  "apps/mobile/app/(app)/diagnostics.tsx",
  "apps/mobile/app/(app)/approvals/batch.tsx",
  "apps/mobile/app/(app)/settlements/review.tsx",
  "README.md",
  "apps/api/src/integrations/sui.ts",
  "apps/api/src/routes/sui.ts",
  "apps/api/src/routes/config.ts",
  "docs/API-NAMESPACE-CORS.md",
  "apps/api/src/routes/capilot-mobile.ts",
  "apps/api/src/routes/cors.ts",
  "apps/api/src/http/cors-policy.ts",
  "apps/api/src/http/api-namespace.ts",
  "docs/ENVIRONMENT.md",
  "docker-compose.yml",
  "apps/api/.env.production.example",
  "apps/api/.env.example",
  "apps/mobile/.env.production.example",
  "apps/mobile/.env.example",
  ".env.example",
  "CHANGELOG.md",
  "LICENSE",
  "VERSION",
  "package.json",
  "tsconfig.json",
  "apps/mobile/package.json",
  "apps/mobile/tsconfig.json",
  "apps/mobile/app/_layout.tsx",
  "apps/mobile/src/providers/AppProviders.tsx",



  "scripts/verify-theme.mjs",
  "scripts/verify-dependencies.mjs",

  "packages/pwrc-credits/package.json",
  "packages/pwrc-credits/src/constants.ts",
  "packages/pwrc-credits/src/contracts.ts",
  "packages/pwrc-credits/src/ledger.ts",
  "packages/pwrc-credits/src/quote.ts",
  "packages/pwrc-credits/test/accounting.test.ts",
  "apps/mobile/src/data/credit-prompts.ts",
  "apps/api/prisma/migrations/20260825130000_pwrc_credit_module/migration.sql",
  "apps/api/prisma.config.ts",
  "apps/api/prisma/schema.prisma",
  "apps/api/src/index.ts",
  "apps/api/src/routes/ai.ts",
  "apps/api/src/routes/integrations.ts",
  "apps/api/src/routes/conversations.ts",
  "apps/api/src/routes/sessions.ts"
];

let failed = false;

for (const file of required) {
  try {
    await access(file);
    console.log(`✓ ${file}`);
  } catch {
    failed = true;
    console.error(`✗ ${file}`);
  }
}

if (failed) process.exitCode = 1;
