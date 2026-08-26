import { access, readFile } from "node:fs/promises";

const required = [
  "packages/energy-contracts/src/ems.ts",
  "packages/energy-contracts/src/iot.ts",
  "packages/energy-contracts/src/depin.ts",
  "packages/energy-contracts/src/actions.ts",
  "packages/platform-adapters/src/auth/remote-auth.ts",
  "packages/platform-adapters/src/wallet/provider-neutral.ts",
  "packages/platform-clients/src/solana/json-rpc.ts",
  "packages/platform-clients/src/sui/json-rpc.ts",
  "packages/platform-clients/src/market/backend-market.ts",
  "apps/operations-api/package.json",
  "apps/operations-api/prisma/schema.prisma",
  "apps/operations-api/src/routes/health.ts",
  "apps/operations-api/src/routes/config.ts",
  "apps/operations-api/src/routes/ems.ts",
  "apps/operations-api/src/routes/iot.ts",
  "apps/operations-api/src/routes/depin.ts",
  "apps/operations-api/src/routes/actions.ts",
  "apps/operations-api/src/services/dispatch-state.ts",
  "apps/operations-api/src/policy/safe-action-policy.ts",
  "apps/mobile/src/api/energy-client.ts",
  "apps/mobile/src/services/ems/client.ts",
  "apps/mobile/src/services/iot/client.ts",
  "apps/mobile/src/services/depin/client.ts",
  "apps/mobile/src/services/safe-actions/client.ts",
  "apps/mobile/src/hooks/useSafeAction.ts",
  "apps/mobile/src/components/operations/EnergyFlowCard.tsx",
  "apps/mobile/app/(app)/energy/index.tsx",
  "apps/mobile/app/(app)/energy/flow.tsx",
  "apps/mobile/app/(app)/iot.tsx",
  "apps/mobile/app/(app)/depin.tsx",
  "docs/ENERGY-PLATFORM-ARCHITECTURE.md",
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

const checks = [];

const frontendEnv = await readFile("apps/mobile/src/config/env.ts", "utf8");
checks.push(["Energy API fallback", frontendEnv.includes("EXPO_PUBLIC_ENERGY_API_URL") && frontendEnv.includes("|| apiUrl")]);

const safeActions = await readFile("apps/operations-api/src/services/safe-actions.ts", "utf8");
const actionRoutes = await readFile("apps/operations-api/src/routes/actions.ts", "utf8");
const dispatchState = await readFile("apps/operations-api/src/services/dispatch-state.ts", "utf8");
const actionPolicy = await readFile("apps/operations-api/src/policy/safe-action-policy.ts", "utf8");
checks.push(["Safe actions fail closed", actionRoutes.includes("physicalExecution:false") && actionPolicy.includes("PHYSICAL_EXECUTION_NOT_EXPOSED")]);
checks.push(["No direct dispatch execution route", !actionRoutes.includes('/execute') && dispatchState.includes("physicalExecutionEnabled:false")]);
checks.push(["Deterministic action request hash", safeActions.includes("intentHash") && safeActions.includes("idempotencyKey") && safeActions.includes("expectedResourceVersion")]);

const backendConfig = await readFile("apps/operations-api/src/routes/config.ts", "utf8");
checks.push(["Sanitized config route", !/SUPABASE_SERVICE_ROLE_KEY|CONTROL_PLANE_SECRET|["\'](?:databaseUrl|energyDatabaseUrl|serviceRoleKey|secret)["\']\s*:/.test(backendConfig)]);

const allFrontend = await Promise.all([
  readFile("apps/mobile/src/api/energy-client.ts", "utf8"),
  readFile("apps/mobile/src/providers/platform-adapters.ts", "utf8"),
  readFile("apps/mobile/src/services/ems/client.ts", "utf8"),
  readFile("apps/mobile/src/services/iot/client.ts", "utf8"),
  readFile("apps/mobile/src/services/depin/client.ts", "utf8"),
]);
checks.push(["Frontend has no Prisma/Supabase SDK coupling", !allFrontend.join("\n").includes("@prisma/") && !allFrontend.join("\n").includes("@supabase/")]);

const solana = await readFile("packages/platform-clients/src/solana/json-rpc.ts", "utf8");
const sui = await readFile("packages/platform-clients/src/sui/json-rpc.ts", "utf8");
checks.push(["Provider-neutral Solana JSON-RPC", solana.includes("getHealth") && solana.includes("getAccountInfo")]);
checks.push(["Provider-neutral Sui JSON-RPC", sui.includes("sui_getObject") && sui.includes("sui_getLatestCheckpointSequenceNumber")]);

const contracts = await readFile("packages/energy-contracts/src/ems.ts", "utf8");
checks.push(["EMS numeric boundary uses strings", contracts.includes("value: string") && contracts.includes("targetPowerMw: string")]);

const packageFiles = [
  "package.json",
  "apps/operations-api/package.json",
  "packages/energy-contracts/package.json",
  "packages/platform-adapters/package.json",
  "packages/platform-clients/package.json",
];
const versions = await Promise.all(
  packageFiles.map(async (file) => JSON.parse(await readFile(file, "utf8")).version),
);
checks.push(["Version remains 1.0.0", versions.every((version) => version === "1.0.0")]);

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
