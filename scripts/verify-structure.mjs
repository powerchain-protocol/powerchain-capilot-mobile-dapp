import { access } from "node:fs/promises";

const required = [
  "README.md",
  "server/src/integrations/sui.ts",
  "server/src/routes/sui.ts",
  "server/src/routes/config.ts",
  "docs/API-NAMESPACE-CORS.md",
  "server/src/routes/capilot-mobile.ts",
  "server/src/routes/cors.ts",
  "server/src/http/cors-policy.ts",
  "server/src/http/api-namespace.ts",
  "docs/ENVIRONMENT.md",
  "docker-compose.yml",
  "server/.env.production.example",
  "server/.env.example",
  "frontend/.env.production.example",
  "frontend/.env.example",
  ".env.example",
  "CHANGELOG.md",
  "LICENSE",
  "VERSION",
  "package.json",
  "tsconfig.json",
  "app.config.ts",
  "eas.json",
  "frontend/package.json",
  "frontend/tsconfig.json",
  "frontend/app/_layout.tsx",
  "frontend/src/providers/AppProviders.tsx",

  "app/_layout.tsx",
  "app/index.tsx",
  "app/(auth)/login.tsx",
  "app/(onboarding)/welcome.tsx",
  "app/(app)/(tabs)/_layout.tsx",
  "app/(app)/(tabs)/copilot.tsx",

  "src/components/ui/Card.tsx",
  "src/components/ui/Button.tsx",
  "src/components/ui/Screen.tsx",
  "src/components/chat/MessageComposer.tsx",
  "src/components/web3/AssetIcon.native.tsx",
  "src/components/web3/AssetIcon.web.tsx",

  "src/config/env.ts",
  "src/providers/AppProviders.tsx",
  "src/features/network/NetworkProvider.tsx",
  "src/components/layout/ResponsiveHeader.tsx",
  "src/components/layout/FloatingMobileTabBar.tsx",
  "src/hooks/useResponsiveLayout.ts",
  "src/hooks/useAdaptiveTypography.ts",
  "src/components/layout/AdaptiveSplitPane.tsx",
  "src/components/layout/AdaptiveDialog.tsx",
  "src/components/chat/ConversationRail.tsx",
  "scripts/verify-theme.mjs",
  "scripts/verify-dependencies.mjs",

  "packages/pwrc-credits/package.json",
  "packages/pwrc-credits/src/constants.ts",
  "packages/pwrc-credits/src/contracts.ts",
  "packages/pwrc-credits/src/ledger.ts",
  "packages/pwrc-credits/src/quote.ts",
  "packages/pwrc-credits/test/accounting.test.ts",
  "frontend/src/data/credit-prompts.ts",
  "prisma/migrations/20260825130000_pwrc_credit_module/migration.sql",
  "prisma.config.ts",
  "prisma/schema.prisma",
  "server/src/index.ts",
  "server/src/routes/ai.ts",
  "server/src/routes/integrations.ts",
  "server/src/routes/conversations.ts",
  "server/src/routes/sessions.ts"
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
