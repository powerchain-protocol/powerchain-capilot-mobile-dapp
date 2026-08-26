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
  "backend/platform-express/package.json",
  "backend/platform-express/prisma/schema.prisma",
  "backend/platform-express/src/routes/health.ts",
  "backend/platform-express/src/routes/config.ts",
  "backend/platform-express/src/routes/ems.ts",
  "backend/platform-express/src/routes/iot.ts",
  "backend/platform-express/src/routes/depin.ts",
  "backend/platform-express/src/routes/safe-actions.ts",
  "frontend/src/api/energy-client.ts",
  "frontend/src/services/ems/client.ts",
  "frontend/src/services/iot/client.ts",
  "frontend/src/services/depin/client.ts",
  "frontend/src/services/safe-actions/client.ts",
  "frontend/src/hooks/useSafeAction.ts",
  "frontend/src/components/operations/EnergyFlowCard.tsx",
  "frontend/app/(app)/energy/index.tsx",
  "frontend/app/(app)/energy/flow.tsx",
  "frontend/app/(app)/iot.tsx",
  "frontend/app/(app)/depin.tsx",
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

const frontendEnv = await readFile("frontend/src/config/env.ts", "utf8");
checks.push(["Energy API fallback", frontendEnv.includes("EXPO_PUBLIC_ENERGY_API_URL") && frontendEnv.includes("|| apiUrl")]);

const safeActions = await readFile("backend/platform-express/src/services/safe-actions.ts", "utf8");
checks.push(["Safe actions fail closed", safeActions.includes("ACTION_EXECUTION_DISABLED")]);
checks.push(["Ambiguous execution becomes UNKNOWN", safeActions.includes("CONTROL_PLANE_TRANSPORT_UNKNOWN") && safeActions.includes('state: "unknown"')]);
checks.push(["Atomic action claim", safeActions.includes("updateMany") && safeActions.includes("resourceVersion")]);

const backendConfig = await readFile("backend/platform-express/src/routes/config.ts", "utf8");
checks.push(["Sanitized config route", !/SUPABASE_SERVICE_ROLE_KEY|CONTROL_PLANE_SECRET|["\'](?:databaseUrl|energyDatabaseUrl|serviceRoleKey|secret)["\']\s*:/.test(backendConfig)]);

const allFrontend = await Promise.all([
  readFile("frontend/src/api/energy-client.ts", "utf8"),
  readFile("frontend/src/providers/platform-adapters.ts", "utf8"),
  readFile("frontend/src/services/ems/client.ts", "utf8"),
  readFile("frontend/src/services/iot/client.ts", "utf8"),
  readFile("frontend/src/services/depin/client.ts", "utf8"),
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
  "backend/platform-express/package.json",
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
