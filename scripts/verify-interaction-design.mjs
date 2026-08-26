import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const required = [
  "docs/INTERACTION-DESIGN.md",
  "frontend/src/constants/routes.ts",
  "frontend/src/components/layout/ScreenToolbar.tsx",
  "frontend/src/data/operations-demo.ts",
  "frontend/src/integrations/status/diagnostics.ts",
  "frontend/app/(app)/(tabs)/action-center.tsx",
  "frontend/app/(app)/approvals/batch.tsx",
  "frontend/app/(app)/assets/[assetId].tsx",
  "frontend/app/(app)/reports.tsx",
  "frontend/app/(app)/settlements/review.tsx",
  "frontend/app/(app)/service-health.tsx",
  "frontend/app/(app)/diagnostics.tsx",
  "frontend/app/(app)/settings.tsx",
  "frontend/assets/brand/logo-green.png",
  "frontend/assets/icons/icon.png",
];

let failed = false;
for (const file of required) {
  try { await access(file); console.log(`✓ ${file}`); }
  catch { failed = true; console.error(`✗ missing ${file}`); }
}

const tabs = await readFile("frontend/app/(app)/(tabs)/_layout.tsx", "utf8");
const routes = await readFile("frontend/src/constants/routes.ts", "utf8");
const diagnostics = await readFile("frontend/src/integrations/status/diagnostics.ts", "utf8");
const themeSelector = await readFile("frontend/src/theme/ThemeSelector.tsx", "utf8");
const demo = await readFile("frontend/src/data/operations-demo.ts", "utf8");

const checks = [
  ["exact five tab screens", (tabs.match(/<Tabs\.Screen/g) ?? []).length === 5],
  ["Overview tab", tabs.includes('name="index"') && tabs.includes('tabBarLabel: "Overview"')],
  ["Action Center tab", tabs.includes('name="action-center"')],
  ["Copilot tab", tabs.includes('name="copilot"')],
  ["Assets tab", tabs.includes('name="assets"')],
  ["Systems tab", tabs.includes('name="integrations"')],
  ["Settings not primary tab", !tabs.includes('name="settings"')],
  ["batch approval route", routes.includes('batchApprovals: "/(app)/approvals/batch"')],
  ["asset detail route", routes.includes('assets/${encodeURIComponent(assetId)}')],
  ["reports route", routes.includes('reports: "/(app)/reports"')],
  ["settlement review route", routes.includes('settlementReview: "/(app)/settlements/review"')],
  ["service health route", routes.includes('serviceHealth: "/(app)/service-health"')],
  ["diagnostics route", routes.includes('diagnostics: "/(app)/diagnostics"')],
  ["PWRC diagnostics", diagnostics.includes('"/credits/reconciliation"')],
  ["MCP diagnostics", diagnostics.includes('"/mcp/tools"')],
  ["demo data guarded", demo.includes('mobileEnv.dataMode === "demo"')],
  ["Carbon Dark user label", themeSelector.includes('label: "Carbon Dark"')],
];

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed = true;
}

try {
  await access("frontend/app/(app)/(tabs)/settings.tsx");
  console.error("✗ legacy Settings tab still exists");
  failed = true;
} catch {
  console.log("✓ Settings moved out of primary tabs");
}

const logo = await readFile("frontend/assets/brand/logo-green.png");
console.log(`✓ brand logo sha256 ${createHash("sha256").update(logo).digest("hex").slice(0, 16)}…`);

if (failed) process.exit(1);
